/**
 * api.js
 * ------------------------------------------------------------------
 * Client API: pembungkus fetch() ke Google Apps Script Web App.
 *
 * Catatan teknis penting tentang Apps Script + CORS:
 * - Permintaan GET memakai query string (?action=...).
 * - Permintaan POST dikirim sebagai text/plain agar tidak memicu
 *   CORS preflight (Apps Script tidak menangani OPTIONS dengan baik).
 *   Backend tetap mem-parse body sebagai JSON.
 *
 * Semua method mengembalikan Promise yang resolve ke objek response
 * standar { ok, data, message, meta }.
 * ------------------------------------------------------------------
 */
window.API = (function () {
  const cfg = window.APP_CONFIG;

  /** Apakah URL backend sudah dikonfigurasi (bukan placeholder)? */
  function isConfigured() {
    const u = cfg.API_BASE_URL || '';
    return /^https:\/\/script\.google\.com\/macros\/s\//.test(u);
  }

  /** Respons error standar ketika backend belum disetel. */
  function notConfigured() {
    return Promise.resolve({
      ok: false,
      data: null,
      message: 'Backend belum dikonfigurasi. Isi API_BASE_URL di assets/js/config.js.',
      code: 'CONFIG',
    });
  }

  /** Bangun URL GET dengan query params */
  function buildUrl(action, params) {
    const url = new URL(cfg.API_BASE_URL);
    url.searchParams.set('action', action);
    if (params) {
      Object.keys(params).forEach((k) => {
        if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
          url.searchParams.set(k, params[k]);
        }
      });
    }
    return url.toString();
  }

  /** GET request */
  async function get(action, params) {
    if (!isConfigured()) return notConfigured();
    try {
      const res = await fetch(buildUrl(action, params), { method: 'GET' });
      const json = await res.json();
      return json;
    } catch (err) {
      return { ok: false, data: null, message: 'Gagal terhubung ke server.', code: 'NETWORK' };
    }
  }

  /** POST request (text/plain agar bebas preflight) */
  async function post(action, payload) {
    if (!isConfigured()) return notConfigured();
    try {
      const res = await fetch(cfg.API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, ...payload }),
      });
      const json = await res.json();
      return json;
    } catch (err) {
      return { ok: false, data: null, message: 'Gagal terhubung ke server.', code: 'NETWORK' };
    }
  }

  /** Ambil token sesi (untuk endpoint admin/ustadz) */
  function session() {
    try {
      return JSON.parse(sessionStorage.getItem(cfg.STORAGE.SESSION) || 'null');
    } catch (_) {
      return null;
    }
  }
  function token() {
    const s = session();
    return s && s.token ? s.token : '';
  }

  return {
    // ---- Publik (GET) ----
    questions: (params) => get('questions', params),
    latestQuestions: () => get('latestQuestions'),
    liveQuestions: (session, status) => get('liveQuestions', { session, status }),
    questionBySlug: (slug) => get('question', { slug }),
    questionById: (id) => get('question', { id }),
    categories: () => get('categories'),
    stats: () => get('stats'),
    ustadz: (email) => get('ustadz', { email }),
    sessions: () => get('sessions'),
    listUstadz: () => get('listUstadz'),

    // ---- Publik (POST) ----
    submitQuestion: (payload) => post('submitQuestion', payload),
    login: (username, password) => post('login', { username, password }),

    // ---- Admin / Ustadz (POST, butuh token) ----
    adminQuestions: (filters) => post('adminQuestions', { token: token(), ...filters }),
    listUsers: () => post('listUsers', { token: token() }),
    saveAnswer: (payload) => post('saveAnswer', { token: token(), ...payload }),
    assignUstadz: (payload) => post('assignUstadz', { token: token(), ...payload }),
    publishQuestion: (id) => post('publishQuestion', { token: token(), id }),
    unpublishQuestion: (id) => post('unpublishQuestion', { token: token(), id }),
    deleteQuestion: (id) => post('deleteQuestion', { token: token(), id }),
    saveUser: (payload) => post('saveUser', { token: token(), ...payload }),
    deleteUser: (email) => post('deleteUser', { token: token(), email }),
    saveCategory: (payload) => post('saveCategory', { token: token(), ...payload }),
    deleteCategory: (id) => post('deleteCategory', { token: token(), id }),
    saveSession: (payload) => post('saveSession', { token: token(), ...payload }),
    deleteSession: (id) => post('deleteSession', { token: token(), id }),

    // ---- Helper sesi ----
    getSession: session,
    getToken: token,
    isConfigured: isConfigured,
  };
})();
