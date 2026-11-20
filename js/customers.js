/* ==========================================================================
   NIGHT SHIFT: ICE CREAM — Ice Cream Flavors & 5-Night Customer Roster
   Implements F-01 (Customer System), F-03 (Orders), F-04 (Suspicion & Red Herrings).
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

  function calcOrderPrice(order) {
    if (!Array.isArray(order) || order.length === 0) return 0;
    return order.reduce((sum, fid) => sum + (FLAVORS[fid] ? FLAVORS[fid].price : 0), 0);
  }

  /**
   * Customer Archetype Definitions:
   * - threatLevel:
   *     'safe'      -> Normal or quirky red-herring innocent. Should be served!
   *     'eerie'     -> Suspicious encounter on Night 1 (harmless warning / plants clue; safe to serve OR refuse without strike!)
   *     'danger'    -> Genuine Threat / Killer in disguise! Opening window triggers emergency lunge/close-call; MUST be refused!
   *     'climax'    -> Night 5 03:00 Final Confrontation with Arman! Opening window = fatal Bad Ending; Refuse = Good Ending; Confront (with >=5 clues) = Secret Ending!
   * - appearance: visual descriptors consumed by renderer.js to paint rich 2D horror portraits.
   */
  const NIGHT_SCHEDULES = {
    // =========================================================================
    // NIGHT 1 — Shift Pertama (Tutorial + Intro to allies & 03:00 stranger)
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
        appearance: {
          skin: '#b89476',
          coat: '#2f3d44',
          shirt: '#1d2428',
          hair: '#22201f',
          hat: 'cap',
          wet: true,
          stains: 'oil',
          glasses: false,
          mask: false,
          gaze: 'normal',
          blinkRate: 'normal',
          expression: 'tired_smile',
          heightScale: 1.02,
          collarHigh: false
        },
        greeting: [
          'Malam, Mas! Wah, penjaga baru ya? Dimas ke mana, kok ganti orang?',
          'Tolong satu Cokelat Pekat dong. Baru tutup bengkel, badan pegal semua kehujanan.'
        ],
        observations: {
          face: 'Wajahnya lelah dan berkeringat dingin, tapi matanya berkedip wajar saat menatap lampu. Terlihat raut ramah meski kelelahan.',
          clothes: 'Jaket kerjanya basah kuyup meneteskan air hujan. Di pergelangan tangan dan ujung jaketnya ada noda hitam pekat—tercium bau oli mesin dan bensin, bukan darah.',
          probe: {
            text: '"Bus? Wah, bus terakhir Jalan Melati sudah habis dari jam 23:30, Mas. Saya jalan kaki dari bengkel ujung gang. Hati-hati ya jaga sendirian."',
            clueId: 'clue_bus'
          }
        },
        serveCorrect: 'Makasih banyak, Mas! Oh ya, kalau ada yang bilang baru turun bus lewat tengah malam, jangan percaya—bus terakhir di sini berhenti jam 23:30. Hati-hati ya!',
        serveWrong: 'Lho, ini bukan cokelat ya? Ya sudahlah, saya capek banget, tapi lain kali cek slip pesanan dulu ya Mas.',
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
        appearance: {
          skin: '#d9cfc5',
          coat: '#495054',
          shirt: '#2a2e33',
          hair: '#171618',
          hairStyle: 'long',
          hat: 'none',
          wet: true,
          stains: 'none',
          glasses: true,
          mask: false,
          prop: 'papers',
          gaze: 'downcast',
          blinkRate: 'slow',
          expression: 'exhausted',
          heightScale: 0.93,
          collarHigh: false
        },
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
        id: 'n1_bambang',
        name: 'Mas Gilang',
        label: 'Karyawan Lembur',
        threatLevel: 'safe',
        knockStyle: 'normal',
        order: ['strawberry'],
        orderText: '1× Stroberi Malam',
        appearance: {
          skin: '#c4a287',
          coat: '#353b34',
          shirt: '#d6d2c8',
          hair: '#241f1c',
          hat: 'none',
          wet: true,
          stains: 'none',
          glasses: false,
          mask: false,
          prop: 'umbrella',
          gaze: 'normal',
          blinkRate: 'normal',
          expression: 'neutral',
          heightScale: 1.0,
          collarHigh: false
        },
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
        threatLevel: 'eerie', // Harmless creepy encounter on Night 1 — introduces mystery & clue_dimas_query!
        knockStyle: 'slow',
        order: ['mint'],
        orderText: '1× Mint Dingin',
        clueOnServe: 'clue_dimas_query',
        clueOnRefuse: 'clue_dimas_query',
        appearance: {
          skin: '#c9c4bc',
          coat: '#282c30',
          shirt: '#141618',
          hair: '#171717',
          hat: 'fedora',
          wet: false,
          stains: 'none',
          glasses: false,
          mask: false,
          gaze: 'latch',
          blinkRate: 'none',
          expression: 'cold_smile',
          heightScale: 1.06,
          collarHigh: true
        },
        greeting: [
          '...Sudah jam tiga pagi. Kamu bukan Dimas.',
          'Aku cuma mau lihat siapa yang menggantikannya. Boleh satu Mint Dingin... kalau kamu berani membuka jendela.'
        ],
        observations: {
          face: 'Separuh wajahnya tertutup bayangan topi rendah. Matanya tidak berkedip sama sekali—dan tatapannya tidak tertuju padamu, melainkan ke grendel kunci jendela.',
          clothes: 'Mantel kelabunya tampak nyaris kering meski rintik hujan masih turun. Kedua tangannya tersembunyi rapat di dalam saku.',
          probe: {
            text: 'Saat lampu teras berkedip terang ke wajahnya, sudut bibirnya terangkat tipis tanpa suara. "Kunci jendelanya masih sama seperti milik Dimas..."',
            clueId: 'clue_dimas_query'
          }
        },
        serveCorrect: 'Dingin sekali... seperti malam terakhir Dimas bekerja di sini. Sampai jumpa di shift berikutnya, penjaga baru.',
        serveWrong: 'Bukan ini yang kuminta. Tapi aku tidak datang hanya demi es krim. Kita akan bertemu lagi.',
        refuseResponse: 'Pintar... kamu memilih menjaga kaca tetap tertutup. Dimas dulu terlalu ramah. Kita lihat berapa lama kamu bisa bertahan.'
      }
    ],

    // =========================================================================
    // NIGHT 2 — Tatapan di Balik Kaca (First real danger + Nurse Red Herring)
    // =========================================================================
    2: [
      {
        id: 'n2_sari',
        name: 'Sari',
        label: 'Mahasiswi Begadang (Kembali)',
        threatLevel: 'safe',
        knockStyle: 'normal',
        order: ['vanilla', 'strawberry'],
        orderText: '1× Vanila + 1× Stroberi',
        appearance: {
          skin: '#d8cec4',
          coat: '#495054',
          shirt: '#2a2e33',
          hair: '#171618',
          hairStyle: 'long',
          hat: 'none',
          wet: true,
          stains: 'none',
          glasses: true,
          mask: false,
          prop: 'papers',
          gaze: 'nervous',
          blinkRate: 'fast',
          expression: 'worried',
          heightScale: 0.93,
          collarHigh: false
        },
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
        serveCorrect: 'Terima kasih, Mas! Aku langsung pulang naik ojek dari depan sini saja. Hati-hati ya, kunci jendelanya!',
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
        appearance: {
          skin: '#ceb7a5',
          coat: '#2b4048',
          shirt: '#d2dede',
          hair: '#1f1a1a',
          hairStyle: 'bun',
          hat: 'none',
          wet: true,
          stains: 'none',
          glasses: false,
          mask: true,
          prop: 'badge',
          gaze: 'normal',
          blinkRate: 'normal',
          expression: 'serious',
          heightScale: 0.95,
          collarHigh: false
        },
        greeting: [
          'Malam. Maaf saya pakai masker, baru selesai jaga IGD di rumah sakit sebelah.',
          'Satu Matcha Pahit ya, tolong agak cepat sebelum hujan makin besar.'
        ],
        observations: {
          face: 'Wajahnya tertutup masker medis sehingga sulit dibaca, namun matanya tampak lelah dan berkedip normal. Saat lampu teras menyala, ia memicingkan mata wajar.',
          clothes: 'Jas hujan tipisnya basah kuyup. Di kerahnya terlihat lanyard resmi "RS HARAPAN MELATI — PERAWAT TIKA" dan ia menenteng kotak makan logam.',
          probe: {
            text: '"Kasus orang hilang di jalan ini? Di rumah sakit ramai dibicarakan—katanya semua korban hilang sekitar jam 3 pagi tanpa bekas pintu didobrak. Artinya mereka buka sendiri."',
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
        appearance: {
          skin: '#c7c1b8',
          coat: '#343638',
          shirt: '#1c1d1f',
          hair: '#1d1b1b',
          hat: 'hood',
          wet: false,
          stains: 'none',
          glasses: false,
          mask: false,
          gaze: 'latch',
          blinkRate: 'none',
          expression: 'hollow',
          heightScale: 1.05,
          collarHigh: true
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
        appearance: {
          skin: '#b89476',
          coat: '#2f3d44',
          shirt: '#1d2428',
          hair: '#22201f',
          hat: 'cap',
          wet: true,
          stains: 'oil',
          glasses: false,
          mask: false,
          gaze: 'normal',
          blinkRate: 'normal',
          expression: 'tired_smile',
          heightScale: 1.02,
          collarHigh: false
        },
        greeting: [
          'Hujan nggak ada habisnya ya, Mas! Saya pesan Cokelat campur Vanila dong malam ini.',
          'Tadi saya lihat seseorang mondar-mandir di dekat halte sebelum saya lewat. Kamu aman kan di dalam?'
        ],
        observations: {
          face: 'Wajah yang sama seperti semalam—mata berkedip wajar, alis berkerut karena khawatir.',
          clothes: 'Jaket bengkelnya kuyup meneteskan air hujan, bau oli mesin tercium samar di dekat jendela.',
          probe: {
            text: '"Iya Mas, saya kenal suara langkah orang mabuk sama orang yang sengaja mengendap-endap. Tadi itu beda banget. Hati-hati ya!"'
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
        appearance: {
          skin: '#bfa086',
          coat: '#3c4b3f',
          shirt: '#262e29',
          hair: '#24211e',
          hat: 'beanie',
          wet: true,
          stains: 'none',
          glasses: false,
          mask: false,
          gaze: 'normal',
          blinkRate: 'normal',
          expression: 'neutral',
          heightScale: 0.99,
          collarHigh: false
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
    // NIGHT 3 — Suara di Saluran Telepon (Mbah Karno, Reno, 2 Disguised Threats)
    // =========================================================================
    3: [
      {
        id: 'n3_karno',
        name: 'Mbah Karno',
        label: 'Warga Tua Insomnia',
        threatLevel: 'safe',
        knockStyle: 'slow',
        order: ['vanilla'],
        orderText: '1× Vanila Klasik',
        clueOnServe: 'clue_dimas_note',
        appearance: {
          skin: '#b09a86',
          coat: '#403830',
          shirt: '#2a241f',
          hair: '#a9a7a2',
          hat: 'none',
          wet: true,
          stains: 'none',
          glasses: true,
          mask: false,
          prop: 'scarf',
          gaze: 'normal',
          blinkRate: 'slow',
          expression: 'solemn',
          heightScale: 0.91,
          collarHigh: false
        },
        greeting: [
          'Uhuk... malam, Nak. Jangan kaget lihat orang tua keluyuran jam segini. Mbah nggak bisa tidur kalau hujan deras.',
          'Boleh satu Vanila saja? Mbah sekalian mau bilang sesuatu soal catatan anak yang jaga dulu...'
        ],
        observations: {
          face: 'Keriput dalam dan mata berkaca-kaca karena usia. Meskipun ketukannya pelan dan suaranya serak, tatapannya hangat dan ia berkedip normal.',
          clothes: 'Syal rajut lusuh dan jaket cokelatnya basah meresap air hujan. Tangannya yang gemetar memegang uang pas.',
          probe: {
            text: '"Dimas dulu sering cerita ke Mbah sebelum hilang... dia pernah menyelipkan sobekan catatan di samping freezer tentang tamu berinisial A. Sudah kamu baca?"',
            clueId: 'clue_dimas_note'
          }
        },
        serveCorrect: 'Terima kasih, Nak. Ingat pesan Mbah: jangan buka jendela untuk yang kering di tengah hujan, atau yang tahu isi dalam kiosmu.',
        serveWrong: 'Hehe, salah rasa ya Nak? Tidak apa-apa, yang penting kamu tetap awas malam ini.',
        refuseResponse: 'Oalah, Nak... Mbah cuma warga sebelah yang mau mengingatkanmu. Hati-hati ya...'
      },
      {
        id: 'n3_mimic_threat',
        name: '“Teman Pak Darma”',
        label: 'Pria Berjaket Kering',
        threatLevel: 'danger',
        knockStyle: 'normal',
        order: ['chocolate'],
        orderText: '1× Cokelat Pekat (atau "Rasa Abu")',
        weirdOrderLabel: '1× "Rasa Abu" / Cokelat',
        clueOnRefuse: 'clue_dry_coat',
        appearance: {
          skin: '#c4bfb7',
          coat: '#2d353a',
          shirt: '#171a1c',
          hair: '#1e1c1c',
          hat: 'cap',
          wet: false,
          stains: 'dark',
          glasses: false,
          mask: false,
          gaze: 'latch',
          blinkRate: 'none',
          expression: 'cold_smile',
          heightScale: 1.04,
          collarHigh: true
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
        orderText: '1× Mint + 1× Matcha',
        appearance: {
          skin: '#c8a88b',
          coat: '#5c3b29',
          shirt: '#222222',
          hair: '#1f1c1a',
          hat: 'helmet_visor',
          wet: true,
          stains: 'none',
          glasses: false,
          mask: false,
          gaze: 'nervous',
          blinkRate: 'fast',
          expression: 'panicked',
          heightScale: 0.98,
          collarHigh: false
        },
        greeting: [
          'Mas! Mas, tolong cepat! Ada orang berdiri di balik tembok samping kiosmu tadi!',
          'Aku cuma mau beli Mint sama Matcha biar tenang sebentar sambil nunggu orderan masuk, sumpah aku kurir!'
        ],
        observations: {
          face: 'Napasnya memburu, keringat dan air hujan mengalir dari dahinya. Matanya terus melirik cemas ke belakang bahunya dengan kedipan panik yang sangat manusiawi.',
          clothes: 'Jaket kurir cokelatnya basah kuyup dari bahu sampai siku. Tanda pengenal ekspedisi tergantung jelas di dadanya.',
          probe: {
            text: '"Sumpah, Mas! Aku baru lewat jembatan layang, lihat orang bermantel kelabu jalan di pinggir kios ini tanpa payung. Bikin merinding banget!"'
          }
        },
        serveCorrect: 'Fuh, makasih Mas! Aku langsung tancap gas habis ini. Tolong jangan buka jendela sembarangan setelah aku pergi!',
        serveWrong: 'Waduh salah rasa ya, nggak apa-apa deh Mas, aku lagi deg-degan banget juga.',
        refuseResponse: 'Yah, Mas! Aku beneran kurir nih, kehujanan pula... ya sudahlah aku langsung jalan saja!'
      },
      {
        id: 'n3_tika',
        name: 'Tika',
        label: 'Perawat Shift Malam',
        threatLevel: 'safe',
        knockStyle: 'normal',
        order: ['strawberry', 'vanilla'],
        orderText: '1× Stroberi + 1× Vanila',
        clueOnServe: 'clue_medical',
        appearance: {
          skin: '#ceb7a5',
          coat: '#2b4048',
          shirt: '#d2dede',
          hair: '#1f1a1a',
          hairStyle: 'bun',
          hat: 'none',
          wet: true,
          stains: 'none',
          glasses: false,
          mask: true,
          prop: 'badge',
          gaze: 'normal',
          blinkRate: 'normal',
          expression: 'serious',
          heightScale: 0.95,
          collarHigh: false
        },
        greeting: [
          'Malam, Raka. Saya Tika, perawat yang kemarin. Malam ini minta Stroberi campur Vanila ya.',
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
        serveWrong: 'Hmm, rasanya tertukar sedikit, tapi tidak apa-apa. Tetap waspada malam ini.',
        refuseResponse: 'Mas, ini saya Tika... kok malah ditolak sih malam ini?'
      },
      {
        id: 'n3_stalker_3am',
        name: 'Sosok Tanpa Payung',
        label: 'Tamu Pukul 03:00',
        threatLevel: 'danger',
        knockStyle: 'slow',
        order: ['mint'],
        orderText: '1× "Yang Paling Dingin"',
        weirdOrderLabel: '??? (Tidak Ada di Menu)',
        appearance: {
          skin: '#c9c4bc',
          coat: '#23272b',
          shirt: '#111214',
          hair: '#141414',
          hat: 'fedora',
          wet: false,
          stains: 'none',
          glasses: false,
          mask: false,
          gaze: 'player',
          blinkRate: 'none',
          expression: 'cold_smile',
          heightScale: 1.07,
          collarHigh: true
        },
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
    // NIGHT 4 — Hujan Tanpa Bayangan (Moral Dilemma Nadia + Fake Inspector Arman!)
    // =========================================================================
    4: [
      {
        id: 'n4_darma',
        name: 'Pak Darma',
        label: 'Mekanik Bengkel Malam',
        threatLevel: 'safe',
        knockStyle: 'normal',
        order: ['chocolate', 'matcha'],
        orderText: '1× Cokelat + 1× Matcha',
        appearance: {
          skin: '#b89476',
          coat: '#2f3d44',
          shirt: '#1d2428',
          hair: '#22201f',
          hat: 'cap',
          wet: true,
          stains: 'oil',
          glasses: false,
          mask: false,
          gaze: 'normal',
          blinkRate: 'normal',
          expression: 'worried',
          heightScale: 1.02,
          collarHigh: false
        },
        greeting: [
          'Malam, Raka! Badai banget ya. Kasih saya Cokelat sama Matcha dong biar hangat pikiran.',
          'Dengar-dengar ada yang menyamar jadi petugas pengawas malam di sekitar sini. Jangan asal percaya kartu pengenal kalau wajahnya mencurigakan!'
        ],
        observations: {
          face: 'Wajah ramah penuh cemas milik Pak Darma. Berkedip normal dan mengibaskan air dari topinya.',
          clothes: 'Basah kuyup, noda oli mesin khas bengkelnya masih menempel di lengan.',
          probe: {
            text: '"Iya! Pak Hendra nggak pernah kirim pengawas tengah malam begini. Jadi kalau ada yang ngaku pengawas, periksa baik-baik!"'
          }
        },
        serveCorrect: 'Makasih, Raka! Hati-hati banget malam ini, badainya bikin suara langkah susah kedengaran.',
        serveWrong: 'Wah keliru rasa nih, tapi nggak apa-apa, yang penting kamu tetap tenang.',
        refuseResponse: 'Aduh Raka, ini saya Pak Darma! Jangan bikin saya kehujanan percuma dong!'
      },
      {
        id: 'n4_nadia',
        name: 'Nadia',
        label: 'Pejalan Kaki Ketakutan',
        threatLevel: 'safe', // Classic horror red herring: frantic knocking, terrified, actually INNOCENT!
        knockStyle: 'frantic',
        order: ['vanilla'],
        orderText: '1× Vanila Klasik',
        appearance: {
          skin: '#d6c1b2',
          coat: '#5c2d31',
          shirt: '#2e1d20',
          hair: '#1b1617',
          hairStyle: 'long',
          hat: 'none',
          wet: true,
          stains: 'none',
          glasses: false,
          mask: false,
          gaze: 'nervous',
          blinkRate: 'fast',
          expression: 'panicked',
          heightScale: 0.94,
          collarHigh: false
        },
        greeting: [
          'TOLONG! Mas, tolong jangan usir aku! Ada pria bermantel yang tadi membuntuti aku dari jembatan layang!',
          'Aku beli satu Vanila saja biar aku punya alasan berdiri di bawah lampu terasmu sampai dia pergi!'
        ],
        observations: {
          face: 'Wajahnya basah oleh hujan dan air mata. Napasnya tersengal nyata, matanya berkedip cepat dan memohon tulus.',
          clothes: 'Jaket merah tuanya kuyup berat meneteskan air ke lantai. Ia menggenggam ponsel dengan layar menyala menghubungi keluarganya.',
          probe: {
            text: '"Benaran, Mas! Aku baru turun taksi online di perempatan karena ban bocor, terus ada pria tinggi berjas kering menatapku dari halte. Aku cuma butuh tempat terang sebentar!"'
          }
        },
        serveCorrect: 'Terima kasih banyak, Mas! Taksiku yang baru sudah kelihatan lampunya di ujung jalan. Kamu menyelamatkan malamku!',
        serveWrong: 'Nggak apa-apa rasa apa saja Mas, makasih sudah percaya sama aku. Hati-hati ya!',
        refuseResponse: 'Tolong jangan tutup... aku beneran ketakutan! Ya Tuhan...'
      },
      {
        id: 'n4_inspector_threat',
        name: '“Pengawas Malam”',
        label: 'Mengaku Inspektur Kios',
        threatLevel: 'danger',
        knockStyle: 'slow',
        order: ['matcha'],
        orderText: '1× Matcha (Inspeksi)',
        weirdOrderLabel: 'Permintaan Buka Jendela (Inspeksi)',
        clueOnRefuse: 'clue_inspector_lie',
        appearance: {
          skin: '#c8c3ba',
          coat: '#262b30',
          shirt: '#d4d0c5',
          hair: '#171717',
          hat: 'fedora',
          wet: false,
          stains: 'none',
          glasses: true,
          mask: false,
          prop: 'scratched_badge',
          gaze: 'latch',
          blinkRate: 'none',
          expression: 'cold_smile',
          heightScale: 1.07,
          collarHigh: true
        },
        greeting: [
          'Selamat malam, Raka. Saya petugas inspeksi kebersihan malam dari kantor pusat Pak Hendra. Saya perlu memeriksa freezer dan stok es krim sekarang.',
          'Segera buka jendela pelayanan dan siapkan satu contoh Matcha. Dimas dulu selalu patuh pada prosedur.'
        ],
        observations: {
          face: 'Di balik kacamata beningnya, matanya sama sekali tidak berkedip. Tidak ada setetes pun embun hujan pada lensanya meski di luar badai.',
          clothes: 'Jas kelabu dan kerah kemejanya KERING MUTLAK. Di dadanya tergantung kartu pengenal usang—di balik coretan spidol hitam samar terbaca nama: "ARMAN".',
          probe: {
            text: 'Saat kamu menyorotkan lampu teras ke kartu namanya dan menyebut Pak Hendra tidak pernah mengirim inspektur, ia menutup kartu itu dengan tangannya perlahan. "Mata yang tajam, Raka..."',
            clueId: 'clue_inspector_lie'
          }
        },
        dangerMessage: 'JEBBAKAN! Begitu kaca terbuka, "Pengawas Malam" langsung menerjang masuk meraih bahumu!',
        serveCorrect: '',
        serveWrong: '',
        refuseResponse: 'Kartu itu... kamu sempat membacanya, ya? Tidak masalah. Besok malam pukul tiga, tidak akan ada lagi samaran.'
      },
      {
        id: 'n4_karno',
        name: 'Mbah Karno',
        label: 'Warga Tua Insomnia',
        threatLevel: 'safe',
        knockStyle: 'slow',
        order: ['vanilla', 'chocolate'],
        orderText: '1× Vanila + 1× Cokelat',
        appearance: {
          skin: '#b09a86',
          coat: '#403830',
          shirt: '#2a241f',
          hair: '#a9a7a2',
          hat: 'none',
          wet: true,
          stains: 'none',
          glasses: true,
          mask: false,
          prop: 'scarf',
          gaze: 'normal',
          blinkRate: 'slow',
          expression: 'solemn',
          heightScale: 0.91,
          collarHigh: false
        },
        greeting: [
          'Nak... Mbah lihat bayangan tinggi baru saja menjauh dari kiosmu. Kamu tidak membukakan jendela untuk dia, kan?',
          'Buatkan Mbah Vanila campur Cokelat ya. Tangan Mbah dingin sekali malam ini.'
        ],
        observations: {
          face: 'Wajah Mbah Karno yang penuh keriput lembut, berkedip normal dengan raut khawatir.',
          clothes: 'Syal dan mantelnya basah kuyup terkena badai hujan.',
          probe: {
            text: '"Dulu sebelum kios ini ramai, ada penjaga malam halte bernama Arman yang sering diusir warga karena suka mengintip orang. Dimas pernah bertengkar dengannya."'
          }
        },
        serveCorrect: 'Syukurlah kamu selamat, Nak. Besok malam adalah malam kelima—malam terakhir sebelum polisi mengganti jadwal patroli. Bertahanlah.',
        serveWrong: 'Bukan rasa ini ya Nak, nggak apa-apa. Mbah mengerti pikiranmu sedang tegang.',
        refuseResponse: 'Lho, Mbah sendiri ikut ditolak, Nak? Ya sudah, Mbah pulang dulu...'
      },
      {
        id: 'n4_mimic_sari',
        name: '“Sari” (?)',
        label: 'Sosok di Balik Kaca Berembun',
        threatLevel: 'danger',
        knockStyle: 'slow',
        order: ['vanilla'],
        orderText: '1× Vanila Klasik',
        appearance: {
          skin: '#d6d4d0',
          coat: '#34373a',
          shirt: '#17191b',
          hair: '#111112',
          hairStyle: 'long',
          hat: 'hood',
          wet: false,
          stains: 'none',
          glasses: false,
          mask: false,
          gaze: 'player',
          blinkRate: 'none',
          expression: 'hollow',
          heightScale: 1.04,
          collarHigh: true
        },
        greeting: [
          'Mas... ini aku, Sari. Aku mau Vanila... buka jendelanya sekarang.',
          'Kenapa diam saja? Cepat buka... di luar... sangat... hangat.'
        ],
        observations: {
          face: 'Suaranya terdengar datar dan aneh—posturnya terlalu tinggi untuk Sari, tidak memakai kacamata, dan senyumnya terbelah kaku tanpa kedipan.',
          clothes: 'Tudung gelap menutupi rambut palsu atau bayangan kepala, pakaiannya sama sekali tidak basah oleh badai, dan tidak membawa map kertas.',
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
        orderText: '1× Matcha + 1× Mint',
        appearance: {
          skin: '#ceb7a5',
          coat: '#2b4048',
          shirt: '#d2dede',
          hair: '#1f1a1a',
          hairStyle: 'bun',
          hat: 'none',
          wet: true,
          stains: 'none',
          glasses: false,
          mask: true,
          prop: 'badge',
          gaze: 'normal',
          blinkRate: 'normal',
          expression: 'serious',
          heightScale: 0.95,
          collarHigh: false
        },
        greeting: [
          'Malam, Raka. Masih kuat jaga sampai pagi? Minta Matcha sama Mint ya.',
          'Saya baru melihat mobil patroli polisi berhenti di perempatan tadi. Semoga besok malam sudah aman.'
        ],
        observations: {
          face: 'Mata Tika yang familier, lelah tapi ramah, berkedip normal saat menyorotkan lampu.',
          clothes: 'Jas hujan basah oleh badai, lanyard resmi RS Harapan Melati jelas terbaca.',
          probe: {
            text: '"Bripka Danu tadi sempat mampir ke IGD. Katanya besok malam ia akan menelepon langsung ke kios ini."'
          }
        },
        serveCorrect: 'Makasih, Raka. Jangan lupa angkat telepon besok malam kalau polisi menghubungi!',
        serveWrong: 'Salah satu rasanya keliru ya, tapi tidak apa-apa. Istirahat yang cukup besok siang.',
        refuseResponse: 'Raka, ini benar-benar saya Tika... aduh, hujan deras begini padahal.'
      }
    ],

    // =========================================================================
    // NIGHT 5 — Jam Tiga Pagi (Climax + Good/Bad/Secret Ending Decision!)
    // =========================================================================
    5: [
      {
        id: 'n5_darma',
        name: 'Pak Darma',
        label: 'Mekanik Bengkel Malam',
        threatLevel: 'safe',
        knockStyle: 'normal',
        order: ['chocolate', 'strawberry'],
        orderText: '1× Cokelat + 1× Stroberi',
        appearance: {
          skin: '#b89476',
          coat: '#2f3d44',
          shirt: '#1d2428',
          hair: '#22201f',
          hat: 'cap',
          wet: true,
          stains: 'oil',
          glasses: false,
          mask: false,
          gaze: 'normal',
          blinkRate: 'normal',
          expression: 'worried',
          heightScale: 1.02,
          collarHigh: false
        },
        greeting: [
          'Raka! Kabut malam ini gila tebalnya. Saya pesan Cokelat sama Stroberi sebelum saya tutup bengkel lebih cepat.',
          'Polisi sudah siaga di ujung jalan. Pastikan teleponmu aktif terus malam ini ya!'
        ],
        observations: {
          face: 'Pak Darma asli—raut wajah jujur, berkedip normal, napas berembun di udara dingin.',
          clothes: 'Jaket lembap berkabut dan bercak oli bengkel yang khas.',
          probe: {
            text: '"Malam terakhir, Nak! Kalau dia datang pukul tiga, jangan pernah buka jendelanya!"'
          }
        },
        serveCorrect: 'Semoga berhasil sampai pagi, Raka! Saya doakan kamu aman!',
        serveWrong: 'Wah keliru sedikit, tapi santai saja, fokus sama keselamatanmu malam ini!',
        refuseResponse: 'Lho Raka, ini Pak Darma! Duh, memang tegang banget ya malam terakhir ini...'
      },
      {
        id: 'n5_fake_courier',
        name: '“Kurir Pengantar”',
        label: 'Pengantar Paket Tengah Malam',
        threatLevel: 'danger',
        knockStyle: 'frantic',
        order: ['mint'],
        orderText: '1× Mint (Minta Tanda Tangan)',
        weirdOrderLabel: 'Paket Tanpa Alamat (Minta Buka Kaca)',
        appearance: {
          skin: '#c7c2ba',
          coat: '#3b332d',
          shirt: '#191919',
          hair: '#171717',
          hat: 'cap',
          wet: false,
          stains: 'dark',
          glasses: false,
          mask: true,
          gaze: 'latch',
          blinkRate: 'none',
          expression: 'hollow',
          heightScale: 1.06,
          collarHigh: true
        },
        greeting: [
          'Paket kilat untuk Kios Sora Dingin! Baru turun dari bus malam, tolong segera buka jendela untuk tanda tangan dan sekalian satu Mint!',
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
        orderText: '1× Vanila + 1× Matcha',
        appearance: {
          skin: '#d8cec4',
          coat: '#495054',
          shirt: '#2a2e33',
          hair: '#171618',
          hairStyle: 'long',
          hat: 'none',
          wet: true,
          stains: 'none',
          glasses: true,
          mask: false,
          prop: 'papers',
          gaze: 'normal',
          blinkRate: 'normal',
          expression: 'tired_smile',
          heightScale: 0.93,
          collarHigh: false
        },
        greeting: [
          'Hai Mas Raka! Skripsiku akhirnya disetujui pembimbing! Aku naik mobil bareng temanku tadi, mampir sebentar beli Vanila sama Matcha buat perayaan.',
          'Temanku nunggu di mobil ujung sana. Kamu hati-hati ya malam ini, kabutnya seram banget.'
        ],
        observations: {
          face: 'Sari asli—memakai kacamata tebal, berkedip normal, tersenyum lega tulus untuk pertama kalinya.',
          clothes: 'Rambut lembap oleh kabut gerimis, memeluk map skripsi yang kini terjilid rapi.',
          probe: {
            text: '"Iya Mas, beneran aku! Makasih ya sudah sering nemenin malam-malam kemarin. Semoga shift malam ini lancar sampai pagi!"'
          }
        },
        serveCorrect: 'Makasih banyak Mas Raka! Kunci jendelanya rapat-rapat ya habis ini!',
        serveWrong: 'Eh rasanya ketukar satu ya, tapi nggak apa-apa, lagi senang soalnya! Hati-hati ya!',
        refuseResponse: 'Oh... oke Mas, aku ngerti kamu lagi waspada banget malam ini. Hati-hati ya!'
      },
      {
        id: 'n5_arman_climax',
        name: 'Arman — Tamu Jam Tiga',
        label: 'Di Depan Kaca Pukul 03:00',
        threatLevel: 'climax',
        knockStyle: 'slow',
        order: [],
        orderText: '—',
        weirdOrderLabel: 'KONFRONTASI AKHIR (03:00)',
        appearance: {
          skin: '#cbc6be',
          coat: '#22262b',
          shirt: '#101214',
          hair: '#141414',
          hat: 'fedora',
          wet: false,
          stains: 'dark',
          glasses: false,
          mask: false,
          prop: 'scratched_badge',
          gaze: 'player',
          blinkRate: 'none',
          expression: 'cold_smile',
          heightScale: 1.09,
          collarHigh: true
        },
        greeting: [
          'Tepat pukul 03:00, Raka. Tidak ada lagi pelanggan lain. Tidak ada lagi penyamaran.',
          'Aku sudah menontonmu selama lima malam dari bawah tiang lampu itu. Dimas mengira kaca tipis ini bisa melindunginya. Apa menurutmu kamu lebih pintar darinya? Buka jendela ini... atau akhiri malammu sekarang.'
        ],
        observations: {
          face: 'Wajahnya dingin dan tenang. Mata gelap tanpa kedipan menatap lurus ke matamu. Di tangan kanannya, ia memutar pelan kunci loker kecil berkarat bertuliskan "DIMAS".',
          clothes: 'Mantel kelabu panjang yang kering sempurna. Di balik kerah mantelnya terlihat kartu pengenal tua bertuliskan ARMAN — PENJAGA HALTE MELATI.',
          probe: {
            text: 'Saat kamu menyorotkan lampu teras penuh ke wajahnya, ia menyeringai. "Kamu sudah mengumpulkan catatan tentangku? Coba saja sebut namaku... lihat apa kamu sempat memanggil siapa pun."'
          }
        },
        dangerMessage: 'Jendela terbuka pada pukul 03:00. Tidak ada jalan mundur.',
        serveCorrect: '',
        serveWrong: '',
        refuseResponse: 'Kamu tetap mengunci jendela rapat-rapat hingga pukul 05:00. Arman menatapmu dalam diam selama berpuluh detik yang terasa abadi... lalu mundur perlahan dan lenyap ditelan kabut tebal.'
      }
    ]
  };

  NS.Customers = {
    FLAVORS,
    FLAVOR_LIST: ['vanilla', 'chocolate', 'strawberry', 'matcha', 'mint'],
    calcOrderPrice,
    getScheduleForNight(night) {
      return NIGHT_SCHEDULES[night] || NIGHT_SCHEDULES[1];
    }
  };
})(window);
