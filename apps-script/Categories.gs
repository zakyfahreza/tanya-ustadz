/**
 * Categories.gs
 * ------------------------------------------------------------------
 * Manajemen kategori. GET publik untuk frontend; tambah/hapus admin.
 * ------------------------------------------------------------------
 */

/** GET categories — daftar nama kategori. */
function getCategories_(params) {
  var rows = readRows_(CONFIG.SHEETS.CATEGORIES);
  var data = rows.map(function (r) { return { id: r.id, name: r.name }; });
  // Bila kosong, kembalikan default agar UI tetap berfungsi
  if (data.length === 0) {
    data = ['Aqidah','Fiqih','Akhlak','Muamalah','Manhaj','Ibadah','Keluarga','Dakwah','Lainnya']
      .map(function (n, i) { return { id: 'C' + (i + 1), name: n }; });
  }
  return ok_(data, 'OK', { total: data.length });
}

/** POST saveCategory — tambah/edit kategori (admin). */
function saveCategory_(params) {
  requireAuth_(params.token, true);
  var name = sanitizeText_(params.name);
  if (!name) return err_('Nama kategori wajib diisi.', 'VALIDATION_ERROR');

  // Edit bila id diberikan & ada
  if (params.id) {
    var row = findRow_(CONFIG.SHEETS.CATEGORIES, 'id', params.id);
    if (row) {
      updateRowFields_(CONFIG.SHEETS.CATEGORIES, row._row, { name: name });
      return ok_({ id: params.id, name: name }, 'Kategori diperbarui.');
    }
  }

  // Cegah duplikasi nama
  var existing = findRow_(CONFIG.SHEETS.CATEGORIES, 'name', name);
  if (existing) return err_('Kategori sudah ada.', 'VALIDATION_ERROR');

  var id = nextId_(CONFIG.SHEETS.CATEGORIES, 'id', 'C', 2);
  appendRow_(CONFIG.SHEETS.CATEGORIES, { id: id, name: name });
  logEvent_('CATEGORY_CREATE', { id: id, name: name });
  return ok_({ id: id, name: name }, 'Kategori ditambahkan.');
}

/** POST deleteCategory — hapus kategori (admin). */
function deleteCategory_(params) {
  requireAuth_(params.token, true);
  var row = findRow_(CONFIG.SHEETS.CATEGORIES, 'id', params.id);
  if (!row) return err_('Kategori tidak ditemukan.', 'NOT_FOUND');
  deleteRow_(CONFIG.SHEETS.CATEGORIES, row._row);
  logEvent_('CATEGORY_DELETE', { id: params.id });
  return ok_({ id: params.id }, 'Kategori dihapus.');
}
