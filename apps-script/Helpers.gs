/**
 * Helpers.gs
 * ------------------------------------------------------------------
 * Utilitas backend yang dipakai lintas modul:
 * - Response JSON konsisten (ok/error) + CORS
 * - Akses Spreadsheet (baca objek, append, update, hapus)
 * - Generator ID (Q0001) & slug unik
 * - Sanitasi input (anti-XSS) & validasi
 * - Hash password (SHA-256) & token sesi sederhana
 * - Logging
 * ------------------------------------------------------------------
 */

/* ============================================================
 * RESPONSE
 * ============================================================ */

/** Bungkus respons sukses standar. */
function ok_(data, message, meta) {
  return jsonOutput_({
    ok: true,
    data: data === undefined ? null : data,
    message: message || 'OK',
    meta: meta || null,
  });
}

/** Bungkus respons error standar. */
function err_(message, code, httpHint) {
  return jsonOutput_({
    ok: false,
    data: null,
    message: message || 'Terjadi kesalahan.',
    code: code || 'ERROR',
  });
}

/**
 * Keluarkan JSON. Apps Script Web App (akses "Anyone") secara default
 * sudah mengembalikan header CORS yang sesuai untuk simple request
 * (GET & POST text/plain), sehingga preflight tidak diperlukan.
 */
function jsonOutput_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ============================================================
 * AKSES SPREADSHEET
 * ============================================================ */

/** Ambil sheet by name, lempar error bila tidak ada. */
function sheet_(name) {
  var sheet = getSpreadsheet_().getSheetByName(name);
  if (!sheet) throw new Error('Sheet "' + name + '" tidak ditemukan. Jalankan setupSpreadsheet().');
  return sheet;
}

/**
 * Baca seluruh baris sebagai array objek (key = header).
 * Setiap objek menyertakan properti tersembunyi _row (nomor baris sheet).
 */
function readRows_(name) {
  var sheet = sheet_(name);
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  var out = [];
  for (var r = 1; r < values.length; r++) {
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      obj[headers[c]] = values[r][c];
    }
    obj._row = r + 1; // nomor baris aktual di sheet (1-based)
    out.push(obj);
  }
  return out;
}

/** Tambahkan satu objek sebagai baris baru sesuai urutan header. */
function appendRow_(name, obj) {
  var sheet = sheet_(name);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = headers.map(function (h) {
    return obj[h] === undefined || obj[h] === null ? '' : obj[h];
  });
  sheet.appendRow(row);
  return obj;
}

/** Perbarui baris (rowIndex 1-based) dengan field dari objek partial. */
function updateRowFields_(name, rowIndex, fields) {
  var sheet = sheet_(name);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var current = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
  for (var c = 0; c < headers.length; c++) {
    if (Object.prototype.hasOwnProperty.call(fields, headers[c])) {
      current[c] = fields[headers[c]];
    }
  }
  sheet.getRange(rowIndex, 1, 1, headers.length).setValues([current]);
}

/** Hapus baris berdasarkan nomor baris sheet (1-based). */
function deleteRow_(name, rowIndex) {
  sheet_(name).deleteRow(rowIndex);
}

/** Cari satu baris berdasarkan kecocokan field. Return objek atau null. */
function findRow_(name, field, value) {
  var rows = readRows_(name);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][field]) === String(value)) return rows[i];
  }
  return null;
}

/* ============================================================
 * GENERATOR ID & SLUG
 * ============================================================ */

/**
 * ID berurutan dengan prefix, mis. nextId_('Questions','id','Q',4) → 'Q0007'.
 * Mengambil angka terbesar yang ada lalu menambah 1.
 */
function nextId_(sheetName, idField, prefix, padLen) {
  var rows = readRows_(sheetName);
  var max = 0;
  rows.forEach(function (r) {
    var id = String(r[idField] || '');
    if (id.indexOf(prefix) === 0) {
      var n = parseInt(id.slice(prefix.length), 10);
      if (!isNaN(n) && n > max) max = n;
    }
  });
  var next = String(max + 1);
  while (next.length < padLen) next = '0' + next;
  return prefix + next;
}

/** Ubah teks menjadi slug: lowercase, strip simbol, spasi → '-'. */
function slugify_(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')   // buang simbol
    .replace(/\s+/g, '-')        // spasi → -
    .replace(/-+/g, '-')         // gabungkan -
    .replace(/^-+|-+$/g, '')     // trim -
    .slice(0, 80);
}

