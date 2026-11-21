# NIGHT SHIFT: ICE CREAM (v2.0.0 — 10 Malam)

**NIGHT SHIFT: ICE CREAM v2.0.0** adalah game horror psikologis 2D berbasis browser & Android APK dengan kampanye lengkap **10 malam**, sistem **Ketenangan (Sanity)**, **CCTV Halte**, **Kunci Ganda**, **Menu Topping**, dan **Toko Peningkatan Keamanan Kios**.

Kamu berperan sebagai **Raka**, penjaga kontrak sepuluh malam (`23:00 – 05:00`) di **Kios Es Krim Sora Dingin**, Jalan Melati Lama. Amati pelanggan di balik kaca, cek rekaman CCTV Halte, jaga kewarasanmu di tengah badai, dan ungkap misteri hilangnya penjaga sebelumnya—**Dimas**.

---

## Pembaruan Utama di v2.0.0

- **10 Malam Penuh (2 Babak & 48 Pertemuan):**
  - *Babak I (Malam 1–5):* Pengenalan pelanggan tetap, jadwal bus `23:30`, catatan Dimas, kartu nama **ARMAN**, hingga **Klimaks Pertengahan Malam 5** pukul `03:00`.
  - *Babak II (Malam 6–10):* Seragam kerja Dimas yang dicuri, peniru pelanggan tetap, badai petir & mati lampu total, rekaman suara Dimas, ruang genset halte tua, hingga **Klimaks Malam ke-10 pukul `03:00`**.
- **Sistem Ketenangan (`100%`) & Kopi Hangat (`[C]`):** Anomali horror dan kegelapan menggerus mentalmu; jaga ketenangan dengan melayani pelanggan sah secara tepat atau meneguk **Kopi Hangat (`+32%`)**.
- **CCTV Halte (`[V]`):** Pantau mode *night-vision* `CAM-01 HALTE MELATI` untuk mengecek arah kedatangan setiap pelanggan (jalan utama / taksi vs lorong gelap belakang halte).
- **Kunci Ganda (`[L]`):** Kunci baja pengaman anti-congkel untuk mencegah kesalahan membuka kaca dan menahan serangan **Grendel Diguncang** pada Malam 6–10.
- **5 Rasa + 3 Topping Es Krim:** Mulai Malam 3, layani kombinasi **Choco Chips (`6`)**, **Saus Karamel (`7`)**, dan **Ceri Merah (`8`)** yang tampil langsung di gelas konter.
- **Toko Peningkatan Keamanan Kios:** Belanjakan uang kas di layar Ringkasan Shift untuk memasang *Lampu Teras Halogen*, *Kaca Anti-Pecah & Rel Baja*, *Stabilizer Listrik Neon*, dan *Termos Kopi Barista*.
- **14 Petunjuk & 5 Variasi Ending:** Good Ending (*Fajar di Jalan Melati*), Secret Ending (*Topeng Terbuka — butuh minimal 9 petunjuk di Malam 10*), serta Bad Ending (*Kios Kosong*, *Dipecat*, dan *Pingsan di Balik Konter*).

---

## Cara Menjalankan

### 1. Versi Android (APK v2.0.0)
- File APK siap pasang tersedia di [`dist/NightShiftIceCream-v2.0.0.apk`](dist/NightShiftIceCream-v2.0.0.apk).
- Salin ke HP Android (Android 7.0 / API 24 ke atas), ketuk file untuk memasang, dan izinkan **Install dari sumber tidak dikenal / Unknown Sources** jika diminta.
- **Build Ulang APK:** Jalankan `./scripts/build-apk.sh` (JDK 17 + Android SDK Build Tools 34) atau buka folder `android/` di Android Studio.

### 2. Langsung di Browser Desktop (Tanpa Server)
Buka file `index.html` langsung di browser desktop modern (Chrome, Edge, Firefox, atau Safari).

### 3. Melalui Local HTTP Server (Opsional)
```bash
python3 -m http.server 8000
```
Lalu buka `http://localhost:8000`.

---

## Kontrol

| Aksi | Mouse / Sentuh | Keyboard |
| :--- | :--- | :--- |
| Buka / tutup jendela (banting tutup darurat) | Klik tombol / kaca jendela | `E` |
| Aktifkan / lepas Kunci Ganda anti-congkel | Klik **Kunci** | `L` |
| Pantau CCTV Halte (*night vision*) | Klik **CCTV** | `V` |
| Minum Kopi Hangat (`+32%` Ketenangan) | Klik **Kopi Hangat** | `C` |
| Amati pelanggan (Wajah, Pakaian, Tanya/Lampu) | Klik **Amati** | `Q` |
| Tolak pelayanan | Klik **Tolak** | `R` |
| Angkat telepon merah / Lampu & reset neon | Klik tombol / objek kios | `T` / `F` |
| Pilih 5 rasa es krim & 3 topping | Klik di Freezer | `1`–`5` / `6`–`8` |
| Serahkan pesanan / Catatan Petunjuk | Klik **Serahkan** / **Petunjuk** | `Enter` / `J` |
| Lanjutkan dialog / Jeda | Klik dialog / **Jeda** | `Space` / `Esc` |
