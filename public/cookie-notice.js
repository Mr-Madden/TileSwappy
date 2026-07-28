/*
 * A lightweight, sitewide cookie/ads notice banner -- self-contained
 * (injects its own styles) so a single <script src="/cookie-notice.js">
 * tag works on every page, including index.html, which doesn't load
 * site-chrome.css/js (it has its own separate React-driven UI).
 *
 * This is a NOTICE, not a full IAB TCF consent-management platform --
 * it informs visitors and remembers dismissal, but it does not block
 * Google AdSense's script from loading before the notice is dismissed.
 * For EEA/UK traffic specifically, Google's own EU User Consent Policy
 * expects a proper consent gate; the sanctioned way to get that without
 * hand-rolling a CMP is enabling "Privacy & messaging" (Funding Choices)
 * in the AdSense dashboard under Settings, which integrates with
 * Google's ad tags directly. This banner is a good-faith, low-risk
 * baseline on top of that, not a replacement for it.
 */
(function () {
  var STORAGE_KEY = 'tileswappy_cookie_notice_ack';

  try {
    if (localStorage.getItem(STORAGE_KEY) === 'true') return;
  } catch (e) {
    return;
  }

  function init() {
    var style = document.createElement('style');
    style.textContent =
      '#cookie-notice {' +
        'position: fixed; left: 0; right: 0; bottom: 0; z-index: 9999;' +
        'background: rgb(var(--color-navy-dark, 10 20 32));' +
        'color: rgb(var(--color-offwhite, 244 244 244));' +
        'border-top: 2px solid rgb(var(--color-teal-dark, 31 163 154) / 0.4);' +
        'padding: 0.9rem 1rem;' +
        'display: flex; flex-wrap: wrap; align-items: center; justify-content: center;' +
        'gap: 0.75rem 1.5rem;' +
        'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;' +
        'font-size: 0.85rem;' +
        'box-shadow: 0 -4px 16px rgba(0,0,0,0.25);' +
      '}' +
      '#cookie-notice p { margin: 0; max-width: 640px; line-height: 1.5; color: rgb(var(--color-offwhite, 244 244 244) / 0.85); }' +
      '#cookie-notice a { color: rgb(var(--color-teal-dark, 31 163 154)); font-weight: 600; text-decoration: none; }' +
      '#cookie-notice a:hover { text-decoration: underline; }' +
      '#cookie-notice button {' +
        'flex-shrink: 0; background: rgb(var(--color-teal-dark, 31 163 154));' +
        'color: rgb(var(--color-navy, 13 27 42)); border: none; border-radius: 8px;' +
        'padding: 0.55rem 1.2rem; font-weight: 700; font-size: 0.85rem; cursor: pointer;' +
      '}' +
      '#cookie-notice button:hover { opacity: 0.9; }';
    document.head.appendChild(style);

    var banner = document.createElement('div');
    banner.id = 'cookie-notice';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookie notice');
    banner.innerHTML =
      '<p>TileSwappy uses cookies to save your progress and to show ads through Google AdSense, which may use cookies to personalize ads. See our <a href="/privacy.html">Privacy Policy</a> for details and opt-out options.</p>' +
      '<button type="button">Got it</button>';

    document.body.appendChild(banner);

    banner.querySelector('button').addEventListener('click', function () {
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
      } catch (e) {
        // ignore -- worst case the banner reappears next visit
      }
      banner.remove();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
