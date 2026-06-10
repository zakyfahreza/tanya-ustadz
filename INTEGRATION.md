# Integrasi Frontend ↔ Backend

Dokumen ini memastikan seluruh sistem terhubung dengan benar dan menyediakan
checklist uji end-to-end sebelum go-live.

## 1. Peta Endpoint (frontend ↔ backend)

Setiap pemanggilan di `assets/js/api.js` sudah dipetakan ke action di
`apps-script/Router.gs`:

| Frontend (`API.*`) | Action | Method | Modul backend |
|---|---|---|---|
| `latestQuestions()` | `latestQuestions` | GET | Questions.gs |
| `questions(params)` | `questions` | GET | Questions.gs |
| `questionBySlug/ById` | `question` | GET | Questions.gs |
| `categories()` | `categories` | GET | Categories.gs |
| `sessions()` | `sessions` | GET | Sessions.gs |
| `ustadz(email)` | `ustadz` | GET | Users.gs |
| `stats()` | `stats` | GET | Sessions.gs |
| `submitQuestion()` | `submitQuestion` | POST | Questions.gs |
| `login()` | `login` | POST | Users.gs |
| `adminQuestions()` | `adminQuestions` | POST🔒 | Questions.gs |
| `saveAnswer()` | `saveAnswer` | POST🔒 | Questions.gs |
| `assignUstadz()` | `assignUstadz` | POST🔒admin | Questions.gs |
| `publishQuestion()` | `publishQuestion` | POST🔒admin | Questions.gs |
| `unpublishQuestion()` | `unpublishQuestion` | POST🔒admin | Questions.gs |
| `deleteQuestion()` | `deleteQuestion` | POST🔒admin | Questions.gs |
| `listUsers()` | `listUsers` | POST🔒admin | Users.gs |
| `saveUser()` / `deleteUser()` | idem | POST🔒admin | Users.gs |
| `saveCategory()` / `deleteCategory()` | idem | POST🔒admin | Categories.gs |
| `saveSession()` / `deleteSession()` | idem | POST🔒admin | Sessions.gs |

🔒 = butuh token sesi · admin = khusus admin

## 2. Konfigurasi Wajib Sebelum Live

1. **`apps-script/Config.gs`** → ganti `SECRET_SALT` dengan string acak Anda.
2. Deploy Web App (lihat `apps-script/DEPLOY.md`), salin URL `/exec`.
3. **`assets/js/config.js`** → tempel URL ke `API_BASE_URL`.
   - Jika belum diisi, frontend menampilkan pesan ramah
     ("Backend belum dikonfigurasi…") alih-alih error mentah.
4. **`assets/js/config.js`** → sesuaikan `PUBLIC_URL` dengan domain Anda
   (dipakai QR code, canonical, Open Graph).

## 3. ⚠️ Penting: Path & GitHub Pages

Semua aset dirujuk dengan **path absolut** (`/assets/...`, `/q.html`).
Ini berfungsi bila situs berada di **root domain**:

- ✅ Custom domain: `https://tanya.muslimsolo.id/`
- ✅ User/Org page: `https://username.github.io/`
- ❌ Project page: `https://username.github.io/nama-repo/` (path absolut akan rusak)

**Rekomendasi:** gunakan custom domain (paling sesuai dengan proyek ini).
Caranya: buat file `CNAME` di root berisi domain Anda, lalu arahkan DNS
(`CNAME`/`A record`) ke GitHub Pages. Aktifkan HTTPS di Settings → Pages.

Bila terpaksa memakai project page, jalankan ganti path absolut → relatif
(hapus awalan `/` pada `src`/`href` aset & tautan antar halaman).

## 4. Routing q.html / arsip.html

URL detail memakai query string: `/q.html?slug=...` — kompatibel penuh dengan
hosting statis (tidak butuh server-side routing). 404 GitHub Pages otomatis
menyajikan `404.html`.

## 5. Checklist Uji End-to-End

Lakukan berurutan setelah konfigurasi:

### A. Koneksi
- [ ] Buka `<WEB_APP_URL>?action=ping` → `{ ok:true, message:"pong" }`.
- [ ] Buka `index.html` → section "Jawaban Terbaru" memuat contoh seed.

### B. Alur Jamaah
- [ ] Isi form (judul ≥10, pertanyaan ≥20) → submit → toast sukses.
- [ ] Coba judul <10 karакter → muncul pesan validasi (tidak terkirim).
- [ ] Cek sheet `Questions` → baris baru `status=Pending`, ID `Q000x`, slug terisi.
- [ ] Search & filter kategori di home bekerja realtime.
- [ ] Klik kartu → `q.html` menampilkan pertanyaan, jawaban, terkait; `views` bertambah.

### C. Alur Admin
- [ ] Login `admin@tms.id / admin123` → masuk dashboard, statistik tampil.
- [ ] Buka Pertanyaan → assign ustadz ke pertanyaan Pending → status jadi `Assigned`.
- [ ] Tambah kategori & sesi kajian → tampil di daftar.
- [ ] Tambah user ustadz baru → bisa login.

### D. Alur Ustadz
- [ ] Login sebagai ustadz → hanya melihat pertanyaan yang ditugaskan.
- [ ] Buka Jawab → tulis → Simpan Draft (status tetap) → Simpan Jawaban (→ `Answered`).
- [ ] Ustadz TIDAK melihat menu Kategori/Pengguna (role guard).

### E. Publikasi
- [ ] Sebagai admin, Publish pertanyaan `Answered` → `Published`, `published_at` terisi.
- [ ] Pertanyaan muncul di `index.html`, `arsip.html`, dan profil ustadz.
- [ ] Unpublish → hilang dari publik (kembali `Answered`).

### F. Keamanan
- [ ] Akses `admin/dashboard.html` tanpa login → redirect ke `login.html`.
- [ ] Logout → token terhapus, halaman admin tidak bisa diakses.
- [ ] Token kedaluwarsa (>TTL) → otomatis diminta login ulang.

### G. UX & Tampilan
- [ ] Dark mode toggle tersimpan antar halaman.
- [ ] Skeleton tampil saat memuat; empty state saat data kosong.
- [ ] Tampilan rapi di layar HP (uji lebar ~360px).
- [ ] Halaman 404 tampil untuk URL tak dikenal.

## 6. Troubleshooting

| Gejala | Kemungkinan sebab | Solusi |
|---|---|---|
| "Backend belum dikonfigurasi" | `API_BASE_URL` placeholder | Isi URL `/exec` |
| "Gagal terhubung ke server" | URL salah / belum deploy ulang | Cek URL, buat deployment versi baru |
| Aset/CSS tidak muncul | Situs di project page | Pakai custom domain atau ubah path relatif |
| Login gagal terus | Salt diubah setelah seed | Re-seed user atau samakan salt |
| Perubahan `.gs` tak berefek | Deployment lama | Manage deployments → New version |
