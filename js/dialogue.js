/* ==========================================================================
   NIGHT SHIFT: ICE CREAM v2.0.0 — Narrative, 10-Night Configs, 14 Clues,
   Phone Calls, Kiosk Upgrade Shop Catalog, Intro & Endings
   ========================================================================== */

(function (global) {
  'use strict';

  const NS = (global.NightShift = global.NightShift || {});

  const INTRO_STEPS = [
    {
      heading: 'Sepuluh Malam di Jalan Melati',
      paragraphs: [
        'Hujan gerimis jatuh tipis di atap seng Kios Es Krim "Sora Dingin". Jam dinding baru menyentuh pukul 22:55. Kamu menandatangani kontrak sepuluh malam penuh menggantikan penjaga sebelumnya—Dimas—yang hilang tanpa kabar dua minggu lalu.',
        'Pemilik kios, Pak Hendra, menawarkan bayaran tinggi plus komisi kas yang bisa kamu pakai untuk meningkatkan keamanan kios setiap akhir shift.',
        'Aturannya tegas: jaga jendela tetap tertutup saat tidak melayani, amati setiap tamu, gunakan CCTV Halte [V] untuk mengecek arah kedatangan mereka, dan kunci ganda jendela [L] bila bahaya mengintai.'
      ],
      whisper: '“Di Jalan Melati, tidak semua yang berdiri di bawah lampu jalan datang untuk membeli es krim.”'
    },
    {
      heading: 'Ketenangan, Topping & Bertahan Hidup',
      paragraphs: [
        'Perhatikan meteran Ketenangan di bar atas. Kejadian ganjil, lampu padam, dan ancaman akan menggerus ketenanganmu—minum Kopi Hangat [C] atau layani pelanggan biasa dengan tepat agar pikiranmu tetap waras.',
        'Mulai Malam 3, pelanggan mulai memesan topping tambahan (Choco Chips, Saus Karamel, Ceri Merah). Gunakan hasil penjualanmu di layar Ringkasan Shift untuk membeli Lampu Halogen, Kaca Anti-Pecah, Stabilizer Neon, atau Termos Barista.',
        'Tiga teguran karena menolak pelanggan sah—atau ketenangan habis total—akan mengakhiri shiftmu. Kumpulkan petunjuk sebanyak mungkin selama 10 malam untuk mengungkap kebenaran di balik hilangnya Dimas.'
      ],
      whisper: 'Kontrak 10 shift dimulai pukul 23:00. Jangan sampai lengah, Raka.'
    }
  ];

  const NIGHT_CONFIGS = {
    1: {
      number: 1,
      title: 'Shift Pertama',
      startHour: 23,
      endHour: 4,
      rainIntensity: 0.42,
      fogDensity: 0.25,
      ambientTension: 0.08,
      eventChance: 0.28,
      toppingsUnlocked: false,
      introNote: 'Malam 1 dari 10. Angkat telepon Pak Hendra saat berdering dan kenali wajah pelanggan tetap di Jalan Melati.',
      summaryNote: 'Malam pertama selesai dengan aman. Pertanyaan tamu terakhir pukul 03:00 tentang Dimas masih terasa mengganjal.'
    },
    2: {
      number: 2,
      title: 'Tatapan di Balik Kaca',
      startHour: 23,
      endHour: 4.5,
      rainIntensity: 0.68,
      fogDensity: 0.38,
      ambientTension: 0.2,
      eventChance: 0.42,
      toppingsUnlocked: false,
      introNote: 'Hujan makin deras malam ini. Coba cek CCTV Halte [V] dan periksa pakaian tamu sebelum membuka kaca.',
      summaryNote: 'Ancaman pertama berhasil kamu kenali. Mulai malam ini kamu bisa membelanjakan kas kios untuk peningkatan keamanan.'
    },
    3: {
      number: 3,
      title: 'Topping & Saluran Telepon',
      startHour: 23,
      endHour: 5,
      rainIntensity: 0.78,
      fogDensity: 0.48,
      ambientTension: 0.32,
      eventChance: 0.55,
      toppingsUnlocked: true,
      introNote: 'Menu Topping (Choco Chips, Karamel, Ceri) resmi aktif! Waspadai panggilan telepon tak dikenal dan lampu berkedip.',
      summaryNote: 'Catatan robek milik Dimas dan suara dari seberang jalan membuktikan seseorang hafal isi dalam kios.'
    },
    4: {
      number: 4,
      title: 'Hujan Tanpa Bayangan',
      startHour: 23,
      endHour: 5,
      rainIntensity: 0.88,
      fogDensity: 0.58,
      ambientTension: 0.44,
      eventChance: 0.66,
      toppingsUnlocked: true,
      introNote: 'Badai dingin menyelimuti jembatan layang. Tidak semua yang mengetuk panik itu jahat—dan tidak semua yang tenang itu manusia biasa.',
      summaryNote: 'Satu nama akhirnya terkuak di balik kartu pengenal tercoret: ARMAN. Namun besok malam baru pertengahan kontrakmu.'
    },
    5: {
      number: 5,
      title: 'Tengah Bulan di Halte Lama',
      startHour: 23,
      endHour: 5,
      rainIntensity: 0.72,
      fogDensity: 0.72,
      ambientTension: 0.58,
      eventChance: 0.72,
      toppingsUnlocked: true,
      introNote: 'Malam ke-5—titik tengah shiftmu. Kabut menebal dan Bripka Danu mulai memantau Jalan Melati.',
      summaryNote: 'Arman sempat muncul terang-terangan pukul 03:00 dan menjatuhkan kunci loker Dimas sebelum sirene patroli mengusirnya. Babak kedua dimulai.'
    },
    6: {
      number: 6,
      title: 'Seragam yang Hilang',
      startHour: 23,
      endHour: 5,
      rainIntensity: 0.82,
      fogDensity: 0.65,
      ambientTension: 0.62,
      eventChance: 0.76,
      toppingsUnlocked: true,
      introNote: 'Pak Hendra melapor seragam cadangan Dimas hilang dari gudang belakang! Aktifkan Kunci Ganda [L] jika mendengar grendel diguncang.',
      summaryNote: 'Penyamaran pelaku makin berani—ia bahkan mulai meniru pelanggan tetapmu. Selalu bandingkan perilaku dan rekaman CCTV Halte.'
    },
    7: {
      number: 7,
      title: 'Pemadaman Jalur Melati',
      startHour: 23,
      endHour: 5,
      rainIntensity: 0.96,
      fogDensity: 0.74,
      ambientTension: 0.7,
      eventChance: 0.82,
      toppingsUnlocked: true,
      introNote: 'Badai petir memicu pemadaman listrik mendadak! Jaga Ketenanganmu dengan Kopi Hangat [C] dan reset saklar [F] bila gelap total.',
      summaryNote: 'Sosok berseragam kios bernama "Dimas" muncul di depan jendela malam ini. Semakin jelas pelaku bersembunyi sangat dekat dari sini.'
    },
    8: {
      number: 8,
      title: 'Suara dari Balik Dinding',
      startHour: 23,
      endHour: 5,
      rainIntensity: 0.88,
      fogDensity: 0.78,
      ambientTension: 0.78,
      eventChance: 0.86,
      toppingsUnlocked: true,
      introNote: 'Suara rekaman aneh mulai masuk lewat telepon kios. Perhatikan baik-baik saksi mata dari Reno dan Nadia malam ini.',
      summaryNote: 'Ruang genset halte tua terkonfirmasi sebagai tempat persembunyian Arman. Tinggal dua malam menuju fajar terakhir.'
    },
    9: {
      number: 9,
      title: 'Malam Sebelum Fajar Terakhir',
      startHour: 23,
      endHour: 5,
      rainIntensity: 0.95,
      fogDensity: 0.84,
      ambientTension: 0.86,
      eventChance: 0.9,
      toppingsUnlocked: true,
      introNote: 'Surat penangkapan resmi terbit! Polisi menyiapkan penyergapan besok malam—malam ini Arman berusaha menghancurkan mentalmu habis-habisan.',
      summaryNote: 'Kamu berhasil melewati malam terberat tanpa runtuh. Besok adalah Malam ke-10: klimaks penentuan nasibmu dan kasus Dimas.'
    },
    10: {
      number: 10,
      title: 'Jam Tiga Pagi — Malam Terakhir',
      startHour: 23,
      endHour: 5,
      rainIntensity: 0.58,
      fogDensity: 0.94,
      ambientTension: 0.92,
      eventChance: 0.92,
      toppingsUnlocked: true,
      introNote: 'Malam ke-10. Kabut putih pekat menelan seluruh Jalan Melati. Bertahanlah hingga pukul 03:00—dan akhiri teror ini selamanya.',
      summaryNote: 'Sepuluh malam di Kios Sora Dingin akhirnya berakhir.'
    }
  };

  const UPGRADES = {
    halogen: {
      id: 'halogen',
      name: 'Lampu Teras Halogen',
      price: 45000,
      desc: 'Sorotan lampu jauh lebih tajam: menambah +0.9 detik waktu reaksi saat penyusup menerjang jendela.'
    },
    reinforcedGlass: {
      id: 'reinforcedGlass',
      name: 'Kaca Anti-Pecah & Rel Baja',
      price: 60000,
      desc: 'Jendela membanting lebih cepat dan otomatis menahan 1 kali guncangan grendel berbahaya tiap malam.'
    },
    stabilizer: {
      id: 'stabilizer',
      name: 'Stabilizer Listrik Neon',
      price: 55000,
      desc: 'Mengurangi penurunan Ketenangan hingga 50% dari kedipan lampu, petir, dan pemadaman listrik.'
    },
    coffeeThermos: {
      id: 'coffeeThermos',
      name: 'Termos Kopi Barista',
      price: 40000,
      desc: 'Memulai setiap malam dengan 2 cangkir Kopi Hangat gratis (+30% Ketenangan per cangkir).'
    }
  };

  const CLUES = {
    clue_bus: {
      id: 'clue_bus',
      night: 1,
      title: 'Jadwal Bus Terakhir',
      summary: 'Pak Darma memastikan bus terakhir rute Jalan Melati berhenti beroperasi pukul 23:30. Tidak ada bus lagi hingga subuh.'
    },
    clue_dimas_query: {
      id: 'clue_dimas_query',
      night: 1,
      title: 'Tamu Pukul 03:00',
      summary: 'Pria asing bermantel menanyakan Dimas tepat sekitar pukul 03:00. Matanya nyaris tak berkedip dan terus melirik grendel jendela.'
    },
    clue_dry_coat: {
      id: 'clue_dry_coat',
      night: 2,
      title: 'Mantel Kering di Tengah Badai',
      summary: 'Tamu yang mengaku baru turun dari bus ternyata berpakaian kering mutlak di tengah hujan deras—ia sudah lama bersembunyi dekat kios.'
    },
    clue_medical: {
      id: 'clue_medical',
      night: 2,
      title: 'Catatan Perawat Tika',
      summary: 'Warga yang hilang di Jalan Melati selalu lenyap pukul 03:00 tanpa bekas pintu didobrak; korban membuka pintu sendiri untuk seseorang.'
    },
    clue_dimas_note: {
      id: 'clue_dimas_note',
      night: 3,
      title: 'Sobekan Kertas Milik Dimas',
      summary: 'Terselip di sisi freezer: "Jangan buka untuk yang pesan rasa aneh di luar menu. Dia hafal isi kios. Inisial namanya A..."'
    },
    clue_phone_voice: {
      id: 'clue_phone_voice',
      night: 3,
      title: 'Penelepon dari Seberang Jalan',
      summary: 'Penelepon tanpa nomor tahu persis detik ketika lampu neon kios berkedip. Pelaku mengintai langsung dari jarak pandang depan kios.'
    },
    clue_inspector_lie: {
      id: 'clue_inspector_lie',
      night: 4,
      title: 'Kartu Nama Tercoret',
      summary: 'Pria yang mengaku "Pengawas Malam" menyembunyikan kartu usang di balik jasnya. Di bawah coretan tinta hitam masih terbaca nama: ARMAN.'
    },
    clue_locker_key: {
      id: 'clue_locker_key',
      night: 5,
      title: 'Kunci Loker Milik Dimas',
      summary: 'Pada konfrontasi Malam 5 pukul 03:00, Arman sengaja meletakkan kunci loker berkarat bertuliskan "DIMAS" di kusen kaca sebelum kabur.'
    },
    clue_missing_uniform: {
      id: 'clue_missing_uniform',
      night: 6,
      title: 'Seragam Cadangan yang Dicuri',
      summary: 'Pak Hendra menemukan gembok gudang belakang rusak—seragam lengkap dan topi kerja milik Dimas dicuri untuk dipakai menyamar.'
    },
    clue_cctv_alley: {
      id: 'clue_cctv_alley',
      night: 7,
      title: 'Jalur Gang Gelap Halte',
      summary: 'Rekaman CCTV Halte membuktikan para penyamar tidak pernah berjalan dari jalan raya—mereka selalu keluar dari lorong gelap di belakang halte tua.'
    },
    clue_dimas_tape: {
      id: 'clue_dimas_tape',
      night: 8,
      title: 'Rekaman Suara Terakhir Dimas',
      summary: 'Di balik suara telepon misterius terdengar dengung mesin genset besar dan teriakan Dimas menyebut: "Arman, jangan tutup pintunya!"'
    },
    clue_genset_hideout: {
      id: 'clue_genset_hideout',
      night: 8,
      title: 'Ruang Genset Halte Tua',
      summary: 'Reno dan Nadia melihat cahaya senter dan pintu besi ruang genset bawah halte tua terbuka—lokasi persembunyian Arman dan tempat ia menyekap barang korban.'
    },
    clue_police_warrant: {
      id: 'clue_police_warrant',
      night: 9,
      title: 'Berkas Penangkapan Arman K.',
      summary: 'Bripka Danu mengonfirmasi Arman K., mantan penjaga malam halte yang dipecat setelah berselisih dengan Dimas, kini berstatus buron utama.'
    },
    clue_trap_signal: {
      id: 'clue_trap_signal',
      night: 10,
      title: 'Kode Sinyal Penyergapan 03:00',
      summary: 'Polsek Melati menyiagakan dua mobil patroli tanpa sirine di ujung gang. Begitu kamu mengonfirmasi Arman di depan kaca terkunci, mereka langsung menyergap.'
    }
  };

  const PHONE_CALLS = {
    night1_boss: {
      id: 'night1_boss',
      speaker: 'Telepon — Pak Hendra (Pemilik)',
      tag: 'Panggilan Masuk',
      creepy: false,
      lines: [
        'Halo, Raka? Terima kasih sudah mengambil kontrak 10 malam ini. Malam pertama biasanya santai—pelanggan bengkel dan kampus sering mampir.',
        'Ingat alurnya: amati dulu [Q], cek CCTV Halte [V] kalau ragu, lalu buka jendela [E] hanya jika aman. Jangan lupa tutup kaca lagi setelah pelanggan pergi.'
      ]
    },
    night2_boss: {
      id: 'night2_boss',
      speaker: 'Telepon — Pak Hendra (Pemilik)',
      tag: 'Panggilan Masuk',
      creepy: false,
      lines: [
        'Raka, hujan makin besar. Tetangga bengkel melapor melihat pria bertudung berdiri diam di halte sejak jam 10 malam.',
        'Mulai akhir shift malam ini, kamu boleh pakai uang kas untuk beli peningkatan keamanan kios. Tapi tetap jangan tolak pelanggan sah sembarangan ya!'
      ]
    },
    night3_boss: {
      id: 'night3_boss',
      speaker: 'Telepon — Pak Hendra (Pemilik)',
      tag: 'Panggilan Masuk',
      creepy: false,
      clueId: 'clue_dimas_note',
      lines: [
        'Raka, malam ini menu topping Choco Chips, Karamel, dan Ceri mulai dijual! Cek slip pesanan baik-baik sebelum menyerahkan cup.',
        'Oh ya... aku menemukan sobekan catatan Dimas terselip di sisi freezer: "Jangan buka untuk yang pesan rasa di luar menu. Dia hafal isi kios. Inisial A..." Hati-hati ya.'
      ]
    },
    night3_creepy: {
      id: 'night3_creepy',
      speaker: 'Telepon — Nomor Tidak Dikenal',
      tag: 'Statis Berat',
      creepy: true,
      clueId: 'clue_phone_voice',
      lines: [
        '...krrrshhh... (suara napas pelan bercampur rintik hujan)...',
        '"Lampu neonmu baru saja berkedip, Raka. Terlihat jelas sekali dari bawah tiang lampu sini."',
        '"Dimas dulu juga minum kopi tengah malam supaya tangannya tidak gemetar... sampai pukul tiga pagi."'
      ]
    },
    night4_warning: {
      id: 'night4_warning',
      speaker: 'Telepon — Siaran Patroli Warga',
      tag: 'Peringatan Malam',
      creepy: false,
      lines: [
        'Peringatan bagi penjaga kios malam di Jalan Melati Lama. Seorang pria bermantel dilaporkan menyamar sebagai petugas inspeksi atau pelanggan tetap.',
        'Gunakan lampu dan kamera pantau sebelum membuka kaca. Jangan percaya kartu pengenal lusuh tanpa verifikasi!'
      ]
    },
    night5_police: {
      id: 'night5_police',
      speaker: 'Telepon — Bripka Danu (Polsek Melati)',
      tag: 'Saluran Polisi',
      creepy: false,
      lines: [
        'Halo Raka, ini Bripka Danu dari Polsek Melati. Malam ini malam kelima—kami mendapat laporan sosok bermantel terlihat sangat dekat dengan halte tua.',
        'Mobil patroli kami akan melintas sekitar pukul 03:10. Jika dia datang pukul 03:00, JANGAN buka jendela! Tahan dia di luar sampai kami lewat!'
      ]
    },
    night6_boss: {
      id: 'night6_boss',
      speaker: 'Telepon — Pak Hendra (Pemilik)',
      tag: 'Darurat Gudang',
      creepy: false,
      clueId: 'clue_missing_uniform',
      lines: [
        'Raka! Gawat! Tadi sore aku cek gudang belakang kios, gemboknya dicongkel orang!',
        'Tidak ada uang yang hilang... yang dicuri cuma seragam kerja cadangan dan topi milik Dimas! Kalau ada orang datang pakai seragam kios atau meniru pelanggan tetap, periksa mati-matian sebelum membuka kaca!'
      ]
    },
    night7_storm: {
      id: 'night7_storm',
      speaker: 'Telepon — Petugas PLN Wilayah Melati',
      tag: 'Peringatan Badai',
      creepy: false,
      lines: [
        'Pemberitahuan otomatis: badai petir di ruas Jalan Melati menyebabkan fluktuasi gardu. Kios Anda dapat mengalami pemadaman sesaat.',
        'Jika lampu padam total, segera tekan saklar pemutus [F] dan aktifkan Kunci Ganda [L] selama ruangan gelap!'
      ]
    },
    night8_tape: {
      id: 'night8_tape',
      speaker: 'Telepon — Saluran Tanpa Nomor',
      tag: 'Rekaman Usang',
      creepy: true,
      clueId: 'clue_dimas_tape',
      lines: [
        '...klik... (dengung berat seperti mesin genset tua bergema di latar belakang)...',
        'Suara serak terdengar di balik statis: "Tolong... siapa pun... Arman mengunci pintu ruang genset halte... jangan buka jendela kios jam tiga..."',
        'Suara lain mendekati mikrofon sambil berbisik pelan: "Kaset yang bagus, kan, Raka?" ...tuuut...'
      ]
    },
    night9_police: {
      id: 'night9_police',
      speaker: 'Telepon — Bripka Danu (Polsek Melati)',
      tag: 'Surat Penangkapan',
      creepy: false,
      clueId: 'clue_police_warrant',
      lines: [
        'Raka, kami sudah mengantongi surat penangkapan resmi atas nama Arman K., mantan penjaga malam halte Melati!',
        'Tim penyergapan penuh baru siap besok malam (Malam 10) pukul 03:00. Malam ini dia pasti sadar ruang geraknya sempit—jaga Ketenanganmu, kunci ganda jendela kalau grendel diguncang!'
      ]
    },
    night10_police: {
      id: 'night10_police',
      speaker: 'Telepon — Bripka Danu (Tim Sergap)',
      tag: 'Operasi 03:00',
      creepy: false,
      clueId: 'clue_trap_signal',
      lines: [
        'Raka, ini malam kesepuluh. Dua unit tim sergap kami sudah mematikan lampu dan bersembunyi 150 meter di belakang jembatan layang.',
        'Layani pelanggan biasa seperti biasa agar Arman tidak curiga. Begitu ia tiba pukul 03:00, JANGAN buka kaca! Jika kamu sudah mengumpulkan minimal 9 petunjuk, tekan tombol Ungkap & Jebak Polisi [X]—kami akan langsung menyergap!'
      ]
    },
    random_creepy_breath: {
      id: 'random_creepy_breath',
      speaker: 'Telepon — Tidak Dikenal',
      tag: 'Saluran Terputus',
      creepy: true,
      lines: [
        '...krrrshhh... (suara ketukan pelan di gagang telepon, persis irama ketukan kaca jendela)...',
        '"...Es krim rasa apa yang paling cepat membekukan darah, Raka?..." (klik).'
      ]
    }
  };

  const ENDINGS = {
    good: {
      type: 'good',
      badge: 'GOOD ENDING — 10 MALAM SELESAI',
      title: 'Fajar di Jalan Melati',
      subtitle: 'Pukul 05:00 di Malam ke-10. Kontrak sepuluh malam berakhir dan matahari akhirnya terbit.',
      paragraphs: [
        'Dengan tangan gemetar namun tegas, kamu menjaga jendela terkunci rapat sampai pukul 05:00. Arman menatapmu dalam kebisuan panjang dari balik kabut putih, lalu berbalik dan lenyap ke arah jembatan layang.',
        'Saat langit timur berubah keemasan, mobil patroli pagi menyusuri Jalan Melati Lama. Kamu menyelesaikan seluruh sepuluh shift malam dengan selamat, membawa seluruh upah dan rasa lega yang tak terbayar.',
        'Kios Sora Dingin ditutup sementara untuk renovasi. Namun karena bukti belum cukup untuk menjebaknya di lokasi, warga sekitar masih sesekali mendengar langkah sepatu kering di halte tua setiap pukul tiga pagi.'
      ]
    },
    secret: {
      type: 'secret',
      badge: 'SECRET ENDING — KASUS DIMAS TERPECAHKAN',
      title: 'Topeng Terbuka',
      subtitle: 'Sepuluh malam pengamatan terbayar tuntas pukul 03:00. Sang pemburu masuk ke perangkapnya sendiri.',
      paragraphs: [
        'Di balik kaca terkunci ganda, kamu menyebut seluruh kebenaran dengan lantang: nama aslinya Arman, ruang genset halte tua, seragam curian, dan rekaman suara Dimas. Senyum dingin di wajahnya runtuh seketika.',
        'Saat ia panik menggedor kaca berusaha menghancurkan bukti, sinyal darurat yang kamu kirim ke Bripka Danu memicu dua mobil tim sergap meluncur tanpa ampun dari balik kabut.',
        'Kilatan biru-merah sirene polisi memecah malam Jalan Melati. Arman dibekuk di bawah tiang lampu tempat ia biasa mengintai. Tim penyelamat langsung mendobrak ruang genset halte tua dan menemukan Dimas dalam keadaan lemah namun masih hidup!',
        'Fajar Malam ke-10 terbit cerah di atas Kios Sora Dingin. Teror Jam Tiga Pagi akhirnya tamat selamanya.'
      ]
    },
    bad_killed: {
      type: 'bad',
      badge: 'BAD ENDING — KEPUTUSAN FATAL',
      title: 'Kios Kosong di Pagi Hari',
      subtitle: 'Jendela pelayanan terbuka bagi sosok yang seharusnya tetap berada di luar.',
      paragraphs: [
        'Begitu kaca bergeser, udara dingin menusuk masuk bersama bau besi basah. Sebelum tanganmu sempat menyentuh grendel, bayangan di luar sudah menyergap melewati meja konter.',
        'Lampu neon berkedip liar lalu padam total. Hanya dengung dingin freezer es krim yang tersisa di dalam gelap.',
        'Pukul 07:00 pagi, Pak Hendra menemukan jendela kios masih terbuka separuh, gagang telepon tergantung terlepas, dan tidak ada siapa pun di dalam. Dua minggu kemudian, kertas lowongan penjaga shift malam kembali ditempel di kaca depan.'
      ]
    },
    bad_fired: {
      type: 'bad',
      badge: 'BAD ENDING — KONTRAK DIPUTUS',
      title: 'Dipecat di Tengah Malam',
      subtitle: 'Ketakutan membuatmu mengusir terlalu banyak pelanggan yang tidak bersalah.',
      paragraphs: [
        'Telepon merah berdering tajam. Suara Pak Hendra terdengar kecewa berat setelah tiga pelanggan tetap mengadu ditolak mentah-mentah di depan kaca.',
        '"Kalau kamu sudah tidak sanggup membedakan pelanggan biasa dan bayangan di kepalamu sendiri, kunci kios dan pulang sekarang, Raka!"',
        'Kamu berjalan pulang sendirian menembus hujan deras pukul 02:40. Dua puluh meter di belakangmu, terdengar langkah sepatu tenang yang selalu berhenti setiap kali kamu menoleh...'
      ]
    },
    bad_panic: {
      type: 'bad',
      badge: 'BAD ENDING — KETENANGAN RUNTUH',
      title: 'Pingsan di Balik Konter',
      subtitle: 'Tekanan psikologis malam itu melampaui batas kewarasanmu.',
      paragraphs: [
        'Detak jantungmu bergemuruh menelan suara hujan. Lampu neon berputar-putar dalam pandanganmu, sementara bisikan dari luar kaca terasa datang dari tepat di belakang tengkukmu.',
        'Lututmu menyerah dan tubuhmu ambruk di balik meja kasir—tepat ketika terdengar suara grendel jendela dipaksa terbuka dari luar...',
        'Pagi harinya, kios ditemukan sepi dengan secangkir kopi dingin yang belum sempat disentuh.'
      ]
    }
  };

  NS.Dialogue = {
    INTRO_STEPS,
    NIGHT_CONFIGS,
    UPGRADES,
    CLUES,
    PHONE_CALLS,
    ENDINGS
  };
})(window);
