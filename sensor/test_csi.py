"""Uji pengolah & status penghubung tanpa perangkat.   python -m unittest -v test_csi"""
import os
import tempfile
import unittest
from datetime import datetime, timedelta, timezone

import make_fixture
from types import SimpleNamespace

from csi_bridge import SensorBridge, classify_open_error, find_esp_port
from csi_processing import STALE_SEC, MotionDetector, ParseError, amplitudes, parse_csi_line

WIB = timezone(timedelta(hours=7))
T0 = datetime(2026, 10, 6, 14, 30, tzinfo=WIB)


class Clock:
    """Jam simulasi: monotonic (detik) + jam dinding yang ikut maju."""

    def __init__(self):
        self.t = 0.0

    def mono(self):
        return self.t

    def wall(self):
        return T0 + timedelta(seconds=self.t)


def line(seq, values, rssi=-53):
    return f"CSI_DATA,{seq},{rssi},1000,{len(values)}," + " ".join(map(str, values)) + " "


class ParseTest(unittest.TestCase):
    def test_valid(self):
        p = parse_csi_line(line(7, [3, 4, -6, 8]))
        self.assertEqual((p.seq, p.rssi, p.values), (7, -53, (3, 4, -6, 8)))

    def test_not_csi_returns_none(self):
        self.assertIsNone(parse_csi_line("I (312) CSI_RX: siap"))
        self.assertIsNone(parse_csi_line(""))

    def test_rejects_broken_lines(self):
        bad = [
            "CSI_DATA,0,-53,123",                      # terpotong
            "CSI_DATA,1,-53,1000,4,1 2 3",             # jumlah angka != len
            "CSI_DATA,1,-53,1000,3,1 2 3",             # len ganjil
            "CSI_DATA,1,-53,1000,0,",                  # len nol
            "CSI_DATA,x,-53,1000,2,1 2",               # header bukan angka
            "CSI_DATA,1,-53,1000,2,1 a",               # nilai bukan angka
            "CSI_DATA,1,-53,1000,2,1 300",             # di luar int8
        ]
        for b in bad:
            with self.subTest(b=b), self.assertRaises(ParseError):
                parse_csi_line(b)

    def test_amplitudes_pairs_are_imag_real(self):
        self.assertEqual(amplitudes((3, 4, 0, 0)), [5.0, 0.0])


class FixtureRunTest(unittest.TestCase):
    """Putar fixture sintetis dengan jam simulasi 33 paket/detik."""

    @classmethod
    def setUpClass(cls):
        fd, cls.path = tempfile.mkstemp(suffix=".txt")
        os.close(fd)
        make_fixture.main(cls.path)

    @classmethod
    def tearDownClass(cls):
        os.remove(cls.path)

    def run_fixture(self):
        clock = Clock()
        bridge = SensorBridge("esp32-test", "replay", "fixture", clock=clock.mono, wall=clock.wall)
        bridge.port_opened()
        timeline = []  # (detik, snapshot)
        with open(self.path, encoding="utf-8") as f:
            for text in f:
                bridge.line(text)
                if text.startswith("CSI_DATA"):
                    clock.t += 1 / make_fixture.RATE
                    timeline.append((clock.t, bridge.snapshot()))
        return clock, bridge, timeline

    def test_calibration_then_detection_per_phase(self):
        _, bridge, timeline = self.run_fixture()
        stages = [s["calibration"] for _, s in timeline]
        # urutan tahap kalibrasi (entri pertama = baris terpotong yang ditolak -> masih 'waiting')
        self.assertEqual(stages[0], "waiting")
        self.assertLess(stages.index("format"), stages.index("baseline"))
        self.assertLess(stages.index("baseline"), stages.index("ready"))
        self.assertEqual(stages[-1], "ready")
        first_ready = stages.index("ready")
        self.assertLess(timeline[first_ready][0], 12.5)  # ~1 dtk format + 10 dtk baseline

        snap = timeline[-1][1]
        self.assertEqual(snap["packet_length"], 128)
        self.assertEqual(snap["active_subcarriers"], 52)
        self.assertEqual(snap["packets_dropped"], 3)
        self.assertEqual(snap["packets_wrong_length"], 1)
        self.assertEqual(snap["invalid_lines"], 1)

        def decisions(t_from, t_to):
            return [s["motion_detected"] for t, s in timeline if t_from <= t < t_to and s["motion_detected"] is not None]

        # beri jeda 1,5 dtk di batas fase karena jendela 1 dtk masih berisi fase sebelumnya
        still_before = decisions(timeline[first_ready][0], 16.0)
        moving = decisions(17.5, 22.0)
        still_after = decisions(23.5, 28.0)
        self.assertTrue(still_before and moving and still_after)
        self.assertFalse(any(still_before), "fase diam (sebelum gerak) tidak boleh terdeteksi gerak")
        self.assertTrue(all(moving), "fase gerak harus terdeteksi gerak")
        self.assertFalse(any(still_after), "fase diam (sesudah gerak) tidak boleh terdeteksi gerak")

        # waktu gerakan terakhir = jam dinding dari sumber data, di dalam fase gerak
        last_motion = datetime.fromisoformat(timeline[-1][1]["last_motion_at"])
        self.assertTrue(T0 + timedelta(seconds=16) <= last_motion <= T0 + timedelta(seconds=23))

    def test_stream_stops_no_stale_decision(self):
        clock, bridge, timeline = self.run_fixture()
        self.assertEqual(timeline[-1][1]["connection"], "streaming")
        clock.t += STALE_SEC + 0.5  # port masih terbuka, paket berhenti
        snap = bridge.snapshot()
        self.assertEqual(snap["connection"], "stalled")
        self.assertIsNone(snap["motion_detected"])
        self.assertIsNone(snap["motion_score"])
        self.assertIsNone(snap["rssi_dbm"])
        self.assertEqual(snap["packets_in_window"], 0)
        self.assertIsNotNone(snap["received_at"])  # waktu data terakhir tetap diberitahukan


