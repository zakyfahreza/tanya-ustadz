/**
 * admin/users.js
 * ------------------------------------------------------------------
 * Logika halaman kelola pengguna (admin only):
 * - List user, tambah, edit (password opsional saat edit), hapus.
 * ------------------------------------------------------------------
 */
document.addEventListener('alpine:init', () => {
  Alpine.data('usersPage', () => ({
    users: [],
    loading: true,
    saving: false,
    modal: false,
    editing: false,
    form: { email: '', name: '', role: 'ustadz', password: '', active: true },

    async load() {
      this.loading = true;
      const res = await API.listUsers();
      this.users = res && res.ok && Array.isArray(res.data) ? res.data : [];
      this.loading = false;
    },

    openCreate() {
      this.editing = false;
      this.form = { email: '', name: '', role: 'ustadz', password: '', active: true };
      this.modal = true;
    },

    openEdit(u) {
      this.editing = true;
      this.form = { email: u.email, name: u.name, role: u.role, password: '', active: u.active };
      this.modal = true;
    },

    async save() {
      if (!this.form.email || !this.form.name) {
        UI.toast('Email dan nama wajib diisi.', 'error');
        return;
      }
      this.saving = true;
      const res = await API.saveUser(this.form);
      this.saving = false;
      if (res && res.ok) {
        UI.toast('Tersimpan.', 'success');
        this.modal = false;
        await this.load();
      } else {
        UI.toast((res && res.message) || 'Gagal menyimpan.', 'error');
      }
    },

    async remove(u) {
      if (!confirm('Hapus pengguna ' + u.name + '?')) return;
      const res = await API.deleteUser(u.email);
      if (res && res.ok) { UI.toast('Pengguna dihapus.', 'success'); await this.load(); }
      else UI.toast((res && res.message) || 'Gagal menghapus.', 'error');
    },
  }));
});
