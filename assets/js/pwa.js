/**
 * pwa.js
 * ------------------------------------------------------------------
 * Mendaftarkan service worker untuk caching aset statis.
 * Dimuat di halaman publik. Gagal mendaftar tidak mengganggu situs.
 * ------------------------------------------------------------------
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {
      /* abaikan: situs tetap berfungsi tanpa SW */
    });
  });
}
