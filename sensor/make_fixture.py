"""
Buat log serial CSI SINTETIS untuk menguji penghubung & UI tanpa ESP32.
Ini BUKAN data hasil pengukuran; pola amplitudonya dibuat agar fase diam/gerak mudah dibedakan.

    python make_fixture.py fixtures/sintetis.txt

Bentuk sama dengan output firmware: CSI_DATA,seq,rssi,timestamp,len,v0 v1 ... (128 angka,
52 subcarrier aktif seperti log percobaan). Fase pada laju 33 paket/detik:
    log boot ESP + 1 baris rusak
    diam  16 dtk  (kalibrasi format ~1 dtk + baseline 10 dtk + diam ~5 dtk)
    gerak  6 dtk
    diam   6 dtk
    (selesai -> saat diputar ulang tanpa --loop, aliran berhenti = status 'stalled')
Juga disisipkan: 1 paket dengan panjang lain, dan celah seq (3 paket "terbuang").
"""
import math
import random
import sys

RATE = 33
N_SUB = 64
NULL_SUB = set(range(0, 6)) | {32} | set(range(59, 64))  # 12 subcarrier kosong -> 52 aktif
PHASES = [("diam", 16.0), ("gerak", 6.0), ("diam", 6.0)]


def packet(rng, seq, t, moving, base_amp, phase):
    values = []
    for k in range(N_SUB):
        if k in NULL_SUB:
            values += [0, 0]
            continue
        if moving:
            # orang bergerak: amplitudo tiap subcarrier berfluktuasi besar & berbeda-beda
            factor = 1 + 0.35 * math.sin(2 * math.pi * (0.7 + 0.05 * k) * t + k) + rng.gauss(0, 0.12)
        else:
            factor = 1 + rng.gauss(0, 0.03)  # derau kecil saat diam
        amp = max(base_amp[k] * factor, 1)
        imag = round(amp * math.sin(phase[k]))
        real = round(amp * math.cos(phase[k]))
        values += [max(-128, min(127, imag)), max(-128, min(127, real))]
    rssi = -53 + rng.choice([-1, 0, 0, 1])
    ts = int(t * 1_000_000) & 0xFFFFFFFF
    return f"CSI_DATA,{seq},{rssi},{ts},{len(values)}," + " ".join(map(str, values)) + " "


def main(path: str) -> None:
    rng = random.Random(42)  # deterministik
    base_amp = [rng.uniform(18, 40) for _ in range(N_SUB)]
    phase = [rng.uniform(0, 2 * math.pi) for _ in range(N_SUB)]
    lines = [
        "I (312) CSI_RX: CSI Receiver siap, menunggu koneksi ke hotspot...",
        "I (1290) CSI_RX: Terhubung, channel 6",
        "CSI_DATA,0,-53,123",  # baris terpotong saat port baru dibuka -> harus ditolak
    ]
    seq, t = 0, 0.0
    for name, seconds in PHASES:
        for _ in range(int(seconds * RATE)):
            if seq == 200:
                seq += 3  # celah seq: 3 paket terbuang di perangkat
            line = packet(rng, seq, t, name == "gerak", base_amp, phase)
            if seq == 400:
                parts = line.split(",")
                line = ",".join(parts[:4] + ["8", "1 2 3 4 5 6 7 8"])  # panjang paket lain
            lines.append(line)
            seq += 1
            t += 1 / RATE
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"{len(lines)} baris -> {path}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "fixtures/sintetis.txt")
