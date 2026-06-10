/**
 * home.js
 * ------------------------------------------------------------------
 * Logika halaman utama (index.html):
 * - questionForm(): form kirim pertanyaan + validasi sisi klien
 * - latestList(): muat 10 jawaban terbaru + search realtime + filter
 *
 * Didaftarkan sebagai komponen Alpine via event 'alpine:init'.
 * ------------------------------------------------------------------
 */
document.addEventListener('alpine:init', () => {
  const cfg = window.APP_CONFIG;
  const V = cfg.VALIDATION;

  /* ---------- Form Pertanyaan ---------- */
  Alpine.data('questionForm', () => ({
    categories: cfg.CATEGORIES,
    loading: false,
    form: {
      author_name: '',
      author_city: '',
      category: cfg.CATEGORIES[1] || cfg.CATEGORIES[0], // default "Fiqih"
      title: '',
      question: '',
      anonymous: false,
    },
    errors: { title: '', question: '' },

    validate() {
      this.errors.title = '';
      this.errors.question = '';
      let ok = true;
      const t = this.form.title.trim();
      const q = this.form.question.trim();

      if (t.length < V.TITLE_MIN) {
        this.errors.title = `Judul minimal ${V.TITLE_MIN} karakter.`;
        ok = false;
      } else if (t.length > V.TITLE_MAX) {
        this.errors.title = `Judul maksimal ${V.TITLE_MAX} karakter.`;
        ok = false;
      }
      if (q.length < V.QUESTION_MIN) {
        this.errors.question = `Pertanyaan minimal ${V.QUESTION_MIN} karakter.`;
        ok = false;
      } else if (q.length > V.QUESTION_MAX) {
        this.errors.question = `Pertanyaan maksimal ${V.QUESTION_MAX} karakter.`;
        ok = false;
      }
      return ok;
    },

    async submit() {
      if (!this.validate()) {
        UI.toast('Mohon perbaiki isian yang ditandai.', 'error');
        return;
      }
      this.loading = true;
      const payload = {
        title: this.form.title.trim(),
        question: this.form.question.trim(),
        category: this.form.category,
        author_name: this.form.anonymous ? '' : this.form.author_name.trim(),
        author_city: this.form.author_city.trim(),
        anonymous: this.form.anonymous,
      };
      // Bila dibuka via QR sesi (?sesi=Sxxxx), kaitkan pertanyaan ke sesi itu.
      // Bila tidak, backend otomatis memakai sesi yang sedang aktif.
      const sesi = UI.param('sesi');
      if (sesi) payload.session_id = sesi;
      const res = await API.submitQuestion(payload);
      this.loading = false;

      if (res && res.ok) {
        UI.toast('Pertanyaan terkirim. Jazaakallahu khairan!', 'success');
        // reset form
        this.form.title = '';
        this.form.question = '';
        this.form.author_name = '';
        this.form.author_city = '';
        this.form.anonymous = false;
      } else {
        UI.toast((res && res.message) || 'Gagal mengirim pertanyaan.', 'error');
      }
    },
  }));

  /* ---------- Daftar Jawaban Terbaru + Search/Filter ---------- */
  Alpine.data('latestList', () => ({
    categories: cfg.CATEGORIES,
    items: [],
    filtered: [],
    loading: true,
    q: '',
    cat: '',

    async load() {
      this.loading = true;
      const res = await API.latestQuestions();
      this.items = res && res.ok && Array.isArray(res.data) ? res.data : [];
      this.apply();
      this.loading = false;
    },

    setCat(c) {
      this.cat = c;
      this.apply();
    },

    apply() {
      const term = this.q.trim().toLowerCase();
      this.filtered = this.items.filter((it) => {
        const matchCat = !this.cat || it.category === this.cat;
        const haystack = (
          (it.title || '') + ' ' + (it.answer || '') + ' ' + (it.question || '')
        ).toLowerCase();
        const matchTerm = !term || haystack.includes(term);
        return matchCat && matchTerm;
      });
    },
  }));
});
