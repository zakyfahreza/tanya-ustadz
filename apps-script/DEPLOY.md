# Panduan Deploy Backend (Google Apps Script)

Ikuti langkah ini sekali saja untuk menyalakan backend & database.

## 1. Buat Spreadsheet
1. Buka [Google Sheets](https://sheets.google.com) → buat spreadsheet baru.
2. Beri nama, mis. **Tanya Muslim Solo DB**.

## 2. Buka Editor Apps Script (mode "bound")
1. Di spreadsheet: menu **Extensions → Apps Script**.
2. Hapus isi `Code.gs` bawaan.
3. Buat file `.gs` baru untuk tiap file di folder `apps-script/` dan tempel isinya:
   - `Config.gs`, `Helpers.gs`, `Code.gs`, `Router.gs`,
     `Questions.gs`, `Users.gs`, `Categories.gs`, `Sessions.gs`, `Setup.gs`
   > Karena skrip "bound" ke spreadsheet, biarkan `CONFIG.SPREADSHEET_ID = ''`.

## 3. Atur Keamanan
Di `Config.gs`, ganti `SECRET_SALT` dengan string acak panjang milik Anda:
```js
SECRET_SALT: 'k7$Apx9_random_panjang_unik_anda_2026',
```

## 4. Inisialisasi Database
1. Di editor, pilih fungsi **`setupSpreadsheet`** dari dropdown.
2. Klik **Run** ▶ dan beri izin akses saat diminta.
3. Cek spreadsheet: sheet `Questions`, `Users`, `Categories`, `Sessions`
   sudah terisi header + data awal.

> Akun awal: `admin@tms.id / admin123` dan `farhan@tms.id / ustadz123`.
> **Segera ganti password** lewat dashboard admin setelah live.

## 5. Deploy sebagai Web App
1. Klik **Deploy → New deployment**.
2. Pilih tipe **Web app**.
3. Konfigurasi:
   - **Execute as:** *Me* (akun Anda)
   - **Who has access:** *Anyone*  ← wajib agar GitHub Pages bisa akses
4. Klik **Deploy**, salin **Web app URL** (berakhiran `/exec`).

## 6. Hubungkan ke Frontend
Tempel URL tersebut di `assets/js/config.js`:
```js
API_BASE_URL: 'https://script.google.com/macros/s/AKfycb..../exec',
```

## 7. Uji Cepat
Buka di browser: `<WEB_APP_URL>?action=ping` → harus muncul:
```json
{ "ok": true, "data": { "time": "..." }, "message": "pong", "meta": null }
```
Lalu `?action=latestQuestions` → harus mengembalikan contoh pertanyaan.

## Catatan Penting
- **Setiap kali mengubah kode `.gs`**, buat **deployment baru** atau pilih
  *Manage deployments → Edit → Version: New version* agar perubahan aktif.
- CORS: tidak perlu konfigurasi tambahan. Frontend memakai GET dan POST
  `text/plain` (simple request) sehingga tidak memicu preflight `OPTIONS`.
- Kuota: Apps Script gratis cukup untuk skala kajian (ribuan request/hari).
