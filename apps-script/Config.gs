/**
 * Config.gs
 * ------------------------------------------------------------------
 * Konstanta backend terpusat: ID spreadsheet, nama sheet, definisi
 * header (skema), pengaturan validasi, dan keamanan.
 *
 * SEBELUM DEPLOY:
 * - Isi SPREADSHEET_ID dengan ID Spreadsheet Anda, ATAU biarkan kosong
 *   bila skrip ini terikat (bound) langsung ke spreadsheet (Extensions
 *   → Apps Script dari dalam Spreadsheet).
 * ------------------------------------------------------------------
 */

var CONFIG = {
  // Kosongkan ('') bila skrip bound ke spreadsheet. Isi bila standalone.
  SPREADSHEET_ID: '',

  // Nama-nama sheet (tab)
  SHEETS: {
    QUESTIONS: 'Questions',
    USERS: 'Users',
    CATEGORIES: 'Categories',
    SESSIONS: 'Sessions',
  },

  // Header (urutan kolom) — JANGAN diubah urutannya tanpa update backend
  HEADERS: {
    QUESTIONS: [
      'id', 'created_at', 'updated_at', 'published_at',
      'title', 'question', 'answer', 'category', 'slug', 'status',
      'ustadz_email', 'ustadz_name', 'author_name', 'author_city',
      'anonymous', 'views', 'session_id',
    ],
    USERS: ['email', 'name', 'role', 'password', 'active'],
    CATEGORIES: ['id', 'name'],
    SESSIONS: ['id', 'title', 'ustadz_name', 'date', 'location', 'active', 'created_at'],
  },

  // Status pertanyaan
  STATUS: {
    PENDING: 'Pending',
    ASSIGNED: 'Assigned',
    ANSWERED: 'Answered',
    PUBLISHED: 'Published',
  },

  // Peran user
  ROLES: { ADMIN: 'admin', USTADZ: 'ustadz' },

  // Aturan validasi (selaras dengan frontend config.js)
  VALIDATION: {
    TITLE_MIN: 10,
    TITLE_MAX: 150,
    QUESTION_MIN: 20,
    QUESTION_MAX: 2000,
  },

  // Keamanan
  SECURITY: {
    // false = password disimpan apa adanya (teks biasa) di Spreadsheet,
    //         sehingga mudah Anda ubah sendiri lewat kolom "password".
    // true  = password disimpan sebagai hash SHA-256 (lebih aman, tapi
    //         tidak bisa diedit manual dari Spreadsheet).
    HASH_PASSWORDS: false,
    // "garam" untuk menandatangani token sesi login (ganti dengan nilai acak Anda)
    SECRET_SALT: 'GANTI_DENGAN_STRING_ACAK_PANJANG_ANDA',
    // Masa berlaku token sesi (jam)
    SESSION_TTL_HOURS: 12,
  },

  // Batas hasil default
  LATEST_LIMIT: 10,
  RELATED_LIMIT: 5,
};

/** Ambil objek Spreadsheet aktif (bound) atau by ID (standalone). */
function getSpreadsheet_() {
  if (CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID.trim() !== '') {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error(
      'Spreadsheet tidak ditemukan. Isi CONFIG.SPREADSHEET_ID di Config.gs.'
    );
  }
  return ss;
}
