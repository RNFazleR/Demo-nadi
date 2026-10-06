"""
Penghubung sensor NADI: SATU proses yang memiliki port serial ESP32-S3, mengolah CSI,
lalu menyediakan hasil terbaru sebagai JSON untuk frontend.

    ESP32-S3 --USB serial--> csi_bridge.py --HTTP--> GET /api/sensor/latest --> React (polling 1 dtk)

Cara pakai:
    python csi_bridge.py --list-ports                 # cek nama port di komputer ini
    python csi_bridge.py --port COM6                  # sensor sungguhan
    python csi_bridge.py --replay fixtures/sintetis.txt   # tanpa perangkat (fixture)
    python csi_bridge.py --port COM6 --host 0.0.0.0   # agar bisa diakses HP di jaringan yang sama

Jangan membuka port yang sama dari serial monitor lain saat program ini berjalan.
"""
from __future__ import annotations

import argparse
import json
import sys
import threading
import time
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from csi_processing import MotionDetector, ParseError, parse_csi_line

BAUDRATE = 921600
RETRY_SEC = 2.0


def iso(dt) -> str | None:
    return dt.isoformat(timespec="seconds") if dt else None


def classify_open_error(exc: Exception) -> str:
    """Pesan error pyserial -> status yang bisa dijelaskan ke pengguna."""
    text = f"{type(exc).__name__}: {exc}".lower()
    if any(k in text for k in ("permissionerror", "access is denied", "resource busy", "device or resource busy")):
        return "port_busy"
    if any(k in text for k in ("filenotfounderror", "cannot find", "no such file", "could not find")):
        return "port_not_found"
    return "error"


class SensorBridge:
    """Status bersama antara thread pembaca dan server HTTP (dijaga lock)."""

    def __init__(self, device_id: str, source: str, port_label: str,
                 clock=time.monotonic, wall=lambda: datetime.now().astimezone()):
        self.device_id = device_id
        self.source = source            # "live" (serial) atau "replay" (fixture)
        self.port_label = port_label
        self._clock = clock
        self._wall = wall
        self._lock = threading.Lock()
        self.detector = MotionDetector()
        self.port_state = "starting"    # starting | open | port_not_found | port_busy | disconnected | error
        self.error: str | None = None
        self.invalid_lines = 0
        self._ever_open = False
        # Baris non-CSI terakhir dari perangkat (log ESP), mis. "Putus/gagal connect (reason 201)".
        # Penting untuk diagnosis saat CSI berhenti: hotspot mati, password salah, dll.
        self.device_log: str | None = None
        self.device_log_wall = None
        self.device_log_seq = 0

    # --- dipanggil thread pembaca ---
    def port_opened(self) -> None:
        with self._lock:
            # Port (baru) terbuka: kalibrasi ulang, jangan pakai keputusan sesi sebelumnya
            self.detector.reset()
            self.port_state = "open"
            self.error = None
            self._ever_open = True

    def port_failed(self, state: str, message: str) -> None:
        with self._lock:
            # Port hilang setelah pernah terbuka = USB terlepas / perangkat mati
            if state == "port_not_found" and self._ever_open:
                state = "disconnected"
            self.port_state = state
            self.error = message

    def line(self, text: str) -> None:
        try:
            pkt = parse_csi_line(text)
        except ParseError:
            with self._lock:
                self.invalid_lines += 1
            return
        if pkt is None:
            text = text.strip()
            if text:  # log ESP biasa, bukan CSI: simpan yang terakhir untuk diagnosis
                with self._lock:
                    self.device_log = text[:200]
                    self.device_log_wall = self._wall()
                    self.device_log_seq += 1
            return
        with self._lock:
            self.detector.feed(pkt, self._clock(), self._wall())

    # --- dipanggil server HTTP ---
    def snapshot(self) -> dict:
        with self._lock:
            now = self._clock()
            d = self.detector
            if self.port_state != "open":
                connection = self.port_state
            elif d.last_packet_mono is None:
                connection = "waiting_data"   # port terbuka, tapi belum ada CSI
            elif d.is_streaming(now):
                connection = "streaming"
            else:
                connection = "stalled"        # port masih terbuka, aliran CSI berhenti

            data = d.snapshot(now)
            if connection != "streaming":
                # Tidak ada aliran: jangan laporkan hasil apa pun sebagai kondisi terkini
                data.update(motion_detected=None, motion_score=None, rssi_dbm=None, packets_in_window=0)
            return {
                "source": self.source,
                "device_id": self.device_id,
                "port": self.port_label,
                "connection": connection,
                "error": self.error,
                "generated_at": iso(self._wall()),
                "received_at": iso(d.last_packet_wall),
                "last_motion_at": iso(d.last_motion_wall),
                "invalid_lines": self.invalid_lines,
                "device_log": self.device_log,
                "device_log_at": iso(self.device_log_wall),
                **data,
            }


