/**
 * Code.gs
 * ------------------------------------------------------------------
 * Entry point Web App. Google Apps Script memanggil:
 * - doGet(e)  untuk permintaan GET  (action via query string)
 * - doPost(e) untuk permintaan POST (action via JSON body text/plain)
 *
 * Keduanya mem-parse parameter lalu meneruskan ke router. Semua error
 * ditangkap di sini agar respons selalu berbentuk JSON konsisten.
 * ------------------------------------------------------------------
 */

function doGet(e) {
  return handleRequest_('GET', e);
}

function doPost(e) {
  return handleRequest_('POST', e);
}

/** Inti penanganan request: parse → route → tangani error. */
function handleRequest_(method, e) {
  try {
    var params = parseParams_(method, e);
    var action = params.action || '';
    if (!action) return err_('Parameter "action" wajib diisi.', 'BAD_REQUEST');

    logEvent_('REQUEST', { method: method, action: action });
    return routeRequest_(method, action, params);
  } catch (error) {
    logEvent_('ERROR', { message: error.message, stack: error.stack });
    var code = error.code || 'SERVER_ERROR';
    return err_(error.message || 'Terjadi kesalahan pada server.', code);
  }
}

/**
 * Gabungkan parameter GET (query) dan POST (JSON body) menjadi satu objek.
 */
function parseParams_(method, e) {
  var params = {};
  // Query string (selalu diparse)
  if (e && e.parameter) {
    Object.keys(e.parameter).forEach(function (k) {
      params[k] = e.parameter[k];
    });
  }
  // Body JSON untuk POST
  if (method === 'POST' && e && e.postData && e.postData.contents) {
    try {
      var body = JSON.parse(e.postData.contents);
      Object.keys(body).forEach(function (k) {
        params[k] = body[k];
      });
    } catch (err) {
      throw new Error('Body permintaan bukan JSON yang valid.');
    }
  }
  return params;
}
