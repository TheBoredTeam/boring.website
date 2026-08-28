/* js/notch.js — MacBook-style notch music player (the star feature).
   Music source: a Spotify playlist via Spotify's free keyless iframe Embed
   (no API keys, no OAuth). The embed is cross-origin, so playback control
   lives INSIDE Spotify's own iframe — there is no <audio> element and no
   custom transport bar. The collapsed pill shows the playlist's oEmbed
   title/artwork (fetched at runtime; emoji + fallback title when offline).
   States: collapsed = slim black pill (art + title + static EQ silhouette),
   expanded = floating panel (Spotify embed + week calendar + events).
   Mount: #notch-root (positioned by Dev A). Data: window.TB_CONFIG.music.
   Exposes window.TBMusic per shared contract v1 (transport fns are no-ops by
   design — the embed can't be driven from the parent page). Listens
   'tb:open-app' (app==='music' only); dispatches 'tb:music-state' with
   playing:false (real playback state inside the embed is unknowable). */
(function () {
  'use strict';

  var MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  var ICONS = {
    home: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
    tray: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>',
    mirror: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 3H3c-1.1 0-2 .9-2 2v3h2V5h18v14h-7v2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM1 18v3h3c0-1.66-1.34-3-3-3zm0-4v2c2.76 0 5 2.24 5 5h2c0-3.87-3.13-7-7-7zm0-4v2c4.97 0 9 4.03 9 9h2c0-6.08-4.93-11-11-11z"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>'
  };

  /* Canonical embed source; TB_CONFIG.music.embedUrl is the same URL, kept
     here as a fallback so a broken config key can't blank the player. */
  var FALLBACK_EMBED_URL = 'https://open.spotify.com/embed/playlist/2iFVkT5FwlAPxDpmAZIEQr?utm_source=generator';

  /* Battery outline + tip are static; the inner fill rect's width tracks level. */
  var BATTERY_SVG =
    '<svg class="tb-battery-icon" viewBox="0 0 27 13" aria-hidden="true">' +
    '<rect class="tb-battery-outline" x="0.5" y="0.5" width="22" height="12" rx="3.5"/>' +
    '<rect class="tb-battery-fill" x="2" y="2" width="19" height="9" rx="1.5"/>' +
    '<path class="tb-battery-tip" d="M24 4.5v4c1.2-.3 2-1 2-2s-.8-1.7-2-2z"/></svg>';

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(init);

  function init() {
    var mount = document.getElementById('notch-root');
    if (!mount) return; // mount point missing — degrade silently

    var cfg = (typeof window.TB_CONFIG !== 'undefined') ? window.TB_CONFIG : null;
    var music = (cfg && cfg.music) ? cfg.music : null;

    /* Config absent/unusable: static black pill + no-op API, zero console noise. */
    if (!music) {
      mount.innerHTML = '<div class="tb-notch tb-notch-static" aria-hidden="true"></div>';
      window.TBMusic = {
        play: function () {}, pause: function () {}, toggle: function () {},
        next: function () {}, prev: function () {}, setVolume: function () {},
        state: function () { return { playing: false, station: null }; }
      };
      return;
    }

    /* state */
    var expanded = false;
    var volume = 0.8; // tracked only so the menubar CC slider stays alive
    var embedUrl = (typeof music.embedUrl === 'string' && music.embedUrl) || FALLBACK_EMBED_URL;
    /* Pseudo-station reported to peers (menubar Control Center tile). The name
       upgrades to the real playlist title once the oEmbed fetch resolves. */
    var station = {
      id: 'spotify-playlist',
      name: music.fallbackTitle || 'Spotify Playlist',
      emoji: '🎧',
      grad: ['#191414', '#1DB954'] // Spotify ink → green
    };

    /* DOM */
    mount.innerHTML = [
      '<div class="tb-notch has-played" role="region" aria-label="Music player">',
      /* Collapsed pill: playlist artwork + title + static EQ silhouette */
      '<div class="tb-notch-collapsed">',
      '<div class="tb-collapsed-art"><span class="tb-collapsed-art-emoji">🎧</span></div>',
      '<span class="tb-collapsed-title"></span>',
      '<div class="tb-notch-eq"><span></span><span></span><span></span><span></span><span></span></div>',
      '</div>',
      /* Expanded floating panel */
      '<div class="tb-notch-expanded">',
      '<div class="tb-panel-top">',
      '<div class="tb-panel-top-left">',
      '<button type="button" class="tb-circle-btn tb-btn-home" aria-label="Home" title="Home">' + ICONS.home + '</button>',
      '<span class="tb-circle-btn tb-circle-static" title="Quick actions" aria-disabled="true">' + ICONS.tray + '</span>',
      '</div>',
      '<div class="tb-panel-top-right">',
      '<span class="tb-top-glyph" aria-hidden="true">' + ICONS.mirror + '</span>',
      '<span class="tb-top-glyph" aria-hidden="true">' + ICONS.gear + '</span>',
      '<span class="tb-battery"><span class="tb-battery-pct">100%</span>' + BATTERY_SVG + '</span>',
      '</div></div>',
      '<div class="tb-panel-body">',
      /* Spotify's own player: free keyless embed, transport lives inside it */
      '<div class="tb-spotify-wrap">',
      '<iframe class="tb-spotify-embed" src="' + embedUrl + '" ',
      'width="100%" height="152" frameborder="0" allowfullscreen ',
      'allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" ',
      'loading="lazy" title="Spotify playlist player"></iframe>',
      '</div>',
      '<div class="tb-cal-section">',
      '<div class="tb-cal-head"><span class="tb-cal-month"></span><span class="tb-cal-year"></span></div>',
      '<div class="tb-cal-weekwrap">',
      '<div class="tb-cal-weekdays"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div>',
      '<div class="tb-cal-weekrow"></div>',
      '<span class="tb-cal-chev tb-cal-chev-l" aria-disabled="true">‹</span>',
      '<span class="tb-cal-chev tb-cal-chev-r" aria-disabled="true">›</span>',
      '</div>',
      '<div class="tb-events">',
      '<div class="tb-event"><span class="tb-event-bar tb-event-bar-green"></span>',
      '<span class="tb-event-text">☕ Built by boring humans</span>',
      '<span class="tb-event-when">All-day</span></div>',
      '<div class="tb-event"><span class="tb-event-bar tb-event-bar-purple"></span>',
      '<span class="tb-event-text">🎧 Spotify beats all day</span>',
      '<span class="tb-event-when">All-day</span></div>',
      '</div></div></div></div></div>'
    ].join('');

    var notch = mount.querySelector('.tb-notch');
    var artThumb = mount.querySelector('.tb-collapsed-art');
    var titleEl = mount.querySelector('.tb-collapsed-title');
    var btnHome = mount.querySelector('.tb-btn-home');
    var batteryPctEl = mount.querySelector('.tb-battery-pct');
    var batteryFillEl = mount.querySelector('.tb-battery-fill');
    var monthEl = mount.querySelector('.tb-cal-month');
    var yearEl = mount.querySelector('.tb-cal-year');
    var weekrowEl = mount.querySelector('.tb-cal-weekrow');

    titleEl.textContent = station.name;

    function dispatchState() {
      try {
        window.dispatchEvent(new CustomEvent('tb:music-state', {
          detail: { playing: false, stationId: station.id }
        }));
      } catch (e) { /* never break a peer */ }
    }

    /* oEmbed: keyless playlist metadata (title + thumbnail) for the pill.
       Any failure leaves the emoji artwork + fallback title in place. */
    function loadMeta() {
      if (typeof fetch !== 'function' || !music.oembedUrl) return;
      fetch(music.oembedUrl)
        .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
        .then(function (meta) {
          if (!meta) return;
          if (typeof meta.title === 'string' && meta.title) {
            station.name = meta.title;
            titleEl.textContent = meta.title;
          }
          if (typeof meta.thumbnail_url === 'string' && meta.thumbnail_url) {
            var img = new Image();
            img.className = 'tb-collapsed-art-img';
            img.alt = '';
            img.src = meta.thumbnail_url; // hotlinked, per oEmbed terms
            artThumb.innerHTML = '';
            artThumb.appendChild(img);
          }
          dispatchState(); // peers (menubar CC tile) refresh the label
        })
        .catch(function () { /* offline/blocked: emoji + fallback title stay */ });
    }

    /* expand / collapse */
    function expand() { expanded = true; notch.classList.add('expanded'); }
    function collapse() { expanded = false; notch.classList.remove('expanded'); }

    notch.addEventListener('click', function (e) {
      /* Clicks on real controls or decorative glyphs must not toggle the panel.
         (Clicks inside the cross-origin embed iframe never reach this page.) */
      if (e.target.closest('button, input, a, iframe, .tb-circle-btn, .tb-top-glyph, .tb-cal-chev')) return;
      if (expanded) collapse(); else expand();
    });

    document.addEventListener('pointerdown', function (e) {
      if (!expanded) return;
      if (e.target && typeof e.target.closest === 'function' && e.target.closest('#notch-root')) return;
      collapse();
    });

    btnHome.addEventListener('click', collapse);

    /* contract events */
    window.addEventListener('tb:open-app', function (e) {
      if (!e || !e.detail || e.detail.app !== 'music') return;
      expand(); // the user presses play inside the embed itself
    });

    /* widgets */
    function buildCalendar() {
      var now = new Date();
      monthEl.textContent = MONTHS_SHORT[now.getMonth()];
      yearEl.textContent = String(now.getFullYear());
      /* One week only: the real current week, Sunday–Saturday. */
      var start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      start.setDate(start.getDate() - start.getDay()); // rewind to Sunday
      var html = '';
      for (var i = 0; i < 7; i += 1) {
        var d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
        var isToday = d.getDate() === now.getDate() &&
          d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        html += '<span class="tb-cal-day' + (isToday ? ' tb-cal-today' : '') + '">' + d.getDate() + '</span>';
      }
      weekrowEl.innerHTML = html;
    }

    function renderBattery(level) {
      batteryPctEl.textContent = Math.round(level * 100) + '%';
      batteryFillEl.setAttribute('width', (19 * level).toFixed(1));
    }

    function initBattery() {
      var fallback = function () { renderBattery(1); };
      if (typeof navigator.getBattery !== 'function') { fallback(); return; }
      try {
        navigator.getBattery().then(function (b) {
          var update = function () { renderBattery(b.level); };
          update();
          b.addEventListener('levelchange', update);
        }).catch(fallback);
      } catch (e) { fallback(); }
    }

    /* contract API — transport fns are no-ops by design: Spotify's cross-origin
       embed exposes no parent-page control surface (that needs Premium + OAuth
       via the Web Playback SDK). Kept so menubar's Control Center tile stays
       wired and harmless. */
    window.TBMusic = {
      play: function () {},
      pause: function () {},
      toggle: function () {},
      next: function () {},
      prev: function () {},
      setVolume: function (v) {
        v = Number(v);
        if (isNaN(v)) return;
        volume = Math.min(1, Math.max(0, v));
      },
      state: function () { return { playing: false, station: station, volume: volume }; }
    };

    /* boot */
    buildCalendar();
    initBattery();
    loadMeta();
    dispatchState();
  }
})();
