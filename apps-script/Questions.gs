/**
 * Questions.gs
 * ------------------------------------------------------------------
 * Semua logika terkait pertanyaan: list publik, detail, submit,
 * jawab, assign, publish/unpublish, hapus, dan listing admin.
 * ------------------------------------------------------------------
 */

/* ============================================================
 * PEMETAAN FIELD PUBLIK (sembunyikan data sensitif)
 * ============================================================ */

/** Bentuk objek untuk konsumsi publik (kartu & detail). */
function publicQuestion_(r) {
  return {
    id: r.id,
    title: r.title,
    question: r.question,
    answer: r.answer,
    category: r.category,
    slug: r.slug,
    status: r.status,
    ustadz_name: r.ustadz_name,
    ustadz_email: r.ustadz_email,
    author_name: toBool_(r.anonymous) ? '' : r.author_name,
    author_city: r.author_city,
    anonymous: toBool_(r.anonymous),
    views: Number(r.views) || 0,
    created_at: toIso_(r.created_at),
    published_at: toIso_(r.published_at),
  };
}

/** Bentuk ringkas untuk kartu daftar. */
function cardQuestion_(r) {
  return {
    id: r.id,
    title: r.title,
    answer: r.answer,
    question: r.question,
    category: r.category,
    slug: r.slug,
    ustadz_name: r.ustadz_name,
    ustadz_email: r.ustadz_email,
    published_at: toIso_(r.published_at),
    created_at: toIso_(r.created_at),
  };
}

