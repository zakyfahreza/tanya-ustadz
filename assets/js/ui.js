/**
 * ui.js
 * ------------------------------------------------------------------
 * Kumpulan utilitas UI yang dipakai lintas halaman:
 * - Toast notification
 * - Format tanggal
 * - Escape HTML (anti-XSS saat render)
 * - Potong teks / ringkasan
 * - Badge warna kategori & status
 * ------------------------------------------------------------------
 */
window.UI = (function () {
  /** Escape karakter HTML agar aman ditampilkan via innerHTML */
  function escapeHtml(str) {
    if (str === undefined || str === null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /** Ubah newline jadi <br> setelah di-escape (untuk render isi jawaban) */
  function nl2br(str) {
    return escapeHtml(str).replace(/\n/g, '<br>');
  }

  /** Format tanggal ke "10 Jun 2026" */
  function formatDate(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  /** Ringkasan teks (strip tag + potong) */
  function excerpt(str, len = 160) {
    if (!str) return '';
    const clean = String(str).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    return clean.length > len ? clean.slice(0, len).trim() + '…' : clean;
  }

  /** Toast notification. type: success | error | info */
  let toastContainer = null;
  function ensureToastContainer() {
    if (toastContainer) return toastContainer;
    toastContainer = document.createElement('div');
    toastContainer.className =
      'fixed top-4 inset-x-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none';
    document.body.appendChild(toastContainer);
    return toastContainer;
  }

  function toast(message, type = 'success', timeout = 3500) {
    const c = ensureToastContainer();
    const colors = {
      success: 'bg-teal-600',
      error: 'bg-red-600',
      info: 'bg-slate-800',
    };
    const el = document.createElement('div');
    el.className =
      'pointer-events-auto max-w-sm w-full sm:w-auto text-white text-sm px-4 py-3 rounded-xl shadow-lg ' +
      'flex items-start gap-2 transition-all duration-300 translate-y-[-12px] opacity-0 ' +
      (colors[type] || colors.info);
    el.innerHTML =
      '<span class="font-medium">' + escapeHtml(message) + '</span>';
    c.appendChild(el);
    requestAnimationFrame(() => {
      el.classList.remove('translate-y-[-12px]', 'opacity-0');
    });
    setTimeout(() => {
      el.classList.add('opacity-0', 'translate-y-[-12px]');
      setTimeout(() => el.remove(), 300);
    }, timeout);
  }

  /** Warna badge per kategori (deterministik berdasarkan nama) */
  function categoryClass(cat) {
    const map = {
      Aqidah: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200',
      Fiqih: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
      Akhlak: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
      Muamalah: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
      Manhaj: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
      Ibadah: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
      Keluarga: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-200',
      Dakwah: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200',
      Lainnya: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
    };
    return map[cat] || map.Lainnya;
  }

  /** Warna badge per status (admin) */
  function statusClass(status) {
    const map = {
      Pending: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
      Assigned: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
      Answered: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
      Published: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    };
    return map[status] || map.Pending;
  }

  /** Ambil query param dari URL */
  function param(name) {
    return new URL(window.location.href).searchParams.get(name) || '';
  }

  return {
    escapeHtml,
    nl2br,
    formatDate,
    excerpt,
    toast,
    categoryClass,
    statusClass,
    param,
  };
})();
