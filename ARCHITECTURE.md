# Tanya Muslim Solo — Arsitektur Proyek

Platform tanya jawab Islami yang ringan, cepat, dan mobile-first untuk digunakan
saat kajian berlangsung. Mengutamakan pengiriman pertanyaan secepat mungkin
(meniru pengalaman Slido / Mentimeter Q&A / Google Form).

## 1. Filosofi Arsitektur

| Prinsip | Implementasi |
|---|---|
| **Semurah mungkin** | 100% gratis: GitHub Pages (hosting statis) + Google Apps Script (backend) + Google Spreadsheet (database) |
| **Sesederhana mungkin** | Tanpa build step, tanpa framework berat, tanpa server. Cukup HTML + CDN |
| **Cepat dibuka** | Halaman utama langsung menampilkan form pertanyaan (tanpa landing page) |
| **Mobile-first** | TailwindCSS dengan pendekatan mobile-first, nyaman dipakai dari HP |

## 2. Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│  CLIENT (Browser / HP Jamaah)                            │
│  ─────────────────────────────────────────────────────  │
│  HTML5 + TailwindCSS (CDN) + AlpineJS (CDN) + Vanilla JS │
│  Di-host di GitHub Pages (statis, gratis)                │
└───────────────────────────┬─────────────────────────────┘
                            │  fetch() JSON  (CORS)
                            ▼
┌─────────────────────────────────────────────────────────┐
│  BACKEND (Google Apps Script Web App)                    │
│  ─────────────────────────────────────────────────────  │
│  doGet(e) / doPost(e)  →  Router  →  Controller          │
│  ID generator, slug, sanitasi, validasi, auth            │
└───────────────────────────┬─────────────────────────────┘
                            │  SpreadsheetApp
                            ▼
┌─────────────────────────────────────────────────────────┐
│  DATABASE (Google Spreadsheet)                           │
│  Sheets: Questions | Users | Categories | Sessions       │
└─────────────────────────────────────────────────────────┘
```

## 3. Struktur Folder

```
/
├── index.html              # Halaman utama: form tanya + jawaban terbaru + search
├── arsip.html              # Arsip semua jawaban terpublikasi (filter, sort, pagination)
├── q.html                  # Detail jawaban (?slug=...) + pertanyaan terkait
├── ustadz.html             # Profil ustadz + daftar jawabannya (?email=...)
├── qr.html                 # Halaman QR Code untuk dipindai jamaah saat kajian
├── 404.html                # Halaman not found
│
├── admin/
│   ├── login.html          # Login admin & ustadz (cek ke sheet Users)
│   ├── dashboard.html      # Statistik + ringkasan (role-aware)
│   ├── questions.html      # Kelola pertanyaan (search, filter, assign, hapus, publish)
│   ├── answer.html         # Tulis/edit jawaban (?id=...)
│   ├── users.html          # Kelola user (admin only)
│   └── categories.html     # Kelola kategori (admin only)
│
├── assets/
│   ├── css/
│   │   └── app.css         # Override Tailwind, komponen, dark mode, skeleton
│   ├── js/
│   │   ├── config.js       # Konfigurasi global (URL API, kategori, konstanta)
│   │   ├── api.js          # Client API: wrapper fetch ke Apps Script
│   │   ├── ui.js           # Utilitas UI: toast, skeleton, format, sanitasi
│   │   ├── store.js        # State Alpine global (dark mode, session admin)
│   │   └── pages/          # Logika spesifik per halaman
│   │       ├── home.js
│   │       ├── arsip.js
│   │       ├── detail.js
│   │       ├── ustadz.js
│   │       └── admin/      # Logika halaman admin
│   ├── images/
│   ├── icons/
│   └── fonts/
│
└── apps-script/
    ├── Code.gs             # Entry point doGet/doPost + router
    ├── Router.gs           # Pemetaan endpoint → handler
    ├── Questions.gs        # Logika CRUD pertanyaan
    ├── Users.gs            # Auth & manajemen user
    ├── Categories.gs       # Manajemen kategori
    ├── Sessions.gs         # Mode kajian (sesi)
    ├── Helpers.gs          # ID, slug, sanitasi, response, sheet utils
    └── Config.gs           # Konstanta backend (nama sheet, header, dsb)
```

## 4. Alur Data Utama

### A. Jamaah mengirim pertanyaan
```
index.html (form)
  → api.submitQuestion(payload)
  → POST Apps Script /submitQuestion
  → validasi + sanitasi + generate ID (Q0001) + slug + timestamp
  → append ke sheet Questions (status=Pending)
  → respons { ok:true, data:{ id } }
  → toast sukses
```

### B. Ustadz menjawab → Admin publish
```
Pending → (admin assign ustadz) → Assigned
        → (ustadz tulis jawaban)  → Answered
        → (admin publish)         → Published  → muncul di publik
```

### C. Jamaah membaca arsip
```
arsip.html → GET /questions?status=Published&page=...
q.html?slug=... → GET /question?slug=... (+ increment views)
```

## 5. Status Pertanyaan

`Pending` → `Assigned` → `Answered` → `Published`
(Admin juga bisa `Unpublish`: Published → Answered)

## 6. Kontrak Response JSON (konsisten)

Semua endpoint mengembalikan bentuk yang sama:

```json
{
  "ok": true,
  "data": { },
  "message": "OK",
  "meta": { "page": 1, "total": 120 }
}
```

Jika gagal:

```json
{
  "ok": false,
  "data": null,
  "message": "Pesan error yang dapat dibaca",
  "code": "VALIDATION_ERROR"
}
```

## 7. Endpoint API (Apps Script)

| Method | Action | Deskripsi |
|---|---|---|
| GET  | `questions`        | List terpublikasi (search, filter, sort, pagination) |
| GET  | `latestQuestions`  | 10 jawaban terbaru |
| GET  | `question`         | Detail by `id` atau `slug` |
| GET  | `categories`       | Daftar kategori |
| GET  | `stats`            | Statistik dashboard |
| GET  | `ustadz`           | Profil + jawaban ustadz |
| GET  | `sessions`         | Daftar sesi kajian |
| POST | `submitQuestion`   | Jamaah kirim pertanyaan |
| POST | `login`            | Auth admin/ustadz |
| POST | `saveAnswer`       | Simpan draft/jawaban |
| POST | `assignUstadz`     | Assign ustadz ke pertanyaan |
| POST | `publishQuestion`  | Publikasikan |
| POST | `unpublishQuestion`| Batalkan publikasi |
| POST | `adminQuestions`   | List semua (admin, butuh token) |
| POST | `saveUser`/`saveCategory`/`saveSession` | Manajemen master data |

## 8. Keamanan (sesederhana mungkin, tetap aman secukupnya)

- Endpoint publik (GET) hanya menampilkan data berstatus `Published`.
- Endpoint admin/ustadz memerlukan **token sesi** sederhana yang dibuat saat login
  (disimpan di `sessionStorage`, dikirim di body POST).
- Sanitasi HTML di sisi backend untuk mencegah XSS pada konten.
- Validasi panjang field di frontend dan backend (defense in depth).

## 9. Konfigurasi yang harus diisi sebelum deploy

Di `assets/js/config.js` → isi `API_BASE_URL` dengan URL Web App Apps Script.
Di `apps-script/Config.gs` → isi `SPREADSHEET_ID` dengan ID Spreadsheet.
