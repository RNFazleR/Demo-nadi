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

  // Perbandingan nilai hari ini vs rata-rata 7 hari, per metrik
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
    average: (valueWithUnit) => `Rata-rata 7 hari: ${valueWithUnit}`,
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
  },

  nav: {
    home: 'Beranda',
    history: 'Riwayat',
    notifications: 'Notifikasi',
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

  callModal: {
    simulationTag: 'Simulasi demo',
    calling: 'Memanggil…',
    note: 'Ini hanya simulasi. Tidak ada panggilan yang benar-benar dilakukan.',
    end: 'Akhiri panggilan',
  },
}
