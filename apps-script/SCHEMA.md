# Skema Google Spreadsheet — Tanya Muslim Solo

Database memakai satu Spreadsheet dengan 4 sheet (tab). Baris pertama setiap
sheet adalah **header** (nama kolom) — urutan kolom HARUS sama persis dengan
daftar di bawah karena backend mengaksesnya berdasarkan nama header.

> Anda tidak perlu membuat sheet manual. Jalankan fungsi `setupSpreadsheet()`
> di `Setup.gs` (Tahap 4) untuk membuat semua sheet, header, dan data awal
> secara otomatis. Dokumen ini adalah referensi struktur.

---

## 1. Sheet: `Questions`

Menyimpan seluruh pertanyaan jamaah beserta jawaban & metadata moderasi.

| Kolom | Tipe | Contoh | Keterangan |
|---|---|---|---|
| `id` | string | `Q0001` | ID unik, auto-generate berurutan |
| `created_at` | ISO datetime | `2026-06-10T08:15:00.000Z` | Waktu pertanyaan masuk |
| `updated_at` | ISO datetime | `2026-06-10T09:00:00.000Z` | Waktu terakhir diubah |
| `published_at` | ISO datetime | `2026-06-10T10:00:00.000Z` | Waktu publikasi (kosong bila belum) |
| `title` | string | `Hukum Isbal bagi Laki-laki` | Judul pertanyaan (10–150 karakter) |
| `question` | text | `Apakah isbal ...` | Isi pertanyaan (20–2000 karakter) |
| `answer` | text | `Isbal hukumnya ...` | Jawaban ustadz (kosong bila belum dijawab) |
| `category` | string | `Fiqih` | Salah satu dari sheet Categories |
| `slug` | string | `hukum-isbal-bagi-laki-laki` | Auto-generate dari judul, unik |
| `status` | enum | `Published` | `Pending` / `Assigned` / `Answered` / `Published` |
| `ustadz_email` | string | `farhan@tms.id` | Email ustadz yang ditugaskan |
| `ustadz_name` | string | `Ustadz Farhan Abu Furaihan` | Nama ustadz (disalin saat assign) |
| `author_name` | string | `Abdullah` | Nama penanya (kosong bila anonim) |
| `author_city` | string | `Solo` | Kota penanya (opsional) |
| `anonymous` | boolean | `TRUE` | `TRUE`/`FALSE` |
| `views` | number | `42` | Jumlah dibaca |
| `session_id` | string | `S0001` | Sesi kajian terkait (opsional) |

**Alur status:** `Pending → Assigned → Answered → Published`
(unpublish mengembalikan `Published → Answered`).

---

## 2. Sheet: `Users`

Akun admin & ustadz untuk login dashboard.

| Kolom | Tipe | Contoh | Keterangan |
|---|---|---|---|
| `email` | string | `admin@tms.id` | Sekaligus username login (unik) |
| `name` | string | `Admin Utama` | Nama tampilan |
| `role` | enum | `admin` | `admin` atau `ustadz` |
| `password` | string | `rahasia123` | Kata sandi (lihat catatan keamanan) |
| `active` | boolean | `TRUE` | `FALSE` untuk menonaktifkan akun |

> **Catatan keamanan:** Karena keterbatasan arsitektur tanpa server, password
> disimpan di Spreadsheet yang hanya bisa diakses pemilik. Untuk keamanan lebih,
> Tahap 4 menyediakan opsi menyimpan **hash** password, bukan teks polos.
> Login dilakukan via username (bagian sebelum `@` boleh dipakai) atau email.

---

## 3. Sheet: `Categories`

Master kategori pertanyaan.

| Kolom | Tipe | Contoh | Keterangan |
|---|---|---|---|
| `id` | string | `C01` | ID unik kategori |
| `name` | string | `Fiqih` | Nama kategori (tampil di UI) |

Kategori awal: Aqidah, Fiqih, Akhlak, Muamalah, Manhaj, Ibadah, Keluarga, Dakwah, Lainnya.

---

## 4. Sheet: `Sessions` (Mode Kajian)

Sesi kajian; pertanyaan dapat dikaitkan ke sesi tertentu.

| Kolom | Tipe | Contoh | Keterangan |
|---|---|---|---|
| `id` | string | `S0001` | ID unik sesi, auto-generate |
| `title` | string | `Syarah Ushul Tsalatsah` | Judul kajian |
| `ustadz_name` | string | `Ustadz Farhan Abu Furaihan` | Pengisi kajian |
| `date` | date | `2026-06-10` | Tanggal kajian |
| `location` | string | `Masjid Al-Hikmah, Solo` | Lokasi (opsional) |
| `active` | boolean | `TRUE` | Sesi yang sedang berlangsung |
| `created_at` | ISO datetime | `2026-06-10T07:00:00.000Z` | Waktu dibuat |

---

## Ringkasan ID & Penamaan

| Entitas | Format ID | Generator |
|---|---|---|
| Pertanyaan | `Q0001`, `Q0002`, … | otomatis (nomor terbesar + 1) |
| Sesi | `S0001`, `S0002`, … | otomatis |
| Kategori | `C01`, `C02`, … | otomatis |
| Slug | `hukum-isbal` | dari judul: lowercase, strip simbol, ganti spasi → `-`, unik |

## Catatan Tipe Data di Sheet
- Boolean disimpan sebagai teks `TRUE`/`FALSE` (mudah dibaca & ditulis Apps Script).
- Datetime disimpan sebagai string ISO 8601 (UTC) agar konsisten lintas zona waktu.
- Sel kosong dianggap nilai kosong (`''`).