/** Pastikan nilai tanggal jadi ISO string (sheet bisa kembalikan Date). */
function toIso_(v) {
  if (!v) return '';
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

/* ============================================================
 * GET PUBLIK
 * ============================================================ */

/** GET questions — daftar terpublikasi (filter, sort, pagination). */
function getQuestions_(params) {
  var rows = readRows_(CONFIG.SHEETS.QUESTIONS).filter(function (r) {
    return String(r.status) === CONFIG.STATUS.PUBLISHED;
  });

  // Filter kategori
  if (params.category) {
    rows = rows.filter(function (r) { return String(r.category) === params.category; });
  }
  // Search
  if (params.q) {
    var term = String(params.q).toLowerCase();
    rows = rows.filter(function (r) {
      return ((r.title || '') + ' ' + (r.answer || '') + ' ' + (r.question || ''))
        .toLowerCase().indexOf(term) !== -1;
    });
  }
  // Sort
  var sort = params.sort === 'oldest' ? 1 : -1;
  rows.sort(function (a, b) {
    var da = new Date(toIso_(a.published_at) || toIso_(a.created_at)).getTime();
    var db = new Date(toIso_(b.published_at) || toIso_(b.created_at)).getTime();
    return (da - db) * sort;
  });

  var total = rows.length;
  var data = rows.map(cardQuestion_);

  // Pagination opsional (bila page diberikan)
  var meta = { total: total };
  if (params.page) {
    var page = Math.max(1, parseInt(params.page, 10) || 1);
    var size = Math.max(1, parseInt(params.pageSize, 10) || 9);
    var start = (page - 1) * size;
    data = data.slice(start, start + size);
    meta.page = page;
    meta.pageSize = size;
    meta.totalPages = Math.max(1, Math.ceil(total / size));
  }

  return ok_(data, 'OK', meta);
}

/** GET latestQuestions — N jawaban terbaru terpublikasi. */
function getLatestQuestions_(params) {
  var limit = parseInt(params.limit, 10) || CONFIG.LATEST_LIMIT;
  var rows = readRows_(CONFIG.SHEETS.QUESTIONS).filter(function (r) {
    return String(r.status) === CONFIG.STATUS.PUBLISHED;
  });
  rows.sort(function (a, b) {
    return new Date(toIso_(b.published_at)).getTime() - new Date(toIso_(a.published_at)).getTime();
  });
  return ok_(rows.slice(0, limit).map(cardQuestion_));
}

/** GET liveQuestions — pertanyaan untuk sesi kajian (live, untuk MC).
 *  Menampilkan semua status (termasuk belum dijawab) agar MC bisa membacakan
 *  pertanyaan yang baru masuk. Tentukan sesi via ?session=Sxxxx, atau otomatis
 *  memakai sesi yang sedang aktif bila tidak diberikan. */
function liveQuestions_(params) {
  var sessionId = params.session ? String(params.session).trim() : getActiveSessionId_();
  var sessionRow = sessionId ? findRow_(CONFIG.SHEETS.SESSIONS, 'id', sessionId) : null;
  var sessionInfo = sessionRow ? {
    id: sessionRow.id,
    title: sessionRow.title,
    ustadz_name: sessionRow.ustadz_name,
    location: sessionRow.location,
    date: toIso_(sessionRow.date),
    active: toBool_(sessionRow.active),
  } : null;

  var data = [];
  if (sessionId) {
    var rows = readRows_(CONFIG.SHEETS.QUESTIONS).filter(function (r) {
      return String(r.session_id) === sessionId;
    });
    if (params.status) {
      rows = rows.filter(function (r) { return String(r.status) === params.status; });
    }
    rows.sort(function (a, b) {
      return new Date(toIso_(b.created_at)).getTime() - new Date(toIso_(a.created_at)).getTime();
    });
    data = rows.map(function (r) {
      var anon = toBool_(r.anonymous);
      return {
        id: r.id,
        title: r.title,
        question: r.question,
        category: r.category,
        status: r.status,
        slug: r.slug,
        author_name: anon ? '' : r.author_name,
        author_city: anon ? '' : r.author_city,
        anonymous: anon,
        created_at: toIso_(r.created_at),
      };
    });
  }
  return ok_({ session: sessionInfo, questions: data }, 'OK', { total: data.length });
}

/** GET question — detail by id atau slug (+ increment views + terkait). */
function getQuestion_(params) {
  var rows = readRows_(CONFIG.SHEETS.QUESTIONS);
  var found = null;
  for (var i = 0; i < rows.length; i++) {
    if ((params.slug && String(rows[i].slug) === String(params.slug)) ||
        (params.id && String(rows[i].id) === String(params.id))) {
      found = rows[i];
      break;
    }
  }
  if (!found || String(found.status) !== CONFIG.STATUS.PUBLISHED) {
    return err_('Pertanyaan tidak ditemukan.', 'NOT_FOUND');
  }

  // Tambah views (best-effort)
  try {
    var newViews = (Number(found.views) || 0) + 1;
    updateRowFields_(CONFIG.SHEETS.QUESTIONS, found._row, { views: newViews });
    found.views = newViews;
  } catch (e) { /* abaikan kegagalan increment */ }

  // Pertanyaan terkait (kategori sama, terpublikasi, selain ini)
  var related = rows.filter(function (r) {
    return String(r.status) === CONFIG.STATUS.PUBLISHED &&
           String(r.category) === String(found.category) &&
           String(r.id) !== String(found.id);
  }).sort(function (a, b) {
    return new Date(toIso_(b.published_at)).getTime() - new Date(toIso_(a.published_at)).getTime();
  }).slice(0, CONFIG.RELATED_LIMIT).map(cardQuestion_);

  return ok_({ question: publicQuestion_(found), related: related });
}

/* ============================================================
 * POST PUBLIK: SUBMIT
 * ============================================================ */

/** POST submitQuestion — jamaah mengirim pertanyaan baru. */
function submitQuestion_(params) {
  var errs = validateQuestion_(params.title, params.question);
  if (errs.length) return err_(errs.join(' '), 'VALIDATION_ERROR');

  var title = clamp_(sanitizeText_(params.title), CONFIG.VALIDATION.TITLE_MAX);
  var question = clamp_(sanitizeText_(params.question), CONFIG.VALIDATION.QUESTION_MAX);
  var category = sanitizeText_(params.category) || 'Lainnya';
  var anonymous = toBool_(params.anonymous);

  var id = nextId_(CONFIG.SHEETS.QUESTIONS, 'id', 'Q', 4);
  var now = nowIso_();

  // Kaitkan ke sesi: pakai session_id dari parameter (mis. dari QR ?sesi=),
  // bila kosong pakai sesi yang sedang aktif (otomatis saat kajian berlangsung).
  var sessionId = sanitizeText_(params.session_id) || getActiveSessionId_();

  var obj = {
    id: id,
    created_at: now,
    updated_at: now,
    published_at: '',
    title: title,
    question: question,
    answer: '',
    category: category,
    slug: uniqueSlug_(title),
    status: CONFIG.STATUS.PENDING,
    ustadz_email: '',
    ustadz_name: '',
    author_name: anonymous ? '' : clamp_(sanitizeText_(params.author_name), 60),
    author_city: clamp_(sanitizeText_(params.author_city), 60),
    anonymous: anonymous ? 'TRUE' : 'FALSE',
    views: 0,
    session_id: sessionId,
  };

  appendRow_(CONFIG.SHEETS.QUESTIONS, obj);
  logEvent_('SUBMIT_QUESTION', { id: id });
  return ok_({ id: id }, 'Pertanyaan berhasil dikirim.');
}

/* ============================================================
 * POST ADMIN/USTADZ
 * ============================================================ */

/** Ambil baris pertanyaan by id atau lempar NOT_FOUND. */
function getQuestionRowOrThrow_(id) {
  var row = findRow_(CONFIG.SHEETS.QUESTIONS, 'id', id);
  if (!row) { var e = new Error('Pertanyaan tidak ditemukan.'); e.code = 'NOT_FOUND'; throw e; }
  return row;
}

/** POST adminQuestions — daftar untuk dashboard (role-aware). */
function adminQuestions_(params) {
  var auth = requireAuth_(params.token, false);
  var rows = readRows_(CONFIG.SHEETS.QUESTIONS);

  // Ustadz hanya melihat yang ditugaskan kepadanya
  if (auth.role === CONFIG.ROLES.USTADZ) {
    rows = rows.filter(function (r) { return String(r.ustadz_email) === auth.email; });
  }
  // Filter status
  if (params.status) {
    rows = rows.filter(function (r) { return String(r.status) === params.status; });
  }
  // Search
  if (params.q) {
    var term = String(params.q).toLowerCase();
    rows = rows.filter(function (r) {
      return ((r.title || '') + ' ' + (r.question || '') + ' ' + (r.author_name || ''))
        .toLowerCase().indexOf(term) !== -1;
    });
  }
  rows.sort(function (a, b) {
    return new Date(toIso_(b.created_at)).getTime() - new Date(toIso_(a.created_at)).getTime();
  });

  // Admin butuh data lengkap (termasuk identitas penanya)
  var data = rows.map(function (r) {
    return {
      id: r.id, title: r.title, question: r.question, answer: r.answer,
      category: r.category, slug: r.slug, status: r.status,
      ustadz_email: r.ustadz_email, ustadz_name: r.ustadz_name,
      author_name: r.author_name, author_city: r.author_city,
      anonymous: toBool_(r.anonymous), views: Number(r.views) || 0,
      session_id: r.session_id,
      created_at: toIso_(r.created_at), updated_at: toIso_(r.updated_at),
      published_at: toIso_(r.published_at),
    };
  });
  return ok_(data, 'OK', { total: data.length, role: auth.role });
}

/** POST saveAnswer — ustadz/admin menyimpan/mengubah jawaban. */
function saveAnswer_(params) {
  var auth = requireAuth_(params.token, false);
  var row = getQuestionRowOrThrow_(params.id);

  // Ustadz hanya boleh menjawab pertanyaan miliknya
  if (auth.role === CONFIG.ROLES.USTADZ && String(row.ustadz_email) !== auth.email) {
    throw authError_('Anda hanya dapat menjawab pertanyaan yang ditugaskan kepada Anda.');
  }

  var answer = clamp_(sanitizeText_(params.answer), 20000);
  var fields = { answer: answer, updated_at: nowIso_() };

  // Status: draft tetap Assigned; submit (final) → Answered
  var isDraft = toBool_(params.draft);
  if (!isDraft && answer.length > 0) {
    // jangan turunkan status bila sudah Published
    if (String(row.status) !== CONFIG.STATUS.PUBLISHED) {
      fields.status = CONFIG.STATUS.ANSWERED;
    }
  }

  updateRowFields_(CONFIG.SHEETS.QUESTIONS, row._row, fields);
  logEvent_('SAVE_ANSWER', { id: params.id, draft: isDraft, by: auth.email });
  return ok_({ id: params.id, status: fields.status || row.status }, isDraft ? 'Draft tersimpan.' : 'Jawaban tersimpan.');
}

/** POST assignUstadz — admin menugaskan ustadz. */
function assignUstadz_(params) {
  requireAuth_(params.token, true); // admin only
  var row = getQuestionRowOrThrow_(params.id);

  var user = findRow_(CONFIG.SHEETS.USERS, 'email', params.ustadz_email);
  if (!user) return err_('Ustadz tidak ditemukan.', 'NOT_FOUND');

  var fields = {
    ustadz_email: user.email,
    ustadz_name: user.name,
    updated_at: nowIso_(),
  };
  // Naikkan status ke Assigned bila masih Pending
  if (String(row.status) === CONFIG.STATUS.PENDING) {
    fields.status = CONFIG.STATUS.ASSIGNED;
  }
  updateRowFields_(CONFIG.SHEETS.QUESTIONS, row._row, fields);
  logEvent_('ASSIGN', { id: params.id, ustadz: user.email });
  return ok_({ id: params.id }, 'Ustadz berhasil ditugaskan.');
}

/** POST publishQuestion — admin atau ustadz pemilik mempublikasikan. */
function publishQuestion_(params) {
  var auth = requireAuth_(params.token, false);
  var row = getQuestionRowOrThrow_(params.id);
  if (auth.role === CONFIG.ROLES.USTADZ && String(row.ustadz_email) !== auth.email) {
    throw authError_('Anda hanya dapat mempublikasikan pertanyaan yang ditugaskan kepada Anda.');
  }
  if (!String(row.answer || '').trim()) {
    return err_('Tidak dapat publikasi: jawaban masih kosong.', 'VALIDATION_ERROR');
  }
  updateRowFields_(CONFIG.SHEETS.QUESTIONS, row._row, {
    status: CONFIG.STATUS.PUBLISHED,
    published_at: nowIso_(),
    updated_at: nowIso_(),
  });
  logEvent_('PUBLISH', { id: params.id, by: auth.email });
  return ok_({ id: params.id }, 'Pertanyaan dipublikasikan.');
}

/** POST unpublishQuestion — admin atau ustadz pemilik membatalkan publikasi. */
function unpublishQuestion_(params) {
  var auth = requireAuth_(params.token, false);
  var row = getQuestionRowOrThrow_(params.id);
  if (auth.role === CONFIG.ROLES.USTADZ && String(row.ustadz_email) !== auth.email) {
    throw authError_('Anda hanya dapat membatalkan publikasi pertanyaan yang ditugaskan kepada Anda.');
  }
  updateRowFields_(CONFIG.SHEETS.QUESTIONS, row._row, {
    status: CONFIG.STATUS.ANSWERED,
    published_at: '',
    updated_at: nowIso_(),
  });
  logEvent_('UNPUBLISH', { id: params.id, by: auth.email });
  return ok_({ id: params.id }, 'Publikasi dibatalkan.');
}

/** POST deleteQuestion — admin menghapus. */
function deleteQuestion_(params) {
  requireAuth_(params.token, true);
  var row = getQuestionRowOrThrow_(params.id);
  deleteRow_(CONFIG.SHEETS.QUESTIONS, row._row);
  logEvent_('DELETE_QUESTION', { id: params.id });
  return ok_({ id: params.id }, 'Pertanyaan dihapus.');
}
