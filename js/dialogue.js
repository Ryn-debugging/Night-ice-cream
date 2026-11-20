/* ==========================================================================
   NIGHT SHIFT: ICE CREAM — Narrative, Clues, Phone Calls, Intro & Endings
   ========================================================================== */

(function (global) {
  'use strict';

  const NS = (global.NightShift = global.NightShift || {});

  const INTRO_STEPS = [
    {
      heading: 'Malam Pertama di Jalan Melati',
      paragraphs: [
        'Hujan gerimis jatuh tipis di atap seng Kios Es Krim "Sora Dingin". Jam dinding baru menyentuh pukul 22:55. Di luar, Jalan Melati Lama hampir sepenuhnya kosong.',
        'Pemilik kios, Pak Hendra, menawarkan upah malam dua kali lipat karena penjaga shift sebelumnya—Dimas—tiba-tiba berhenti datang dua minggu lalu tanpa kabar.',
        'Aturannya sederhana: jaga jendela tetap tertutup saat tidak melayani, amati siapa pun yang mengetuk, sajikan es krim bagi pelanggan biasa, dan jangan pernah membuka kaca untuk orang yang terasa salah.'
      ],
      whisper: '“Kalau ada yang datang lewat tengah malam dan gelagatnya ganjil, percayai instingmu. Kaca ini satu-satunya batas antara kamu dan jalanan.”'
    },
    {
      heading: 'Cara Bertahan Hingga Fajar',
      paragraphs: [
        'Setiap pelanggan akan mengetuk kaca dari luar. Sebelum membuka jendela, kamu bisa menekan tombol Amati [Q] untuk memeriksa wajah, pakaian, atau menguji reaksi mereka terhadap pertanyaan dan lampu teras.',
        'Hati-hati: sebagian pelanggan biasa juga terlihat aneh atau lelah karena kerja malam. Menolak pelanggan yang tidak bersalah terlalu sering akan membuat Pak Hendra menegurmu—tiga teguran berarti shiftmu berakhir.',
        'Jawab telepon merah saat berdering [T], periksa buku catatan petunjuk [J], dan jika kamu salah membuka jendela untuk ancaman berbahaya... segera banting tutup jendela [E] sebelum terlambat.'
      ],
      whisper: 'Shift malam dimulai pukul 23:00. Selamat bertugas, Raka.'
    }
  ];

  const NIGHT_CONFIGS = {
    1: {
      number: 1,
      title: 'Shift Pertama',
      startHour: 23,
      endHour: 4, // 23:00 -> 04:00
      rainIntensity: 0.45,
      fogDensity: 0.28,
      ambientTension: 0.08,
      eventChance: 0.3,
      introNote: 'Malam pertama terasa cukup tenang. Dengarkan telepon Pak Hendra dan biasakan dirimu dengan cara kerja kios.',
      summaryNote: 'Shift pertama berlalu dengan aman. Namun pertanyaan tamu terakhir tentang Dimas masih menggantung di kepalamu.'
    },
    2: {
      number: 2,
      title: 'Tatapan di Balik Kaca',
      startHour: 23,
      endHour: 4.5, // 23:00 -> 04:30
      rainIntensity: 0.72,
      fogDensity: 0.42,
      ambientTension: 0.22,
      eventChance: 0.48,
      introNote: 'Hujan turun jauh lebih deras malam ini. Perhatikan baik-baik siapa yang benar-benar kehujanan dan siapa yang tidak.',
      summaryNote: 'Sesuatu jelas tidak beres di sekitar Jalan Melati. Beberapa tamu berbicara seolah mereka mengawasi kios ini setiap malam.'
    },
    3: {
      number: 3,
      title: 'Suara di Saluran Telepon',
      startHour: 23,
      endHour: 5, // 23:00 -> 05:00
      rainIntensity: 0.85,
      fogDensity: 0.56,
      ambientTension: 0.38,
      eventChance: 0.65,
      introNote: 'Lampu neon mulai sering berdengung. Jika lampu tiba-tiba redup, tekan saklar Lampu Kios [F]. Jangan abaikan telepon yang berdering.',
      summaryNote: 'Catatan lama milik Dimas dan panggilan tanpa nomor membuktikan satu hal: sosok itu mengetahui bagian dalam kios ini.'
    },
    4: {
      number: 4,
      title: 'Hujan Tanpa Bayangan',
      startHour: 23,
      endHour: 5,
      rainIntensity: 0.95,
      fogDensity: 0.68,
      ambientTension: 0.55,
      eventChance: 0.78,
      introNote: 'Badai dingin menyelimuti jembatan layang. Tidak semua yang panik adalah ancaman—dan tidak semua yang tenang adalah manusia biasa.',
      summaryNote: 'Tinggal satu malam lagi. Jika semua potongan petunjuk sudah terkumpul, besok malam mungkin menjadi kesempatan terakhirmu.'
    },
    5: {
      number: 5,
      title: 'Jam Tiga Pagi',
      startHour: 23,
      endHour: 5,
      rainIntensity: 0.6,
      fogDensity: 0.88,
      ambientTension: 0.75,
      eventChance: 0.85,
      introNote: 'Kabut tebal menelan seluruh ujung jalan. Hujan hampir berhenti, menyisakan sunyi yang mencekam. Bertahanlah hingga fajar—atau ungkap kebenarannya.',
      summaryNote: 'Fajar akhirnya menyentuh kaca kios.'
    }
  };

  const CLUES = {
    clue_bus: {
      id: 'clue_bus',
      night: 1,
      title: 'Jadwal Bus Terakhir',
      summary: 'Pak Darma memastikan bus terakhir rute Jalan Melati berhenti beroperasi pukul 23:30. Tidak ada bus yang lewat setelah tengah malam.'
    },
    clue_dimas_query: {
      id: 'clue_dimas_query',
      night: 1,
      title: 'Tamu Pukul 03:00',
      summary: 'Pria asing bermantel menanyakan Dimas tepat sekitar pukul 03:00. Matanya nyaris tak berkedip dan terus memperhatikan kunci grendel jendela.'
    },
    clue_dry_coat: {
      id: 'clue_dry_coat',
      night: 2,
      title: 'Mantel Kering di Tengah Badai',
      summary: 'Seseorang yang mengaku baru berjalan dari halte ternyata berpakaian benar-benar kering meski hujan turun deras. Ia pasti sudah bersembunyi dekat kios.'
    },
    clue_medical: {
      id: 'clue_medical',
      night: 2,
      title: 'Catatan Perawat Tika',
      summary: 'Beberapa warga yang hilang di sekitar Jl. Melati lenyap sekitar pukul 03:00 tanpa tanda pembobolan. Diduga mereka membuka pintu sendiri untuk seseorang.'
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
      summary: 'Suara tenang tanpa nomor tahu persis detik ketika lampu neon kios berkedip. Pelaku mengintai langsung dari jarak pandang depan kios.'
    },
    clue_inspector_lie: {
      id: 'clue_inspector_lie',
      night: 4,
      title: 'Kartu Nama Tercoret',
      summary: 'Pria yang mengaku "Pengawas Malam" menyembunyikan kartu usang di balik mantelnya. Di bawah coretan tinta hitam masih terbaca nama: ARMAN.'
    },
    clue_police_alert: {
      id: 'clue_police_alert',
      night: 5,
      title: 'Peringatan Kepolisian Melati',
      summary: 'Siaran darurat menyebut buronan bernama Arman K., mantan penjaga malam halte lama yang pernah berselisih dengan Dimas di kios Sora Dingin.'
    }
  };

  const PHONE_CALLS = {
    night1_boss: {
      id: 'night1_boss',
      speaker: 'Telepon — Pak Hendra (Pemilik)',
      tag: 'Panggilan Masuk',
      creepy: false,
      lines: [
        'Halo, Raka? Bagus kamu sudah sampai. Maaf kios ini agak sepi kalau malam, tapi pelanggan tetap biasa datang dari bengkel dan kampus.',
        'Ingat prosedur ya: amati dulu dari balik kaca. Kalau aman, buka jendela, ambil es krim dari freezer, lalu serahkan sesuai slip pesanan.',
        'Satu lagi... jangan lupa tutup kembali jendelanya setelah pelanggan pergi. Jangan pernah biarkan terbuka sembarangan. Selamat bekerja.'
      ]
    },
    night2_boss: {
      id: 'night2_boss',
      speaker: 'Telepon — Pak Hendra (Pemilik)',
      tag: 'Panggilan Masuk',
      creepy: false,
      lines: [
        'Raka, hujan deras sekali malam ini. Tadi tetangga bengkel menelepon, katanya ada orang mencurigakan sering berdiri dekat tiang lampu seberang kios.',
        'Kalau ada pelanggan yang ceritanya tidak masuk akal atau membuatmu tidak nyaman, langsung tekan Tolak saja. Keselamatanmu lebih penting dari satu cup es krim.',
        'Tapi jangan sembarangan menolak pelanggan biasa juga ya—omzet kita tetap diawasi. Gunakan tombol Amati sebelum memutuskan.'
      ]
    },
    night3_boss: {
      id: 'night3_boss',
      speaker: 'Telepon — Pak Hendra (Pemilik)',
      tag: 'Panggilan Masuk',
      creepy: false,
      clueId: 'clue_dimas_note',
      lines: [
        'Raka... aku baru membersihkan loker barang lama milik Dimas sore tadi. Ada sobekan catatan yang sempat terselip di samping freezer.',
        'Bunyinya agak bikin merinding: "Jangan buka untuk yang pesan rasa tidak ada di menu. Dia hafal isi kios. Inisial namanya A..."',
        'Aku tidak tahu Dimas bercanda atau serius, tapi tolong waspada malam ini. Aku sudah menyuruh polisi patroli sesekali lewat Melati.'
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
        '"Kenapa masih menyalakan lampu teras? Kamu tidak suka gelap, ya? Dimas dulu juga begitu... sampai pukul tiga pagi."'
      ]
    },
    night4_warning: {
      id: 'night4_warning',
      speaker: 'Telepon — Siaran Patroli Warga',
      tag: 'Peringatan Malam',
      creepy: false,
      lines: [
        'Peringatan bagi seluruh penjaga kios malam di sepanjang Jalan Melati Lama. Seorang pria bermantel gelap dilaporkan menyamar sebagai petugas atau penumpang terlambat.',
        'Waspadai orang yang tidak terpengaruh hujan, menghindari cahaya langsung, atau terlalu banyak tahu tentang isi ruangan tempat kerja Anda.',
        'Jika melihat pelaku, JANGAN buka pintu atau jendela. Kunci rapat dan tunggu fajar.'
      ]
    },
    night5_police: {
      id: 'night5_police',
      speaker: 'Telepon — Bripka Danu (Polsek Melati)',
      tag: 'Saluran Darurat',
      creepy: false,
      clueId: 'clue_police_alert',
      lines: [
        'Halo, penjaga kios Sora Dingin? Ini Bripka Danu dari Polsek Melati. Kami baru mengonfirmasi identitas terduga pelaku hilangnya Dimas dan dua warga lainnya.',
        'Namanya Arman K., mantan penjaga malam halte lama yang diberhentikan tahun lalu. Ia terobsesi pada kios itu sejak Dimas menolaknya masuk pukul 03:00.',
        'Mobil patroli kami hanya berjarak 3 menit dari Jl. Melati. Jika dia muncul lagi, JANGAN buka jendela! Kalau kamu punya cukup bukti dan ia datang sendiri, tahan dia di luar dan segera laporkan lewat tombol darurat!'
      ]
    },
    random_creepy_breath: {
      id: 'random_creepy_breath',
      speaker: 'Telepon — Tidak Dikenal',
      tag: 'Saluran Terputus',
      creepy: true,
      lines: [
        '...krrrshhh... (suara ketukan pelan di gagang telepon, persis seperti ketukan di kaca jendela)...',
        '"...Es krim rasa apa yang paling dingin di malam seperti ini?..." (klik — sambungan terputus).'
      ]
    }
  };

  const ENDINGS = {
    good: {
      type: 'good',
      badge: 'GOOD ENDING — BERTAHAN HINGGA FAJAR',
      title: 'Fajar di Jalan Melati',
      subtitle: 'Pukul 05:00. Lampu jalan padam satu per satu, dan kabut perlahan memudar.',
      paragraphs: [
        'Kamu menahan napas di balik kaca terkunci sementara bayangan di luar akhirnya mundur perlahan ke dalam kabut. Tidak ada lagi ketukan. Tidak ada lagi bisikan dari celah jendela.',
        'Saat langit timur berubah kelabu keemasan, suara mesin truk pasar dan sirine patroli pagi memecah sunyi Jalan Melati Lama. Kamu berhasil melewati seluruh lima shift malam dengan selamat.',
        'Keesokan harinya, kamu menyerahkan kunci kios kepada Pak Hendra dan mengundurkan diri. Di seberang halte tua, jejak sepatu kering tidak pernah ditemukan lagi—sosok itu menghilang entah ke mana, menunggu penjaga shift berikutnya.'
      ]
    },
    secret: {
      type: 'secret',
      badge: 'SECRET ENDING — KEBENARAN TERUNGKAP',
      title: 'Topeng Terbuka',
      subtitle: 'Semua petunjuk terhubung tepat pukul 03:00 pagi. Kali ini, sang pemburu yang terjebak.',
      paragraphs: [
        'Dengan jendela terkunci rapat, kamu menyebut nama aslinya dengan lantang melalui celah kaca: "Arman." Untuk pertama kalinya, senyum dingin di wajahnya membeku.',
        'Sementara ia terpaku menggedor kaca karena terkejut identitas dan catatan Dimas telah terbongkar, saluran telepon darurat yang diam-diam kamu sambungkan ke Bripka Danu memandu dua mobil patroli meluncur dari balik kabut.',
        'Cahaya biru-merah sirene polisi menyapu aspal basah Jalan Melati. Arman dibekuk di bawah tiang lampu tempat ia biasa mengintai. Dari kantong mantelnya, polisi menemukan kunci loker milik Dimas dan berkas penyelidikan akhirnya terpecahkan.',
        'Fajar terbit di atas Kios Sora Dingin. Jalan Melati tidak lagi dihantui tamu pukul tiga pagi.'
      ]
    },
    bad_killed: {
      type: 'bad',
      badge: 'BAD ENDING — KEPUTUSAN FATAL',
      title: 'Kios Kosong di Pagi Hari',
      subtitle: 'Jendela pelayanan terbuka terlalu lama untuk orang yang salah.',
      paragraphs: [
        'Begitu kaca bergeser penuh, udara dingin menusuk masuk bersama bau logam basah. Sebelum tanganmu sempat meraih grendel, sosok di luar sudah meluncur melewati celah meja konter.',
        'Lampu neon berkedip hebat lalu padam seketika. Hanya dengung freezer es krim yang tersisa di dalam kegelapan.',
        'Pukul 07:00 pagi, Pak Hendra menemukan jendela kios masih terbuka separuh, telepon merah tergantung terlepas dari gagangnya, dan tidak ada seorang pun di dalam. Dua minggu kemudian, papan lowongan penjaga shift malam kembali dipasang di kaca depan.'
      ]
    },
    bad_fired: {
      type: 'bad',
      badge: 'BAD ENDING — SHIFT DIHENTIKAN',
      title: 'Dipecat di Tengah Malam',
      subtitle: 'Ketakutan membuatmu menolak terlalu banyak pelanggan yang tidak bersalah.',
      paragraphs: [
        'Telepon merah berdering keras. Suara Pak Hendra terdengar penuh kecewa dan marah setelah menerima tiga laporan pelanggan tetap yang diusir mentah-mentah dari jendela.',
        '"Kalau kamu terlalu parno sampai tidak bisa membedakan pelanggan biasa, tutup kios sekarang dan pulang saja, Raka!"',
        'Kamu meninggalkan kios pukul 02:30 di bawah hujan deras. Di sepanjang jalan pulang yang gelap, kamu terus mendengar langkah kaki tenang mengikuti dua puluh meter di belakangmu...'
      ]
    }
  };

  NS.Dialogue = {
    INTRO_STEPS,
    NIGHT_CONFIGS,
    CLUES,
    PHONE_CALLS,
    ENDINGS
  };
})(window);