/** Slug unik di sheet Questions; tambah -2, -3, dst bila bentrok. */
function uniqueSlug_(title) {
  var base = slugify_(title) || 'pertanyaan';
  var rows = readRows_(CONFIG.SHEETS.QUESTIONS);
  var existing = {};
  rows.forEach(function (r) { existing[String(r.slug)] = true; });
  if (!existing[base]) return base;
  var i = 2;
  while (existing[base + '-' + i]) i++;
  return base + '-' + i;
}

/* ============================================================
 * SANITASI & VALIDASI
 * ============================================================ */

/** Hapus tag HTML & rapikan spasi (mencegah XSS pada penyimpanan). */
function sanitizeText_(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/<\/?[^>]+(>|$)/g, '') // buang tag HTML
    .replace(/\u0000/g, '')
    .trim();
}

/** Potong string ke panjang maksimum. */
function clamp_(str, max) {
  str = String(str || '');
  return str.length > max ? str.slice(0, max) : str;
}

/** Boolean dari berbagai bentuk input. */
function toBool_(v) {
  return v === true || v === 'TRUE' || v === 'true' || v === 1 || v === '1';
}

/** Validasi pertanyaan; return array pesan error (kosong = valid). */
function validateQuestion_(title, question) {
  var errs = [];
  var V = CONFIG.VALIDATION;
  var t = sanitizeText_(title);
  var q = sanitizeText_(question);
  if (t.length < V.TITLE_MIN) errs.push('Judul minimal ' + V.TITLE_MIN + ' karakter.');
  if (t.length > V.TITLE_MAX) errs.push('Judul maksimal ' + V.TITLE_MAX + ' karakter.');
  if (q.length < V.QUESTION_MIN) errs.push('Pertanyaan minimal ' + V.QUESTION_MIN + ' karakter.');
  if (q.length > V.QUESTION_MAX) errs.push('Pertanyaan maksimal ' + V.QUESTION_MAX + ' karakter.');
  return errs;
}

/* ============================================================
 * KEAMANAN: HASH & TOKEN
 * ============================================================ */

/** SHA-256 → hex string. */
function sha256_(str) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str, Utilities.Charset.UTF_8);
  return bytes.map(function (b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

/** Hash password dengan salt. */
function hashPassword_(plain) {
  return sha256_(String(plain) + '::' + CONFIG.SECURITY.SECRET_SALT);
}

/** Verifikasi password terhadap nilai tersimpan (hash atau plain). */
function verifyPassword_(plain, stored) {
  if (CONFIG.SECURITY.HASH_PASSWORDS) {
    return hashPassword_(plain) === String(stored);
  }
  return String(plain) === String(stored);
}

/** Buat token sesi: base64(email|role|expiry|signature). */
function makeToken_(email, role) {
  var expiry = Date.now() + CONFIG.SECURITY.SESSION_TTL_HOURS * 3600 * 1000;
  var payload = email + '|' + role + '|' + expiry;
  var sig = sha256_(payload + '|' + CONFIG.SECURITY.SECRET_SALT);
  return Utilities.base64EncodeWebSafe(payload + '|' + sig);
}

/** Verifikasi token; return { email, role } bila valid, atau null. */
function verifyToken_(token) {
  try {
    var raw = Utilities.newBlob(Utilities.base64DecodeWebSafe(token)).getDataAsString();
    var parts = raw.split('|');
    if (parts.length !== 4) return null;
    var email = parts[0], role = parts[1], expiry = parts[2], sig = parts[3];
    var expected = sha256_(email + '|' + role + '|' + expiry + '|' + CONFIG.SECURITY.SECRET_SALT);
    if (sig !== expected) return null;
    if (Date.now() > parseInt(expiry, 10)) return null;
    return { email: email, role: role };
  } catch (e) {
    return null;
  }
}

/** Pastikan token valid; lempar error bila tidak. Return identitas. */
function requireAuth_(token, requireAdmin) {
  var auth = verifyToken_(token);
  if (!auth) throw authError_('Sesi tidak valid atau kedaluwarsa. Silakan login ulang.');
  if (requireAdmin && auth.role !== CONFIG.ROLES.ADMIN) {
    throw authError_('Akses ditolak. Hanya admin yang diizinkan.');
  }
  return auth;
}

/** Error khusus auth (ditangani router → kode AUTH). */
function authError_(msg) {
  var e = new Error(msg);
  e.code = 'AUTH';
  return e;
}

/* ============================================================
 * LOGGING
 * ============================================================ */

function logEvent_(action, detail) {
  try {
    Logger.log('[' + new Date().toISOString() + '] ' + action + ' :: ' + JSON.stringify(detail));
  } catch (e) { /* abaikan */ }
}

/** Timestamp ISO sekarang. */
function nowIso_() {
  return new Date().toISOString();
}
