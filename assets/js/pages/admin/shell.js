/**
 * admin/shell.js
 * ------------------------------------------------------------------
 * Kerangka (shell) dashboard admin yang dipakai semua halaman admin:
 * - Proteksi akses (guard) — redirect ke login bila belum auth.
 * - Daftar menu navigasi (role-aware: menu admin disembunyikan bagi ustadz).
 * - Info user aktif + tombol logout.
 *
 * Dipakai sebagai x-data terluar: x-data="adminShell('questions')".
 * Item menu di-render via <template x-for="link in navLinks">.
 * ------------------------------------------------------------------
 */
document.addEventListener('alpine:init', () => {
  Alpine.data('adminShell', (active, requireAdmin = false) => ({
    active: active,
    sidebarOpen: false,

    boot() {
      this.$store.theme.init();
      this.$store.auth.init();
      // Guard akses
      if (!this.$store.auth.guard(requireAdmin)) return;
    },

    get user() {
      return this.$store.auth.user || {};
    },
    get isAdmin() {
      return this.$store.auth.isAdmin;
    },

    /** Menu navigasi; properti adminOnly menyaring untuk ustadz. */
    get navLinks() {
      const I = {
        dashboard: '<i class="ti ti-layout-dashboard text-xl"></i>',
        questions: '<i class="ti ti-messages text-xl"></i>',
        categories: '<i class="ti ti-tag text-xl"></i>',
        users: '<i class="ti ti-users text-xl"></i>',
      };
      const links = [
        { key: 'dashboard', label: 'Dashboard', short: 'Dashboard', icon: I.dashboard, href: '/admin/dashboard.html' },
        { key: 'questions', label: 'Pertanyaan', short: 'Pertanyaan', icon: I.questions, href: '/admin/questions.html' },
        { key: 'categories', label: 'Kategori & Kajian', short: 'Kategori', icon: I.categories, href: '/admin/categories.html', adminOnly: true },
        { key: 'users', label: 'Pengguna', short: 'Pengguna', icon: I.users, href: '/admin/users.html', adminOnly: true },
      ];
      return links.filter((l) => !l.hidden && (!l.adminOnly || this.isAdmin));
    },

    logout() {
      this.$store.auth.logout();
    },
  }));
});
