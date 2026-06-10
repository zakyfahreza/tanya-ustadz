/**
 * Setup.gs
 * ------------------------------------------------------------------
 * Skrip inisialisasi database. Jalankan SEKALI dari editor Apps Script:
 *
 *   1. Buka editor → pilih fungsi `setupSpreadsheet` → klik Run.
 *   2. Beri izin akses saat diminta.
 *   3. Semua sheet, header, dan data awal akan dibuat otomatis.
 *
 * Aman dijalankan ulang: sheet yang sudah ada tidak akan ditimpa,
 * hanya dibuatkan bila belum ada. Data seed hanya ditambahkan bila
 * sheet masih kosong.
 * ------------------------------------------------------------------
 */

function setupSpreadsheet() {
  var ss = getSpreadsheet_();

  // 1) Buat tiap sheet + header bila belum ada
  ensureSheet_(ss, CONFIG.SHEETS.QUESTIONS, CONFIG.HEADERS.QUESTIONS);
  ensureSheet_(ss, CONFIG.SHEETS.USERS, CONFIG.HEADERS.USERS);
  ensureSheet_(ss, CONFIG.SHEETS.CATEGORIES, CONFIG.HEADERS.CATEGORIES);
  ensureSheet_(ss, CONFIG.SHEETS.SESSIONS, CONFIG.HEADERS.SESSIONS);

  // 2) Seed data awal (hanya bila masih kosong)
  seedCategories_(ss);
  seedUsers_(ss);
  seedSessions_(ss);
  seedSampleQuestions_(ss);

  // 3) Hapus sheet bawaan "Sheet1" bila ada & kosong
  var def = ss.getSheetByName('Sheet1');
  if (def && ss.getSheets().length > 1) {
    try { ss.deleteSheet(def); } catch (e) { /* abaikan */ }
  }

  Logger.log('✅ Setup selesai. Spreadsheet siap digunakan.');
  return 'Setup selesai.';
}

/** Buat sheet bila belum ada, set header & format baris pertama. */
function ensureSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  // Tulis header bila baris pertama masih kosong
  var firstCell = sheet.getRange(1, 1).getValue();
  if (firstCell === '' || firstCell === null) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  // Format header: tebal, latar, freeze
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange
    .setFontWeight('bold')
    .setBackground('#2f415b')
    .setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
  return sheet;
}

/** Kategori default */
function seedCategories_(ss) {
  var sheet = ss.getSheetByName(CONFIG.SHEETS.CATEGORIES);
  if (sheet.getLastRow() > 1) return; // sudah ada data
  var names = [
    'Aqidah', 'Fiqih', 'Akhlak', 'Muamalah', 'Manhaj',
    'Ibadah', 'Keluarga', 'Dakwah', 'Lainnya',
  ];
  var rows = names.map(function (n, i) {
    return ['C' + pad_(i + 1, 2), n];
  });
  sheet.getRange(2, 1, rows.length, 2).setValues(rows);
}

/** User awal: 1 admin + 1 ustadz contoh. GANTI password setelah setup! */
function seedUsers_(ss) {
  var sheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
  if (sheet.getLastRow() > 1) return;
  var users = [
    // email, name, role, password(plain → akan di-hash), active
    ['admin@tms.id', 'Admin Utama', 'admin', 'admin123', 'TRUE'],
    ['farhan@tms.id', 'Ustadz Farhan Abu Furaihan', 'ustadz', 'ustadz123', 'TRUE'],
  ];
  // Hash password bila diaktifkan
  if (CONFIG.SECURITY.HASH_PASSWORDS) {
    users = users.map(function (u) {
      u[3] = hashPassword_(u[3]);
      return u;
    });
  }
  sheet.getRange(2, 1, users.length, users[0].length).setValues(users);
}

/** Sesi kajian contoh */
function seedSessions_(ss) {
  var sheet = ss.getSheetByName(CONFIG.SHEETS.SESSIONS);
  if (sheet.getLastRow() > 1) return;
  var now = new Date().toISOString();
  var rows = [
    ['S0001', 'Syarah Ushul Tsalatsah', 'Ustadz Farhan Abu Furaihan',
     '2026-06-10', 'Masjid Al-Hikmah, Solo', 'TRUE', now],
  ];
  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

/** Contoh 1 pertanyaan terpublikasi agar UI tidak kosong saat uji coba */
function seedSampleQuestions_(ss) {
  var sheet = ss.getSheetByName(CONFIG.SHEETS.QUESTIONS);
  if (sheet.getLastRow() > 1) return;
  var now = new Date().toISOString();
  var row = [
    'Q0001', now, now, now,
    'Hukum Isbal bagi Laki-laki',
    'Apakah memanjangkan kain/celana melebihi mata kaki (isbal) termasuk perbuatan yang dilarang dalam Islam? Mohon penjelasannya.',
    'Isbal, yaitu menurunkan pakaian melebihi mata kaki bagi laki-laki, dilarang berdasarkan banyak hadits. ' +
      'Apabila dilakukan karena sombong, ancamannya lebih berat. Hendaknya seorang muslim menjaga pakaiannya ' +
      'di atas mata kaki sebagai bentuk ittiba\' kepada Nabi shallallahu \'alaihi wa sallam. Wallahu a\'lam.',
    'Fiqih', 'hukum-isbal-bagi-laki-laki', 'Published',
    'farhan@tms.id', 'Ustadz Farhan Abu Furaihan',
    'Abdullah', 'Solo', 'FALSE', 12, 'S0001',
  ];
  sheet.getRange(2, 1, 1, row.length).setValues([row]);
}

/** Padding angka jadi string, mis. pad_(1,4) → "0001" */
function pad_(num, len) {
  var s = String(num);
  while (s.length < len) s = '0' + s;
  return s;
}
