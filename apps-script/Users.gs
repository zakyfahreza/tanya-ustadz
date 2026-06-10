/**
 * Users.gs
 * ------------------------------------------------------------------
 * Autentikasi (login) & manajemen user (admin only), serta endpoint
 * publik profil ustadz beserta daftar jawabannya.
 * ------------------------------------------------------------------
 */

/* ============================================================
 * LOGIN
 * ============================================================ */

/**
 * POST login — verifikasi kredensial terhadap sheet Users.
 * username dapat berupa email penuh ATAU bagian sebelum '@'.
 * Mengembalikan token sesi + profil ringkas.
 */
function login_(params) {
  var username = String(params.username || '').trim().toLowerCase();
  var password = String(params.password || '');
  if (!username || !password) {
    return err_('Username dan password wajib diisi.', 'VALIDATION_ERROR');
  }

  var users = readRows_(CONFIG.SHEETS.USERS);
  var user = null;
  for (var i = 0; i < users.length; i++) {
    var email = String(users[i].email || '').toLowerCase();
    var localPart = email.split('@')[0];
    if (email === username || localPart === username) {
      user = users[i];
      break;
    }
  }

  if (!user) return err_('Akun tidak ditemukan.', 'AUTH');
  if (!toBool_(user.active)) return err_('Akun dinonaktifkan. Hubungi admin.', 'AUTH');
  if (!verifyPassword_(password, user.password)) {
    logEvent_('LOGIN_FAIL', { username: username });
    return err_('Password salah.', 'AUTH');
  }

  var token = makeToken_(String(user.email).toLowerCase(), user.role);
  logEvent_('LOGIN_OK', { email: user.email, role: user.role });
  return ok_({
    token: token,
    email: user.email,
    name: user.name,
    role: user.role,
  }, 'Login berhasil.');
}

/* ============================================================
 * MANAJEMEN USER (ADMIN ONLY)
 * ============================================================ */

/** POST listUsers — daftar user (tanpa password). */
function listUsers_(params) {
  requireAuth_(params.token, true);
  var users = readRows_(CONFIG.SHEETS.USERS).map(function (u) {
    return { email: u.email, name: u.name, role: u.role, active: toBool_(u.active) };
  });
  return ok_(users, 'OK', { total: users.length });
}

/**
 * POST saveUser — tambah/edit user. Bila email sudah ada → update,
 * selain itu → tambah baru. Password hanya diubah bila diisi.
 */
function saveUser_(params) {
  requireAuth_(params.token, true);

  var email = String(params.email || '').trim().toLowerCase();
  var name = sanitizeText_(params.name);
  var role = params.role === CONFIG.ROLES.ADMIN ? CONFIG.ROLES.ADMIN : CONFIG.ROLES.USTADZ;
  var active = toBool_(params.active) ? 'TRUE' : 'FALSE';

  if (!email || email.indexOf('@') === -1) return err_('Email tidak valid.', 'VALIDATION_ERROR');
  if (!name) return err_('Nama wajib diisi.', 'VALIDATION_ERROR');

  var existing = findRow_(CONFIG.SHEETS.USERS, 'email', email);

  if (existing) {
    var fields = { name: name, role: role, active: active };
    if (params.password) {
      fields.password = CONFIG.SECURITY.HASH_PASSWORDS ? hashPassword_(params.password) : params.password;
    }
    updateRowFields_(CONFIG.SHEETS.USERS, existing._row, fields);
    logEvent_('USER_UPDATE', { email: email });
    return ok_({ email: email }, 'User diperbarui.');
  }

  // Tambah baru — wajib password
  if (!params.password) return err_('Password wajib diisi untuk user baru.', 'VALIDATION_ERROR');
  appendRow_(CONFIG.SHEETS.USERS, {
    email: email,
    name: name,
    role: role,
    password: CONFIG.SECURITY.HASH_PASSWORDS ? hashPassword_(params.password) : params.password,
    active: active,
  });
  logEvent_('USER_CREATE', { email: email });
  return ok_({ email: email }, 'User ditambahkan.');
}

/** POST deleteUser — hapus user (cegah hapus diri sendiri). */
function deleteUser_(params) {
  var auth = requireAuth_(params.token, true);
  var email = String(params.email || '').toLowerCase();
  if (email === auth.email) return err_('Tidak dapat menghapus akun sendiri.', 'VALIDATION_ERROR');

  var row = findRow_(CONFIG.SHEETS.USERS, 'email', email);
  if (!row) return err_('User tidak ditemukan.', 'NOT_FOUND');
  deleteRow_(CONFIG.SHEETS.USERS, row._row);
  logEvent_('USER_DELETE', { email: email });
  return ok_({ email: email }, 'User dihapus.');
}

/* ============================================================
 * PROFIL USTADZ (PUBLIK)
 * ============================================================ */

/** GET ustadz — profil + daftar jawaban terpublikasi. */
function getUstadz_(params) {
  var email = String(params.email || '').toLowerCase();
  if (!email) return err_('Parameter email wajib diisi.', 'BAD_REQUEST');

  var user = findRow_(CONFIG.SHEETS.USERS, 'email', email);
  if (!user || String(user.role) !== CONFIG.ROLES.USTADZ) {
    return err_('Ustadz tidak ditemukan.', 'NOT_FOUND');
  }

  var answers = readRows_(CONFIG.SHEETS.QUESTIONS).filter(function (r) {
    return String(r.status) === CONFIG.STATUS.PUBLISHED &&
           String(r.ustadz_email).toLowerCase() === email;
  }).sort(function (a, b) {
    return new Date(toIso_(b.published_at)).getTime() - new Date(toIso_(a.published_at)).getTime();
  }).map(cardQuestion_);

  return ok_({
    profile: { name: user.name, email: user.email },
    answers: answers,
  });
}
