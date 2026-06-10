/**
 * admin/answer.js
 * ------------------------------------------------------------------
 * Logika halaman tulis jawaban (answer.html?id=Q0001):
 * - Memuat pertanyaan via adminQuestions (role-aware) lalu cari by id.
 * - Simpan draft / simpan jawaban final / (admin) simpan & publikasikan.
 * ------------------------------------------------------------------
 */
document.addEventListener('alpine:init', () => {
  Alpine.data('answerPage', () => ({
    id: '',
    item: null,
    answer: '',
    loading: true,
    saving: false,

    get isAdmin() {
      return this.$store.auth.isAdmin;
    },

    async init() {
      this.id = UI.param('id');
      if (!this.id) { this.loading = false; return; }
      await this.load();
    },

    async load() {
      this.loading = true;
      const res = await API.adminQuestions({});
      if (res && res.ok && Array.isArray(res.data)) {
        this.item = res.data.find((q) => q.id === this.id) || null;
        if (this.item) this.answer = this.item.answer || '';
      }
      this.loading = false;
    },

    async save(draft) {
      if (!draft && !this.answer.trim()) return;
      this.saving = true;
      const res = await API.saveAnswer({ id: this.id, answer: this.answer, draft: draft });
      this.saving = false;
      if (res && res.ok) {
        UI.toast(draft ? 'Draft tersimpan.' : 'Jawaban tersimpan.', 'success');
        await this.load();
      } else {
        UI.toast((res && res.message) || 'Gagal menyimpan.', 'error');
      }
    },

    async saveAndPublish() {
      if (!this.answer.trim()) return;
      this.saving = true;
      const save = await API.saveAnswer({ id: this.id, answer: this.answer, draft: false });
      if (!save || !save.ok) {
        this.saving = false;
        UI.toast((save && save.message) || 'Gagal menyimpan jawaban.', 'error');
        return;
      }
      const pub = await API.publishQuestion(this.id);
      this.saving = false;
      if (pub && pub.ok) {
        UI.toast('Jawaban dipublikasikan.', 'success');
        await this.load();
      } else {
        UI.toast((pub && pub.message) || 'Tersimpan, tapi gagal publikasi.', 'error');
      }
    },
  }));
});
