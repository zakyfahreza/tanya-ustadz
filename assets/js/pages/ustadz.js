/**
 * ustadz.js
 * ------------------------------------------------------------------
 * Logika halaman profil ustadz (ustadz.html?email=...):
 * - Ambil profil ustadz + daftar jawaban terpublikasinya.
 * - Tampilkan inisial sebagai avatar sederhana.
 * ------------------------------------------------------------------
 */
document.addEventListener('alpine:init', () => {
  Alpine.data('ustadzPage', () => ({
    profile: null,
    answers: [],
    loading: true,
    initials: '',

    async init() {
      const email = UI.param('email');
      if (!email) {
        this.loading = false;
        return;
      }
      const res = await API.ustadz(email);
      if (res && res.ok && res.data && res.data.profile) {
        this.profile = res.data.profile;
        this.answers = Array.isArray(res.data.answers) ? res.data.answers : [];
        this.initials = this.makeInitials(this.profile.name);
        document.title = this.profile.name + ' — Tanya Muslim Solo';
      }
      this.loading = false;
    },

    makeInitials(name) {
      if (!name) return 'U';
      return name
        .replace(/ustadz/gi, '')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();
    },
  }));
});
