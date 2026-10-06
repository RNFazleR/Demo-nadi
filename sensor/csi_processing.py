"""
Pengolahan CSI ESP32 -> skor gerak. Murni (tanpa serial, jaringan, atau jam sistem),
supaya bisa diuji dengan fixture tanpa perangkat.

Algoritma sama dengan csi_check.py (percobaan awal):
  pasangan [imag, real] -> amplitudo -> subcarrier aktif -> normalisasi per paket
  -> std tiap subcarrier dalam jendela 1 detik -> skor = rata-rata std
  ambang = max(mean_baseline + 4*std_baseline, mean_baseline * 1.5)

Tambahan dibanding csi_check.py:
  - validasi baris (jumlah field, len genap, jumlah angka == len, rentang int8)
  - kalibrasi gagal bila tidak ada subcarrier aktif (lalu diulang)
  - hasil gerak hanya dianggap terkini bila datanya masih segar (lihat snapshot)
  - celah nomor urut (seq) dihitung sebagai paket yang terbuang di perangkat
"""
from __future__ import annotations

import math
import statistics
from collections import Counter, deque
from dataclasses import dataclass

WINDOW_SEC = 1.0      # lebar jendela gerak (detik)
MIN_PKTS = 4          # minimal paket dalam jendela supaya skor dihitung
CALIBRATE_PKTS = 30   # paket awal untuk menentukan panjang paket dominan + subcarrier aktif
BASELINE_SEC = 10.0   # lama baseline (kondisi diam) untuk menentukan ambang
SCORE_EVERY = 0.25    # skor dihitung paling sering tiap 0,25 detik
K_SIGMA = 4.0         # ambang = rata-rata baseline + K_SIGMA * std baseline
MIN_AMP = 0.5         # subcarrier dengan rata-rata amplitudo <= ini dianggap kosong
STALE_SEC = 3.0       # tanpa paket/skor baru selama ini -> data dianggap tidak terkini


@dataclass(frozen=True)
class CsiPacket:
    seq: int
    rssi: int
    esp_timestamp: int  # timestamp metadata ESP32 (mikrodetik), BUKAN waktu kalender
    values: tuple       # angka CSI bertanda, pasangan [imag, real]


class ParseError(ValueError):
    """Baris berawalan CSI_DATA tetapi isinya rusak/tidak konsisten."""


def parse_csi_line(line: str) -> CsiPacket | None:
    """Kembalikan CsiPacket, None bila bukan baris CSI (mis. log ESP), atau raise ParseError."""
    line = line.strip()
    if not line.startswith("CSI_DATA,"):
        return None
    parts = line.split(",")
    if len(parts) != 6:
        raise ParseError(f"jumlah field {len(parts)}, seharusnya 6")
    try:
        seq, rssi, esp_ts, length = (int(p) for p in parts[1:5])
    except ValueError as exc:
        raise ParseError("header bukan angka") from exc
    if length <= 0 or length % 2:
        raise ParseError(f"len {length} harus positif dan genap")
    tokens = parts[5].split()
    if len(tokens) != length:
        raise ParseError(f"jumlah angka {len(tokens)} tidak sama dengan len {length}")
    try:
        values = tuple(int(t) for t in tokens)
    except ValueError as exc:
        raise ParseError("ada nilai CSI yang bukan bilangan bulat") from exc
    if any(v < -128 or v > 127 for v in values):
        raise ParseError("nilai CSI di luar rentang int8")
    return CsiPacket(seq, rssi, esp_ts, values)


def amplitudes(values) -> list[float]:
    """Data ESP32: pasangan [imag, real] per subcarrier."""
    return [math.hypot(real, imag) for imag, real in zip(values[0::2], values[1::2])]


