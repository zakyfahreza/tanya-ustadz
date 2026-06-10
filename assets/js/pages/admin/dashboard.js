/**
 * admin/dashboard.js
 * ------------------------------------------------------------------
 * Memuat statistik (GET stats) lalu menyusun kartu ringkasan dan
 * distribusi kategori untuk ditampilkan di dashboard.
 * ------------------------------------------------------------------
 */
document.addEventListener('alpine:init', () => {
  Alpine.data('dashboardPage', () => ({
    loading: true,
    stats: {},
    cards: [],
    categoryRows: [],

    async load() {
      const res = await API.stats();
      this.stats = res && res.ok ? res.data : {};
      this.buildCards();
      this.buildCategories();
      this.loading = false;
    },

    buildCards() {
      const s = this.stats;
      const ic = {
        total: '<i class="ti ti-archive text-3xl"></i>',
        pending: '<i class="ti ti-inbox text-3xl"></i>',
        answered: '<i class="ti ti-message-check text-3xl"></i>',
        published: '<i class="ti ti-world-check text-3xl"></i>',
      };
      this.cards = [
        { label: 'Total', icon: ic.total, value: s.total || 0, badge: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200' },
        { label: 'Pending', icon: ic.pending, value: s.pending || 0, badge: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200' },
        { label: 'Answered', icon: ic.answered, value: s.answered || 0, badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' },
        { label: 'Published', icon: ic.published, value: s.published || 0, badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' },
      ];
    },

    buildCategories() {
      const by = this.stats.byCategory || {};
      const entries = Object.keys(by).map((k) => ({ name: k, count: by[k] }));
      const max = entries.reduce((m, e) => Math.max(m, e.count), 0) || 1;
      entries.sort((a, b) => b.count - a.count);
      this.categoryRows = entries.map((e) => ({
        name: e.name,
        count: e.count,
        pct: Math.round((e.count / max) * 100),
      }));
    },
  }));
});
