/* ==========================================================================
   NIGHT SHIFT: ICE CREAM v2.0.0 — Flavors, Toppings & 10-Night Customer Roster
   45+ handcrafted encounters across 10 escalating nights with red herrings,
   recurring story arcs, CCTV approach clues, toppings, and two climaxes
   (Night 5 Mid-Climax + Night 10 True Climax).
   ========================================================================== */

(function (global) {
  'use strict';

  const NS = (global.NightShift = global.NightShift || {});

  const FLAVORS = {
    vanilla: { id: 'vanilla', name: 'Vanila Klasik', shortName: 'Vanila', price: 15000, color: '#f3ead3', rim: '#d9cbb0' },
    chocolate: { id: 'chocolate', name: 'Cokelat Pekat', shortName: 'Cokelat', price: 18000, color: '#5a3825', rim: '#3d2416' },
    strawberry: { id: 'strawberry', name: 'Stroberi Malam', shortName: 'Stroberi', price: 18000, color: '#c96d78', rim: '#994853' },
    matcha: { id: 'matcha', name: 'Matcha Pahit', shortName: 'Matcha', price: 20000, color: '#739362', rim: '#4f6941' },
    mint: { id: 'mint', name: 'Mint Dingin', shortName: 'Mint', price: 20000, color: '#89c5ba', rim: '#5b968c' }
  };

  const TOPPINGS = {
    chips: { id: 'chips', name: 'Choco Chips', shortName: 'Choco', price: 5000, color: '#3b2416' },
    caramel: { id: 'caramel', name: 'Saus Karamel', shortName: 'Karamel', price: 5000, color: '#c9842b' },
    cherry: { id: 'cherry', name: 'Ceri Merah', shortName: 'Ceri', price: 6000, color: '#cf3d34' }
  };

  function calcOrderPrice(order, topping) {
    if (!Array.isArray(order) || order.length === 0) return 0;
    const base = order.reduce((sum, fid) => sum + (FLAVORS[fid] ? FLAVORS[fid].price : 0), 0);
    const top = topping && TOPPINGS[topping] ? TOPPINGS[topping].price : 0;
    return base + top;
  }

  // Reusable visual appearances for recurring characters
  const LOOKS = {
    darma: {
      skin: '#b89476', coat: '#2f3d44', shirt: '#1d2428', hair: '#22201f',
      hat: 'cap', wet: true, stains: 'oil', glasses: false, mask: false,
      gaze: 'normal', blinkRate: 'normal', expression: 'tired_smile', heightScale: 1.02, collarHigh: false
    },
    sari: {
      skin: '#d9cfc5', coat: '#495054', shirt: '#2a2e33', hair: '#171618', hairStyle: 'long',
      hat: 'none', wet: true, stains: 'none', glasses: true, mask: false, prop: 'papers',
      gaze: 'downcast', blinkRate: 'slow', expression: 'exhausted', heightScale: 0.93, collarHigh: false
    },
    gilang: {
      skin: '#c4a287', coat: '#353b34', shirt: '#d6d2c8', hair: '#241f1c',
      hat: 'none', wet: true, stains: 'none', glasses: false, mask: false, prop: 'umbrella',
      gaze: 'normal', blinkRate: 'normal', expression: 'neutral', heightScale: 1.0, collarHigh: false
    },
    tika: {
      skin: '#ceb7a5', coat: '#2b4048', shirt: '#d2dede', hair: '#1f1a1a', hairStyle: 'bun',
      hat: 'none', wet: true, stains: 'none', glasses: false, mask: true, prop: 'badge',
      gaze: 'normal', blinkRate: 'normal', expression: 'serious', heightScale: 0.95, collarHigh: false
    },
    karno: {
      skin: '#b09a86', coat: '#403830', shirt: '#2a241f', hair: '#a9a7a2',
      hat: 'none', wet: true, stains: 'none', glasses: true, mask: false, prop: 'scarf',
      gaze: 'normal', blinkRate: 'slow', expression: 'solemn', heightScale: 0.91, collarHigh: false
    },
    reno: {
      skin: '#c8a88b', coat: '#5c3b29', shirt: '#222222', hair: '#1f1c1a',
      hat: 'helmet_visor', wet: true, stains: 'none', glasses: false, mask: false,
      gaze: 'nervous', blinkRate: 'fast', expression: 'panicked', heightScale: 0.98, collarHigh: false
    },
    nadia: {
      skin: '#d6c1b2', coat: '#5c2d31', shirt: '#2e1d20', hair: '#1b1617', hairStyle: 'long',
      hat: 'none', wet: true, stains: 'none', glasses: false, mask: false,
      gaze: 'nervous', blinkRate: 'fast', expression: 'panicked', heightScale: 0.94, collarHigh: false
    },
    rina: {
      skin: '#c6a792', coat: '#554248', shirt: '#d5c7b8', hair: '#2b2220', hairStyle: 'bun',
      hat: 'none', wet: true, stains: 'none', glasses: true, mask: false, prop: 'umbrella',
      gaze: 'normal', blinkRate: 'normal', expression: 'serious', heightScale: 0.92, collarHigh: false
    },
    bima: {
      skin: '#cbb29d', coat: '#c8d0d2', shirt: '#24343c', hair: '#1c1b1d',
      hat: 'none', wet: true, stains: 'none', glasses: true, mask: false, prop: 'badge',
      gaze: 'normal', blinkRate: 'normal', expression: 'tired_smile', heightScale: 1.01, collarHigh: false
    },
    arman: {
      skin: '#cbc6be', coat: '#22262b', shirt: '#101214', hair: '#141414',
      hat: 'fedora', wet: false, stains: 'dark', glasses: false, mask: false, prop: 'scratched_badge',
      gaze: 'player', blinkRate: 'none', expression: 'cold_smile', heightScale: 1.08, collarHigh: true
    }
  };

  function look(base, overrides) {
    return Object.assign({}, LOOKS[base], overrides || {});
  }

  const NIGHT_SCHEDULES = {
    // =========================================================================
    // NIGHT 1 — Shift Pertama (4 Pelanggan)
    // =========================================================================
    1: [
      {
        id: 'n1_darma',
        name: 'Pak Darma',
        label: 'Mekanik Bengkel Malam',
        threatLevel: 'safe',
        knockStyle: 'normal',
        order: ['chocolate'],
        orderText: '1× Cokelat Pekat',
        clueOnServe: 'clue_bus',
        cctvNote: 'CCTV Halte: Terlihat berjalan santai dari arah bengkel ujung jalan sambil mengibaskan jas hujan.',
        appearance: look('darma'),
        greeting: [
          'Malam, Mas! Wah, penjaga baru ya? Kontrak sepuluh malam gantiin Dimas?',
          'Tolong satu Cokelat Pekat dong. Baru tutup bengkel, badan pegal semua kehujanan.'
        ],
        observations: {
          face: 'Wajahnya lelah dan berkeringat dingin, tapi matanya berkedip wajar saat menatap lampu. Terlihat raut ramah meski kelelahan.',
          clothes: 'Jaket kerjanya basah kuyup meneteskan air hujan. Di pergelangan tangan ada noda hitam pekat—tercium bau oli mesin dan bensin, bukan darah.',
          probe: {
            text: '"Bus? Wah, bus terakhir Jalan Melati sudah habis dari jam 23:30, Mas. Saya jalan kaki dari bengkel ujung gang. Hati-hati ya jaga sendirian."',
            clueId: 'clue_bus'
          }
        },
        serveCorrect: 'Makasih banyak, Mas! Oh ya, kalau ada yang bilang baru turun bus lewat tengah malam, jangan percaya—bus terakhir di sini berhenti jam 23:30!',
        serveWrong: 'Lho, ini bukan cokelat ya? Ya sudahlah, saya capek banget, lain kali cek slip pesanan dulu ya Mas.',
        refuseResponse: 'Lho, kok ditolak? Saya pelanggan tetap di sini lho, Mas. Aduh, nanti saya bilang Pak Hendra deh...'
      },
      {
        id: 'n1_sari',
        name: 'Sari',
        label: 'Mahasiswi Begadang',
        threatLevel: 'safe',
        knockStyle: 'normal',
        order: ['vanilla'],
        orderText: '1× Vanila Klasik',
        cctvNote: 'CCTV Halte: Berlari kecil menyeberang jalan raya sambil memeluk map plastik di bawah gerimis.',
        appearance: look('sari'),
        greeting: [
          'Halo... maaf mengganggu malam-malam. Kios masih buka, kan?',
          'Boleh pesan satu Vanila Klasik? Aku butuh sesuatu yang dingin biar tidak ketiduran ngerjain revisi.'
        ],
        observations: {
          face: 'Kulitnya sangat pucat dengan lingkar hitam pekat di bawah kacamata tebal. Sekilas tampak menyeramkan, tapi ia menguap kecil dan berkedip pelan karena kurang tidur.',
          clothes: 'Rambut dan bahu jaketnya basah oleh gerimis. Ia memeluk map plastik berisi tumpukan kertas skripsi yang ujungnya lembap.',
          probe: {
            text: 'Saat lampu teras menyala terang, ia mengerjap silau. "Aduh silau, Mas... maaf mukaku memang kayak mayat hidup kalau lagi deadline."'
          }
        },
        serveCorrect: 'Makasih ya, Mas... eh, jalanan depan halte agak gelap malam ini. Rasanya tadi ada yang berdiri di sana, tapi mungkin cuma bayangan pohon.',
        serveWrong: 'Hmm... ini bukan vanila, tapi nggak apa-apa deh, sudah terlalu ngantuk buat protes.',
        refuseResponse: 'Oh... maaf kalau aku kelihatan aneh. Aku cuma mau beli es krim... baiklah.'
      },
      {
        id: 'n1_gilang',
        name: 'Mas Gilang',
        label: 'Karyawan Lembur',
        threatLevel: 'safe',
        knockStyle: 'normal',
        order: ['strawberry'],
        orderText: '1× Stroberi Malam',
        cctvNote: 'CCTV Halte: Terlihat turun dari motor ojek di perempatan lalu membuka payung menuju kios.',
        appearance: look('gilang'),
        greeting: [
          'Selamat malam. Untung kios ini buka sampai subuh.',
          'Saya pesan satu Stroberi Malam ya, untuk istri di rumah.'
        ],
        observations: {
          face: 'Tatapannya wajar, sesekali melirik jam tangannya. Tidak ada gelagat aneh saat menatap menu es krim.',
          clothes: 'Kemeja kantornya agak kusut, ia menenteng payung lipat basah yang masih meneteskan air ke atas meja jendela.',
          probe: {
            text: '"Iya, baru pulang lembur dari kota. Jalan Melati memang makin sepi sejak berita orang hilang itu ya?"'
          }
        },
        serveCorrect: 'Terima kasih, Mas. Tetap waspada ya kalau sudah lewat jam dua pagi.',
        serveWrong: 'Waduh, istri saya maunya stroberi padahal... ya sudahlah, saya bayar separuh saja ya.',
        refuseResponse: 'Eh, serius ditolak? Padahal lampu toko masih nyala. Aneh sekali pelayanan malam ini...'
      },
      {
        id: 'n1_stranger',
        name: 'Pria Bermantel Kelabu',
        label: 'Tamu Pukul 03:00',
        threatLevel: 'eerie',
        knockStyle: 'slow',
        order: ['mint'],
        orderText: '1× Mint Dingin',
        clueOnServe: 'clue_dimas_query',
        clueOnRefuse: 'clue_dimas_query',
        cctvNote: 'CCTV Halte: Kamera tidak menangkap kedatangannya dari jalan raya—ia tahu-tahu sudah berdiri tepat di bawah atap kios.',
        appearance: look('arman', { stains: 'none', prop: null }),
        greeting: [
          '...Sudah jam tiga pagi. Kamu bukan Dimas.',
          'Aku cuma mau lihat siapa yang menandatangani kontrak sepuluh malam menggantikannya. Satu Mint Dingin... kalau kamu berani membuka kaca.'
        ],
        observations: {
          face: 'Separuh wajahnya tertutup bayangan topi rendah. Matanya tidak berkedip sama sekali—dan tatapannya tertuju langsung pada grendel kunci jendela.',
          clothes: 'Mantel kelabunya tampak nyaris kering meski rintik hujan masih turun. Kedua tangannya tersembunyi rapat di dalam saku.',
          probe: {
            text: 'Saat lampu teras berkedip terang ke wajahnya, sudut bibirnya terangkat tipis tanpa suara. "Kunci jendelanya masih sama seperti milik Dimas..."',
            clueId: 'clue_dimas_query'
          }
        },
        serveCorrect: 'Dingin sekali... seperti malam terakhir Dimas bekerja di sini. Sampai jumpa di sembilan malam berikutnya, penjaga baru.',
        serveWrong: 'Bukan ini yang kuminta. Tapi aku tidak datang hanya demi es krim. Kita masih punya sembilan malam lagi.',
        refuseResponse: 'Pintar... kamu memilih menjaga kaca tetap tertutup. Dimas dulu terlalu ramah. Kita lihat berapa malam kamu bisa bertahan.'
      }
    ],

    // =========================================================================
    // NIGHT 2 — Tatapan di Balik Kaca (5 Pelanggan)
    // =========================================================================
    2: [
      {
        id: 'n2_sari',
        name: 'Sari',
        label: 'Mahasiswi Begadang',
        threatLevel: 'safe',
        knockStyle: 'normal',
        order: ['vanilla', 'strawberry'],
        orderText: '1× Vanila + 1× Stroberi',
        cctvNote: 'CCTV Halte: Terlihat berjalan cepat dari gang kos sambil berkali-kali menoleh ke arah halte tua.',
        appearance: look('sari', { gaze: 'nervous', blinkRate: 'fast', expression: 'worried' }),
        greeting: [
          'Mas... aku lagi. Maaf ya beli dua rasa sekaligus: Vanila sama Stroberi.',
          'Tadi waktu jalan ke sini, aku merasa ada yang jalan pelan di belakangku, tapi pas menoleh jalanannya kosong.'
        ],
        observations: {
          face: 'Ia tampak benar-benar gelisah, sesekali menengok ke arah jalanan gelap di belakang bahunya. Matanya berkedip cepat dan wajar.',
          clothes: 'Jaket dan rambutnya basah terkena hujan deras. Di tangannya masih ada map kertas yang sama seperti kemarin malam.',
          probe: {
            text: '"Serius, Mas! Orangnya tinggi pakai mantel gelap, berdiri dekat tiang lampu tadi. Aku langsung lari ke sini."'
          }
        },
        serveCorrect: 'Terima kasih, Mas! Aku langsung pulang naik ojek dari depan sini saja. Kunci jendelanya ya!',
        serveWrong: 'Eh, rasanya agak keliru Mas... tapi sudahlah, aku buru-buru mau pulang. Makasih ya.',
        refuseResponse: 'Lho Mas, ini aku Sari yang kemarin! Kenapa nggak dibukain? Aduh aku takut sendirian di luar...'
      },
      {
        id: 'n2_tika',
        name: 'Tika',
        label: 'Perawat Shift Malam',
        threatLevel: 'safe',
        knockStyle: 'normal',
        order: ['matcha'],
        orderText: '1× Matcha Pahit',
        clueOnServe: 'clue_medical',
        cctvNote: 'CCTV Halte: Terlihat berjalan dari gerbang Rumah Sakit Harapan Melati di sisi kanan jalan.',
        appearance: look('tika'),
        greeting: [
          'Malam. Maaf saya pakai masker, baru selesai jaga IGD di rumah sakit sebelah.',
          'Satu Matcha Pahit ya, tolong agak cepat sebelum hujan makin besar.'
        ],
        observations: {
          face: 'Wajahnya tertutup masker medis sehingga sulit dibaca, namun matanya tampak lelah dan berkedip normal. Saat lampu menyala, ia memicing wajar.',
          clothes: 'Jas hujan tipisnya basah kuyup. Di kerahnya terlihat lanyard resmi "RS HARAPAN MELATI — PERAWAT TIKA" dan ia membawa kotak makan logam.',
          probe: {
            text: '"Kasus orang hilang di jalan ini? Di RS ramai dibicarakan—katanya semua korban hilang sekitar jam 3 pagi tanpa bekas pintu didobrak. Artinya mereka buka sendiri."',
            clueId: 'clue_medical'
          }
        },
        serveCorrect: 'Terima kasih. Tolong hati-hati ya, di RS ramai kabar warga yang hilang di sini selalu membuka pintu sendiri sekitar jam tiga pagi.',
        serveWrong: 'Ini bukan matcha... tapi sudahlah, saya sudah kehabisan waktu istirahat.',
        refuseResponse: 'Kenapa saya ditolak? Cuma gara-gara saya pakai masker medis? Tidak profesional sekali.'
      },
      {
        id: 'n2_budi_threat',
        name: 'Budi',
        label: 'Mengaku Penumpang Bus',
        threatLevel: 'danger',
        knockStyle: 'slow',
        order: ['chocolate'],
        orderText: '1× Cokelat Pekat',
        clueOnRefuse: 'clue_dry_coat',
        cctvNote: 'CCTV Halte: Jalan raya kosong total—tidak ada bus yang lewat sama sekali! Orang ini merayap keluar dari sisi gelap halte tua.',
        appearance: {
          skin: '#c7c1b8', coat: '#343638', shirt: '#1c1d1f', hair: '#1d1b1b',
          hat: 'hood', wet: false, stains: 'none', glasses: false, mask: false,
          gaze: 'latch', blinkRate: 'none', expression: 'hollow', heightScale: 1.05, collarHigh: true
        },
        greeting: [
          'Malam... hujan deras ya. Saya baru saja turun dari bus malam di halte depan, pukul 02:15 tadi.',
          'Buka jendelanya dong, Mas. Saya cuma mau Cokelat Pekat... sekalian lihat ke dalam, kiosnya hangat ya?'
        ],
        observations: {
          face: 'Matanya terbuka lebar tanpa berkedip. Senyumnya terlalu kaku, dan pupil matanya nyaris tidak mengecil meski menatap cahaya kios.',
          clothes: 'Aneh sekali—hujan turun sangat deras di luar, tapi tudung jaket dan bahunya BENAR-BENAR KERING. Tak ada satu pun tetes air di kainnya.',
          probe: {
            text: 'Saat kamu bertanya soal bus jam 02:15 dan menyorotkan lampu teras, ia berhenti tersenyum. "Bus... iya, bus yang cuma datang buat orang-orang yang jendelanya terbuka."',
            clueId: 'clue_dry_coat'
          }
        },
        dangerMessage: 'BEGITU KACA TERBUKA, tangannya langsung menerjang ke arah kunci jendela dan mencoba menarikmu keluar!',
        serveCorrect: '',
        serveWrong: '',
        refuseResponse: 'Kamu tidak percaya ceritaku? ...Menarik. Kuku jarinya menggores kaca perlahan sebelum ia menghilang ke sisi gelap kios.'
      },
      {
        id: 'n2_darma',
        name: 'Pak Darma',
        label: 'Mekanik Bengkel Malam',
        threatLevel: 'safe',
        knockStyle: 'normal',
        order: ['chocolate', 'vanilla'],
        orderText: '1× Cokelat + 1× Vanila',
        cctvNote: 'CCTV Halte: Terlihat berjalan dari ujung kiri jalan sambil melambai ke arah kamera.',
        appearance: look('darma'),
        greeting: [
          'Hujan nggak ada habisnya ya, Mas! Saya pesan Cokelat campur Vanila dong malam ini.',
          'Tadi saya lihat seseorang mondar-mandir di dekat halte sebelum saya lewat. Kamu aman kan di dalam?'
        ],
        observations: {
          face: 'Wajah yang sama seperti semalam—mata berkedip wajar, alis berkerut karena khawatir.',
          clothes: 'Jaket bengkelnya kuyup meneteskan air hujan, bau oli mesin tercium samar di dekat jendela.',
          probe: {
            text: '"Iya Mas, saya kenal suara langkah orang biasa sama orang yang sengaja mengendap-endap. Tadi itu beda banget. Hati-hati ya!"'
          }
        },
        serveCorrect: 'Mantap! Jaga diri baik-baik ya, Mas. Kalau ragu, jangan dibuka kacanya!',
        serveWrong: 'Wah, salah campur nih Mas, lagi deg-degan ya? Nggak apa-apa, tetap fokus!',
        refuseResponse: 'Lho Mas, ini saya Pak Darma! Kok malah diusir sih?'
      },
      {
        id: 'n2_yudha',
        name: 'Yudha',
        label: 'Penjaga Warung Kopi',
        threatLevel: 'safe',
        knockStyle: 'normal',
        order: ['mint'],
        orderText: '1× Mint Dingin',
        cctvNote: 'CCTV Halte: Datang dari arah warung kopi terang 100 meter di sisi kanan jalan.',
        appearance: {
          skin: '#bfa086', coat: '#3c4b3f', shirt: '#262e29', hair: '#24211e',
          hat: 'beanie', wet: true, stains: 'none', glasses: false, mask: false,
          gaze: 'normal', blinkRate: 'normal', expression: 'neutral', heightScale: 0.99, collarHigh: false
        },
        greeting: [
          'Halo Mas, saya Yudha dari warung kopi ujung jalan. Untung masih buka.',
          'Minta satu Mint Dingin ya, biar melek sampai pagi.'
        ],
        observations: {
          face: 'Kelihatan santai dan sedikit kedinginan, mengembuskan uap napas hangat ke udara malam. Mata berkedip normal.',
          clothes: 'Topi kupluk dan jaket hijaunya basah terkena cipratan hujan. Tangannya terbuka memegang uang pecahan dua puluh ribuan.',
          probe: {
            text: '"Bukan, saya bukan dari halte, warung kopi saya cuma 100 meter di kanan. Kios ini terang banget kelihatan dari sana."'
          }
        },
        serveCorrect: 'Sip, makasih banyak Mas! Moga-moga hujannya cepat reda ya.',
        serveWrong: 'Eh, kok bukan mint? Ya sudahlah, lumayan buat ganjal perut.',
        refuseResponse: 'Wah, ketat amat sekarang kios ini. Ya sudah, saya balik ke warung.'
      }
    ],

    // =========================================================================
    // NIGHT 3 — Topping & Saluran Telepon (5 Pelanggan — Toppings Unlocked!)
    // =========================================================================
    3: [
      {
        id: 'n3_karno',
        name: 'Mbah Karno',
        label: 'Warga Tua Insomnia',
        threatLevel: 'safe',
        knockStyle: 'slow',
        order: ['vanilla'],
        topping: 'caramel',
        orderText: '1× Vanila + Saus Karamel',
        clueOnServe: 'clue_dimas_note',
        cctvNote: 'CCTV Halte: Berjalan tertatih dengan tongkat dari perumahan gang timur.',
        appearance: look('karno'),
        greeting: [
          'Uhuk... malam, Nak. Mbah nggak bisa tidur kalau hujan deras. Wah, sekarang sudah ada Saus Karamel ya?',
          'Boleh satu Vanila pakai Saus Karamel? Mbah sekalian mau bilang soal catatan Dimas...'
        ],
        observations: {
          face: 'Keriput dalam dan mata berkaca-kaca karena usia. Meskipun ketukannya pelan dan suaranya serak, tatapannya hangat dan ia berkedip normal.',
          clothes: 'Syal rajut lusuh dan jaket cokelatnya basah meresap air hujan. Tangannya yang gemetar memegang uang pas.',
          probe: {
            text: '"Dimas dulu sering cerita ke Mbah sebelum hilang... dia menyelipkan sobekan catatan di samping freezer tentang tamu berinisial A."',
            clueId: 'clue_dimas_note'
          }
        },
        serveCorrect: 'Terima kasih, Nak. Ingat pesan Mbah: jangan buka jendela untuk yang kering di tengah hujan, atau yang tahu isi dalam kiosmu.',
        serveWrong: 'Hehe, salah rasa atau lupa karamelnya ya Nak? Tidak apa-apa, yang penting kamu tetap awas malam ini.',
        refuseResponse: 'Oalah, Nak... Mbah cuma warga sebelah yang mau mengingatkanmu. Hati-hati ya...'
      },
      {
        id: 'n3_mimic_threat',
        name: '“Teman Pak Darma”',
        label: 'Pria Berjaket Kering',
        threatLevel: 'danger',
        knockStyle: 'normal',
        order: ['chocolate'],
        orderText: '1× "Rasa Abu" / Cokelat',
        weirdOrderLabel: '1× "Rasa Abu" / Cokelat',
        clueOnRefuse: 'clue_dry_coat',
        cctvNote: 'CCTV Halte: Tidak ada jejak kedatangan dari arah bengkel—sosok ini muncul tiba-tiba dari bayangan tiang jembatan layang.',
        appearance: {
          skin: '#c4bfb7', coat: '#2d353a', shirt: '#171a1c', hair: '#1e1c1c',
          hat: 'cap', wet: false, stains: 'dark', glasses: false, mask: false,
          gaze: 'latch', blinkRate: 'none', expression: 'cold_smile', heightScale: 1.04, collarHigh: true
        },
        greeting: [
          'Hei, saya teman bengkelnya Pak Darma. Tadi dia suruh saya ambil Cokelat Pekat... oh, atau kalian masih punya rasa "Abu" yang biasa dipesan Dimas?',
          'Ngomong-ngomong, telepon merah di sebelah kirimu itu masih bunyi nyaring ya?'
        ],
        observations: {
          face: 'Ia meniru gaya bicara santai, tapi matanya mati—tidak berkedip sama sekali, terus menatap meja sebelah kirimu di balik dinding kios.',
          clothes: 'Jaketnya KERING sempurna meski hujan lebat. Noda gelap di ujung lengan bajunya tidak berbau oli... dan tangannya menggenggam sesuatu yang berkilat di dalam saku.',
          probe: {
            text: 'Saat kamu menanyakan bagaimana ia tahu warna telepon di dalam kios dan menyalakan lampu teras, senyumnya melebar kaku. "Aku sudah lama melihat dari luar, Raka."',
            clueId: 'clue_dry_coat'
          }
        },
        dangerMessage: 'JENDELA TERBUKA! Pria itu langsung menyambar tepi konter dan mengayunkan benda logam tajam ke dalam kios!',
        serveCorrect: '',
        serveWrong: '',
        refuseResponse: 'Kamu membaca catatan Dimas, ya? Bagus... jadi kamu tahu siapa yang sedang bermain denganmu.'
      },
      {
        id: 'n3_reno',
        name: 'Reno',
        label: 'Kurir Malam Panik',
        threatLevel: 'safe',
        knockStyle: 'frantic',
        order: ['mint', 'matcha'],
        topping: 'chips',
        orderText: '1× Mint + 1× Matcha + Choco Chips',
        cctvNote: 'CCTV Halte: Lampu motor kurir terlihat berhenti tergesa di tepi aspal dengan lampu hazard menyala.',
        appearance: look('reno'),
        greeting: [
          'Mas! Mas, tolong cepat! Ada orang berdiri di balik tembok samping kiosmu tadi!',
          'Aku pesan Mint sama Matcha pakai Choco Chips biar tenang sebentar sambil nunggu orderan, sumpah aku kurir!'
        ],
        observations: {
          face: 'Napasnya memburu, keringat dan air hujan mengalir dari dahinya. Matanya terus melirik cemas ke belakang bahunya dengan kedipan panik yang sangat manusiawi.',
          clothes: 'Jaket kurir cokelatnya basah kuyup dari bahu sampai siku. Tanda pengenal ekspedisi tergantung jelas di dadanya.',
          probe: {
            text: '"Sumpah, Mas! Aku baru lewat jembatan layang, lihat orang bermantel kelabu jalan di pinggir kios ini tanpa payung!"'
          }
        },
        serveCorrect: 'Fuh, makasih Mas! Aku langsung tancap gas habis ini. Tolong jangan buka jendela sembarangan setelah aku pergi!',
        serveWrong: 'Waduh pesanan agak keliru ya, nggak apa-apa deh Mas, aku lagi deg-degan banget juga.',
        refuseResponse: 'Yah, Mas! Aku beneran kurir nih, kehujanan pula... ya sudahlah aku langsung jalan saja!'
      },
      {
        id: 'n3_tika',
        name: 'Tika',
        label: 'Perawat Shift Malam',
        threatLevel: 'safe',
        knockStyle: 'normal',
        order: ['strawberry', 'vanilla'],
        topping: 'cherry',
        orderText: '1× Stroberi + 1× Vanila + Ceri Merah',
        clueOnServe: 'clue_medical',
        cctvNote: 'CCTV Halte: Datang dari arah gerbang RS Harapan Melati dengan payung bening.',
        appearance: look('tika'),
        greeting: [
          'Malam, Raka. Saya Tika, perawat yang kemarin. Malam ini minta Stroberi campur Vanila pakai Ceri Merah ya.',
          'Polisi tadi sempat datang ke rumah sakit menanyakan ciri-ciri pria yang sering terlihat dekat halte tua.'
        ],
        observations: {
          face: 'Tatapannya fokus dan berkedip normal seperti kemarin malam.',
          clothes: 'Jas hujan basah kuyup dengan lanyard resmi RS Harapan Melati masih tergantung di lehernya.',
          probe: {
            text: '"Polisi bilang pelaku kemungkinan mantan pekerja di sekitar Jalan Melati yang hafal jadwal jalanan ini."'
          }
        },
        serveCorrect: 'Terima kasih banyak. Jangan lengah menjelang jam tiga pagi ya.',
        serveWrong: 'Hmm, pesanan agak tertukar sedikit, tapi tidak apa-apa. Tetap waspada malam ini.',
        refuseResponse: 'Mas, ini saya Tika... kok malah ditolak sih malam ini?'
      },
      {
        id: 'n3_stalker_3am',
        name: 'Sosok Tanpa Payung',
        label: 'Tamu Pukul 03:00',
        threatLevel: 'danger',
        knockStyle: 'slow',
        order: ['mint'],
        orderText: '??? (Tidak Ada di Menu)',
        weirdOrderLabel: '??? (Tidak Ada di Menu)',
        cctvNote: 'CCTV Halte: Layar CCTV mendadak bersemut statis saat menyorotnya. Tidak ada bayangan di aspal basah.',
        appearance: look('arman', { stains: 'none', prop: null }),
        greeting: [
          'Jam tiga tepat. Jam dindingmu telat dua menit, Raka... baterai di belakangnya hampir habis, kan?',
          'Buka kacanya sebentar saja. Aku cuma ingin rasa yang sama seperti yang kuberikan pada Dimas.'
        ],
        observations: {
          face: 'Bayangan topi menutupi dahi, tapi kedua matanya menatap lurus menembus kaca tanpa berkedip sedikit pun.',
          clothes: 'Hujan badai di luar, namun mantel kelabunya kering tak bernoda air. Jemarinya menempel dingin di kaca buram.',
          probe: {
            text: 'Lampu teras menyorot langsung ke wajahnya—ia sama sekali tidak silau. Ia malah mengetuk kaca pelan sambil berbisik: "Buka."'
          }
        },
        dangerMessage: 'JENDELA TERBUKA! Sosok itu mendorong daun kaca dengan kekuatan mengerikan!',
        serveCorrect: '',
        serveWrong: '',
        refuseResponse: 'Kamu belajar cepat, Raka. Malam keempat tidak akan semudah ini...'
      }
    ],

    // =========================================================================
    // NIGHT 4 — Hujan Tanpa Bayangan (5 Pelanggan)
    // =========================================================================
    4: [
      {
        id: 'n4_darma',
        name: 'Pak Darma',
        label: 'Mekanik Bengkel Malam',
        threatLevel: 'safe',
        knockStyle: 'normal',
        order: ['chocolate', 'matcha'],
        topping: 'chips',
        orderText: '1× Cokelat + 1× Matcha + Choco Chips',
        cctvNote: 'CCTV Halte: Berjalan tegas dari arah bengkel dengan lampu senter kecil menyala di tangannya.',
        appearance: look('darma', { expression: 'worried' }),
        greeting: [
          'Malam, Raka! Badai banget ya. Kasih saya Cokelat sama Matcha pakai Choco Chips dong.',
          'Dengar-dengar ada yang menyamar jadi petugas pengawas malam di sekitar sini. Jangan asal percaya!'
        ],
        observations: {
          face: 'Wajah ramah penuh cemas milik Pak Darma. Berkedip normal dan mengibaskan air dari topinya.',
          clothes: 'Basah kuyup, noda oli mesin khas bengkelnya masih menempel di lengan.',
          probe: {
            text: '"Iya! Pak Hendra nggak pernah kirim pengawas tengah malam begini. Jadi kalau ada yang ngaku pengawas, periksa baik-baik!"'
          }
        },
        serveCorrect: 'Makasih, Raka! Hati-hati banget malam ini, badainya bikin suara langkah susah kedengaran.',
        serveWrong: 'Wah keliru pesanan nih, tapi nggak apa-apa, yang penting kamu tetap tenang.',
        refuseResponse: 'Aduh Raka, ini saya Pak Darma! Jangan bikin saya kehujanan percuma dong!'
      },
      {
        id: 'n4_nadia',
        name: 'Nadia',
        label: 'Pejalan Kaki Ketakutan',
        threatLevel: 'safe',
        knockStyle: 'frantic',
        order: ['vanilla'],
        topping: 'cherry',
        orderText: '1× Vanila + Ceri Merah',
        cctvNote: 'CCTV Halte: Taksi online dengan lampu darurat terlihat berhenti 80 meter di ujung jalan—Nadia benar-benar berlari dari sana!',
        appearance: look('nadia'),
        greeting: [
          'TOLONG! Mas, tolong jangan usir aku! Ada pria bermantel yang tadi membuntuti aku dari jembatan layang!',
          'Aku beli satu Vanila pakai Ceri Merah saja biar aku punya alasan berdiri di bawah lampu terasmu sampai taksi penggantiku datang!'
        ],
        observations: {
          face: 'Wajahnya basah oleh hujan dan air mata. Napasnya tersengal nyata, matanya berkedip cepat dan memohon tulus.',
          clothes: 'Jaket merah tuanya kuyup berat meneteskan air ke lantai. Ia menggenggam ponsel dengan layar menyala menghubungi keluarganya.',
          probe: {
            text: '"Benaran, Mas! Aku baru turun taksi online di perempatan karena ban bocor, terus ada pria tinggi berjas kering menatapku dari halte!"'
          }
        },
        serveCorrect: 'Terima kasih banyak, Mas! Taksiku yang baru sudah kelihatan lampunya di ujung jalan. Kamu menyelamatkan malamku!',
        serveWrong: 'Nggak apa-apa pesanan apa saja Mas, makasih sudah percaya sama aku. Hati-hati ya!',
        refuseResponse: 'Tolong jangan tutup... aku beneran ketakutan! Ya Tuhan...'
      },
      {
        id: 'n4_inspector_threat',
        name: '“Pengawas Malam”',
        label: 'Mengaku Inspektur Kios',
        threatLevel: 'danger',
        knockStyle: 'slow',
        order: ['matcha'],
        orderText: 'Permintaan Buka Jendela (Inspeksi)',
        weirdOrderLabel: 'Permintaan Buka Jendela (Inspeksi)',
        clueOnRefuse: 'clue_inspector_lie',
        cctvNote: 'CCTV Halte: Tidak ada mobil dinas di jalan raya. Sosok ini berdiri diam di balik tiang lampu selama 10 menit sebelum mendekat.',
        appearance: {
          skin: '#c8c3ba', coat: '#262b30', shirt: '#d4d0c5', hair: '#171717',
          hat: 'fedora', wet: false, stains: 'none', glasses: true, mask: false, prop: 'scratched_badge',
          gaze: 'latch', blinkRate: 'none', expression: 'cold_smile', heightScale: 1.07, collarHigh: true
        },
        greeting: [
          'Selamat malam, Raka. Saya petugas inspeksi kebersihan malam dari kantor pusat Pak Hendra. Saya perlu memeriksa freezer sekarang.',
          'Segera buka jendela pelayanan. Dimas dulu selalu patuh pada prosedur.'
        ],
        observations: {
          face: 'Di balik kacamata beningnya, matanya sama sekali tidak berkedip. Tidak ada setetes pun embun hujan pada lensanya meski di luar badai.',
          clothes: 'Jas kelabu dan kerah kemejanya KERING MUTLAK. Di dadanya tergantung kartu pengenal usang—di balik coretan spidol hitam samar terbaca nama: "ARMAN".',
          probe: {
            text: 'Saat kamu menyorotkan lampu teras ke kartu namanya dan menyebut Pak Hendra tidak pernah mengirim inspektur, ia menutup kartu itu pelan. "Mata yang tajam, Raka..."',
            clueId: 'clue_inspector_lie'
          }
        },
        dangerMessage: 'JEBAKAN! Begitu kaca terbuka, "Pengawas Malam" langsung menerjang masuk meraih bahumu!',
        serveCorrect: '',
        serveWrong: '',
        refuseResponse: 'Kartu itu... kamu sempat membacanya, ya? Tidak masalah. Besok malam pukul tiga, aku akan menemuimu tanpa nama samaran.'
      },
      {
        id: 'n4_mimic_sari',
        name: '“Sari” (?)',
        label: 'Sosok di Balik Kaca Berembun',
        threatLevel: 'danger',
        knockStyle: 'slow',
        order: ['vanilla'],
        orderText: '1× Vanila Klasik',
        cctvNote: 'CCTV Halte: Langkahnya terlalu panjang dan kaku untuk Sari—dan ia keluar dari lorong belakang halte tua!',
        appearance: {
          skin: '#d6d4d0', coat: '#34373a', shirt: '#17191b', hair: '#111112', hairStyle: 'long',
          hat: 'hood', wet: false, stains: 'none', glasses: false, mask: false,
          gaze: 'player', blinkRate: 'none', expression: 'hollow', heightScale: 1.04, collarHigh: true
        },
        greeting: [
          'Mas... ini aku, Sari. Aku mau Vanila... buka jendelanya sekarang.',
          'Kenapa diam saja? Cepat buka... di luar... sangat... hangat.'
        ],
        observations: {
          face: 'Suaranya terdengar datar dan aneh—posturnya terlalu tinggi untuk Sari, tidak memakai kacamata, dan senyumnya terbelah kaku tanpa kedipan.',
          clothes: 'Tudung gelap menutupi bayangan kepala, pakaiannya sama sekali tidak basah oleh badai, dan tidak membawa map kertas.',
          probe: {
            text: 'Saat lampu teras menyala, ia memiringkan kepala terlalu jauh ke samping hingga lehernya tampak tak wajar. "Buka. Kaca. Ini."'
          }
        },
        dangerMessage: 'ITU BUKAN SARI! Tangan dingin menyergap melewati kusen jendela yang baru kamu buka!',
        serveCorrect: '',
        serveWrong: '',
        refuseResponse: 'Hening mencekam. Suara tawa rendah terdengar dari balik tudung sebelum sosok itu melebur ke dalam kabut.'
      },
      {
        id: 'n4_tika',
        name: 'Tika',
        label: 'Perawat Shift Malam',
        threatLevel: 'safe',
        knockStyle: 'normal',
        order: ['matcha', 'mint'],
        topping: 'caramel',
        orderText: '1× Matcha + 1× Mint + Karamel',
        cctvNote: 'CCTV Halte: Terlihat keluar dari lobi RS Harapan Melati dengan seragam jaga malam.',
        appearance: look('tika'),
        greeting: [
          'Malam, Raka. Masih kuat jaga sampai pagi? Minta Matcha sama Mint pakai Saus Karamel ya.',
          'Saya baru melihat mobil patroli Bripka Danu berhenti di perempatan tadi. Besok malam pertengahan shiftmu, tetap awas!'
        ],
        observations: {
          face: 'Mata Tika yang familier, lelah tapi ramah, berkedip normal saat menyorotkan lampu.',
          clothes: 'Jas hujan basah oleh badai, lanyard resmi RS Harapan Melati jelas terbaca.',
          probe: {
            text: '"Bripka Danu bilang besok malam ia akan menelepon langsung ke kios ini."'
          }
        },
        serveCorrect: 'Makasih, Raka. Jangan lupa angkat telepon besok malam!',
        serveWrong: 'Salah satu rasanya keliru ya, tapi tidak apa-apa. Istirahat yang cukup besok siang.',
        refuseResponse: 'Raka, ini benar-benar saya Tika... aduh, hujan deras begini padahal.'
      }
    ],

    // =========================================================================
    // NIGHT 5 — Tengah Bulan di Halte Lama (Mid-Game Climax / Act 1 Finale!)
    // =========================================================================
    5: [
      {
        id: 'n5_darma',
        name: 'Pak Darma',
        label: 'Mekanik Bengkel Malam',
        threatLevel: 'safe',
        knockStyle: 'normal',
        order: ['chocolate', 'strawberry'],
        topping: 'caramel',
        orderText: '1× Cokelat + 1× Stroberi + Karamel',
        cctvNote: 'CCTV Halte: Berjalan dari arah bengkel sambil mengecek sekeliling jalanan berkabut.',
        appearance: look('darma', { expression: 'worried' }),
        greeting: [
          'Raka! Kabut malam ini gila tebalnya. Saya pesan Cokelat sama Stroberi pakai Karamel ya.',
          'Baru setengah perjalanan dari sepuluh malam kontrakmu—kalau kamu butuh kopi hangat, jangan pelit jaga mentalmu!'
        ],
        observations: {
          face: 'Pak Darma asli—raut wajah jujur, berkedip normal, napas berembun di udara dingin.',
          clothes: 'Jaket lembap berkabut dan bercak oli bengkel yang khas.',
          probe: {
            text: '"Katanya polisi patroli bakal lewat sekitar jam tiga lebih sepuluh. Tahan kaca rapat-rapat kalau ada yang datang jam tiga!"'
          }
        },
        serveCorrect: 'Semoga berhasil malam kelima ini, Raka! Hati-hati!',
        serveWrong: 'Wah keliru sedikit, tapi santai saja, fokus sama keselamatanmu malam ini!',
        refuseResponse: 'Lho Raka, ini Pak Darma! Duh, memang tegang banget ya malam kelima ini...'
      },
      {
        id: 'n5_fake_courier',
        name: '“Kurir Pengantar”',
        label: 'Pengantar Paket Tengah Malam',
        threatLevel: 'danger',
        knockStyle: 'frantic',
        order: ['mint'],
        orderText: 'Paket Tanpa Alamat (Minta Buka Kaca)',
        weirdOrderLabel: 'Paket Tanpa Alamat (Minta Buka Kaca)',
        cctvNote: 'CCTV Halte: Tidak ada sepeda motor kurir di sepanjang jalan! Ia berjalan kaki keluar dari kegelapan halte.',
        appearance: {
          skin: '#c7c2ba', coat: '#3b332d', shirt: '#191919', hair: '#171717',
          hat: 'cap', wet: false, stains: 'dark', glasses: false, mask: true,
          gaze: 'latch', blinkRate: 'none', expression: 'hollow', heightScale: 1.06, collarHigh: true
        },
        greeting: [
          'Paket kilat untuk Kios Sora Dingin! Baru turun dari bus malam, tolong segera buka jendela untuk tanda tangan dan satu Mint!',
          'Cepat Mas, saya buru-buru!'
        ],
        observations: {
          face: 'Meski meniru kepanikan kurir, matanya sama sekali tidak berkedip dan tidak pernah melirik belakang—fokus penuh pada grendel jendela.',
          clothes: 'Tidak ada tanda pengenal kurir, jaketnya kering di tengah kabut lembap, dan ia mengaku turun dari bus malam padahal bus terakhir pukul 23:30.',
          probe: {
            text: 'Begitu lampu teras menyala, ia tidak melirik paket sama sekali. Suaranya mendadak turun dingin: "Buka saja jendelanya, Raka."'
          }
        },
        dangerMessage: 'PENYAMARAN! Saat kaca bergeser, tangannya menghantam jendela berusaha memaksa masuk!',
        serveCorrect: '',
        serveWrong: '',
        refuseResponse: 'Kau mulai kebal terhadap umpan kecil... baiklah. Sampai bertemu pukul tiga.'
      },
      {
        id: 'n5_sari',
        name: 'Sari',
        label: 'Mahasiswi Begadang',
        threatLevel: 'safe',
        knockStyle: 'normal',
        order: ['vanilla', 'matcha'],
        topping: 'chips',
        orderText: '1× Vanila + 1× Matcha + Choco Chips',
        cctvNote: 'CCTV Halte: Sebuah mobil sedan teman kampusnya terparkir menyalakan lampu hazard di seberang kios.',
        appearance: look('sari', { gaze: 'normal', blinkRate: 'normal', expression: 'tired_smile' }),
        greeting: [
          'Hai Mas Raka! Bab akhir skripsiku akhirnya disetujui! Aku mampir sebentar beli Vanila sama Matcha pakai Choco Chips.',
          'Temanku nunggu di mobil depan sana. Kamu hati-hati ya malam ini, kabutnya pekat banget.'
        ],
        observations: {
          face: 'Sari asli—memakai kacamata tebal, berkedip normal, tersenyum lega tulus.',
          clothes: 'Rambut lembap oleh kabut gerimis, memeluk map skripsi yang kini terjilid rapi.',
          probe: {
            text: '"Iya Mas, beneran aku! Ibu kosku Bu Rina mungkin besok malam ikut mampir beli es krim juga katanya."'
          }
        },
        serveCorrect: 'Makasih banyak Mas Raka! Kunci jendelanya rapat-rapat ya habis ini!',
        serveWrong: 'Eh rasanya ketukar satu ya, tapi nggak apa-apa, lagi senang soalnya! Hati-hati ya!',
        refuseResponse: 'Oh... oke Mas, aku ngerti kamu lagi waspada banget malam ini. Hati-hati ya!'
      },
      {
        id: 'n5_arman_mid',
        name: 'Arman — Tamu Jam Tiga',
        label: 'Penampakan Terbuka Pukul 03:00',
        threatLevel: 'mid_climax',
        knockStyle: 'slow',
        order: [],
        orderText: '—',
        weirdOrderLabel: 'TEROR PUKUL 03:00 (JANGAN BUKA)',
        clueOnRefuse: 'clue_locker_key',
        cctvNote: 'CCTV Halte: Lampu sorot mobil patroli polisi mulai terlihat samar jauh di ujung jembatan layang! Tahan dia di luar!',
        appearance: look('arman'),
        greeting: [
          'Sudah setengah jalan, Raka. Lima malam terlewati... tapi kamu masih punya lima malam lagi bersamaku.',
          'Lihat apa yang kubawa di tanganku? Kunci loker milik Dimas. Buka jendela ini kalau kamu mau mengambilnya...'
        ],
        observations: {
          face: 'Wajahnya dingin dan tenang. Mata gelap tanpa kedipan menatap lurus ke matamu sambil tersenyum tipis.',
          clothes: 'Mantel kelabu panjang kering sempurna. Ia mengetukkan sebuah kunci loker berkarat berlabel "DIMAS" ke kaca buram.',
          probe: {
            text: 'Lampu teras menyinari jelas kartu usang bertuliskan ARMAN di dadanya. "Polisi patroli sebentar lagi lewat... tapi besok malam aku akan mengenakan wajah yang jauh lebih akrab bagimu."',
            clueId: 'clue_locker_key'
          }
        },
        dangerMessage: 'ARMAN MENERJANG! Ia menghantam daun kaca begitu kamu membukanya!',
        serveCorrect: '',
        serveWrong: '',
        refuseResponse: 'Kaca tetap terkunci rapat. Dari kejauhan sorot lampu patroli polisi menyapu kabut—Arman meletakkan kunci loker Dimas di kusen jendela, tersenyum dingin, lalu mundur menghilang ke bawah jembatan layang!'
      }
    ],

    // =========================================================================
    // NIGHT 6 — Seragam yang Hilang (5 Pelanggan — Act 2 Begins!)
    // =========================================================================
    6: [
      {
        id: 'n6_rina',
        name: 'Bu Rina',
        label: 'Ibu Kos Jalan Melati',
        threatLevel: 'safe',
        knockStyle: 'frantic',
        order: ['strawberry'],
        topping: 'cherry',
        orderText: '1× Stroberi + Ceri Merah',
        cctvNote: 'CCTV Halte: Berjalan cepat dari kompleks rumah kos di sisi timur sambil membawa payung lipat basah.',
        appearance: look('rina'),
        greeting: [
          'Aduh Mas, cepat sedikit ya! Saya Bu Rina, ibu kosnya Sari—tadi Sari cerita es krim sini enak.',
          'Minta satu Stroberi pakai Ceri Merah. Tadi di gerbang kos ada orang mencurigakan pakai topi kios es krim mondar-mandir!'
        ],
        observations: {
          face: 'Meskipun ketukannya agak keras dan bicaranya cerewet terburu-buru, ekspresinya tulus, mata berkedip wajar, dan napasnya berembun.',
          clothes: 'Cardigan cokelat dan payungnya basah kuyup oleh hujan malam. Menggenggam tas belanja kecil.',
          probe: {
            text: '"Iya beneran! Topinya persis logo kios ini, padahal kan penjaganya kamu di dalam! Makanya saya buru-buru ke sini sekalian kasih tahu!"'
          }
        },
        serveCorrect: 'Makasih ya Mas! Hati-hati banget lho, kunci ganda jendelanya kalau nggak ada orang!',
        serveWrong: 'Lho, kok beda sama yang saya pesan? Ya sudahlah, lagi hujan deras begini.',
        refuseResponse: 'Lho kok ibu-ibu mau beli es krim malah diusir sih Mas? Nanti saya adukan ke Pak Hendra!'
      },
      {
        id: 'n6_fake_darma',
        name: '“Pak Darma” (?)',
        label: 'Mekanik Tanpa Bau Oli',
        threatLevel: 'danger',
        knockStyle: 'normal',
        order: ['chocolate'],
        topping: 'caramel',
        orderText: '1× Cokelat + Karamel',
        cctvNote: 'CCTV Halte: Bengkel di ujung gang sudah gelap tutup sejam lalu! Orang ini justru keluar dari gang belakang halte tua.',
        appearance: look('darma', {
          skin: '#c7c2ba', wet: false, stains: 'dark', gaze: 'latch', blinkRate: 'none',
          expression: 'cold_smile', collarHigh: true, heightScale: 1.07
        }),
        greeting: [
          'Malam, Raka. Ini saya, Pak Darma dari bengkel. Tolong Cokelat pakai Karamel ya—buka jendelanya cepat.',
          'Saya baru turun dari bus malam tadi... capek sekali.'
        ],
        observations: {
          face: 'Ia memakai topi mekanik mirip Pak Darma, tapi posturnya terlalu tinggi, kulitnya pucat abu-abu, dan matanya TIDAK BERKEDIP sama sekali!',
          clothes: 'Jaketnya benar-benar KERING di tengah hujan! Tidak ada bau oli mesin—dan ia keceplosan mengaku baru turun dari bus malam!',
          probe: {
            text: 'Saat kamu menyorotkan lampu teras dan bertanya kenapa bengkelnya gelap, suaranya berubah datar dingin: "Pak Darma tidak datang malam ini. Buka kacanya."'
          }
        },
        dangerMessage: 'PENIRU! Begitu kaca terbuka, tangannya langsung menyambar kerah bajumu melewati konter!',
        serveCorrect: '',
        serveWrong: '',
        refuseResponse: 'Suara tawa parau menggema di balik topi mekanik curian itu sebelum ia mundur ditelan bayangan hujan.'
      },
      {
        id: 'n6_karno',
        name: 'Mbah Karno',
        label: 'Warga Tua Insomnia',
        threatLevel: 'safe',
        knockStyle: 'slow',
        order: ['vanilla', 'chocolate'],
        topping: 'caramel',
        orderText: '1× Vanila + 1× Cokelat + Karamel',
        cctvNote: 'CCTV Halte: Terlihat berjalan pelan di trotoar kanan dengan mantel hujan basah dan tongkat kayu.',
        appearance: look('karno'),
        greeting: [
          'Uhuk... malam, Nak Raka. Mbah dengar gudang belakang kiosmu dibobol sore tadi ya?',
          'Buatkan Mbah Vanila campur Cokelat pakai Saus Karamel ya. Malam ini terasa makin dingin.'
        ],
        observations: {
          face: 'Keriput ramah Mbah Karno asli, berkedip pelan wajar dan tersenyum teduh.',
          clothes: 'Syal rajut dan mantelnya basah kuyup terkena hujan deras.',
          probe: {
            text: '"Hati-hati Nak, Mbah dengar suara mesin genset tua di bawah halte kadang menyala sendiri tengah malam. Jangan pernah keluar kios sendirian."'
          }
        },
        serveCorrect: 'Terima kasih, Nak. Ingat selalu pakai Kunci Ganda kalau grendel kacamu diguncang dari luar.',
        serveWrong: 'Hehe agak tertukar ya Nak, nggak apa-apa. Mbah tahu shift malam ini berat.',
        refuseResponse: 'Lho Mbah kok ikut ditolak malam ini, Nak? Ya sudah Mbah pulang dulu...'
      },
      {
        id: 'n6_uniform_threat',
        name: 'Pria Bertopi Sora Dingin',
        label: 'Mengenakan Seragam Kios',
        threatLevel: 'danger',
        knockStyle: 'slow',
        order: ['mint'],
        orderText: 'Permintaan Masuk Gudang',
        weirdOrderLabel: 'SERAGAM DIMAS (MINTA MASUK)',
        clueOnRefuse: 'clue_missing_uniform',
        cctvNote: 'CCTV Halte: Terlihat berdiri kaku tepat di depan kamera CCTV lalu perlahan menoleh menatap lensa sebelum menuju jendelamu!',
        appearance: {
          skin: '#c9c4bc', coat: '#243536', shirt: '#e6dfd0', hair: '#151515',
          hat: 'cap', wet: false, stains: 'dark', glasses: false, mask: false, prop: 'scratched_badge',
          gaze: 'player', blinkRate: 'none', expression: 'cold_smile', heightScale: 1.07, collarHigh: true
        },
        greeting: [
          'Raka... Pak Hendra menyuruhku masuk shift ganda malam ini. Lihat, aku sudah memakai seragam Sora Dingin.',
          'Cepat buka jendelanya dan serahkan kunci cadangan di bawah meja kasir.'
        ],
        observations: {
          face: 'Senyum pucat tanpa kedipan yang sama seperti Arman! Bola matanya terpaku tepat ke arahmu tanpa berkedip sedikit pun.',
          clothes: 'Ia mengenakan seragam dan topi kerja milik Dimas yang baru dilaporkan dicuri dari gudang belakang—dan seluruh pakaiannya KERING MUTLAK!',
          probe: {
            text: 'Saat kamu menyorotkan lampu teras penuh, bercak karat dan sobekan di saku seragam Dimas terlihat jelas. "Baju ini pas sekali di badanku, Raka."',
            clueId: 'clue_missing_uniform'
          }
        },
        dangerMessage: 'ITU SERAGAM CURIAN DIMAS! Sosok itu menghantam kaca dan menerjang ke dalam!',
        serveCorrect: '',
        serveWrong: '',
        refuseResponse: 'Dia mengetuk topi Sora Dingin dengan dua jari secara mengejek, lalu lenyap ke dalam gelapnya hujan.'
      },
      {
        id: 'n6_yudha',
        name: 'Yudha',
        label: 'Penjaga Warung Kopi',
        threatLevel: 'safe',
        knockStyle: 'normal',
        order: ['matcha', 'mint'],
        topping: 'chips',
        orderText: '1× Matcha + 1× Mint + Choco Chips',
        cctvNote: 'CCTV Halte: Datang dari arah warung kopi ujung kanan sambil membawa termos kecil.',
        appearance: {
          skin: '#bfa086', coat: '#3c4b3f', shirt: '#262e29', hair: '#24211e',
          hat: 'beanie', wet: true, stains: 'none', glasses: false, mask: false,
          gaze: 'normal', blinkRate: 'normal', expression: 'tired_smile', heightScale: 0.99, collarHigh: false
        },
        greeting: [
          'Mas Raka! Masih aman kan? Saya pesan Matcha campur Mint pakai Choco Chips ya.',
          'Kalau butuh kopi panas tengah malam biar nggak panik, stok termos di kiosmu pasti kepakai banget!'
        ],
        observations: {
          face: 'Wajah santai Yudha yang berkedip normal, menggosok kedua tangannya yang kedinginan.',
          clothes: 'Topi kupluk dan jaket hijau basah oleh air hujan.',
          probe: {
            text: '"Tadi lampu di ruas halte sempat padam sebentar. Katanya besok malam mau ada badai petir besar!"'
          }
        },
        serveCorrect: 'Mantap Mas! Sampai ketemu lagi besok malam!',
        serveWrong: 'Wah keliru dikit Mas, nggak masalah, tetap semangat!',
        refuseResponse: 'Lho Mas, ini Yudha tetangga warung kopi sebelah! Kok ditolak sih?'
      }
    ],

    // =========================================================================
    // NIGHT 7 — Pemadaman Jalur Melati (5 Pelanggan — Storm & Blackouts!)
    // =========================================================================
    7: [
      {
        id: 'n7_bima',
        name: 'Dokter Bima',
        label: 'Dokter Jaga RS Melati',
        threatLevel: 'safe',
        knockStyle: 'normal',
        order: ['matcha', 'vanilla'],
        topping: 'chips',
        orderText: '1× Matcha + 1× Vanila + Choco Chips',
        cctvNote: 'CCTV Halte: Berlari kecil menyeberang dari gerbang UGD Rumah Sakit Harapan Melati di bawah kilatan petir.',
        appearance: look('bima'),
        greeting: [
          'Selamat malam! Saya Dokter Bima, rekan shiftnya Perawat Tika di RS sebelah. Badai petirnya luar biasa ya.',
          'Boleh minta Matcha campur Vanila pakai Choco Chips? Baru selesai operasi darurat.'
        ],
        observations: {
          face: 'Meski jas putihnya tampak pucat mencolok di malam badai, matanya berkedip wajar, tersenyum letih, dan lensa kacamatanya penuh bintik air hujan!',
          clothes: 'Jas dokter dan kemejanya basah kuyup kehujanan; tanda pengenal resmi RS Harapan Melati "DR. BIMA" tergantung rapi.',
          probe: {
            text: '"Oh iya, Tika titip pesan: katanya kalau listrik padam total, langsung nyalakan saklar kios dan kunci ganda jendela!"'
          }
        },
        serveCorrect: 'Terima kasih banyak! Hati-hati badai malam ini, gardu jalanan sering anjlok!',
        serveWrong: 'Hmm, pesanannya sedikit keliru, tapi tidak apa-apa—terima kasih ya.',
        refuseResponse: 'Lho, saya dokter dari rumah sakit seberang lho Mas! Kenapa ditolak?'
      },
      {
        id: 'n7_fake_dimas',
        name: '“Dimas”',
        label: 'Mengaku Penjaga Shift Lama',
        threatLevel: 'danger',
        knockStyle: 'slow',
        order: ['vanilla'],
        orderText: '??? ("Aku Kembali Bekerja")',
        weirdOrderLabel: 'MENGAKU DIMAS (KERING DI BADAI)',
        clueOnRefuse: 'clue_cctv_alley',
        cctvClueId: 'clue_cctv_alley',
        cctvNote: 'CCTV Halte: Rekaman jelas memperlihatkan ia merangkak keluar dari lorong gelap di BELAKANG halte tua—sama sekali tidak melewati jalan raya!',
        appearance: {
          skin: '#c8c3ba', coat: '#243536', shirt: '#d8d2c6', hair: '#151515',
          hat: 'cap', wet: false, stains: 'dark', glasses: false, mask: false, prop: 'scratched_badge',
          gaze: 'player', blinkRate: 'none', expression: 'hollow', heightScale: 1.07, collarHigh: true
        },
        greeting: [
          'Raka... aku Dimas. Aku sudah kembali. Kamu bisa pulang sekarang, biar aku yang jaga shift ini.',
          'Buka jendelanya, Raka... di luar badai petir... cepat buka untukku.'
        ],
        observations: {
          face: 'Wajah dingin tak berkedip dengan senyum kosong—suaranya terlalu berat dan datar untuk mahasiswa. Kilat petir menyingkap tatapan penuh obsesi.',
          clothes: 'Seragam Sora Dingin curian yang BENAR-BENAR KERING meski badai petir mengamuk di belakangnya!',
          probe: {
            text: 'Saat kamu menyalakan lampu teras dan bertanya dari mana ia datang, ia melirik kamera CCTV halte. "Kamera kecil itu tidak akan menyelamatkanmu."',
            clueId: 'clue_cctv_alley'
          }
        },
        dangerMessage: 'DIA BUKAN DIMAS! Begitu kaca bergeser, tangannya menerkam ke arah lehermu!',
        serveCorrect: '',
        serveWrong: '',
        refuseResponse: 'Lampu jalan berkedip diterpa petir. Sosok berseragam curian itu mendesis pelan dan mundur kembali ke lorong gelap belakang halte.'
      },
      {
        id: 'n7_darma',
        name: 'Pak Darma',
        label: 'Mekanik Bengkel Malam',
        threatLevel: 'safe',
        knockStyle: 'normal',
        order: ['chocolate', 'chocolate'],
        topping: 'caramel',
        orderText: '2× Cokelat Pekat + Karamel',
        cctvNote: 'CCTV Halte: Datang dari arah bengkel sambil membawa jas hujan kuning-gelap yang kuyup.',
        appearance: look('darma'),
        greeting: [
          'Wah gila badainya, Mas Raka! Listrik bengkelku aja baru sempat mati dua menit!',
          'Kasih saya dobel Cokelat Pekat pakai Saus Karamel dong, butuh energi ekstra malam ini!'
        ],
        observations: {
          face: 'Pak Darma asli—raut hangat, berkedip normal, air hujan menetes dari pinggir topinya.',
          clothes: 'Basah kuyup dan bau oli mesin asli dari bengkelnya.',
          probe: {
            text: '"Katanya kemarin ada yang nyamar jadi saya ya?! Kurang ajar betul! Untung kamu jeli meriksa, Raka!"'
          }
        },
        serveCorrect: 'Nah ini baru mantap! Tetap waspada ya Mas, jangan sampai kecolongan waktu mati lampu!',
        serveWrong: 'Wah keliru nih Mas, nggak apa-apa, efek tegang badai petir ya!',
        refuseResponse: 'Eh Raka, ini beneran saya Pak Darma asli lho! Aduh kehujanan nih saya!'
      },
      {
        id: 'n7_fake_doctor',
        name: '“Petugas Gardu”',
        label: 'Mengaku Teknisi Listrik',
        threatLevel: 'danger',
        knockStyle: 'frantic',
        order: ['mint'],
        orderText: 'Cek Sekring Dalam Kios',
        weirdOrderLabel: 'MINTA MASUK CEK LISTRIK',
        cctvNote: 'CCTV Halte: Tidak ada mobil PLN di jalan raya! Orang ini berjalan keluar dari lorong gelap belakang halte tua!',
        cctvClueId: 'clue_cctv_alley',
        appearance: {
          skin: '#c4bfb6', coat: '#38382c', shirt: '#171717', hair: '#161616',
          hat: 'helmet_visor', wet: false, stains: 'dark', glasses: false, mask: true,
          gaze: 'latch', blinkRate: 'none', expression: 'hollow', heightScale: 1.06, collarHigh: true
        },
        greeting: [
          'Teknisi listrik darurat! Gardu kios ini korslet—buka jendelanya sekarang supaya saya bisa cek panel sekring di sebelah freezermu!',
          'Cepat buka sebelum kios ini terbakar!'
        ],
        observations: {
          face: 'Matanya menatap dingin tanpa berkedip ke arah grendel jendela, sama sekali tidak menunjukkan kepanikan teknisi sungguhan.',
          clothes: 'Jaket dan helmnya KERING sempurna di tengah badai petir! Dan ia tahu persis posisi panel listrik di sebelah freezer dalam kios!',
          probe: {
            text: 'Begitu lampu teras menyala terang, ia mundur setengah langkah tanpa memejamkan mata. "Listriknya... bisa kumatikan lagi kapan saja."'
          }
        },
        dangerMessage: 'TEKNISI PALSU! Ia langsung menyodokkan linggis pendek lewat celah kaca yang kamu buka!',
        serveCorrect: '',
        serveWrong: '',
        refuseResponse: 'Ia mengetuk kaca dengan logam dingin tiga kali perlahan sebelum melangkah mundur ke arah lorong halte.'
      },
      {
        id: 'n7_sari',
        name: 'Sari',
        label: 'Mahasiswi Begadang',
        threatLevel: 'safe',
        knockStyle: 'normal',
        order: ['strawberry', 'vanilla'],
        topping: 'cherry',
        orderText: '1× Stroberi + 1× Vanila + Ceri Merah',
        cctvNote: 'CCTV Halte: Turun dari ojek berjas hujan biru di tepi jalan lalu berlari ke depan jendela.',
        appearance: look('sari', { expression: 'worried', blinkRate: 'normal', gaze: 'normal' }),
        greeting: [
          'Mas Raka! Lampu jalan tadi padam seram banget! Boleh Stroberi campur Vanila pakai Ceri Merah?',
          'Aku sudah pesan ojek langganan buat nungguin di pojok sana sampai aku selesai beli.'
        ],
        observations: {
          face: 'Sari asli—kacamata berembun titik hujan, berkedip normal, wajah lelah yang familier.',
          clothes: 'Jaket abu-abunya basah kuyup dan memeluk tas ransel kampus.',
          probe: {
            text: '"Hati-hati ya Mas, Bu Rina juga bilang jangan keluar kios sendirian sampai polisi menangkap pelakunya!"'
          }
        },
        serveCorrect: 'Makasih banyak Mas Raka! Jaga kesehatan dan Ketenanganmu ya!',
        serveWrong: 'Wah agak keliru dikit Mas, tapi nggak apa-apa kok! Makasih ya!',
        refuseResponse: 'Mas Raka, ini beneran aku Sari... hujan petir banget nih di luar!'
      }
    ],

    // =========================================================================
    // NIGHT 8 — Suara dari Balik Dinding (5 Pelanggan — Hideout Discovered!)
    // =========================================================================
    8: [
      {
        id: 'n8_reno',
        name: 'Reno',
        label: 'Kurir Malam (Saksi Mata)',
        threatLevel: 'safe',
        knockStyle: 'frantic',
        order: ['mint', 'chocolate'],
        topping: 'chips',
        orderText: '1× Mint + 1× Cokelat + Choco Chips',
        clueOnServe: 'clue_genset_hideout',
        cctvNote: 'CCTV Halte: Motor kurir Reno terparkir tepat di bawah lampu jalan dengan mesin masih menyala.',
        appearance: look('reno'),
        greeting: [
          'Mas Raka!! Aku baru lihat sesuatu yang gila dekat halte tua!!',
          'Tolong Mint campur Cokelat pakai Choco Chips sambil aku cerita—aku lihat pintu besi ruang genset di bawah halte tua terbuka dan ada cahaya senter dari dalam!'
        ],
        observations: {
          face: 'Wajah Reno asli yang penuh keringat dan air hujan, berkedip cepat, menoleh gugup ke arah halte.',
          clothes: 'Jaket kurir cokelat basah kuyup dengan tanda pengenal ekspedisi jelas di dadanya.',
          probe: {
            text: '"Serius Mas! Aku dengar suara dengung genset tua dan lihat tumpukan jaket di dalam ruang genset halte tua itu! Aku sudah lapor ke polisi juga!"',
            clueId: 'clue_genset_hideout'
          }
        },
        serveCorrect: 'Makasih Mas! Aku yakin pelakunya sembunyi di ruang genset halte tua itu! Hati-hati banget malam ini!',
        serveWrong: 'Agak keliru sedikit Mas, tapi nggak apa-apa, yang penting kamu catat info ruang genset tadi!',
        refuseResponse: 'Aduh Mas Raka, ini Reno! Aku bawa info penting soal halte tua padahal!'
      },
      {
        id: 'n8_fake_police',
        name: '“Petugas Patroli”',
        label: 'Mengaku Anggota Polsek',
        threatLevel: 'danger',
        knockStyle: 'slow',
        order: ['vanilla'],
        orderText: 'Sita Catatan Petunjuk',
        weirdOrderLabel: 'MINTA BUKA KACA & SERAHKAN CATATAN',
        cctvNote: 'CCTV Halte: TIDAK ADA mobil patroli di seluruh ruas Jalan Melati! Ia berjalan kaki keluar dari lorong gelap belakang halte.',
        appearance: {
          skin: '#cac5bd', coat: '#242934', shirt: '#151820', hair: '#151515',
          hat: 'cap', wet: false, stains: 'none', glasses: false, mask: false, prop: 'scratched_badge',
          gaze: 'player', blinkRate: 'none', expression: 'cold_smile', heightScale: 1.07, collarHigh: true
        },
        greeting: [
          'Malam, Raka. Saya anggota patroli utusan Bripka Danu. Buka jendela sekarang dan serahkan buku catatan petunjukmu untuk barang bukti.',
          'Kamu tidak perlu lagi mencatat apa pun tentang ruang genset itu.'
        ],
        observations: {
          face: 'Wajah tenang dingin tanpa kedipan—sorot matanya persis sama dengan Arman! Tidak ada sirine atau cahaya mobil polisi di luar.',
          clothes: 'Seragam gelapnya KERING MUTLAK di tengah hujan, dan di dadanya bukan lencana polisi melainkan kartu lama yang dicoret tinta hitam!',
          probe: {
            text: 'Saat kamu menanyakan dari mana ia tahu soal catatan dan ruang genset, senyumnya melebar dingin. "Bripka Danu belum sampai di sini, Raka. Hanya aku."'
          }
        },
        dangerMessage: 'POLISI GADUNGAN! Begitu kaca terbuka, ia langsung mencengkeram pergelangan tanganmu!',
        serveCorrect: '',
        serveWrong: '',
        refuseResponse: 'Kamu terlalu banyak tahu tentang ruang genset itu... dua malam lagi kita selesaikan semuanya.'
      },
      {
        id: 'n8_nadia',
        name: 'Nadia',
        label: 'Saksi Mata Halte',
        threatLevel: 'safe',
        knockStyle: 'normal',
        order: ['strawberry', 'matcha'],
        topping: 'cherry',
        orderText: '1× Stroberi + 1× Matcha + Ceri Merah',
        clueOnServe: 'clue_genset_hideout',
        cctvNote: 'CCTV Halte: Taksi online berhenti di seberang jalan menunggunya sementara Nadia berlari membawa payung basah.',
        appearance: look('nadia', { expression: 'worried', gaze: 'normal', blinkRate: 'normal' }),
        greeting: [
          'Mas Raka! Aku Nadia yang waktu itu kamu tolong! Malam ini aku mampir naik taksi cuma buat beli Stroberi campur Matcha pakai Ceri Merah.',
          'Tadi dari jendela taksi, sopirnya juga lihat pria bermantel mengunci pintu besi ruang genset di bawah halte tua!'
        ],
        observations: {
          face: 'Nadia asli—wajah lega yang ramah, berkedip normal, rambut basah terkena cipratan hujan.',
          clothes: 'Jaket merah tuanya lembap kehujanan, taksinya benar-benar terlihat menunggu di belakang.',
          probe: {
            text: '"Aku sudah ikut kasih kesaksian ke Bripka Danu sore tadi. Tinggal dua malam lagi kan kontrakmu? Bertahan ya Mas!"',
            clueId: 'clue_genset_hideout'
          }
        },
        serveCorrect: 'Makasih banyak Mas Raka! Semoga pelakunya cepat tertangkap!',
        serveWrong: 'Wah rasanya tertukar sedikit, tapi nggak apa-apa kok! Hati-hati ya Mas!',
        refuseResponse: 'Lho Mas, ini Nadia... oke deh aku ngerti kamu lagi super waspada malam ini.'
      },
      {
        id: 'n8_fake_tika',
        name: '“Perawat Tika” (?)',
        label: 'Sosok Bermasker Kering',
        threatLevel: 'danger',
        knockStyle: 'slow',
        order: ['matcha'],
        orderText: '1× Matcha Pahit',
        cctvNote: 'CCTV Halte: Lobi rumah sakit di sebelah kanan gelap tanpa ada siapa pun keluar—sosok ini melangkah dari belakang halte tua!',
        appearance: look('tika', {
          skin: '#cbc6be', wet: false, prop: 'scratched_badge', gaze: 'latch',
          blinkRate: 'none', heightScale: 1.06, collarHigh: true
        }),
        greeting: [
          'Malam, Raka... ini aku, Tika. Buka kacanya cepat, aku butuh satu Matcha... tanganku dingin sekali.',
          'Kenapa kamu terus menatap tanda pengenalku? Buka saja jendelanya.'
        ],
        observations: {
          face: 'Meskipun memakai masker medis, posturnya jauh lebih tinggi dari Tika, matanya lebar tak berkedip, dan tatapannya mengunci grendel jendelamu!',
          clothes: 'Jas hujannya KERING MUTLAK tanpa setetes pun air, dan kartu di dadanya bukan lanyard rumah sakit melainkan kartu nama yang dicoret hitam!',
          probe: {
            text: 'Begitu lampu teras menyala, ia memiringkan kepala dengan suara serak parau meniru perempuan: "Buka... Raka..."'
          }
        },
        dangerMessage: 'BUKAN TIKA! Sosok bermasker itu menerjang lewat kaca yang terbuka!',
        serveCorrect: '',
        serveWrong: '',
        refuseResponse: 'Ia merobek masker medisnya pelan di balik hujan, memperlihatkan senyum pucat kaku sebelum melangkah pergi.'
      },
      {
        id: 'n8_rina',
        name: 'Bu Rina',
        label: 'Ibu Kos Jalan Melati',
        threatLevel: 'safe',
        knockStyle: 'normal',
        order: ['vanilla', 'strawberry'],
        topping: 'caramel',
        orderText: '1× Vanila + 1× Stroberi + Karamel',
        cctvNote: 'CCTV Halte: Berjalan bersama payung besar dari arah gang kos sebelah timur.',
        appearance: look('rina'),
        greeting: [
          'Malam, Mas Raka! Saya beli Vanila sama Stroberi pakai Saus Karamel buat anak-anak kos yang masih melek.',
          'Polisi tadi sempat keliling gang tanya-tanya soal mantan penjaga halte yang bernama Arman. Mudah-mudahan besok sudah aman!'
        ],
        observations: {
          face: 'Bu Rina asli—kacamata berembun hujan, mata berkedip wajar, raut wajah cemas namun ramah.',
          clothes: 'Mantel dan payungnya basah kuyup meneteskan air hujan.',
          probe: {
            text: '"Iya Mas, dulu Arman memang sering duduk sendirian di halte tua sambil memandangi kios ini. Ngeri banget!"'
          }
        },
        serveCorrect: 'Makasih banyak Mas Raka! Jaga diri dua malam terakhir ini ya!',
        serveWrong: 'Aduh keliru sedikit Mas, tapi ya sudahlah, makasih ya!',
        refuseResponse: 'Lho Mas, ini Bu Rina! Masa ditolak lagi sih?'
      }
    ],

    // =========================================================================
    // NIGHT 9 — Malam Sebelum Fajar Terakhir (6 Pelanggan — High Pressure!)
    // =========================================================================
    9: [
      {
        id: 'n9_bima',
        name: 'Dokter Bima',
        label: 'Dokter Jaga RS Melati',
        threatLevel: 'safe',
        knockStyle: 'normal',
        order: ['matcha', 'mint'],
        topping: 'caramel',
        orderText: '1× Matcha + 1× Mint + Karamel',
        cctvNote: 'CCTV Halte: Berjalan menyeberang dari gerbang RS Harapan Melati di sisi kanan.',
        appearance: look('bima'),
        greeting: [
          'Malam, Raka! Malam kesembilan ya? Luar biasa kamu masih bertahan sejauh ini.',
          'Saya minta Matcha campur Mint pakai Saus Karamel ya. Kalau jantungmu mulai berdebar, jangan lupa minum kopi hangat!'
        ],
        observations: {
          face: 'Dokter Bima asli—berkedip normal, air hujan menempel di kacamata, raut wajah penuh empati.',
          clothes: 'Jas dokter basah oleh hujan badai dengan lanyard resmi RS Harapan Melati.',
          probe: {
            text: '"Bripka Danu bilang surat penangkapan Arman sudah keluar. Besok malam tim sergap turun penuh!"'
          }
        },
        serveCorrect: 'Terima kasih, Raka! Tinggal satu malam lagi setelah ini, tetap tenang!',
        serveWrong: 'Pesanan sedikit meleset ya, tidak apa-apa, malam ini memang penuh tekanan.',
        refuseResponse: 'Lho Raka, ini saya Dokter Bima! Wah kamu tegang sekali malam ini ya...'
      },
      {
        id: 'n9_threat_1',
        name: '“Hendra” (Suara Palsu)',
        label: 'Mengaku Pemilik Kios',
        threatLevel: 'danger',
        knockStyle: 'frantic',
        order: ['chocolate'],
        orderText: 'Minta Masuk Cek Kasir',
        weirdOrderLabel: 'MENGAKU PAK HENDRA (KERING)',
        cctvNote: 'CCTV Halte: Tidak ada mobil Pak Hendra di pinggir jalan! Sosok ini melangkah keluar dari lorong gelap ruang genset halte tua.',
        appearance: {
          skin: '#c7c2ba', coat: '#292c30', shirt: '#d0cbbd', hair: '#201f1f',
          hat: 'fedora', wet: false, stains: 'dark', glasses: true, mask: false, prop: 'scratched_badge',
          gaze: 'latch', blinkRate: 'none', expression: 'cold_smile', heightScale: 1.07, collarHigh: true
        },
        greeting: [
          'Raka! Ini aku Pak Hendra, pemilik kios! Polisi menyuruh kita menutup kios sekarang juga—cepat buka jendela dan serahkan uang kas!',
          'Jangan buang waktu, buka sekarang!'
        ],
        observations: {
          face: 'Matanya tidak berkedip sama sekali di balik kacamata kering—itu wajah dingin Arman yang meniru suara pemilik kios!',
          clothes: 'Jas dan topinya KERING MUTLAK meski badai mengamuk! Di balik kerahnya mengintip kartu nama tua bertuliskan ARMAN.',
          probe: {
            text: 'Saat kamu menyalakan lampu teras dan bertanya di mana mobilnya, suaranya pecah menjadi tawa rendah. "Cerdik sekali..."'
          }
        },
        dangerMessage: 'ITU BUKAN PAK HENDRA! Begitu kaca terbuka, Arman menerjang keras ke arah konter!',
        serveCorrect: '',
        serveWrong: '',
        refuseResponse: 'Gedoran keras menghantam kaca sekali—lalu hening. Ia berbisik: "Kamu tidak akan selamat melewati malam kesepuluh."'
      },
      {
        id: 'n9_darma',
        name: 'Pak Darma',
        label: 'Mekanik Bengkel Malam',
        threatLevel: 'safe',
        knockStyle: 'normal',
        order: ['chocolate', 'vanilla'],
        topping: 'chips',
        orderText: '1× Cokelat + 1× Vanila + Choco Chips',
        cctvNote: 'CCTV Halte: Datang dari bengkel ujung kiri jalan sambil mengibaskan jas hujan yang kuyup.',
        appearance: look('darma', { expression: 'worried' }),
        greeting: [
          'Raka! Saya Pak Darma asli nih—bau oli mesinnya sampai ke depan kaca! Pesan Cokelat sama Vanila pakai Choco Chips ya.',
          'Saya baru lihat bayangan kabur ke arah ruang genset halte. Pastikan Kunci Ganda selalu siap malam ini!'
        ],
        observations: {
          face: 'Pak Darma asli—raut cemas tapi jujur, mata berkedip wajar, napas hangat.',
          clothes: 'Jaket bengkel basah kuyup dengan noda oli hitam khas bengkel.',
          probe: {
            text: '"Besok malam saya sengaja nggak buka bengkel malam biar jalanan steril buat polisi sergap dia. Semangat, Raka!"'
          }
        },
        serveCorrect: 'Makasih, Raka! Satu malam lagi, kamu pasti menang!',
        serveWrong: 'Agak ketukar sedikit Mas, nggak masalah, fokus jaga keselamatanmu!',
        refuseResponse: 'Aduh Raka, ini Pak Darma asli lho! Jangan panik dulu Mas!'
      },
      {
        id: 'n9_threat_2',
        name: '“Reno” (?)',
        label: 'Kurir Tanpa Motor',
        threatLevel: 'danger',
        knockStyle: 'frantic',
        order: ['mint'],
        orderText: '1× Mint Dingin',
        cctvNote: 'CCTV Halte: Tidak ada sepeda motor atau lampu kendaraan di jalan—ia berjalan kaki keluar dari belakang halte tua!',
        appearance: look('reno', {
          skin: '#c8c3bb', wet: false, stains: 'dark', gaze: 'latch', blinkRate: 'none',
          expression: 'hollow', heightScale: 1.06, collarHigh: true
        }),
        greeting: [
          'Mas! Buka cepat, ini aku Reno! Ada orang ngejar aku! Kasih satu Mint sambil aku masuk sebentar!',
          'Cepat buka kacanya sekarang!!'
        ],
        observations: {
          face: 'Meskipun mengetuk panik, matanya justru terbuka dingin TANPA BERKEDIP dan tidak sekali pun menengok ke belakang bahunya!',
          clothes: 'Jaket cokelatnya KERING sempurna di tengah hujan deras, tanpa tanda pengenal ekspedisi, dan posturnya terlalu tinggi untuk Reno!',
          probe: {
            text: 'Saat lampu teras menyala terang, ia berhenti pura-pura terengah dan menatap lurus ke matamu: "Ketenanganmu mulai goyah, Raka."'
          }
        },
        dangerMessage: 'PENIRU RENO! Tangannya langsung meraih tepi jendela berusaha mendobrak masuk!',
        serveCorrect: '',
        serveWrong: '',
        refuseResponse: 'Ia berdiri mematung menatapmu lewat kaca buram selama lima detik penuh sebelum lenyap di balik kabut.'
      },
      {
        id: 'n9_karno',
        name: 'Mbah Karno',
        label: 'Warga Tua Insomnia',
        threatLevel: 'safe',
        knockStyle: 'slow',
        order: ['vanilla', 'matcha'],
        topping: 'cherry',
        orderText: '1× Vanila + 1× Matcha + Ceri Merah',
        cctvNote: 'CCTV Halte: Terlihat berjalan pelan di trotoar gang timur dengan jas hujan basah dan tongkat.',
        appearance: look('karno'),
        greeting: [
          'Nak Raka... malam kesembilan sudah hampir lewat. Mbah beli Vanila sama Matcha pakai Ceri Merah ya.',
          'Jika besok malam semua petunjukmu sudah lengkap, jangan ragu bantu polisi mengakhiri kutukan Jalan Melati.'
        ],
        observations: {
          face: 'Wajah keriput teduh Mbah Karno asli, berkedip pelan wajar dan tersenyum penuh harap.',
          clothes: 'Syal rajut dan mantel cokelat basah kuyup oleh hujan.',
          probe: {
            text: '"Mbah yakin Dimas masih hidup di ruang genset halte tua itu. Besok pukul tiga, selesaikan semuanya, Nak."'
          }
        },
        serveCorrect: 'Terima kasih, Nak. Tuhan melindungimu di malam kesepuluh besok.',
        serveWrong: 'Tidak apa-apa sedikit keliru, Nak. Pikiranmu sudah bekerja keras sembilan malam ini.',
        refuseResponse: 'Oalah Nak... Mbah mengerti malam ini terlalu mencekam. Hati-hati ya...'
      },
      {
        id: 'n9_threat_3',
        name: 'Bayangan Bermantel',
        label: 'Uji Grendel Pukul 03:00',
        threatLevel: 'danger',
        knockStyle: 'slow',
        order: [],
        orderText: '???',
        weirdOrderLabel: 'TEROR PENUTUP MALAM 9',
        cctvNote: 'CCTV Halte: Kamera menangkap sosok tinggi berdiri tepat di antara halte dan kios—hanya menatap lurus ke jendelamu.',
        appearance: look('arman'),
        greeting: [
          'Sembilan malam berlalu, dan kamu belum juga membuka kaca untukku.',
          'Besok malam adalah malam kesepuluhmu, Raka. Tidak akan ada lagi penyamaran... hanya kamu, aku, dan pukul tiga pagi.'
        ],
        observations: {
          face: 'Wajah Arman di balik bayangan fedora—tidak berkedip, senyum tipis penuh amarah dingin.',
          clothes: 'Mantel kelabu panjang kering mutlak. Tangannya menggores pelan kaca depan kios.',
          probe: {
            text: 'Kilat lampu teras membuat matanya berkilat dingin. "Siapkan dirimu besok malam, Raka."'
          }
        },
        dangerMessage: 'JANGAN BUKA! Arman langsung menghantam kaca terbuka mencoba menerobos masuk!',
        serveCorrect: '',
        serveWrong: '',
        refuseResponse: 'Arman mengangguk pelan dengan dingin, lalu menghilang sepenuhnya ke dalam kabut menjelang fajar Malam 9.'
      }
    ],

    // =========================================================================
    // NIGHT 10 — Jam Tiga Pagi: Malam Terakhir (True Climax — 3+ Endings!)
    // =========================================================================
    10: [
      {
        id: 'n10_tika',
        name: 'Tika',
        label: 'Perawat Shift Malam',
        threatLevel: 'safe',
        knockStyle: 'normal',
        order: ['matcha', 'strawberry'],
        topping: 'cherry',
        orderText: '1× Matcha + 1× Stroberi + Ceri Merah',
        cctvNote: 'CCTV Halte: Terlihat berjalan dari gerbang RS Harapan Melati di bawah kabut putih.',
        appearance: look('tika'),
        greeting: [
          'Malam terakhir, Raka! Saya beli Matcha sama Stroberi pakai Ceri Merah sebagai perayaan sebelum kontrakmu selesai.',
          'Ambulans rumah sakit juga sudah siaga bersama Bripka Danu kalau-kalau Dimas ditemukan malam ini!'
        ],
        observations: {
          face: 'Mata Tika yang ramah dan berkedip normal di atas masker medis resminya.',
          clothes: 'Jas hujan lembap berkabut dengan lanyard resmi RS Harapan Melati jelas terbaca.',
          probe: {
            text: '"Tim sergap polisi sudah bersembunyi di dekat jembatan layang. Jangan pernah buka kaca pukul 03:00!"'
          }
        },
        serveCorrect: 'Semoga berhasil malam terakhir ini, Raka! Kami semua mendukungmu!',
        serveWrong: 'Agak ketukar sedikit, nggak apa-apa! Fokus hadapi jam tiga pagi nanti!',
        refuseResponse: 'Lho Raka, ini Tika! Aku ngerti kamu tegang banget malam terakhir ini...'
      },
      {
        id: 'n10_fake_sari',
        name: '“Sari” (Umpan Terakhir)',
        label: 'Penyamaran Sebelum 03:00',
        threatLevel: 'danger',
        knockStyle: 'frantic',
        order: ['vanilla', 'chocolate'],
        orderText: '1× Vanila + 1× Cokelat',
        cctvNote: 'CCTV Halte: Tidak ada mobil atau ojek di jalan! Sosok ini berjalan kaku keluar dari ruang genset halte tua!',
        appearance: {
          skin: '#d3d0cc', coat: '#33363a', shirt: '#15171a', hair: '#111112', hairStyle: 'long',
          hat: 'hood', wet: false, stains: 'dark', glasses: false, mask: false,
          gaze: 'player', blinkRate: 'none', expression: 'cold_smile', heightScale: 1.06, collarHigh: true
        },
        greeting: [
          'Mas Raka, tolong buka jendelanya! Ini aku Sari! Polisi salah tangkap—buka kaca sekarang biar aku masuk!',
          'Kenapa kamu diam saja? Cepat buka!'
        ],
        observations: {
          face: 'Tidak berkacamata, postur terlalu tinggi, tatapan kosong tanpa kedipan—umpan terakhir Arman sebelum pukul 03:00!',
          clothes: 'Tudung dan jaketnya benar-benar kering di tengah kabut lembap, dengan bercak gelap di lengan baju.',
          probe: {
            text: 'Lampu teras menyala—ia berhenti berpura-pura panik dan menyeringai datar. "Sebentar lagi pukul tiga..."'
          }
        },
        dangerMessage: 'UMPAN BERBAHAYA! Sosok itu langsung menerjang celah jendela!',
        serveCorrect: '',
        serveWrong: '',
        refuseResponse: 'Suara langkahnya menjauh perlahan ke dalam kabut pekat. Jam dinding mendekati 03:00...'
      },
      {
        id: 'n10_sari_real',
        name: 'Sari',
        label: 'Mahasiswi Begadang (Perpisahan)',
        threatLevel: 'safe',
        knockStyle: 'normal',
        order: ['vanilla', 'mint'],
        topping: 'chips',
        orderText: '1× Vanila + 1× Mint + Choco Chips',
        cctvNote: 'CCTV Halte: Mobil sedan temannya berhenti terang benderang di depan jalan dengan lampu hazard menyala.',
        appearance: look('sari', { gaze: 'normal', blinkRate: 'normal', expression: 'tired_smile' }),
        greeting: [
          'Mas Raka! Ini beneran aku Sari—lihat mobil temanku di depan jalan! Aku pesan Vanila sama Mint pakai Choco Chips buat malam terakhir shiftmu.',
          'Terima kasih sudah jadi penjaga kios paling berani di Jalan Melati!'
        ],
        observations: {
          face: 'Sari asli dengan kacamata tebal, senyum lega tulus, dan kedipan wajar.',
          clothes: 'Jaket lembap berkabut sambil memegang buket bunga kecil wisuda dan map skripsinya.',
          probe: {
            text: '"Habis ini jalanan langsung steril untuk tim polisi. Jaga kaca tetap terkunci rapat pukul tiga ya, Mas!"'
          }
        },
        serveCorrect: 'Makasih banyak Mas Raka! Semoga fajar besok membawa kabar baik!',
        serveWrong: 'Hehe salah sedikit nggak apa-apa Mas, makasih sudah bertahan sepuluh malam!',
        refuseResponse: 'Oke Mas, nggak apa-apa—aku tahu sebentar lagi jam tiga. Hati-hati ya!'
      },
      {
        id: 'n10_arman_climax',
        name: 'Arman — Tamu Jam Tiga',
        label: 'Klimaks Malam ke-10 (03:00)',
        threatLevel: 'climax',
        knockStyle: 'slow',
        order: [],
        orderText: '—',
        weirdOrderLabel: 'KONFRONTASI AKHIR MALAM 10 (03:00)',
        cctvNote: 'CCTV Halte: Dua mobil patroli polisi tanpa lampu terlihat bersiaga penuh di balik jembatan layang—menunggu sinyalmu!',
        appearance: look('arman'),
        greeting: [
          'Tepat pukul 03:00 di Malam Kesepuluh, Raka. Sepuluh malam penuh kamu bertahan di balik kaca tipis ini.',
          'Tidak ada lagi pelanggan. Tidak ada lagi penyamaran. Aku memakai seragam Dimas, memegang kuncinya, dan tahu seluruh isi kiosmu. Buka jendela ini... atau akhiri sepuluh malammu sekarang.'
        ],
        observations: {
          face: 'Wajah Arman terlihat jelas tanpa bayangan—dingin, obsesif, dan sama sekali tidak berkedip menatap lurus ke matamu.',
          clothes: 'Mantel kelabu kering membungkus seragam Sora Dingin curian. Di balik kerahnya tergantung kartu lama bertuliskan ARMAN — PENJAGA HALTE MELATI.',
          probe: {
            text: 'Lampu teras menyorot wajahnya terang benderang. "Kamu pikir tumpukan catatanmu cukup untuk menjebakku? Coba saja buktikan, Raka!"'
          }
        },
        dangerMessage: 'Jendela terbuka pada klimaks Malam 10 pukul 03:00. Tidak ada jalan mundur.',
        serveCorrect: '',
        serveWrong: '',
        refuseResponse: 'Kamu mengunci ganda jendela rapat-rapat dan menolak tunduk hingga pukul 05:00. Arman menatapmu dalam sunyi yang mencekam... lalu berbalik perlahan dan lenyap ditelan kabut fajar.'
      }
    ]
  };

  NS.Customers = {
    FLAVORS,
    FLAVOR_LIST: ['vanilla', 'chocolate', 'strawberry', 'matcha', 'mint'],
    TOPPINGS,
    TOPPING_LIST: ['chips', 'caramel', 'cherry'],
    calcOrderPrice,
    getScheduleForNight(night) {
      return NIGHT_SCHEDULES[night] || NIGHT_SCHEDULES[1];
    }
  };
})(window);
