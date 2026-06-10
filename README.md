# Tanya Muslim Solo

Platform tanya jawab Islami yang ringan, cepat, dan mobile-first untuk dipakai
saat kajian berlangsung. Jamaah dapat langsung bertanya begitu membuka situs,
ustadz menjawab, admin memoderasi & mempublikasikan, dan jamaah membaca arsip.

## Tech Stack
- **Frontend:** HTML5 + TailwindCSS (CDN) + AlpineJS (CDN) + Vanilla JS
- **Hosting:** GitHub Pages (statis, gratis)
- **Backend:** Google Apps Script (Web App)
- **Database:** Google Spreadsheet

> Arsitektur lengkap ada di [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Cara Menjalankan (ringkas)
1. **Backend:** Buat Spreadsheet + deploy kode di `apps-script/` sebagai Web App
   (akses: "Anyone"). Salin URL `/exec`.
2. **Konfigurasi:** Tempel URL tersebut ke `assets/js/config.js` → `API_BASE_URL`.
3. **Frontend:** Aktifkan GitHub Pages dari branch `main` (root). Situs siap.

## Status Pengerjaan (bertahap)
- [x] Tahap 1 — Arsitektur proyek & struktur folder
- [x] Tahap 2 — Halaman frontend publik
- [x] Tahap 3 — Skema Google Spreadsheet
- [x] Tahap 4 — Google Apps Script API
- [x] Tahap 5 — Dashboard admin
- [x] Tahap 6 — Integrasi frontend & backend
- [x] Tahap 7 — Optimasi SEO & performa

## Dokumentasi
- `ARCHITECTURE.md` — arsitektur & struktur folder
- `apps-script/SCHEMA.md` — skema database spreadsheet
- `apps-script/DEPLOY.md` — langkah deploy backend
- `INTEGRATION.md` — peta endpoint, konfigurasi & uji end-to-end

## Struktur Folder
Lihat `ARCHITECTURE.md` bagian 3.
