/* js/notch.js — Dev B: MacBook-style notch music player (the star feature).
   Reworked to match the boring.notch reference: collapsed idle = slim black pill,
   collapsed active = wide black bar (artwork left, EQ right), expanded = floating
   near-full-width panel (player + week calendar + events).
   Mount: #notch-root (positioned by Dev A). Data: window.TB_CONFIG (manager-owned).
   Exposes window.TBMusic per shared contract v1. Listens 'tb:open-app' (app==='music'
   only); dispatches 'tb:music-state' on every play/pause/station change.
   EQ bars are pure CSS animation (no WebAudio — CORS-safe). */
(function () {
  'use strict';

  var MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  var ICONS = {
    home: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
    tray: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>',
    mirror: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 3H3c-1.1 0-2 .9-2 2v3h2V5h18v14h-7v2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM1 18v3h3c0-1.66-1.34-3-3-3zm0-4v2c2.76 0 5 2.24 5 5h2c0-3.87-3.13-7-7-7zm0-4v2c4.97 0 9 4.03 9 9h2c0-6.08-4.93-11-11-11z"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>',
    shuffle: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 18l8.5-6L6 6v12zM16 6h2v12h-2z"/></svg>',
    airplay: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 22h12l-6-6zM21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4v-2H3V5h18v12h-4v2h4c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>'
  };

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
    var stations = (cfg && Array.isArray(cfg.stations)) ? cfg.stations : [];

    /* Config absent/unusable: static black pill + no-op API, zero console noise. */
    if (!stations.length) {
      mount.innerHTML = '<div class="tb-notch tb-notch-static" aria-hidden="true"></div>';
      window.TBMusic = {
        play: function () {}, pause: function () {}, toggle: function () {},
        next: function () {}, prev: function () {}, setVolume: function () {},
        state: function () { return { playing: false, station: null }; }
      };
      return;
    }

    /* state */
    var idx = 0;            // index into stations[]
    var playing = false;    // actually playing (driven by media events)
    var shouldPlay = false; // user intent: stream should be playing
    var expanded = false;
    var hasPlayed = false;  // first successful play happened at least once
    var elapsed = 0;        // seconds on current station
    var buffering = false;
    var failCount = 0;      // consecutive stream failures
    var statusText = null;  // overrides elapsed readout when non-null

    var audio = new Audio();
    audio.preload = 'none';
    audio.volume = 0.8;

    /* DOM */
    mount.innerHTML = [
      '<div class="tb-notch" role="region" aria-label="Music player">',
      /* State B — collapsed wide bar: artwork left, EQ right, nothing else */
      '<div class="tb-notch-collapsed">',
      '<div class="tb-collapsed-art"><span class="tb-collapsed-art-emoji"></span>',
      '<span class="tb-src-badge">📻</span></div>',
      '<div class="tb-notch-eq"><span></span><span></span><span></span><span></span><span></span></div>',
      '</div>',
      /* State C — expanded floating panel */
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
      '<div class="tb-player-art"><span class="tb-player-art-emoji"></span>',
      '<span class="tb-src-badge tb-src-badge-lg">📻</span></div>',
      '<div class="tb-player-info">',
      '<div class="tb-player-name"></div><div class="tb-player-tag"></div>',
      '<div class="tb-player-sub">Streaming live · lofi radio</div>',
      '<div class="tb-player-progress"><div class="tb-player-progress-fill"></div></div>',
      '<div class="tb-player-times"><span class="tb-player-elapsed">0:00</span>',
      '<span class="tb-player-live"><span class="tb-live-dot">●</span>LIVE</span></div>',
      '<div class="tb-player-controls">',
      '<button type="button" class="tb-btn tb-btn-shuffle" title="Shuffle" aria-label="Shuffle station">' + ICONS.shuffle + '</button>',
      '<button type="button" class="tb-btn tb-btn-prev" title="Previous" aria-label="Previous station">' + ICONS.prev + '</button>',
      '<button type="button" class="tb-btn tb-btn-play" title="Play" aria-label="Play or pause">' + ICONS.play + '</button>',
      '<button type="button" class="tb-btn tb-btn-next" title="Next" aria-label="Next station">' + ICONS.next + '</button>',
      '<span class="tb-btn tb-btn-airplay" title="AirPlay" aria-hidden="true">' + ICONS.airplay + '</span>',
      '</div></div>',
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
      '<span class="tb-event-text">🎧 lofi beats all day</span>',
      '<span class="tb-event-when">All-day</span></div>',
      '</div></div></div></div></div>'
    ].join('');

    var notch = mount.querySelector('.tb-notch');
    var artThumb = mount.querySelector('.tb-collapsed-art');
    var artThumbEmoji = mount.querySelector('.tb-collapsed-art-emoji');
    var artTile = mount.querySelector('.tb-player-art');
    var artTileEmoji = mount.querySelector('.tb-player-art-emoji');
    var nameEl = mount.querySelector('.tb-player-name');
    var tagEl = mount.querySelector('.tb-player-tag');
    var fillEl = mount.querySelector('.tb-player-progress-fill');
    var elapsedEl = mount.querySelector('.tb-player-elapsed');
    var btnHome = mount.querySelector('.tb-btn-home');
    var btnShuffle = mount.querySelector('.tb-btn-shuffle');
    var btnPrev = mount.querySelector('.tb-btn-prev');
    var btnPlay = mount.querySelector('.tb-btn-play');
    var btnNext = mount.querySelector('.tb-btn-next');
    var batteryPctEl = mount.querySelector('.tb-battery-pct');
    var batteryFillEl = mount.querySelector('.tb-battery-fill');
    var monthEl = mount.querySelector('.tb-cal-month');
    var yearEl = mount.querySelector('.tb-cal-year');
    var weekrowEl = mount.querySelector('.tb-cal-weekrow');

    /* rendering */
    function renderStation() {
      var st = stations[idx];
      if (st.art) {
        /* real album-art image (e.g. the boring.notch channel avatar) */
        var img = 'url("' + st.art + '")';
        artThumb.style.background = img;
        artThumb.style.backgroundSize = 'cover';
        artThumb.style.backgroundPosition = 'center';
        artThumbEmoji.textContent = '';
        artTile.style.background = img;
        artTile.style.backgroundSize = 'cover';
        artTile.style.backgroundPosition = 'center';
        artTileEmoji.textContent = '';
      } else {
        var grad = 'linear-gradient(135deg,' + st.grad[0] + ',' + st.grad[1] + ')';
        artThumb.style.background = grad;
        artThumbEmoji.textContent = st.emoji;
        artTile.style.background = grad;
        artTileEmoji.textContent = st.emoji;
      }
      nameEl.textContent = st.name;
      tagEl.textContent = st.tag;
    }

    function fmtTime(s) { return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }

    function renderTimes() {
      if (statusText) elapsedEl.textContent = statusText;
      else if (buffering) elapsedEl.textContent = 'Buffering…';
      else elapsedEl.textContent = fmtTime(elapsed);
      /* Live streams have no duration: the fill sweeps a 60s window as the
         "elapsed portion" indicator (never a fraction of total length). */
      fillEl.style.width = (((elapsed % 60) / 60) * 100).toFixed(1) + '%';
    }

    function render() {
      notch.classList.toggle('playing', playing);
      notch.classList.toggle('has-played', hasPlayed);
      btnPlay.innerHTML = playing ? ICONS.pause : ICONS.play;
      btnPlay.title = playing ? 'Pause' : 'Play';
      renderTimes();
    }

    function dispatchState() {
      try {
        window.dispatchEvent(new CustomEvent('tb:music-state', {
          detail: { playing: playing, stationId: stations[idx] ? stations[idx].id : null }
        }));
      } catch (e) { /* never break a peer */ }
    }

    /* transport */
    function play() {
      shouldPlay = true;
      if (!audio.src) audio.src = stations[idx].streamUrl;
      /* Autoplay policy: play() is only called from a user-gesture handler chain
         (click / tb:open-app) or the error-retry chain a user gesture started.
         Rejections are caught to keep the console clean. */
      var p = audio.play();
      if (p && typeof p.catch === 'function') p.catch(function () {});
    }

    function pause() { shouldPlay = false; audio.pause(); } // real pause — src kept
    function toggle() { if (playing) pause(); else play(); }

    function changeStation(newIdx, autoplay) {
      idx = ((newIdx % stations.length) + stations.length) % stations.length;
      elapsed = 0;
      buffering = false;
      statusText = null;
      renderStation();
      audio.src = stations[idx].streamUrl;
      if (autoplay) play();
      render();
      dispatchState();
    }

    function randomOther() {
      if (stations.length < 2) return idx;
      var n;
      do { n = Math.floor(Math.random() * stations.length); } while (n === idx);
      return n;
    }

    function nextStation() { failCount = 0; changeStation(idx + 1, shouldPlay); }
    function prevStation() { failCount = 0; changeStation(idx - 1, shouldPlay); }
    function shuffleStation() { failCount = 0; changeStation(randomOther(), shouldPlay); }

    function setVolume(v) {
      v = Number(v);
      if (isNaN(v)) return;
      v = Math.min(1, Math.max(0, v));
      audio.volume = v;
    }

    /* expand / collapse */
    function expand() { expanded = true; notch.classList.add('expanded'); }
    function collapse() { expanded = false; notch.classList.remove('expanded'); }

    notch.addEventListener('click', function (e) {
      /* Clicks on real controls or decorative glyphs must not toggle the panel. */
      if (e.target.closest('button, input, a, .tb-circle-btn, .tb-top-glyph, .tb-btn-airplay, .tb-cal-chev')) return;
      if (expanded) collapse(); else expand();
    });

    document.addEventListener('pointerdown', function (e) {
      if (!expanded) return;
      if (e.target && typeof e.target.closest === 'function' && e.target.closest('#notch-root')) return;
      collapse();
    });

    btnHome.addEventListener('click', collapse);
    btnPlay.addEventListener('click', toggle);
    btnNext.addEventListener('click', nextStation);
    btnPrev.addEventListener('click', prevStation);
    btnShuffle.addEventListener('click', shuffleStation);

    /* contract events */
    window.addEventListener('tb:open-app', function (e) {
      if (!e || !e.detail || e.detail.app !== 'music') return;
      expand();
      play(); // originates from a click in a peer module — gesture-safe
    });

    /* audio events */
    audio.addEventListener('playing', function () {
      playing = true;
      hasPlayed = true;
      buffering = false;
      statusText = null;
      failCount = 0;
      render();
      dispatchState();
    });

    audio.addEventListener('pause', function () {
      playing = false;
      render();
      dispatchState();
    });

    audio.addEventListener('waiting', function () {
      if (!shouldPlay) return;
      buffering = true;
      renderTimes();
    });

    audio.addEventListener('canplay', function () {
      if (!buffering) return;
      buffering = false;
      renderTimes();
    });

    audio.addEventListener('error', function () {
      if (!shouldPlay || !audio.error) return; // intentional stop or stale event
      failCount += 1;
      if (failCount >= 3) {
        shouldPlay = false;
        playing = false;
        buffering = false;
        statusText = 'All streams offline';
        failCount = 0;
        try { audio.pause(); } catch (e) { /* ignore */ }
        render();
        dispatchState();
        return;
      }
      statusText = 'Stream offline — trying next…';
      renderTimes();
      setTimeout(function () {
        if (!shouldPlay) return;
        changeStation(idx + 1, true);
      }, 2000);
    });

    /* elapsed ticker */
    setInterval(function () {
      if (playing && !buffering) {
        elapsed += 1;
        renderTimes();
      }
    }, 1000);

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

    /* contract API */
    window.TBMusic = {
      play: play,
      pause: pause,
      toggle: toggle,
      next: nextStation,
      prev: prevStation,
      setVolume: setVolume,
      state: function () { return { playing: playing, station: stations[idx] || null }; }
    };

    /* boot */
    renderStation();
    render();
    buildCalendar();
    initBattery();

    /* Default state: the notch boots LOOKING like it's playing (album art +
       EQ animating, pause glyph, dock dot + menubar glyph lit). Real audio
       may only start inside a user gesture, so the first pointerdown /
       touchstart / keydown anywhere silently arms true playback; from then
       on the normal media-event state machine drives everything. */
    hasPlayed = true;
    playing = true;
    shouldPlay = true;
    render();
    dispatchState();
    var armEvents = ['pointerdown', 'touchstart', 'keydown'];
    function disarm() {
      armEvents.forEach(function (t) { window.removeEventListener(t, arm, true); });
    }
    function arm() {
      disarm();
      play();
    }
    armEvents.forEach(function (t) { window.addEventListener(t, arm, true); });
  }
})();