class MotionDetector:
    """Mesin keadaan kalibrasi + deteksi. Waktu selalu dari pemanggil (now_mono, now_wall)."""

    def __init__(self) -> None:
        self.reset()

    def reset(self) -> None:
        self.calibration = "waiting"   # waiting -> format -> baseline -> ready ; failed bila gagal
        self.calibration_failures = 0
        self._calib: list[tuple] = []
        self.ref_len: int | None = None
        self.mask: list[bool] | None = None
        self.active_subcarriers = 0
        self._window: deque = deque()
        self._last_eval = -math.inf
        self._baseline_scores: list[float] = []
        self._baseline_start: float | None = None
        self.baseline_mean: float | None = None
        self.threshold: float | None = None
        # hasil terakhir
        self.last_score: float | None = None
        self.last_score_mono: float | None = None
        self.motion: bool | None = None
        self.last_motion_wall = None
        # statistik aliran
        self.last_packet_mono: float | None = None
        self.last_packet_wall = None
        self.last_rssi: int | None = None
        self._last_seq: int | None = None
        self.packets_accepted = 0
        self.packets_dropped = 0        # celah seq = paket terbuang di perangkat
        self.packets_wrong_length = 0

    # ------------------------------------------------------------------ input
    def feed(self, pkt: CsiPacket, now_mono: float, now_wall) -> None:
        if self._last_seq is not None:
            if pkt.seq > self._last_seq + 1:
                self.packets_dropped += pkt.seq - self._last_seq - 1
            elif pkt.seq <= self._last_seq:
                # seq mundur = perangkat restart: kalibrasi ulang dari awal
                self.reset()
        self._last_seq = pkt.seq
        self.last_packet_mono = now_mono
        self.last_packet_wall = now_wall
        self.last_rssi = pkt.rssi
        self.packets_accepted += 1

        # ---- Tahap 1: panjang paket dominan + subcarrier aktif ----
        if self.ref_len is None:
            self.calibration = "format"
            self._calib.append(pkt.values)
            if len(self._calib) >= CALIBRATE_PKTS:
                self._finish_format_calibration()
            return

        if len(pkt.values) != self.ref_len:
            self.packets_wrong_length += 1
            return

        amp = [a for a, keep in zip(amplitudes(pkt.values), self.mask) if keep]
        mean = sum(amp) / len(amp)
        if mean <= 0:
            return
        self._window.append((now_mono, [a / mean for a in amp]))
        self._prune(now_mono)

        if len(self._window) < MIN_PKTS or now_mono - self._last_eval < SCORE_EVERY:
            return
        self._last_eval = now_mono
        score = self._score()
        self.last_score = score
        self.last_score_mono = now_mono

        # ---- Tahap 2: baseline (kondisi diam) ----
        if self.threshold is None:
            self.calibration = "baseline"
            if self._baseline_start is None:
                self._baseline_start = now_mono
            self._baseline_scores.append(score)
            if BASELINE_SEC - (now_mono - self._baseline_start) <= 0:
                mean_b = statistics.fmean(self._baseline_scores)
                std_b = statistics.pstdev(self._baseline_scores)  # = np.std (ddof=0)
                self.baseline_mean = mean_b
                self.threshold = max(mean_b + K_SIGMA * std_b, mean_b * 1.5)
                self.calibration = "ready"
            return

        # ---- Tahap 3: deteksi ----
        self.motion = score > self.threshold
        if self.motion:
            self.last_motion_wall = now_wall

    def _finish_format_calibration(self) -> None:
        self.ref_len = Counter(len(v) for v in self._calib).most_common(1)[0][0]
        amps = [amplitudes(v) for v in self._calib if len(v) == self.ref_len]
        means = [statistics.fmean(col) for col in zip(*amps)]
        mask = [m > MIN_AMP for m in means]
        if not any(mask):
            # Tidak ada subcarrier aktif: tandai gagal lalu ulangi dengan paket berikutnya
            self.calibration = "failed"
            self.calibration_failures += 1
            self.ref_len = None
            self._calib = []
            return
        self.mask = mask
        self.active_subcarriers = sum(mask)
        self.calibration = "baseline"

    def _prune(self, now_mono: float) -> None:
        while self._window and now_mono - self._window[0][0] > WINDOW_SEC:
            self._window.popleft()

    def _score(self) -> float:
        rows = [a for _, a in self._window]
        return statistics.fmean(statistics.pstdev(col) for col in zip(*rows))

    # ----------------------------------------------------------------- output
    def is_streaming(self, now_mono: float) -> bool:
        return self.last_packet_mono is not None and now_mono - self.last_packet_mono <= STALE_SEC

    def calibration_progress(self, now_mono: float) -> float | None:
        if self.calibration in ("waiting", "failed"):
            return 0.0 if self.calibration == "waiting" else None
        if self.calibration == "format":
            return min(len(self._calib) / CALIBRATE_PKTS, 1.0)
        if self.calibration == "baseline":
            if self._baseline_start is None:
                return 0.0
            return min((now_mono - self._baseline_start) / BASELINE_SEC, 1.0)
        return 1.0

    def snapshot(self, now_mono: float) -> dict:
        """Hasil terkini. Keputusan gerak hanya dilaporkan bila skornya masih segar,
        supaya keputusan lama tidak tampil seolah-olah hasil sekarang."""
        fresh = (
            self.calibration == "ready"
            and self.is_streaming(now_mono)
            and self.last_score_mono is not None
            and now_mono - self.last_score_mono <= STALE_SEC
        )
        in_window = sum(1 for t, _ in self._window if now_mono - t <= WINDOW_SEC)
        return {
            "calibration": self.calibration,
            "calibration_progress": self.calibration_progress(now_mono),
            "calibration_failures": self.calibration_failures,
            "active_subcarriers": self.active_subcarriers or None,
            "packet_length": self.ref_len,
            "rssi_dbm": self.last_rssi if self.is_streaming(now_mono) else None,
            "packets_in_window": in_window if self.is_streaming(now_mono) else 0,
            "window_seconds": WINDOW_SEC,
            "motion_score": round(self.last_score, 4) if fresh else None,
            "motion_threshold": round(self.threshold, 4) if self.threshold is not None else None,
            "baseline_mean": round(self.baseline_mean, 4) if self.baseline_mean is not None else None,
            "motion_detected": self.motion if fresh else None,
            "packets_accepted": self.packets_accepted,
            "packets_dropped": self.packets_dropped,
            "packets_wrong_length": self.packets_wrong_length,
        }