# ------------------------------------------------------------------ pembaca
def run_serial(bridge: SensorBridge, port: str, stop: threading.Event) -> None:
    import serial  # pyserial; hanya dibutuhkan untuk mode sensor sungguhan

    while not stop.is_set():
        ser = serial.Serial()
        ser.port = port
        ser.baudrate = BAUDRATE
        ser.timeout = 1
        ser.dtr = False   # DTR/RTS dimatikan sebelum dibuka supaya board tidak ke-reset
        ser.rts = False
        try:
            ser.open()
        except Exception as exc:  # serial.SerialException / OSError
            bridge.port_failed(classify_open_error(exc), str(exc))
            stop.wait(RETRY_SEC)
            continue
        bridge.port_opened()
        try:
            while not stop.is_set():
                raw = ser.readline()  # b"" bila timeout 1 dtk -> status 'stalled' dihitung dari waktu
                if raw:
                    bridge.line(raw.decode(errors="ignore"))
        except Exception as exc:  # USB dicabut saat membaca
            bridge.port_failed("disconnected", str(exc))
        finally:
            try:
                ser.close()
            except Exception:
                pass
        stop.wait(RETRY_SEC)


def run_replay(bridge: SensorBridge, path: str, rate: float, loop: bool, stop: threading.Event) -> None:
    """Putar ulang log serial dengan laju tetap. Setelah file habis (tanpa --loop), port dianggap
    tetap terbuka tapi tidak ada data -> status 'stalled', sama seperti aliran CSI berhenti."""
    bridge.port_opened()
    sent = 0
    start = time.monotonic()
    while not stop.is_set():
        with open(path, encoding="utf-8", errors="ignore") as f:
            for text in f:
                if stop.is_set():
                    return
                bridge.line(text)
                if text.startswith("CSI_DATA"):
                    # Jadwal absolut (bukan wait 1/rate per paket) supaya keterlambatan timer
                    # tidak menumpuk dan laju tetap mendekati --rate.
                    sent += 1
                    stop.wait(max(0.0, start + sent / rate - time.monotonic()))
        if not loop:
            return


# ------------------------------------------------------------ status terminal
STATUS_TEXT = {
    "starting": "memulai...",
    "port_not_found": "port tidak ditemukan (cek kabel USB / nama port, --list-ports)",
    "port_busy": "port sedang dipakai program lain (tutup serial monitor / idf.py monitor)",
    "disconnected": "sensor terputus, mencoba menyambung lagi...",
    "error": "port tidak bisa dibuka",
    "waiting_data": "port terbuka, belum ada data CSI (cek hotspot 2,4 GHz)",
    "stalled": "data CSI berhenti masuk (port masih terbuka)",
}
CALIB_TEXT = {
    "waiting": "menunggu data",
    "format": "mengenali format paket...",
    "baseline": "BASELINE: DIAM dulu sekitar 10 detik, jangan lewat di antara ESP dan HP",
    "failed": "kalibrasi gagal (tidak ada subcarrier aktif), mengulang...",
}


def describe_for_terminal(s: dict) -> str:
    if s["connection"] != "streaming":
        msg = STATUS_TEXT.get(s["connection"], s["connection"])
        return f"{msg}" + (f" | {s['error']}" if s.get("error") else "")
    if s["calibration"] != "ready":
        pct = s.get("calibration_progress")
        return CALIB_TEXT.get(s["calibration"], s["calibration"]) + (f" ({pct:.0%})" if pct is not None else "")
    if s["motion_detected"] is None:
        return "siap, menunggu skor..."
    state = "GERAK!" if s["motion_detected"] else "diam"
    return (f"{state:<6} skor {s['motion_score']:.3f} (batas {s['motion_threshold']:.3f}) | "
            f"rssi {s['rssi_dbm']} | {s['packets_in_window']} pkt/dtk")


