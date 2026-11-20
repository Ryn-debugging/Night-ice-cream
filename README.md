# NIGHT SHIFT: ICE CREAM

**NIGHT SHIFT: ICE CREAM** adalah game horror psikologis 2D berbasis browser (HTML5, CSS3, Vanilla JavaScript, HTML5 Canvas, dan Web Audio API).

Kamu berperan sebagai **Raka**, penjaga shift malam (`23:00 – 05:00`) di **Kios Es Krim Sora Dingin**, Jalan Melati Lama. Layani pelanggan yang datang melalui jendela pelayanan, amati detail wajah, pakaian, dan dialog mereka, catat setiap petunjuk tersembunyi, dan pastikan kamu tidak pernah membukakan kaca untuk ancaman yang menyamar.

---

## Fitur Utama

- **5 Malam dengan Eskalasi Cerita (`Malam 1 – Malam 5`)**: Dari shift tutorial hingga klimaks konfrontasi pukul `03:00` di Malam 5.
- **Sistem Jendela Pelayanan (`F-02`)**: Buka, tutup, tolak pelayanan, amati dari balik kaca buram, hingga mekanik darurat *banting tutup jendela* saat penyusup mencoba menerjang masuk.
- **Sistem Pesanan Es Krim (`F-03`)**: 5 varian rasa (Vanila Klasik, Cokelat Pekat, Stroberi Malam, Matcha Pahit, Mint Dingin) dengan pesanan tunggal dan kombinasi, slip pesanan diegetik, dan penghitungan kas otomatis.
- **Sistem Kecurigaan & Red Herring (`F-04`)**: Pelanggan biasa bisa tampak mencurigakan (noda oli mekanik, wajah pucat mahasiswi begadang, masker perawat), sementara ancaman bersembunyi di balik detail halus (pakaian kering di tengah hujan, kontradiksi jadwal bus, tatapan tanpa berkedip, dan pengetahuan tentang isi kios).
- **6 Kejadian Horror Atmosferis (`F-05`)**: Ketukan hantu, lampu neon berkedip / padam sejenak, bayangan di bawah tiang lampu, langkah kaki stereo mengitari kios, cap telapak tangan dingin di kaca berembun, penampakan sekilas saat lampu berkedip, serta panggilan telepon anonim.
- **3 Ending Berbeda (`F-07`)**:
  - **Good Ending (*Fajar di Jalan Melati*)** — Bertahan hingga pagi pada Malam 5.
  - **Bad Ending (*Kios Kosong / Dipecat*)** — Keputusan fatal di jendela atau menolak terlalu banyak pelanggan sah.
  - **Secret Ending (*Topeng Terbuka*)** — Kumpulkan minimal 5 petunjuk kritis dan ungkap identitas pelaku kepada polisi tepat pukul `03:00` di Malam 5.
- **Simpan Progres Otomatis (`F-08`)**: Menggunakan `localStorage` dengan pemulihan otomatis apabila data simpan hilang atau rusak.
- **100% Offline & Zero Backend**: Berjalan langsung dengan membuka `index.html` di browser desktop modern tanpa perlu server atau koneksi internet.

---

## Cara Menjalankan

### 1. Versi Android (APK)
- File APK siap pasang tersedia di [`dist/NightShiftIceCream-v1.0.apk`](dist/NightShiftIceCream-v1.0.apk).
- Salin file `.apk` ke HP Android (Android 7.0 / API 24 ke atas), ketuk file untuk memasang, lalu aktifkan izin **Install dari sumber tidak dikenal / Unknown Sources** jika diminta.
- **Fitur Native Android:**
  - Layar penuh lanskap (*immersive sticky fullscreen*), mendukung layar *notch/punch-hole*.
  - 100% offline tanpa izin berbahaya (*zero permissions*), progres tersimpan otomatis (`localStorage`).
  - Layout sentuh khusus layar ponsel lanskap + tombol **Back** native untuk jeda/keluar.
  - Audio otomatis jeda saat aplikasi berpindah ke latar belakang.
- **Build Ulang APK:** Jalankan `./scripts/build-apk.sh` (memerlukan JDK 17 + Android SDK Build Tools 34) atau buka folder `android/` di Android Studio.

### 2. Langsung di Browser Desktop (Tanpa Server)
Buka file `index.html` langsung di browser desktop modern (Chrome, Edge, Firefox, atau Safari).

### 3. Melalui Local HTTP Server (Opsional)
```bash
python3 -m http.server 8000
```
Lalu buka `http://localhost:8000`.

---

## Kontrol

| Aksi | Mouse | Keyboard |
| :--- | :--- | :--- |
| Buka / tutup jendela (termasuk banting tutup darurat) | Klik tombol / klik langsung kaca jendela | `E` |
| Amati pelanggan (Wajah, Pakaian, Tanya/Uji Lampu) | Klik tombol **Amati** | `Q` |
| Tolak pelayanan | Klik tombol **Tolak** | `R` |
| Angkat telepon merah | Klik tombol / klik telepon di meja | `T` |
| Nyalakan/matikan lampu teras & reset neon | Klik tombol / klik saklar di dinding | `F` |
| Pilih rasa es krim (saat jendela terbuka) | Klik varian di Freezer | `1` – `5` |
| Serahkan pesanan es krim | Klik **Serahkan** | `Enter` |
| Buka buku catatan petunjuk | Klik **Petunjuk** di bar atas | `J` |
| Lanjutkan / percepat dialog | Klik kotak dialog | `Space` |
| Jeda permainan / tutup panel | Klik **Jeda** | `Esc` |

---

## Struktur Proyek

```text
Night-ice-cream/
├── index.html          # Struktur utama & seluruh alur layar
├── css/
│   └── style.css       # Gaya noir horror 2D & HUD diegetik responsif
├── js/
│   ├── save.js         # Penyimpanan localStorage & pemulihan data rusak
│   ├── audio.js        # Mesin Web Audio API prosedural (100% offline)
│   ├── dialogue.js     # Narasi, intro, telepon, petunjuk, dan 3 ending
│   ├── customers.js    # Katalog es krim & 5 malam pelanggan + red herring
│   ├── events.js       # Mesin kejadian acak horror dengan pembatas frekuensi
│   ├── renderer.js     # Renderer Canvas 2D (hujan, kios, kaca, karakter)
│   ├── game.js         # State machine utama permainan
│   └── main.js         # Bootstrap DOM, hit-testing Canvas, & shortcut keyboard
├── docs/
│   └── narrative.md    # Dokumen desain narasi & jaringan petunjuk terpisah
└── assets/
    ├── images/
    │   └── favicon.svg
    ├── audio/
    └── fonts/
```
