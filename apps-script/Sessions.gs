/**
 * Sessions.gs
 * ------------------------------------------------------------------
 * Mode Kajian: admin membuat sesi kajian; pertanyaan dapat dikaitkan
 * ke sesi tertentu via field session_id pada Questions.
 * Juga berisi endpoint statistik dashboard.
 * ------------------------------------------------------------------
 */

/** Cari sesi yang aktif (paling baru dibuat). Return objek baris atau null. */
function getActiveSession_() {
  var rows = readRows_(CONFIG.SHEETS.SESSIONS).filter(function (r) {
    return toBool_(r.active);
  });
  if (rows.length === 0) return null;
  rows.sort(function (a, b) {
    return new Date(toIso_(b.created_at)).getTime() - new Date(toIso_(a.created_at)).getTime();
  });
  return rows[0];
}

/** ID sesi aktif atau '' bila tidak ada. */
function getActiveSessionId_() {
  var s = getActiveSession_();
  return s ? String(s.id) : '';
}

/** GET sessions — daftar sesi kajian (publik; bisa filter active). */
function getSessions_(params) {
  var rows = readRows_(CONFIG.SHEETS.SESSIONS);
  if (params.active) {
    rows = rows.filter(function (r) { return toBool_(r.active); });
  }
  rows.sort(function (a, b) {
    return new Date(toIso_(b.created_at)).getTime() - new Date(toIso_(a.created_at)).getTime();
  });
  var data = rows.map(function (r) {
    return {
      id: r.id, title: r.title, ustadz_name: r.ustadz_name,
      date: toIso_(r.date), location: r.location, active: toBool_(r.active),
    };
  });
  return ok_(data, 'OK', { total: data.length });
}

/** POST saveSession — tambah/edit sesi (admin). */
function saveSession_(params) {
  requireAuth_(params.token, true);
  var title = sanitizeText_(params.title);
  if (!title) return err_('Judul kajian wajib diisi.', 'VALIDATION_ERROR');

  var fields = {
    title: title,
    ustadz_name: sanitizeText_(params.ustadz_name),
    date: sanitizeText_(params.date),
    location: sanitizeText_(params.location),
    active: toBool_(params.active) ? 'TRUE' : 'FALSE',
  };

  // Edit
  if (params.id) {
    var row = findRow_(CONFIG.SHEETS.SESSIONS, 'id', params.id);
    if (row) {
      updateRowFields_(CONFIG.SHEETS.SESSIONS, row._row, fields);
      return ok_({ id: params.id }, 'Sesi diperbarui.');
    }
  }

  // Tambah
  var id = nextId_(CONFIG.SHEETS.SESSIONS, 'id', 'S', 4);
  fields.id = id;
  fields.created_at = nowIso_();
  appendRow_(CONFIG.SHEETS.SESSIONS, fields);
  logEvent_('SESSION_CREATE', { id: id });
  return ok_({ id: id }, 'Sesi kajian dibuat.');
}

/** POST deleteSession — hapus sesi (admin). */
function deleteSession_(params) {
  requireAuth_(params.token, true);
  var row = findRow_(CONFIG.SHEETS.SESSIONS, 'id', params.id);
  if (!row) return err_('Sesi tidak ditemukan.', 'NOT_FOUND');
  deleteRow_(CONFIG.SHEETS.SESSIONS, row._row);
  return ok_({ id: params.id }, 'Sesi dihapus.');
}

/* ============================================================
 * STATISTIK DASHBOARD
 * ============================================================ */

/** GET stats — ringkasan jumlah per status & total. */
function getStats_(params) {
  var rows = readRows_(CONFIG.SHEETS.QUESTIONS);
  var stats = {
    total: rows.length,
    pending: 0, assigned: 0, answered: 0, published: 0,
    totalViews: 0,
    byCategory: {},
  };
  rows.forEach(function (r) {
    var s = String(r.status);
    if (s === CONFIG.STATUS.PENDING) stats.pending++;
    else if (s === CONFIG.STATUS.ASSIGNED) stats.assigned++;
    else if (s === CONFIG.STATUS.ANSWERED) stats.answered++;
    else if (s === CONFIG.STATUS.PUBLISHED) stats.published++;
    stats.totalViews += Number(r.views) || 0;
    var cat = String(r.category || 'Lainnya');
    stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;
  });
  return ok_(stats);
}
