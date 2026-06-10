/**
 * admin/login.js
 * ------------------------------------------------------------------
 * Logika halaman login admin/ustadz. Memverifikasi kredensial ke
 * backend, menyimpan sesi (token) lalu mengarahkan ke dashboard.
 * ------------------------------------------------------------------
 */
document.addEventListener('alpine:init', () => {
  Alpine.data('adminLogin', () => ({
    username: '',
    password: '',
    show: false,
    loading: false,

    init() {
      // Bila sudah login, langsung ke dashboard
      this.$store.auth.init();
      if (this.$store.auth.isLoggedIn) {
        window.location.href = '/admin/dashboard.html';
      }
    },

    async submit() {
      if (!this.username || !this.password) return;
      this.loading = true;
      const res = await API.login(this.username.trim(), this.password);
      this.loading = false;

      if (res && res.ok && res.data && res.data.token) {
        this.$store.auth.set(res.data);
        UI.toast('Selamat datang, ' + res.data.name + '!', 'success');
        setTimeout(() => (window.location.href = '/admin/dashboard.html'), 400);
      } else {
        UI.toast((res && res.message) || 'Gagal masuk.', 'error');
        this.password = '';
      }
    },
  }));
});
