/* js/promo.js — left-edge promo column. Owned by Dev 4 (Promo Column).
   Mounts one container into #promo-root (positioned by css/main.css; the
   root is click-through, .tb-promo re-enables pointer events). Four
   cards: the boring.notch DOWNLOAD card (the star), a Discord invite
   banner, a theboringoffice banner, and a yellow sticky note (the whole
   note links to office.theboring.name). All outbound hrefs come from
   window.TB_CONFIG.links and degrade to '#' (discord degrades to a
   non-interactive "invite soon" pill; the sticky note falls back to its
   hardcoded URL) when config is absent — zero console errors either way. */
(function () {
  'use strict';

  /* ---------- static data ---------- */

  var ICON_SRC = 'assets/icons/boring-notch.png';

  /* sticky note target — same URL as TB_CONFIG.links.office; hardcoded
     fallback so the note still links out when config never loads */
  var STICKY_URL = 'https://office.theboring.name';

  /* Inline SVG down-arrow for the download button (no emoji — this glyph
     is what the bob keyframes animate). */
  var DOWN_ARROW_SVG =
    '<svg class="tb-promo-download-glyph" viewBox="0 0 24 24" width="16" ' +
    'height="16" fill="none" stroke="currentColor" stroke-width="2.6" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M12 4v13"/><path d="M6 12l6 6 6-6"/></svg>';

  /* ---------- dom + config helpers ---------- */

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined && text !== null) { node.textContent = text; }
    return node;
  }

  /* window.TB_CONFIG.links, or {} when config never loaded. */
  function configLinks() {
    var cfg =
      (typeof window.TB_CONFIG !== 'undefined' && window.TB_CONFIG) || {};
    return cfg.links || {};
  }

  /* Trimmed non-empty link value, else ''. */
  function link(links, key) {
    var v = links[key];
    return (typeof v === 'string' && v.trim()) ? v : '';
  }

  /* Point an anchor at a real outbound URL (new tab, noopener) or at the
     inert '#' fallback (no target — a blank new tab would be noise). */
  function outbound(a, url) {
    if (url) {
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
    } else {
      a.href = '#';
    }
    return a;
  }

  /* ---------- 1. download card (the star) ---------- */

  function renderDownload(links) {
    var card = el('section', 'tb-promo-card tb-promo-card--download');

    var head = el('div', 'tb-promo-dl-head');
    var icon = el('img', 'tb-promo-dl-icon');
    icon.src = ICON_SRC;
    icon.alt = 'boring.notch app icon';
    head.appendChild(icon);

    var titles = el('div', 'tb-promo-dl-titles');
    titles.appendChild(el('div', 'tb-promo-dl-title', 'boring.notch'));
    titles.appendChild(
      el('div', 'tb-promo-dl-sub', 'for macOS · Free & Open Source'));
    head.appendChild(titles);
    card.appendChild(head);

    var btn =
      outbound(el('a', 'tb-promo-download-btn'), link(links, 'githubReleases'));
    btn.innerHTML = DOWN_ARROW_SVG;
    btn.appendChild(document.createTextNode('Download'));
    card.appendChild(btn);

    var meta = el('div', 'tb-promo-dl-meta');
    var ver = el('span', 'tb-promo-dl-version', '… · Universal');
    meta.appendChild(ver);
    if (typeof window.TB_CONFIG === 'object' && window.TB_CONFIG &&
        typeof window.TB_CONFIG.getLatestTag === 'function') {
      window.TB_CONFIG.getLatestTag(function (tag) {
        ver.textContent = tag + ' · Universal';
      });
    }
    meta.appendChild(
      outbound(el('a', 'tb-promo-dl-github', 'GitHub ↗'), link(links, 'github')));
    card.appendChild(meta);

    return card;
  }

  /* ---------- 2. discord banner ---------- */

  function renderDiscord(links) {
    var card = el('section', 'tb-promo-card tb-promo-card--discord');
    card.appendChild(el('span', 'tb-promo-discord-emoji', '💬'));

    var text = el('div', 'tb-promo-banner-text');
    text.appendChild(
      el('div', 'tb-promo-banner-title', 'Join the boring Discord'));
    text.appendChild(el('div', 'tb-promo-banner-sub',
      'lofi, code & questionable life choices'));
    card.appendChild(text);

    var url = link(links, 'discord');
    if (url) {
      card.appendChild(
        outbound(el('a', 'tb-promo-discord-pill', 'Join ↗'), url));
    } else {
      /* invite missing → non-interactive placeholder, no href anywhere */
      card.appendChild(
        el('span', 'tb-promo-discord-pill tb-promo-discord-pill--soon',
          'invite soon'));
    }
    return card;
  }

  /* ---------- 3. theboringoffice banner ---------- */

  function renderOffice(links) {
    var card = el('section', 'tb-promo-card tb-promo-card--office');
    card.style.cursor = 'pointer';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', 'Open theboringoffice in a window');
    card.appendChild(el('span', 'tb-promo-office-emoji', '🏢'));

    var text = el('div', 'tb-promo-banner-text');
    text.appendChild(el('div', 'tb-promo-banner-title', 'theboringoffice'));
    text.appendChild(el('div', 'tb-promo-banner-sub',
      'AI agents that run your boring work'));
    card.appendChild(text);

    card.appendChild(outbound(
      el('a', 'tb-promo-office-link', 'office.theboring.name ↗'),
      link(links, 'office')));

    /* card body → open the in-page window; the ↗ link stays outbound */
    function openWindow() {
      window.dispatchEvent(new CustomEvent('tb:open-app', { detail: { app: 'office' } }));
    }
    card.addEventListener('click', function (e) {
      if (e.target.closest('a')) { return; }
      openWindow();
    });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openWindow(); }
    });
    return card;
  }

  /* ---------- 4. sticky note (the whole note is one outbound link) ---------- */

  function renderSticky(links) {
    var note = outbound(
      el('a', 'tb-promo-card tb-promo-card--sticky'),
      link(links, 'office') || STICKY_URL);

    /* 📌 straddles the top edge via negative margin (see css/promo.css) */
    note.appendChild(el('span', 'tb-promo-sticky-pin', '📌'));

    var text = el('div', 'tb-promo-sticky-text');
    text.appendChild(
      el('div', 'tb-promo-sticky-line', 'built with 💛 by the majdoors'));
    text.appendChild(
      el('div', 'tb-promo-sticky-url', 'office.theboring.name'));
    note.appendChild(text);

    return note;
  }

  /* ---------- mount ---------- */

  function init() {
    var root = document.getElementById('promo-root');
    if (!root) { return; }

    var links = configLinks();
    var col = el('div', 'tb-promo');
    col.appendChild(renderDownload(links));
    col.appendChild(renderDiscord(links));
    col.appendChild(renderOffice(links));
    col.appendChild(renderSticky(links));
    root.appendChild(col);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
