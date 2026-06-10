/**
 * admin/questions.js
 * ------------------------------------------------------------------
 * Logika halaman kelola pertanyaan:
 * - Memuat daftar (admin: semua; ustadz: yang ditugaskan).
 * - Search & filter status di sisi klien.
 * - Aksi: assign ustadz (modal), publish, unpublish, hapus.
 * ------------------------------------------------------------------
 */
document.addEventListener('alpine:init', () => {
  Alpine.data('questionsPage', () => ({
    all: [],
    filtered: [],
    loading: true,
    saving: false,
    q: '',
    status: '',
    ustadzList: [],

    // Modal assign
    assignModal: false,
    current: null,
    assignEmail: '',

    get isAdmin() {
      return this.$store.auth.isAdmin;
    },

    async init() {
      // Prefill status dari query (?status=Pending)
      this.status = UI.param('status');
      await this.load();
      if (this.isAdmin) await this.loadUstadz();
    },

    async load() {
      this.loading = true;
      const res = await API.adminQuestions({});
      this.all = res && res.ok && Array.isArray(res.data) ? res.data : [];
      this.apply();
      this.loading = false;
    },

    async loadUstadz() {
      const res = await API.listUsers();
      if (res && res.ok && Array.isArray(res.data)) {
        this.ustadzList = res.data.filter((u) => u.role === 'ustadz' && u.active);
      }
    },

    apply() {
      const term = this.q.trim().toLowerCase();
      const myEmail = this.$store?.auth?.user?.email || '';
      this.filtered = this.all.filter((it) => {
        const matchStatus = !this.status || it.status === this.status;
        const hay = ((it.title || '') + ' ' + (it.question || '') + ' ' + (it.author_name || '')).toLowerCase();
        const matchTerm = !term || hay.includes(term);
        // Untuk ustadz: tampilkan pertanyaan yang ditujukan ke mereka
        // ATAU pertanyaan yang belum punya preferensi ustadz (open for all)
        const matchUstadz = this.isAdmin
          || !it.ustadz_preference
          || it.ustadz_preference === myEmail;
        return matchStatus && matchTerm && matchUstadz;
      });
    },

    openAssign(item) {
      this.current = item;
      this.assignEmail = item.ustadz_email || '';
      this.assignModal = true;
    },

    async doAssign() {
      if (!this.assignEmail) return;
      this.saving = true;
      const res = await API.assignUstadz({ id: this.current.id, ustadz_email: this.assignEmail });
      this.saving = false;
      if (res && res.ok) {
        UI.toast('Ustadz ditugaskan.', 'success');
        this.assignModal = false;
        await this.load();
      } else {
        UI.toast((res && res.message) || 'Gagal menugaskan.', 'error');
      }
    },

    async publish(item) {
      const res = await API.publishQuestion(item.id);
      if (res && res.ok) { UI.toast('Dipublikasikan.', 'success'); await this.load(); }
      else UI.toast((res && res.message) || 'Gagal publikasi.', 'error');
    },

    async unpublish(item) {
      const res = await API.unpublishQuestion(item.id);
      if (res && res.ok) { UI.toast('Publikasi dibatalkan.', 'success'); await this.load(); }
      else UI.toast((res && res.message) || 'Gagal.', 'error');
    },

    async remove(item) {
      if (!confirm('Hapus pertanyaan "' + item.title + '"? Tindakan ini permanen.')) return;
      const res = await API.deleteQuestion(item.id);
      if (res && res.ok) { UI.toast('Pertanyaan dihapus.', 'success'); await this.load(); }
      else UI.toast((res && res.message) || 'Gagal menghapus.', 'error');
    },
  }));
});
