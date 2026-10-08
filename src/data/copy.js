// Semua teks UI NADI (Bahasa Indonesia). Komponen hanya boleh mengambil teks dari sini.
// Untuk versi Inggris nanti: buat objek dengan struktur key yang sama.
// Ingat aturan copy di AGENTS.md: wellness, bukan medis. Hindari istilah diagnostik.

export const copy = {
  app: {
    name: 'NADI',
    disclaimer: 'NADI memantau pola keseharian, bukan alat medis.',
  },

  // Tiga tingkat status utama
  status: {
    normal: {
      label: 'Normal',
    },
    waspada: {
      label: 'Waspada',
      summary: 'Ada pola yang berubah dari biasanya, perlu dicek',
    },
    darurat: {
      label: 'Darurat',
      summary: 'Butuh perhatian sekarang, segera hubungi',
    },
  },

  // Label untuk AlertEvent.tingkat
  alertLevel: {
    info: 'Info',
    waspada: 'Waspada',
    darurat: 'Darurat',
  },

  // Label untuk AlertEvent.status
  alertStatus: {
    baru: 'Baru',
    dicek: 'Sedang dicek',
    selesai: 'Selesai',
  },

  metrics: {
    sleep: {
      label: 'Tidur semalam',
      shortLabel: 'Durasi tidur',
      definition: 'Total waktu tidur pada malam sebelumnya.',
      unit: 'jam',
      withUnit: (v) => `${v} jam`,
    },
    activity: {
      label: 'Waktu aktif hari ini',
      shortLabel: 'Waktu aktif',
      definition: 'Porsi waktu bangun saat beliau terdeteksi bergerak aktif.',
      unit: '%',
      withUnit: (v) => `${v}%`,
    },
    wakeUps: {
      label: 'Terbangun malam',
      shortLabel: 'Terbangun malam',
      definition: 'Berapa kali terbangun antara pukul 22.00 dan 05.00.',
      unit: 'kali',
      withUnit: (v) => `${v} kali`,
    },
  },

  // Perbandingan nilai hari ini vs pola biasanya (rata-rata hari lain), per metrik
  comparison: {
    sleep: {
      higher: 'Lebih lama dari biasanya',
      same: 'Sama seperti biasanya',
      lower: 'Lebih singkat dari biasanya',
    },
    activity: {
      higher: 'Lebih aktif dari biasanya',
      same: 'Sama seperti biasanya',
      lower: 'Lebih sedikit dari biasanya',
    },
    wakeUps: {
      higher: 'Lebih sering dari biasanya',
      same: 'Sama seperti biasanya',
      lower: 'Lebih jarang dari biasanya',
    },
    average: (valueWithUnit) => `Pola biasanya: ${valueWithUnit}`,
  },

  profile: {
    monitoredSince: 'Dipantau sejak',
  },

  dashboard: {
    greeting: 'Kabar hari ini',
    statusCardTitle: 'Status saat ini',
    alertAt: (time) => `Tercatat pukul ${time}`,
    statusAction: 'Lihat & tindak lanjuti',
    // Satu kalimat ringkas untuk status Normal
    normalSentence: 'Pola keseharian terlihat seperti biasanya, tidak ada pemberitahuan baru.',
    todaySummary: 'Ringkasan hari ini',
    provenance: (time) => `Diperbarui ${time} · dari sinyal WiFi di rumah`,
    lastActivity: (minutes) => `Aktivitas terakhir terdeteksi: ${minutes} menit lalu`,
    simulate: {
      tag: 'Fitur demo',
      button: 'Simulasikan anomali',
      hint: 'Tampilkan layar konfirmasi di HP lansia',
    },
  },

  nav: {
    home: 'Beranda',
    history: 'Riwayat',
    notifications: 'Notifikasi',
    settings: 'Pengaturan',
    withBadge: (label, n) => `${label}, ${n} belum ditanggapi`,
  },

  time: {
    today: 'Hari ini',
    yesterday: 'Kemarin',
    dayAndTime: (day, time) => `${day}, ${time}`,
  },

  notifications: {
    title: 'Notifikasi',
    subtitle: 'Semua catatan NADI, dari yang terbaru',
    empty: 'Belum ada notifikasi.',
    groups: {
      needsResponse: (n) => `Perlu ditanggapi (${n})`,
      today: () => 'Hari ini',
      yesterday: () => 'Kemarin',
      earlier: () => 'Sebelumnya',
    },
  },

  alertDetail: {
    back: 'Kembali',
    detectedTitle: 'Apa yang terdeteksi',
    // Kalimat pendamping per tingkat, tetap netral dan tidak menakut-nakuti
    levelNote: {
      info: 'Ini hanya kabar, tidak ada yang perlu dilakukan.',
      waspada: 'Belum tentu ada masalah, tapi ada baiknya ditanyakan kabarnya.',
      darurat: 'Pola ini jauh berbeda dari biasanya. Sebaiknya segera pastikan keadaannya.',
    },
    compareTitle: 'Dibandingkan pola biasanya',
    compareSubtitle: (date) => `Data ${date} dibandingkan rata-rata hari lain dalam 7 hari terakhir`,
    thatDay: 'Hari itu',
    usual: 'Biasanya',
    noMetric: 'Belum ada data harian untuk tanggal ini.',
    actionsTitle: 'Tindak lanjut',
  },

  actions: {
    markChecked: 'Tandai sudah dicek',
    callElder: (name) => `Hubungi ${name}`,
    callEmergency: 'Hubungi layanan darurat',
    confirmEmergency: {
      title: (nomor) => `Hubungi layanan darurat (${nomor})?`,
      body: 'Gunakan saat beliau butuh pertolongan segera. Kalau belum yakin, coba hubungi beliau atau keluarga dulu.',
      confirm: (nomor) => `Ya, hubungi ${nomor}`,
      cancel: 'Batal',
    },
    alreadyHandled: 'Notifikasi ini sudah ditanggapi. Terima kasih sudah memperhatikan.',
  },

  // Tahap Feedback agent: respons keluarga dipakai untuk penilaian berikutnya
  feedback: {
    title: 'Respons tercatat',
    body: 'NADI mencatat respons ini untuk memperbaiki penilaian berikutnya.',
  },

  history: {
    title: 'Riwayat',
    subtitle: '7 hari terakhir',
    intro: 'NADI membandingkan pola beliau dengan kebiasaannya sendiri, bukan dengan standar umum.',
    metricTabs: {
      sleep: 'Durasi tidur',
      activity: 'Waktu aktif',
      wakeUps: 'Bangun malam',
    },
    metricTabsAria: 'Pilih metrik',
    chartAria: (label) => `Grafik batang ${label} selama 7 hari terakhir`,
    legendBaseline: (date, value) => `Pola biasanya untuk ${date}: ${value}`,
    baselineNote: (n, date) => `Rata-rata ${n} hari lainnya, tidak termasuk ${date}.`,
    selectedDayChip: (weekday, date) => `Hari terpilih · ${weekday}, ${date}`,
    legendDeviation: 'Berbeda jauh dari biasanya',
    deviationMark: '!', // simbol di atas batang yang menyimpang
    tapHint: 'Ketuk salah satu batang atau tanggal untuk melihat detail hari itu.',
    // Label tombol hari untuk pembaca layar, mis. "Selasa, 22 September: 4,3 jam, berbeda jauh dari biasanya"
    dayButtonLabel: (date, value, note) => (note ? `${date}: ${value}, ${note.toLowerCase()}` : `${date}: ${value}`),
    deviationBadge: 'Berbeda jauh dari biasanya',
    // Selisih nilai dengan satuannya
    diffWithUnit: {
      sleep: (d) => `${d} jam`,
      activity: (d) => `${d} poin persen`,
      wakeUps: (d) => `${d} kali`,
    },
    // Kalimat netral: (nilai, biasanya, selisih) sudah diformat dengan satuan
    sentence: {
      sleep: {
        lower: (v, u, d) => `Tidur ${d} lebih sedikit dari biasanya`,
        higher: (v, u, d) => `Tidur ${d} lebih lama dari biasanya`,
        same: () => 'Lama tidur sama seperti biasanya',
      },
      activity: {
        lower: (v, u, d) => `Waktu aktif ${d} lebih rendah dari biasanya`,
        higher: (v, u, d) => `Waktu aktif ${d} lebih tinggi dari biasanya`,
        same: () => 'Waktu aktif sama seperti biasanya',
      },
      wakeUps: {
        lower: (v, u) => `Terbangun ${v}, lebih jarang dari biasanya (sekitar ${u})`,
        higher: (v, u) => `Terbangun ${v}, lebih sering dari biasanya (sekitar ${u})`,
        same: () => 'Terbangun malam sama seperti biasanya',
      },
    },
    alertsTitle: 'Catatan NADI di hari ini',
    noAlerts: 'Tidak ada catatan di tanggal ini.',
  },

  settings: {
    title: 'Pengaturan',
    contacts: {
      title: 'Kontak keluarga',
      explainer: 'Saat Darurat, NADI menghubungi kontak sesuai urutan ini, mulai dari nomor 1.',
      priority: (n) => `Prioritas ${n}`,
      moveUp: (nama) => `Naikkan prioritas ${nama}`,
      moveDown: (nama) => `Turunkan prioritas ${nama}`,
      moved: (nama, n) => `${nama} sekarang prioritas ${n}`,
    },
    privacy: {
      title: 'Privasi & Data',
      intro: 'Cara NADI menjaga privasi beliau:',
      points: {
        noCamera: 'Tidak memakai kamera dan tidak merekam suara.',
        wifiOnly: 'Hanya membaca pola gerak dan istirahat dari sinyal WiFi di rumah.',
        wellness: 'NADI adalah pemantau kesejahteraan, bukan alat diagnosis medis.',
      },
      pauseTitle: 'Jeda pemantauan',
      pauseHint: 'Misalnya saat ada tamu menginap. NADI berhenti membaca pola sampai diaktifkan lagi.',
      pauseOn: 'Pemantauan sedang dijeda',
      pauseOff: 'Pemantauan aktif',
    },
    reset: {
      tag: 'Fitur demo',
      button: 'Reset data demo',
      hint: 'Kembalikan semua notifikasi, status, kontak, dan pengaturan pemantauan ke kondisi awal.',
      done: 'Data demo sudah dikembalikan ke kondisi awal.',
    },
  },

  // Status di Dashboard saat pemantauan dijeda
  paused: {
    label: 'Dijeda',
    title: 'Pemantauan dijeda',
    body: 'NADI sedang tidak membaca pola keseharian. Aktifkan lagi lewat Pengaturan kapan saja.',
  },

  // Mode "Sensor langsung" (ESP32-S3 + penghubung Python). Bahasa netral: sensor hanya membaca
  // perubahan sinyal WiFi sebagai tanda gerakan, bukan tidur, identitas, atau kondisi darurat.
  sensor: {
    modeChip: 'Sensor langsung',
    replayChip: 'Rekaman uji',
    cardTitle: 'Sensor gerak',
    states: {
      connecting: { title: 'Menghubungkan ke penghubung sensor…', body: 'Mengambil data pertama dari laptop.' },
      starting: { title: 'Penghubung sedang dimulai…', body: 'Sebentar lagi data sensor dibaca.' },
      unreachable: {
        title: 'Penghubung sensor tidak terjangkau',
        body: 'Pastikan program penghubung berjalan di laptop dan alamatnya benar.',
      },
      port_not_found: {
        title: 'Perangkat sensor tidak ditemukan',
        body: 'Periksa kabel USB dan nama port. Penghubung akan mencoba lagi.',
      },
      port_busy: {
        title: 'Port sensor sedang dipakai program lain',
        body: 'Tutup serial monitor atau program lain yang membuka port ini.',
      },
      disconnected: {
        title: 'Sensor terputus',
        body: 'Kabel USB terlepas atau perangkat mati. Penghubung akan mencoba menyambung lagi.',
      },
      error: { title: 'Sensor tidak bisa dibaca', body: 'Lihat detail teknis di bawah untuk pesan kesalahannya.' },
      waiting_data: {
        title: 'Perangkat tersambung, belum ada data sinyal',
        body: 'Port sudah terbuka, tapi belum ada data WiFi. Periksa hotspot 2,4 GHz perangkat.',
      },
      stalled: {
        title: 'Data sensor berhenti masuk',
        body: 'Port masih terbuka, tapi tidak ada data baru. Periksa hotspot HP (2,4 GHz) masih menyala. Status gerak tidak ditampilkan sampai data kembali.',
      },
      calibration_failed: {
        title: 'Kalibrasi belum berhasil, mencoba lagi',
        body: 'Sinyal yang terbaca belum cukup. Pastikan perangkat dan hotspot menyala dan berdekatan.',
      },
      calibrating_format: { title: 'Menyiapkan pembacaan sinyal…', body: 'Mengenali format data dari perangkat.' },
      calibrating_baseline: {
        title: 'Kalibrasi: mohon jangan bergerak di area pemantauan',
        body: 'NADI sedang mempelajari sinyal saat ruangan tenang, kira-kira 10 detik.',
      },
      processing: { title: 'Membaca sinyal…', body: 'Menunggu hasil pembacaan berikutnya.' },
      motion: { title: 'Gerakan terdeteksi di area pemantauan', body: 'Sinyal WiFi berubah melebihi batas hasil kalibrasi.' },
      still: {
        title: 'Belum ada gerakan terdeteksi',
        body: 'Ini tidak selalu berarti ruangan kosong atau beliau sedang tidur.',
      },
    },
    progress: (pct) => `Kalibrasi ${pct}%`,
    lastMotion: 'Gerakan terakhir',
    noMotionYet: 'Belum ada sejak kalibrasi',
    lastUpdate: 'Data terakhir diterima',
    noDataYet: 'Belum ada',
    unavailableTitle: 'Belum tersedia dari sensor ini',
    unavailableBody:
      'Durasi tidur, waktu aktif harian, dan terbangun malam belum bisa dihitung dari pembacaan gerak saat ini.',
    technical: {
      summary: 'Detail teknis',
      score: 'Skor perubahan sinyal',
      threshold: 'Batas gerak (hasil kalibrasi)',
      rssi: 'Kekuatan sinyal (RSSI)',
      rssiValue: (v) => `${v} dBm`,
      packets: 'Paket dalam 1 detik terakhir',
      dropped: 'Paket hilang di perangkat',
      invalid: 'Baris data tidak valid',
      port: 'Port',
      source: 'Sumber',
      sourceLive: 'Perangkat (serial)',
      sourceReplay: 'Rekaman uji (bukan pengukuran langsung)',
      api: 'Alamat penghubung',
      error: 'Pesan kesalahan',
      deviceLog: (time) => `Pesan perangkat terakhir (${time})`,
      note: 'Skor bukan persentase aktivitas dan bukan probabilitas. Batas berlaku untuk sesi kalibrasi ini saja.',
      empty: '–',
    },
    // Riwayat & Notifikasi masih berbasis data demo, jadi tidak ditampilkan di mode sensor
    notice: {
      title: 'Belum tersedia di mode sensor langsung',
      body: (page) =>
        `${page} masih memakai data demo, jadi disembunyikan agar tidak tercampur dengan data sensor.`,
      backToDemo: 'Beralih ke mode demo',
    },
    source: {
      title: 'Sumber data',
      hint: 'Mode demo memakai cerita contoh. Sensor langsung membaca perangkat ESP32 lewat penghubung di laptop.',
      demo: 'Demo (data contoh)',
      live: 'Sensor langsung (ESP32)',
      apiLabel: (url) => `Penghubung: ${url}`,
    },
  },

  // Layar konfirmasi di HP lansia. Kalimat pendek, maksimal 1 pertanyaan.
  elderCheck: {
    question: (panggilan) => `Halo ${panggilan}, apakah baik-baik saja?`,
    yes: 'Ya, saya baik-baik saja',
    help: 'Butuh bantuan',
    countdownLabel: (s) => `Sisa ${s} detik`,
    countdownAria: (s) => `Sisa waktu menjawab: ${s} detik`,
    result: {
      ok: {
        title: (panggilan) => `Terima kasih, ${panggilan}.`,
        body: 'Semoga harinya menyenangkan.',
      },
      // Dipakai untuk "Butuh bantuan" maupun waktu habis
      help: {
        title: 'Keluarga sedang dihubungi.',
        body: 'Tunggu sebentar, ya.',
      },
    },
    demoTag: 'Fitur demo',
    backToFamily: 'Kembali ke app keluarga',
    // Isi AlertEvent baru yang dibuat dari hasil konfirmasi
    generated: {
      ok: (nama) => `${nama} menjawab bahwa ia baik-baik saja lewat pertanyaan konfirmasi NADI.`,
      help: (nama) => `${nama} menekan tombol "Butuh bantuan" di pertanyaan konfirmasi NADI. Coba hubungi sekarang.`,
      timeout: (nama, detik) =>
        `${nama} belum menjawab pertanyaan konfirmasi NADI dalam ${detik} detik. Coba hubungi sekarang.`,
    },
  },

  callModal: {
    simulationTag: 'Simulasi demo',
    calling: 'Memanggil…',
    note: 'Ini hanya simulasi. Tidak ada panggilan yang benar-benar dilakukan.',
    end: 'Akhiri panggilan',
  },
}
