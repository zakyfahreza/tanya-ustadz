/**
 * Router.gs
 * ------------------------------------------------------------------
 * Memetakan (method, action) ke fungsi handler yang sesuai.
 * Memisahkan endpoint publik (GET) dan endpoint aksi (POST).
 * ------------------------------------------------------------------
 */

function routeRequest_(method, action, params) {
  // ---------- GET: data publik ----------
  if (method === 'GET') {
    switch (action) {
      case 'questions':        return getQuestions_(params);
      case 'latestQuestions':  return getLatestQuestions_(params);
      case 'liveQuestions':    return liveQuestions_(params);
      case 'question':         return getQuestion_(params);
      case 'categories':       return getCategories_(params);
      case 'stats':            return getStats_(params);
      case 'ustadz':           return getUstadz_(params);
      case 'listUstadz':       return listUstadz_(params);
      case 'sessions':         return getSessions_(params);
      case 'ping':             return ok_({ time: nowIso_() }, 'pong');
      default:                 return err_('Action GET tidak dikenal: ' + action, 'NOT_FOUND');
    }
  }

  // ---------- POST: aksi (sebagian butuh token) ----------
  if (method === 'POST') {
    switch (action) {
      // Publik
      case 'submitQuestion':   return submitQuestion_(params);
      case 'login':            return login_(params);

      // Admin / Ustadz
      case 'adminQuestions':   return adminQuestions_(params);
      case 'saveAnswer':       return saveAnswer_(params);
      case 'assignUstadz':     return assignUstadz_(params);
      case 'publishQuestion':  return publishQuestion_(params);
      case 'unpublishQuestion':return unpublishQuestion_(params);
      case 'deleteQuestion':   return deleteQuestion_(params);

      // Admin only — master data
      case 'saveUser':         return saveUser_(params);
      case 'deleteUser':       return deleteUser_(params);
      case 'listUsers':        return listUsers_(params);
      case 'saveCategory':     return saveCategory_(params);
      case 'deleteCategory':   return deleteCategory_(params);
      case 'saveSession':      return saveSession_(params);
      case 'deleteSession':    return deleteSession_(params);

      default:                 return err_('Action POST tidak dikenal: ' + action, 'NOT_FOUND');
    }
  }

  return err_('Method tidak didukung.', 'METHOD_NOT_ALLOWED');
}
