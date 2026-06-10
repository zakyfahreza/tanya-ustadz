/**
 * detail.js
 * ------------------------------------------------------------------
 * Logika halaman detail jawaban (q.html?slug=...):
 * - Ambil detail by slug (backend menambah hitungan views).
 * - Render pertanyaan & jawaban (aman via UI.nl2br).
 * - Set meta tags (title, description, OG) & Schema FAQPage dinamis.
 * - Tampilkan 5 pertanyaan terkait (kategori sama).
 * - Tombol bagikan (Web Share API + fallback) & WhatsApp.
 * ------------------------------------------------------------------
 */
document.addEventListener('alpine:init', () => {
  const cfg = window.APP_CONFIG;

  Alpine.data('detailPage', () => ({
    item: null,
    related: [],
    loading: true,
    askedBy: '',
    waLink: '#',

    async init() {
      const slug = UI.param('slug');
      const id = UI.param('id');
      if (!slug && !id) {
        this.loading = false;
        return;
      }

      const res = slug ? await API.questionBySlug(slug) : await API.questionById(id);
      if (res && res.ok && res.data && res.data.question) {
        this.item = res.data.question;
        this.related = Array.isArray(res.data.related) ? res.data.related : [];
        this.applyMeta();
      }
      this.loading = false;
    },

    applyMeta() {
      const it = this.item;
      document.title = it.title + ' — Tanya Muslim Solo';
      const desc = UI.excerpt(it.answer, 155);
      const url = cfg.PUBLIC_URL + '/q.html?slug=' + encodeURIComponent(it.slug);

      const set = (id, attr, val) => {
        const el = document.getElementById(id);
        if (el) el.setAttribute(attr, val);
      };
      set('meta-desc', 'content', desc);
      set('meta-canonical', 'href', url);
      set('og-title', 'content', it.title);
      set('og-desc', 'content', desc);

      // Penanya
      if (it.anonymous || !it.author_name) {
        this.askedBy = 'Ditanyakan secara anonim';
      } else {
        this.askedBy = 'Ditanyakan oleh ' + it.author_name + (it.author_city ? ' — ' + it.author_city : '');
      }

      // Link share WhatsApp
      this.waLink =
        'https://wa.me/?text=' + encodeURIComponent(it.title + '\n' + url);

      // Schema FAQPage
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: it.title,
            acceptedAnswer: {
              '@type': 'Answer',
              text: UI.excerpt(it.answer, 5000),
            },
          },
        ],
      };
      const tag = document.getElementById('faq-schema');
      if (tag) tag.textContent = JSON.stringify(schema);
    },

    async share() {
      const url = window.location.href;
      if (navigator.share) {
        try {
          await navigator.share({ title: this.item.title, url });
          return;
        } catch (_) {
          /* dibatalkan */
        }
      }
      try {
        await navigator.clipboard.writeText(url);
        UI.toast('Tautan disalin ke clipboard.', 'success');
      } catch (_) {
        UI.toast('Gagal menyalin tautan.', 'error');
      }
    },
  }));
});
