/**
 * store.js
 * ------------------------------------------------------------------
 * State global Alpine.js. Didaftarkan sebelum Alpine init lewat event
 * 'alpine:init'. Menyediakan:
 * - $store.theme  : dark mode toggle (persist ke localStorage)
 * - $store.auth   : sesi login admin/ustadz (sessionStorage)
 * ------------------------------------------------------------------
 */
document.addEventListener('alpine:init', () => {
  const cfg = window.APP_CONFIG;

  // ---- Theme / Dark mode ----
  Alpine.store('theme', {
    dark: false,
    init() {
      const saved = localStorage.getItem(cfg.STORAGE.THEME);
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.dark = saved ? saved === 'dark' : prefersDark;
      this.apply();
    },
    toggle() {
      this.dark = !this.dark;
      localStorage.setItem(cfg.STORAGE.THEME, this.dark ? 'dark' : 'light');
      this.apply();
    },
    apply() {
      document.documentElement.classList.toggle('dark', this.dark);
    },
  });

  // ---- Auth (admin/ustadz) ----
  Alpine.store('auth', {
    user: null,
    init() {
      try {
        this.user = JSON.parse(sessionStorage.getItem(cfg.STORAGE.SESSION) || 'null');
      } catch (_) {
        this.user = null;
      }
    },
    get isLoggedIn() {
      return !!(this.user && this.user.token);
    },
    get isAdmin() {
      return this.user && this.user.role === 'admin';
    },
    get isUstadz() {
      return this.user && this.user.role === 'ustadz';
    },
    set(session) {
      this.user = session;
      sessionStorage.setItem(cfg.STORAGE.SESSION, JSON.stringify(session));
    },
    logout() {
      this.user = null;
      sessionStorage.removeItem(cfg.STORAGE.SESSION);
      window.location.href = '/admin/login.html';
    },
    /** Panggil di halaman admin; redirect ke login bila belum auth */
    guard(requireAdmin = false) {
      if (!this.isLoggedIn) {
        window.location.href = '/admin/login.html';
        return false;
      }
      if (requireAdmin && !this.isAdmin) {
        window.location.href = '/admin/dashboard.html';
        return false;
      }
      return true;
    },
  });
});
