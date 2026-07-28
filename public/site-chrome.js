/*
 * Injects the shared header/footer/breadcrumb/table-of-contents into
 * every static marketing page's mount points. Kept as one file instead
 * of copy-pasting this markup into nine pages -- see site-chrome.css
 * for the matching styles and public/index.html's data-theme sync
 * script for why the same theme-sync snippet also needs to be repeated
 * as an early inline <script> per-page (this file runs too late in
 * <body> to prevent that specific flash, so it's duplicated there
 * deliberately).
 */
(function () {
  var NAV_LINKS = [
    { href: '/index.html', label: 'Play' },
    { href: '/how-to-play.html', label: 'How to Play' },
    { href: '/faq.html', label: 'FAQ' },
    { href: '/blog/5-strategies.html', label: 'Blog' },
    { href: '/about.html', label: 'About' },
    { href: '/support.html', label: 'Support' }
  ];

  // Breadcrumb trail per page, keyed by pathname -- the middle "Blog"
  // crumb points at the first post since there's no blog index page,
  // matching the header nav's own "Blog" link target.
  var BREADCRUMBS = {
    '/about.html': [{ label: 'About' }],
    '/faq.html': [{ label: 'FAQ' }],
    '/how-to-play.html': [{ label: 'How to Play' }],
    '/support.html': [{ label: 'Support' }],
    '/terms.html': [{ label: 'Terms of Service' }],
    '/privacy.html': [{ label: 'Privacy Policy' }],
    '/blog/5-strategies.html': [
      { label: 'Blog', href: '/blog/5-strategies.html' },
      { label: '5 Winning Strategies' }
    ],
    '/blog/gradient-science.html': [
      { label: 'Blog', href: '/blog/5-strategies.html' },
      { label: 'Science of Gradients' }
    ]
  };

  function isActive(href) {
    var path = window.location.pathname;
    if (href === '/index.html') return path === '/' || path === '/index.html';
    return path === href;
  }

  function renderHeader() {
    var mount = document.getElementById('site-header');
    if (!mount) return;

    var navHtml = NAV_LINKS.map(function (link) {
      var current = isActive(link.href) ? ' aria-current="page"' : '';
      return '<a href="' + link.href + '"' + current + '>' + link.label + '</a>';
    }).join('');

    mount.innerHTML =
      '<header class="site-header">' +
        '<div class="site-header__inner">' +
          '<a href="/index.html" class="site-header__brand">' +
            '<span class="site-header__logo" aria-hidden="true"><span></span><span></span><span></span><span class="accent"></span></span>' +
            '<span class="site-header__name">TileSwappy</span>' +
          '</a>' +
          '<nav class="site-header__nav">' + navHtml + '</nav>' +
        '</div>' +
      '</header>';
  }

  function renderFooter() {
    var mount = document.getElementById('site-footer');
    if (!mount) return;

    mount.innerHTML =
      '<footer class="site-footer">' +
        '<div class="site-footer__content">' +
          '<div class="site-footer__top">' +
            '<div class="site-footer__brand">' +
              '<div class="site-footer__logo" aria-hidden="true"><span></span><span></span><span></span><span class="accent"></span></div>' +
              '<div>' +
                '<p class="site-footer__name">TileSwappy</p>' +
                '<p class="site-footer__tagline">One puzzle a day. No account needed.</p>' +
              '</div>' +
            '</div>' +
            '<div class="site-footer__columns">' +
              '<div>' +
                '<h4>Play</h4>' +
                '<ul>' +
                  '<li><a href="/index.html#calendar">Today\'s Puzzle</a></li>' +
                  '<li><a href="/index.html#archive">Puzzle Archive</a></li>' +
                '</ul>' +
              '</div>' +
              '<div>' +
                '<h4>Learn</h4>' +
                '<ul>' +
                  '<li><a href="/how-to-play.html">How to Play</a></li>' +
                  '<li><a href="/faq.html">FAQ</a></li>' +
                  '<li><a href="/blog/5-strategies.html">5 Winning Strategies</a></li>' +
                  '<li><a href="/blog/gradient-science.html">Science of Gradients</a></li>' +
                '</ul>' +
              '</div>' +
              '<div>' +
                '<h4>Company</h4>' +
                '<ul>' +
                  '<li><a href="/about.html">About TileSwappy</a></li>' +
                  '<li><a href="/support.html">Support</a></li>' +
                  '<li><a href="https://www.tiktok.com/@tileswappy" target="_blank" rel="noopener">TikTok</a></li>' +
                '</ul>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="site-footer__bottom">' +
          '<p>&copy; 2025 Mad_Den Gaming Co. All rights reserved.</p>' +
          '<div class="site-footer__legal">' +
            '<a href="/privacy.html">Privacy</a>' +
            '<a href="/terms.html">Terms</a>' +
          '</div>' +
        '</div>' +
      '</footer>';
  }

  function renderBreadcrumb() {
    var trail = BREADCRUMBS[window.location.pathname];
    if (!trail) return;

    var shell = document.querySelector('.page-shell');
    if (!shell) return;

    var crumbs = [{ label: 'Home', href: '/index.html' }].concat(trail);

    var html = crumbs
      .map(function (crumb, i) {
        var isLast = i === crumbs.length - 1;
        var piece = crumb.href && !isLast
          ? '<a href="' + crumb.href + '">' + crumb.label + '</a>'
          : '<span aria-current="page">' + crumb.label + '</span>';
        return i === 0 ? piece : '<span class="breadcrumb__sep">/</span>' + piece;
      })
      .join('');

    var nav = document.createElement('nav');
    nav.className = 'breadcrumb';
    nav.setAttribute('aria-label', 'Breadcrumb');
    nav.innerHTML = html;
    shell.insertBefore(nav, shell.firstChild);

    // BreadcrumbList structured data -- helps Google show the breadcrumb
    // trail directly in search results instead of a raw URL.
    var origin = 'https://www.tileswappy.com';
    var itemListElement = crumbs.map(function (crumb, i) {
      return {
        '@type': 'ListItem',
        position: i + 1,
        name: crumb.label,
        item: origin + (crumb.href || window.location.pathname)
      };
    });
    var ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: itemListElement
    });
    document.head.appendChild(ld);
  }

  // Auto-builds an "On This Page" jump-nav from a page's own top-level
  // <h2> headings -- only kicks in once a page has enough sections to
  // actually be worth navigating (5+), so short pages are left alone.
  function slugify(text, used) {
    var base = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    if (!base) base = 'section';
    var slug = base;
    var i = 2;
    while (used[slug] || document.getElementById(slug)) {
      slug = base + '-' + i;
      i++;
    }
    used[slug] = true;
    return slug;
  }

  function renderTOC() {
    var card = document.querySelector('.page-card');
    if (!card) return;

    var headings = Array.prototype.filter.call(card.children, function (el) {
      return el.tagName === 'H2';
    });
    if (headings.length < 5) return;

    var used = {};
    var items = headings.map(function (h) {
      var id = h.id || slugify(h.textContent, used);
      h.id = id;
      return '<li><a href="#' + id + '">' + h.textContent + '</a></li>';
    });

    var toc = document.createElement('nav');
    toc.className = 'toc';
    toc.setAttribute('aria-label', 'Table of contents');
    toc.innerHTML = '<p class="toc__title">On This Page</p><ol>' + items.join('') + '</ol>';

    card.insertBefore(toc, headings[0]);
  }

  renderHeader();
  renderFooter();
  renderBreadcrumb();
  renderTOC();
})();