class DetectorEdgeTest(unittest.TestCase):
    def test_no_active_subcarrier_fails_then_retries(self):
        d = MotionDetector()
        zeros = parse_csi_line(line(0, [0] * 128))
        for i in range(30):
            d.feed(zeros.__class__(i, -53, 0, zeros.values), i / 33, T0)
        self.assertEqual(d.calibration, "failed")
        self.assertEqual(d.calibration_failures, 1)
        self.assertIsNone(d.snapshot(1.0)["motion_detected"])
        d.feed(zeros.__class__(30, -53, 0, zeros.values), 31 / 33, T0)
        self.assertEqual(d.calibration, "format")  # mencoba lagi

    def test_seq_going_back_means_device_restart(self):
        d = MotionDetector()
        p = parse_csi_line(line(0, [3, 4] * 64))
        for i in range(40):
            d.feed(p.__class__(i, -53, 0, p.values), i / 33, T0)
        self.assertEqual(d.calibration, "baseline")
        d.feed(p.__class__(0, -53, 0, p.values), 2.0, T0)  # seq kembali ke 0
        self.assertEqual(d.calibration, "format")
        self.assertEqual(d.packets_accepted, 1)


class BridgeStateTest(unittest.TestCase):
    def setUp(self):
        self.clock = Clock()
        self.bridge = SensorBridge("esp32-test", "live", "COM6", clock=self.clock.mono, wall=self.clock.wall)

    def test_starting(self):
        self.assertEqual(self.bridge.snapshot()["connection"], "starting")

    def test_port_open_without_data_is_waiting(self):
        self.bridge.port_opened()
        snap = self.bridge.snapshot()
        self.assertEqual(snap["connection"], "waiting_data")
        self.assertEqual(snap["calibration"], "waiting")
        self.assertIsNone(snap["motion_detected"])

    def test_not_found_before_and_after_connection(self):
        self.bridge.port_failed("port_not_found", "could not open port 'COM6'")
        self.assertEqual(self.bridge.snapshot()["connection"], "port_not_found")
        self.bridge.port_opened()
        self.bridge.port_failed("port_not_found", "could not open port 'COM6'")
        self.assertEqual(self.bridge.snapshot()["connection"], "disconnected")  # pernah tersambung

    def test_reconnect_resets_calibration(self):
        self.bridge.port_opened()
        p = parse_csi_line(line(0, [3, 4] * 64))
        for i in range(35):
            self.bridge.detector.feed(p.__class__(i, -53, 0, p.values), i / 33, T0)
        self.bridge.port_failed("disconnected", "ClearCommError failed")
        self.bridge.port_opened()
        self.assertEqual(self.bridge.snapshot()["calibration"], "waiting")

    def test_find_esp_port_by_vid(self):
        ports = [
            SimpleNamespace(device="COM6", vid=None),           # Bluetooth (tanpa VID)
            SimpleNamespace(device="COM17", vid=0x067B),        # Prolific
            SimpleNamespace(device="COM24", vid=0x303A),        # ESP32-S3 USB Serial/JTAG
        ]
        self.assertEqual(find_esp_port(ports), "COM24")
        self.assertIsNone(find_esp_port(ports[:2]))

    def test_classify_open_error(self):
        cases = {
            "could not open port 'COM6': FileNotFoundError(2, 'The system cannot find the file specified.')": "port_not_found",
            "could not open port 'COM6': PermissionError(13, 'Access is denied.', None, 5)": "port_busy",
            "[Errno 16] could not open port /dev/ttyACM0: [Errno 16] Device or resource busy": "port_busy",
            "[Errno 2] could not open port /dev/ttyACM0: [Errno 2] No such file or directory": "port_not_found",
            "something else": "error",
        }
        for msg, expected in cases.items():
            with self.subTest(msg=msg):
                self.assertEqual(classify_open_error(Exception(msg)), expected)


if __name__ == "__main__":
    unittest.main()
