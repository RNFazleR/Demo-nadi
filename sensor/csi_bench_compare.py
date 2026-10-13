"""
Uji skor gerak NADI pada rekaman publik CSI-Bench.

CSI-Bench (Kaggle guozhenjennzhu/csi-bench, lisensi CC BY-NC-ND 4.0) TIDAK disertakan di repo.
Unduh file .h5 seperlunya ke folder di luar repo, satu subfolder per label, mis.:

    breathing/empty/*.h5   breathing/sleep_fanoff/*.h5   (BreathingDetection, 30 Hz, 10 dtk)
    motion/human/*.h5      motion/pet/*.h5               (MotionSourceRecognition, 100 Hz, 5 dtk)

lalu:

    pip install h5py numpy
    python csi_bench_compare.py <folder>/breathing --rate 30 --baseline empty
    python csi_bench_compare.py <folder>/motion --rate 100

Isi .h5: dataset CSI_amps (subcarrier x sampel x antena), amplitudo saja. Amplitudo diubah ke
paket [imag=0, real=amplitudo] lalu dimasukkan ke MotionDetector yang sama dengan penghubung, jadi
algoritmanya tidak disalin. Normalisasi per paket membuat skala amplitudo tidak berpengaruh.

--baseline <label>: ambang dihitung dengan rumus detektor (K_SIGMA, 1,5x) dari skor SATU rekaman
label itu (seperti kalibrasi "diam" di NADI), lalu diuji ke semua rekaman lain. Diulang untuk tiap
rekaman baseline. Skor diambil per file, jadi tidak ada jendela yang melintasi sambungan dua rekaman.
"""
from __future__ import annotations

import argparse
import statistics
from pathlib import Path

import h5py
import numpy as np

from csi_processing import CALIBRATE_PKTS, K_SIGMA, WINDOW_SEC, CsiPacket, MotionDetector

# Skala bilangan bulat besar supaya pembulatan tidak menambah derau (CsiPacket tidak membatasi int8;
# batas int8 hanya berlaku saat mengurai baris serial ESP32).
INT_SCALE = 30000


def window_scores(path: Path, rate_hz: float) -> list[float]:
    """Skor tiap jendela penuh (1 dtk) dari satu rekaman."""
    with h5py.File(path, "r") as f:
        amps = np.asarray(f["CSI_amps"][()], dtype=float)[:, :, 0].T  # sampel x subcarrier
    scaled = np.rint(amps * (INT_SCALE / amps.max())).astype(int)

    det = MotionDetector()
    first_full = CALIBRATE_PKTS / rate_hz + WINDOW_SEC
    scores = []
    for i, row in enumerate(scaled):
        now = i / rate_hz
        values = tuple(v for a in row for v in (0, int(a)))  # pasangan [imag, real]
        det.feed(CsiPacket(i, 0, 0, values), now, None)
        if det.last_score_mono == now and now >= first_full:
            scores.append(det.last_score)
    return scores


def threshold(scores: list[float]) -> float:
    """Rumus yang sama dengan tahap baseline di MotionDetector."""
    mean_b = statistics.fmean(scores)
    return max(mean_b + K_SIGMA * statistics.pstdev(scores), mean_b * 1.5)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("folder", help="folder berisi subfolder per label, masing-masing berisi .h5")
    ap.add_argument("--rate", type=float, required=True, help="laju sampel rekaman (Hz)")
    ap.add_argument("--baseline", help="label rekaman 'diam' untuk menghitung ambang, mis. empty")
    args = ap.parse_args()

    files = {p: p.parent.name for p in sorted(Path(args.folder).glob("*/*.h5"))}
    scores = {p: window_scores(p, args.rate) for p in files}

    print(f"{'label':<13} {'file':<32} {'jendela':>7} {'median':>8} {'min':>8} {'maks':>8}")
    for p, s in scores.items():
        print(f"{files[p]:<13} {p.name:<32} {len(s):>7} "
              f"{statistics.median(s):>8.4f} {min(s):>8.4f} {max(s):>8.4f}")

    print("\nPer label (semua jendela digabung):")
    for label in sorted(set(files.values())):
        s = [x for p, xs in scores.items() if files[p] == label for x in xs]
        print(f"  {label:<13} n={len(s):<4} median={statistics.median(s):.4f} "
              f"min={min(s):.4f} maks={max(s):.4f}")

    if not args.baseline:
        return
    bases = [p for p in files if files[p] == args.baseline]
    print(f"\nAmbang dari 1 rekaman '{args.baseline}', diuji ke rekaman lain "
          f"(% jendela di atas ambang = 'gerakan terdeteksi'):")
    hits: dict[str, list[float]] = {}
    for b in bases:
        thr = threshold(scores[b])
        row = []
        for p, s in scores.items():
            if p == b:
                continue
            pct = 100 * sum(x > thr for x in s) / len(s)
            hits.setdefault(files[p], []).append(pct)
            row.append(f"{files[p]}:{pct:.0f}%")
        print(f"  baseline {b.name:<32} ambang={thr:.4f}  " + "  ".join(row))
    print("\nRata-rata % jendela terdeteksi gerak:")
    for label, xs in sorted(hits.items()):
        print(f"  {label:<13} {statistics.fmean(xs):5.1f}%  (dari {len(xs)} pasangan baseline-uji)")


if __name__ == "__main__":
    main()
