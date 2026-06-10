/**
 * arsip.js
 * ------------------------------------------------------------------
 * Logika halaman arsip (arsip.html):
 * - Ambil seluruh pertanyaan terpublikasi.
 * - Search, filter kategori, sort (terbaru/terlama).
 * - Pagination sisi-klien (PAGE_SIZE dari config).
 *
 * Catatan: arsip mengambil semua data sekali lalu memfilter di klien.
 * Untuk skala besar, backend juga mendukung pagination via parameter,
 * namun pendekatan klien ini paling sederhana & responsif untuk
 * volume pertanyaan kajian pada umumnya.
 * ------------------------------------------------------------------
 */
document.addEventListener('alpine:init', () => {
  const cfg = window.APP_CONFIG;

  Alpine.data('arsipPage', () => ({
    categories: cfg.CATEGORIES,
    all: [],
    filtered: [],
    paged: [],
    loading: true,
    q: '',
    cat: '',
    sort: 'newest',
    page: 1,
    pageSize: cfg.PAGE_SIZE,
    totalPages: 1,

    async init() {
      // Prefill dari query string (mis. dari klik kategori di home)
      this.q = UI.param('q');
      this.cat = UI.param('cat');
      const res = await API.questions({ status: cfg.STATUS.PUBLISHED });
      this.all = res && res.ok && Array.isArray(res.data) ? res.data : [];
      this.loading = false;
      this.apply();
    },

    apply() {
      const term = this.q.trim().toLowerCase();
      let list = this.all.filter((it) => {
        const matchCat = !this.cat || it.category === this.cat;
        const haystack = ((it.title || '') + ' ' + (it.answer || '') + ' ' + (it.question || '')).toLowerCase();
        return matchCat && (!term || haystack.includes(term));
      });

      list.sort((a, b) => {
        const da = new Date(a.published_at || a.created_at).getTime();
        const db = new Date(b.published_at || b.created_at).getTime();
        return this.sort === 'oldest' ? da - db : db - da;
      });

      this.filtered = list;
      this.totalPages = Math.max(1, Math.ceil(list.length / this.pageSize));
      if (this.page > this.totalPages) this.page = this.totalPages;
      this.slice();
    },

    slice() {
      const start = (this.page - 1) * this.pageSize;
      this.paged = this.filtered.slice(start, start + this.pageSize);
    },

    reset() {
      this.page = 1;
      this.apply();
    },

    next() {
      if (this.page < this.totalPages) {
        this.page++;
        this.slice();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    prev() {
      if (this.page > 1) {
        this.page--;
        this.slice();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
  }));
});