def run_status_printer(bridge: SensorBridge, stop: threading.Event, heartbeat_sec: float = 5.0) -> None:
    """Cetak ke terminal setiap kali status berubah, plus ringkasan berkala, supaya terminal
    tidak tampak 'kosong'. Tidak mencetak per paket."""
    prev_key, last_print = None, 0.0
    printed_ready = False
    last_log_seq = 0
    while not stop.wait(0.5):
        s = bridge.snapshot()
        if bridge.device_log_seq != last_log_seq:
            last_log_seq = bridge.device_log_seq
            print(f"[{datetime.now():%H:%M:%S}] [log ESP] {s['device_log']}", flush=True)
        key = (s["connection"], s["calibration"], s["motion_detected"])
        now = time.monotonic()
        if s["calibration"] == "ready" and not printed_ready and s["motion_threshold"] is not None:
            print(f"[{datetime.now():%H:%M:%S}] Kalibrasi selesai: {s['packet_length']} angka/paket, "
                  f"{s['active_subcarriers']} subcarrier aktif, baseline {s['baseline_mean']:.3f}, "
                  f"batas gerak {s['motion_threshold']:.3f}. Sekarang boleh bergerak.", flush=True)
            printed_ready = True
        if s["calibration"] != "ready":
            printed_ready = False
        if key != prev_key or now - last_print >= heartbeat_sec:
            extra = ""
            if now - last_print >= heartbeat_sec and key == prev_key:
                extra = f" | diterima {s['packets_accepted']}, hilang {s['packets_dropped']}, baris rusak {s['invalid_lines']}"
            print(f"[{datetime.now():%H:%M:%S}] {describe_for_terminal(s)}{extra}", flush=True)
            prev_key, last_print = key, now


# --------------------------------------------------------------------- HTTP
def make_handler(bridge: SensorBridge):
    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):  # noqa: N802
            if self.path.split("?")[0] == "/api/sensor/latest":
                self._send(200, bridge.snapshot())
            elif self.path == "/api/health":
                self._send(200, {"ok": True})
            else:
                self._send(404, {"error": "not_found"})

        def _send(self, status: int, body: dict) -> None:
            payload = json.dumps(body).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Access-Control-Allow-Origin", "*")  # frontend dev server beda port
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)

        def log_message(self, *args):  # jangan banjiri terminal dengan log tiap polling
            pass

    return Handler


def main(argv=None) -> None:
    ap = argparse.ArgumentParser(description="Penghubung CSI ESP32 -> API lokal NADI")
    src = ap.add_mutually_exclusive_group(required=True)
    src.add_argument("--port", help="port serial ESP32, mis. COM6 atau /dev/ttyACM0")
    src.add_argument("--replay", help="file log serial untuk diputar ulang (tanpa perangkat)")
    src.add_argument("--list-ports", action="store_true", help="tampilkan port serial yang tersedia")
    ap.add_argument("--rate", type=float, default=33.0, help="paket/detik saat --replay (default 33)")
    ap.add_argument("--loop", action="store_true", help="ulangi file --replay terus-menerus")
    ap.add_argument("--host", default="127.0.0.1", help="0.0.0.0 agar bisa diakses dari HP di jaringan yang sama")
    ap.add_argument("--http-port", type=int, default=8765)
    ap.add_argument("--device-id", default="esp32-s3-01")
    args = ap.parse_args(argv)

    if args.list_ports:
        from serial.tools import list_ports
        for p in list_ports.comports():
            print(f"{p.device}\t{p.description}")
        return

    source = "replay" if args.replay else "live"
    bridge = SensorBridge(args.device_id, source, args.replay or args.port)
    stop = threading.Event()
    target = (run_replay, (bridge, args.replay, args.rate, args.loop, stop)) if args.replay \
        else (run_serial, (bridge, args.port, stop))
    threading.Thread(target=target[0], args=target[1], daemon=True).start()

    # Di Windows, SO_REUSEADDR membuat DUA penghubung bisa sama-sama memakai port HTTP tanpa error
    # (permintaan lalu dijawab acak oleh salah satunya). Matikan supaya penghubung kedua gagal jelas.
    ThreadingHTTPServer.allow_reuse_address = sys.platform != "win32"
    try:
        server = ThreadingHTTPServer((args.host, args.http_port), make_handler(bridge))
    except OSError as exc:
        stop.set()
        sys.exit(f"Port HTTP {args.http_port} sudah dipakai ({exc}). Kemungkinan penghubung lain masih berjalan; "
                 f"tutup dulu atau pakai --http-port lain.")
    threading.Thread(target=run_status_printer, args=(bridge, stop), daemon=True).start()
    print(f"Sumber: {source} ({bridge.port_label})")
    print(f"API   : http://{args.host}:{args.http_port}/api/sensor/latest   (Ctrl+C untuk berhenti)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        stop.set()
        server.server_close()


if __name__ == "__main__":
    main()
