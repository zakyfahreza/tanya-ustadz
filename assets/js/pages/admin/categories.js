/**
 * admin/categories.js
 * ------------------------------------------------------------------
 * Logika halaman Kategori & Sesi Kajian (admin only):
 * - Tab Kategori: tambah & hapus kategori.
 * - Tab Sesi: tambah/edit/hapus sesi kajian (Mode Kajian).
 * ------------------------------------------------------------------
 */
document.addEventListener('alpine:init', () => {
  Alpine.data('categoriesPage', () => ({
    tab: 'cat',
    categories: [],
    sessions: [],
    newCat: '',
    saving: false,

    // Modal sesi
    sessionModal: false,
    sForm: { id: '', title: '', ustadz_name: '', date: '', location: '', active: true },

    async load() {
      await Promise.all([this.loadCategories(), this.loadSessions()]);
    },

    async loadCategories() {
      const res = await API.categories();
      this.categories = res && res.ok && Array.isArray(res.data) ? res.data : [];
    },

    async loadSessions() {
      const res = await API.sessions();
      this.sessions = res && res.ok && Array.isArray(res.data) ? res.data : [];
    },

    // ---- Kategori ----
    async addCategory() {
      const name = this.newCat.trim();
      if (!name) return;
      const res = await API.saveCategory({ name });
      if (res && res.ok) { UI.toast('Kategori ditambahkan.', 'success'); this.newCat = ''; await this.loadCategories(); }
      else UI.toast((res && res.message) || 'Gagal.', 'error');
    },

    async removeCategory(c) {
      if (!confirm('Hapus kategori "' + c.name + '"?')) return;
      const res = await API.deleteCategory(c.id);
      if (res && res.ok) { UI.toast('Kategori dihapus.', 'success'); await this.loadCategories(); }
      else UI.toast((res && res.message) || 'Gagal.', 'error');
    },

    // ---- Sesi ----
    openSession(s) {
      if (s) {
        this.sForm = {
          id: s.id, title: s.title, ustadz_name: s.ustadz_name,
          date: (s.date || '').slice(0, 10), location: s.location, active: s.active,
        };
      } else {
        this.sForm = { id: '', title: '', ustadz_name: '', date: '', location: '', active: true };
      }
      this.sessionModal = true;
    },

    async saveSession() {
      if (!this.sForm.title.trim()) { UI.toast('Judul kajian wajib diisi.', 'error'); return; }
      this.saving = true;
      const res = await API.saveSession(this.sForm);
      this.saving = false;
      if (res && res.ok) { UI.toast('Sesi tersimpan.', 'success'); this.sessionModal = false; await this.loadSessions(); }
      else UI.toast((res && res.message) || 'Gagal menyimpan.', 'error');
    },

    async removeSession(s) {
      if (!confirm('Hapus sesi "' + s.title + '"?')) return;
      const res = await API.deleteSession(s.id);
      if (res && res.ok) { UI.toast('Sesi dihapus.', 'success'); await this.loadSessions(); }
      else UI.toast((res && res.message) || 'Gagal.', 'error');
    },

    /** Salin link halaman live MC untuk sesi ini. */
    async copyLive(s) {
      const base = (window.APP_CONFIG.PUBLIC_URL || window.location.origin).replace(/\/$/, '');
      const link = base + '/live.html?sesi=' + s.id;
      try {
        await navigator.clipboard.writeText(link);
        UI.toast('Link MC disalin. Teruskan ke pembaca/MC.', 'success');
      } catch (_) {
        prompt('Salin link berikut:', link);
      }
    },
  }));
});
