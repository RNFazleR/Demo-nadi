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
    statusDetail: 'Lihat detail',
    // Kartu status saat alert Waspada/Darurat sudah ditanggapi tapi belum ditandai selesai
    handling: {
      title: 'Sedang dicek keluarga',
      hint: 'Buka detail dan tandai selesai kalau keadaan beliau sudah dipastikan baik.',
    },
    // Satu kalimat ringkas untuk status Normal
    normalSentence: 'Pola keseharian terlihat seperti biasanya, tidak ada pemberitahuan baru.',
    todaySummary: 'Ringkasan hari ini',
    // Tanggal cerita demo ikut ditulis, supaya jelas data ini bukan "hari ini" yang sebenarnya
    provenance: (date, time) => `Diperbarui ${date}, ${time} · dari sinyal WiFi di rumah, lewat HP Pusat`,
    // Penanda sumber data di mode demo (padanan copy.sensor.modeChip di mode sensor langsung)
    demoChip: 'Demo · data contoh',
    lastActivity: (minutes) => `Aktivitas terakhir terdeteksi: ${minutes} menit lalu`,
    simulate: {
      tag: 'Fitur demo',
      button: 'Pratinjau HP Pusat',
      hint: 'Lihat pertanyaan konfirmasi yang muncul di HP orang tua',
      waspadaButton: 'Simulasikan pola berubah',
      waspadaHint: 'Kirim satu notifikasi Waspada ke app keluarga',
      // Isi AlertEvent Waspada yang dibuat simulasi ini. Hanya apa yang terlihat; ajakan
      // "ada baiknya ditanyakan kabarnya" sudah ada di alertDetail.levelNote.waspada.
      waspadaAlert: (nama) => `Pagi ini gerakan ${nama} lebih jarang dibanding jam yang sama di hari lain.`,
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
    markDone: 'Tandai selesai',
    markDoneHint: 'Sudah ada yang mengecek. Tandai selesai kalau keadaan beliau sudah dipastikan baik.',
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

  // Layar masuk untuk keluarga (simulasi prototipe, akun di dummy.js)
  login: {
    title: 'Masuk ke NADI',
    subtitle: 'Untuk keluarga yang mendampingi, dan untuk HP orang tua yang disiapkan keluarga.',
    email: 'Email',
    password: 'Kata sandi',
    showPassword: 'Tampilkan kata sandi',
    submit: 'Masuk',
    errors: {
      emailEmpty: 'Isi email dulu, ya.',
      emailFormat: 'Format email belum benar. Contoh: nama@contoh.id',
      passwordEmpty: 'Isi kata sandi dulu, ya.',
      wrong: 'Email atau kata sandi belum cocok. Coba periksa lagi.',
    },
    forgot: {
      question: 'Lupa kata sandi?',
      answer: 'Hubungi anggota keluarga yang mendaftarkan akun NADI untuk mengatur ulang kata sandi.',
    },
    signedOut: 'Kamu sudah keluar. Masuk lagi kapan saja.',
  },

  settings: {
    title: 'Pengaturan',
    account: {
      title: 'Akun',
      signedInAs: 'Masuk sebagai',
      logout: 'Keluar',
      linkedTo: 'Tertaut ke HP Pusat',
      linkedName: (nama) => `HP ${nama}`,
      unlink: 'Lepas tautan',
      unlinkConfirm: {
        title: 'Lepas tautan dari HP Pusat?',
        body: (nama) => `Kabar ${nama} tidak akan masuk ke HP ini lagi sampai ditautkan ulang dengan kode keluarga.`,
        confirm: 'Ya, lepas tautan',
        cancel: 'Batal',
      },
    },
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
      // Mode sensor langsung belum bisa dijeda; jangan sampai tampil "dijeda" padahal sensor tetap membaca
      pauseUnavailable: 'Jeda belum tersedia di mode sensor langsung. Pembacaan sensor tetap berjalan.',
    },
    reset: {
      tag: 'Fitur demo',
      button: 'Reset data demo',
      hint: 'Kembalikan semua notifikasi, status, kontak, dan pengaturan pemantauan ke kondisi awal.',
      done: 'Data demo sudah dikembalikan ke kondisi awal.',
    },
  },

  // HP Cabang: menautkan ke HP Pusat (HP orang tua) dengan kode undangan
  linkPusat: {
    title: 'Tautkan ke HP orang tua',
    intro: 'Masukkan kode keluarga dari HP Pusat, yaitu HP orang tua di rumah yang tersambung ke perangkat NADI.',
    where: 'Kodenya ada di HP orang tua: tekan dan tahan "Pengaturan (untuk keluarga)", lalu lihat "Kode keluarga".',
    codeLabel: 'Kode keluarga (6 angka)',
    submit: 'Tautkan',
    errors: {
      empty: 'Isi kode keluarga dulu, ya.',
      format: 'Kode keluarga terdiri dari 6 angka.',
      wrong: 'Kode belum cocok dengan HP Pusat mana pun. Coba periksa lagi.',
    },
    signedInAs: (nama) => `Masuk sebagai ${nama}`,
    switchAccount: 'Ganti akun',
    linked: (nama) => `Tertaut dengan HP ${nama}.`,
  },

  // HP Pusat: disiapkan keluarga sekali, lalu menjadi mode lansia
  pusatSetup: {
    stepOf: (n, total) => `Langkah ${n} dari ${total}`,
    intro: (nama) => `Siapkan HP ini untuk ${nama}. Cukup sekali; setelah itu HP ini menampilkan layar yang sederhana untuk beliau.`,
    device: {
      title: 'Sambungkan perangkat',
      body: 'Isi alamat IP laptop yang menjalankan penghubung NADI di rumah. HP ini dan laptop harus tersambung ke WiFi yang sama.',
      next: 'Lanjut',
      skip: 'Lewati, pakai data demo',
      skipNote: 'Tanpa perangkat, HP ini tetap bisa dicoba dengan data contoh.',
    },
    code: {
      title: 'Kode untuk keluarga',
      body: 'Bacakan atau kirim kode ini ke anggota keluarga. Mereka memasukkannya di HP masing-masing untuk menerima kabar dari HP ini.',
      linkedTitle: 'Keluarga yang sudah tertaut',
      noneLinked: 'Belum ada. Kode bisa dipakai kapan saja.',
      next: 'Lanjut',
    },
    start: {
      title: 'Siap untuk beliau',
      points: [
        'Layar dibuat besar dan sederhana, tanpa menu.',
        'Sesekali NADI bertanya kabar dengan dua tombol besar.',
        'Pengaturan hanya bisa dibuka keluarga: tekan dan tahan, lalu masukkan kata sandi.',
      ],
      button: 'Mulai',
    },
    back: 'Kembali',
  },

  // HP Pusat, mode lansia: teks besar, satu sapaan, tanpa navigasi
  pusatHome: {
    greeting: (panggilan) => `Halo ${panggilan}`,
    body: 'NADI sedang menemani di rumah.',
    device: {
      live: 'Perangkat NADI tersambung',
      demo: 'Memakai data contoh',
      problem: 'Perangkat NADI belum tersambung',
    },
    demoTag: 'Fitur demo',
    showQuestion: 'Tampilkan pertanyaan konfirmasi',
    settings: 'Pengaturan (untuk keluarga)',
    settingsHint: 'Tekan dan tahan',
  },

  // Dialog kata sandi untuk membuka pengaturan HP Pusat
  pusatUnlock: {
    title: 'Pengaturan untuk keluarga',
    body: 'Masukkan kata sandi akun HP ini.',
    password: 'Kata sandi',
    submit: 'Buka pengaturan',
    cancel: 'Batal',
    wrong: 'Kata sandi belum cocok. Coba lagi.',
  },

  // Pengaturan HP Pusat (setelah kata sandi benar)
  pusatSettings: {
    title: 'Pengaturan HP Pusat',
    deviceTitle: 'Perangkat',
    codeTitle: 'Kode keluarga',
    backToElder: 'Kembali ke layar orang tua',
    logout: 'Keluar dari akun',
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
      unset: {
        title: 'Alamat penghubung sensor belum diatur',
        body: 'Isi alamat IP laptop di Pengaturan → Sumber data supaya NADI bisa membaca sensor.',
      },
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
      live: 'Sensor langsung (lewat HP Pusat)',
      liveDemoNote:
        'Di produk nyata, data datang lewat akun HP Pusat. Di prototipe ini HP keluarga membaca penghubung yang sama di WiFi rumah.',
      apiLabel: (url) => `Penghubung: ${url}`,
      hostLabel: 'Alamat penghubung sensor',
      hostHint: 'IP laptop yang menjalankan penghubung, mis. 192.168.1.5. HP dan laptop harus di WiFi yang sama.',
      hostSave: 'Simpan',
      hostSaved: 'Alamat penghubung disimpan.',
      hostUnset: 'Belum diatur',
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
    previewTag: 'Pratinjau HP Pusat',
    backToFamily: 'Kembali ke app keluarga',
    done: 'Selesai',
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

  // Uji Fase 0 (alat bantu pengembang, dibuka dari layar Masuk). Dibuang setelah Fase 1.
  uji: {
    demoTag: 'Fitur demo',
    entry: 'Uji Fase 0 (pengembang)',
    title: 'Uji Fase 0',
    intro: 'Mengecek apakah HP ini bisa menjadi HP Pusat. Alat bantu pengembang, bukan bagian dari app.',
    back: 'Kembali',
    onlyApk: 'Hanya bisa diuji di APK Android, bukan di browser.',
    passLabel: 'Lolos bila',
    udp: {
      title: '1. Terima data dari alat (UDP)',
      body: 'Nyalakan hotspot HP ini di 2,4 GHz. Setelah alat tersambung, paket akan masuk di sini.',
      start: 'Mulai dengarkan',
      stop: 'Berhenti',
      state: {
        idle: 'Belum mendengarkan',
        listening: 'Mendengarkan port 5005',
        error: (pesan) => `Gagal: ${pesan}`,
      },
      rate: 'Paket per detik',
      total: 'Total paket',
      lost: 'Paket hilang (celah nomor)',
      lostValue: (jumlah, persen) => `${jumlah} (${persen}%)`,
      invalid: 'Paket tidak dikenali',
      from: 'Dikirim dari',
      device: 'Alat',
      rssi: 'Kekuatan sinyal',
      rssiValue: (dbm) => `${dbm} dBm`,
      none: '–',
      pass: 'sekitar 50 paket per detik dan paket hilang di bawah 1%.',
    },
    ble: {
      title: '2. Pasang alat lewat Bluetooth',
      body: 'Cari alat bernama NADI-XXXX, sambungkan, lalu kirim nama & sandi hotspot HP ini.',
      scan: 'Cari alat',
      scanning: 'Mencari alat NADI… (10 detik)',
      none: 'Belum ada alat ditemukan. Pastikan alat menyala dan dekat HP ini.',
      connect: (nama) => `Sambungkan ${nama}`,
      connecting: 'Menyambungkan…',
      connected: (nama) => `Tersambung ke ${nama}`,
      disconnect: 'Putuskan',
      deviceStatus: 'Status dari alat',
      ssid: 'Nama hotspot HP ini',
      password: 'Sandi hotspot',
      send: 'Kirim ke alat',
      sent: 'Terkirim. Perhatikan status dari alat di atas.',
      error: (pesan) => `Gagal: ${pesan}`,
      pass: 'status alat berubah menjadi "tersambung" lalu paket UDP mulai masuk di bagian 1.',
    },
    firebase: {
      title: '3. Firebase di app',
      notConfigured: 'Firebase belum diatur. Isi VITE_FIREBASE_* di .env.local, lalu build APK ulang.',
      email: 'Email akun uji',
      password: 'Kata sandi akun uji',
      run: 'Masuk & uji tulis-baca',
      running: 'Menguji…',
      ok: (ms) => `Berhasil. Tulis lalu baca ulang butuh ${ms} ms.`,
      failed: (kode) => `Gagal: ${kode}`,
      pass: 'tulis-baca berhasil dalam kurang dari 2 detik.',
    },
    keepAwake: {
      title: '4. Layar tetap menyala',
      on: 'Jaga layar tetap menyala',
      off: 'Izinkan layar mati',
      unsupported: 'Tidak didukung di perangkat ini.',
      failed: (pesan) => `Gagal: ${pesan}`,
      elapsed: 'Lama berjalan',
      longestGap: 'Jeda terlama antar detik',
      gapValue: (detik) => `${detik} dtk`,
      duration: (menit, detik) => `${menit} mnt ${detik} dtk`,
      pass: 'setelah ±1 jam layar masih menyala dan jeda terlama di bawah 3 detik.',
    },
  },
}
