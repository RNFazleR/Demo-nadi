// Semua teks UI NADI (Bahasa Indonesia). Komponen hanya boleh mengambil teks dari sini.
// Untuk versi Inggris nanti: buat objek dengan struktur key yang sama.
// Ingat aturan copy di CLAUDE.md: wellness, bukan medis. Hindari istilah diagnostik.

export const copy = {
  app: {
    name: 'NADI',
    tagline: 'Teman setia menjaga keseharian orang tersayang',
    disclaimer: 'NADI memantau pola keseharian, bukan alat medis.',
  },

  // Tiga tingkat status utama
  status: {
    normal: {
      label: 'Normal',
      summary: 'Semua terlihat seperti biasanya',
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
    sleep: { label: 'Tidur semalam', shortLabel: 'Durasi tidur', unit: 'jam', withUnit: (v) => `${v} jam` },
    activity: { label: 'Waktu aktif hari ini', shortLabel: 'Waktu aktif', unit: '%', withUnit: (v) => `${v}%` },
    wakeUps: { label: 'Terbangun malam', shortLabel: 'Terbangun malam', unit: 'kali', withUnit: (v) => `${v} kali` },
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
    noNewAlert: 'Tidak ada pemberitahuan baru. Pola keseharian terlihat seperti biasanya.',
    todaySummary: 'Ringkasan hari ini',
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
  },

  placeholder: {
    comingSoon: 'Segera hadir',
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
    newCount: (n) => `${n} belum ditanggapi`,
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
    statusLabel: 'Status',
    actionsTitle: 'Tindak lanjut',
  },

  actions: {
    markChecked: 'Tandai sudah dicek',
    callElder: (name) => `Hubungi ${name}`,
    callEmergency: 'Hubungi layanan darurat',
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
      activity: 'Rasio aktif',
      wakeUps: 'Bangun malam',
    },
    metricTabsAria: 'Pilih metrik',
    chartAria: (label) => `Grafik batang ${label} selama 7 hari terakhir`,
    legendBaseline: (value) => `Pola biasanya: ${value} (rata-rata hari lain)`,
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

  // Layar konfirmasi di HP lansia. Kalimat pendek, maksimal 1 pertanyaan.
  elderCheck: {
    question: (panggilan) => `Halo ${panggilan}, apakah baik-baik saja?`,
    yes: 'Ya, saya baik-baik saja',
    help: 'Butuh bantuan',
    secondsUnit: 'detik',
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
