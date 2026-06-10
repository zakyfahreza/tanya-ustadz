/**
 * config.js
 * ------------------------------------------------------------------
 * Konfigurasi global aplikasi "Tanya Muslim Solo".
 * Semua konstanta yang dipakai lintas halaman didefinisikan di sini.
 *
 * PENTING: Sebelum deploy, isi API_BASE_URL dengan URL Web App
 * Google Apps Script Anda (akhiran /exec).
 * ------------------------------------------------------------------
 */
window.APP_CONFIG = {
  /** Nama & identitas aplikasi */
  APP_NAME: 'Tanya Muslim Solo',
  TAGLINE:
    'Tanyakan masalah agama Anda kepada ustadz dan temukan jawaban yang bermanfaat.',

  /**
   * URL Web App Apps Script. Ganti setelah deploy backend.
   * Contoh: 'https://script.google.com/macros/s/AKfycbx....../exec'
   */
  API_BASE_URL: 'https://script.google.com/macros/s/AKfycbwETVVjFdzKSC_a-w0m7-58B4UiMOfL4ze-qgX3EZFUeyqpbHmjBYvqvXxg5Cj5ihg9_A/exec',

  /** Domain publik untuk QR code & Open Graph */
  PUBLIC_URL: 'https://tanya.muslimsolo.id',

  /** Daftar kategori default (juga di-fetch dari backend; ini fallback) */
  CATEGORIES: [
    'Aqidah',
    'Fiqih',
    'Akhlak',
    'Muamalah',
    'Manhaj',
    'Ibadah',
    'Keluarga',
    'Dakwah',
    'Lainnya',
  ],

  /** Status pertanyaan */
  STATUS: {
    PENDING: 'Pending',
    ASSIGNED: 'Assigned',
    ANSWERED: 'Answered',
    PUBLISHED: 'Published',
  },

  /** Aturan validasi (selaras dengan backend) */
  VALIDATION: {
    TITLE_MIN: 10,
    TITLE_MAX: 150,
    QUESTION_MIN: 20,
    QUESTION_MAX: 2000,
  },

  /** Pagination */
  PAGE_SIZE: 9,

  /** Tema palet warna (dipakai sebagian di JS, mayoritas via Tailwind config) */
  COLORS: {
    PRIMARY: '#2f415b',
    SECONDARY: '#22304a',
    ACCENT: '#F59E0B',
  },

  /** Kunci penyimpanan lokal */
  STORAGE: {
    THEME: 'tms_theme',
    SESSION: 'tms_session',
  },
};
