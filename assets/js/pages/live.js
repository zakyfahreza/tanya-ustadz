/**
 * live.js
 * ------------------------------------------------------------------
 * Halaman live untuk MC (live.html):
 * - Menampilkan pertanyaan masuk untuk sesi kajian aktif (atau ?sesi=).
 * - Auto-refresh berkala agar pertanyaan baru muncul sendiri.
 * - "Sudah dibacakan" disimpan lokal (localStorage) per sesi, agar MC
 *   bisa menandai pertanyaan yang telah dibaca tanpa mengubah data server.
 * ------------------------------------------------------------------
 */
document.addEventListener('alpine:init', () => {
  const REFRESH_MS = 12000;

  Alpine.data('livePage', () => ({
    session: null,
    items: [],
    loading: true,
    filterUnread: false,
    lastUpdated: '-',
    readSet: {},
    timer: null,

    async init() {
      this.$store.theme.init();
      this.sesiParam = UI.param('sesi') || UI.param('session');
      await this.load(true);
      // Auto-refresh
      this.timer = setInterval(() => this.load(false), REFRESH_MS);
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) this.load(false);
      });
    },

    async load(showLoading) {
      if (showLoading) this.loading = true;
      const res = await API.liveQuestions(this.sesiParam || '');
      if (res && res.ok && res.data) {
        this.session = res.data.session || null;
        this.items = Array.isArray(res.data.questions) ? res.data.questions : [];
        this.loadReadSet();
        this.lastUpdated = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
      this.loading = false;
    },

    reload() {
      this.load(true);
    },

    get filtered() {
      if (!this.filterUnread) return this.items;
      return this.items.filter((it) => !this.isRead(it.id));
    },

    // ---- Tandai sudah dibacakan (lokal) ----
    storageKey() {
      return 'tms_read_' + (this.session ? this.session.id : 'none');
    },
    loadReadSet() {
      try {
        this.readSet = JSON.parse(localStorage.getItem(this.storageKey()) || '{}');
      } catch (_) {
        this.readSet = {};
      }
    },
    isRead(id) {
      return !!this.readSet[id];
    },
    toggleRead(id) {
      if (this.readSet[id]) delete this.readSet[id];
      else this.readSet[id] = true;
      localStorage.setItem(this.storageKey(), JSON.stringify(this.readSet));
    },

    time(iso) {
      if (!iso) return '';
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    },
  }));
});
