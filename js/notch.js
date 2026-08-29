/* js/notch.js — MacBook-style single-track player.
   Configure TB_CONFIG.music with title, artist, artworkUrl, and optionally
   audioUrl. Audio controls are enabled only when an audio URL is supplied. */
(function () {
  'use strict';

  var ICONS = {
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zm6 0h4v14h-4z"/></svg>',
    previous: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h2v14H6zm4 7 9-7v14z"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 5h-2v14h2zm-4 7-9-7v14z"/></svg>',
    shuffle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>'
  };

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function init() {
    var mount = document.getElementById('notch-root');
    if (!mount) return;

    var cfg = typeof window.TB_CONFIG !== 'undefined' ? window.TB_CONFIG : {};
    var music = cfg.music || {};
    var track = {
      id: music.id || 'indeed',
      name: music.title || 'Indeed',
      artist: music.artist || 'Cheema Y',
      artworkUrl: music.artworkUrl || '',
      audioUrl: music.audioUrl || ''
    };
    var expanded = false;
    var compact = true;
    var playing = false;
    var audio = null;
    var volume = 0.8;
    var BATTERY_ICON = '<svg class="tb-battery-icon" viewBox="0 0 27 13" aria-hidden="true"><rect x=".5" y=".5" width="22" height="12" rx="3.5"/><rect class="tb-battery-charge" x="2.5" y="2.5" width="18" height="8" rx="1.5"/><path d="M24 4.5v4c1.2-.3 2-1 2-2s-.8-1.7-2-2z"/></svg>';

    if (track.audioUrl && typeof Audio !== 'undefined') {
      audio = new Audio(track.audioUrl);
      audio.preload = 'metadata';
      audio.volume = volume;
      audio.addEventListener('play', function () { playing = true; renderPlayback(); dispatchState(); });
      audio.addEventListener('pause', function () { playing = false; renderPlayback(); dispatchState(); });
      audio.addEventListener('timeupdate', renderProgress);
      audio.addEventListener('loadedmetadata', renderProgress);
      audio.addEventListener('ended', function () { playing = false; renderPlayback(); renderProgress(); dispatchState(); });
    }

    mount.innerHTML = [
      '<section class="tb-notch has-played" role="region" aria-label="Music player">',
      '<div class="tb-notch-collapsed"><div class="tb-collapsed-art"></div><span class="tb-collapsed-title"></span><div class="tb-notch-eq"><span></span><span></span><span></span><span></span><span></span></div></div>',
      '<div class="tb-single-track">',
      '<div class="tb-track-status"><span class="tb-track-mode">Now Playing</span><span class="tb-track-battery"><span class="tb-battery-pct">100%</span>' + BATTERY_ICON + '</span></div>',
      '<div class="tb-track-info"><div class="tb-track-art"></div><div class="tb-track-copy"><strong class="tb-track-title"></strong><span class="tb-track-artist"></span></div><span class="tb-track-level" aria-hidden="true">▮▮▮▮</span></div>',
      '<div class="tb-track-progress-row"><span class="tb-track-current">0:00</span><input class="tb-track-progress" type="range" min="0" max="100" value="0" aria-label="Track progress"><span class="tb-track-duration">--:--</span></div>',
      '<div class="tb-track-controls"><button type="button" class="tb-track-btn" aria-label="Shuffle">' + ICONS.shuffle + '</button><button type="button" class="tb-track-btn" aria-label="Previous track">' + ICONS.previous + '</button><button type="button" class="tb-track-btn tb-track-play" aria-label="Play">' + ICONS.play + '</button><button type="button" class="tb-track-btn" aria-label="Next track">' + ICONS.next + '</button></div>',
      '</div>',
      '<div class="tb-full-player"><nav class="tb-full-tabs" aria-label="Notch views"><button type="button" class="tb-full-tab is-active" data-notch-view="home" aria-label="Home"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5v8a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg></button><button type="button" class="tb-full-tab" data-notch-view="airdrop" aria-label="AirDrop"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 10h14l-2-5H7zM4 11h16v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/></svg></button></nav><span class="tb-full-battery"><span class="tb-battery-pct">100%</span>' + BATTERY_ICON + '</span>',
      '<section class="tb-full-now"><div class="tb-full-art"></div><div class="tb-full-copy"><strong class="tb-full-title"></strong><span class="tb-full-artist"></span><div class="tb-full-progress"><span class="tb-full-fill"></span></div><div class="tb-full-times"><span>0:00</span><span>--:--</span></div><div class="tb-full-controls"><button type="button" disabled>' + ICONS.previous + '</button><button type="button" class="tb-full-play" aria-label="Play">' + ICONS.play + '</button><button type="button" disabled>' + ICONS.next + '</button></div></div></section>',
      '<section class="tb-full-calendar"><div><strong class="tb-full-month"></strong><span class="tb-full-year"></span></div><div class="tb-full-weekdays"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div><div class="tb-full-days"></div><div class="tb-full-event"><i></i><strong>Anna Haro’s<br>41st Birthday</strong><span>All-day</span></div></section>',
      '<section class="tb-full-mirror"><span>◉</span><strong>Mirror</strong></section>',
      '<section class="tb-airdrop" aria-label="AirDrop"><div class="tb-airdrop-device"><span>◉</span><strong>AirDrop</strong></div><div class="tb-airdrop-drop"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11m0-11 4 4m-4-4-4 4M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/></svg><strong>Drop files here</strong></div></section>',
      '</div></section>',
      '<button type="button" class="tb-compact-toggle" aria-pressed="true">Expanded player</button>'
    ].join('');

    var notch = mount.querySelector('.tb-notch');
    var titleEls = mount.querySelectorAll('.tb-collapsed-title, .tb-track-title, .tb-full-title');
    var artistEls = mount.querySelectorAll('.tb-track-artist, .tb-full-artist');
    var artEls = mount.querySelectorAll('.tb-collapsed-art, .tb-track-art, .tb-full-art');
    var toggleEl = mount.querySelector('.tb-compact-toggle');
    var playEl = mount.querySelector('.tb-track-play');
    var progressEl = mount.querySelector('.tb-track-progress');
    var currentEl = mount.querySelector('.tb-track-current');
    var durationEl = mount.querySelector('.tb-track-duration');

    Array.prototype.forEach.call(titleEls, function (el) { el.textContent = track.name; });
    Array.prototype.forEach.call(artistEls, function (el) { el.textContent = track.artist; });
    Array.prototype.forEach.call(artEls, function (el) {
      if (track.artworkUrl) el.innerHTML = '<img src="' + track.artworkUrl + '" alt="">';
      else el.textContent = '♫';
    });

    function formatTime(seconds) {
      seconds = Math.max(0, Math.floor(seconds || 0));
      return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
    }
    function renderProgress() {
      if (!audio) return;
      var duration = isFinite(audio.duration) ? audio.duration : 0;
      progressEl.value = duration ? (audio.currentTime / duration) * 100 : 0;
      progressEl.style.setProperty('--tb-progress', progressEl.value + '%');
      currentEl.textContent = formatTime(audio.currentTime);
      durationEl.textContent = formatTime(duration);
    }
    function renderPlayback() {
      Array.prototype.forEach.call(mount.querySelectorAll('.tb-track-play, .tb-full-play'), function (button) {
        button.innerHTML = playing ? ICONS.pause : ICONS.play;
        button.setAttribute('aria-label', playing ? 'Pause' : 'Play');
      });
    }
    function dispatchState() {
      try { window.dispatchEvent(new CustomEvent('tb:music-state', { detail: { playing: playing, stationId: track.id } })); } catch (e) {}
    }
    function initBattery() {
      var indicators = mount.querySelectorAll('.tb-track-battery, .tb-full-battery');
      var percentages = mount.querySelectorAll('.tb-battery-pct');
      function renderBattery(level, charging) {
        var pct = Math.round(level * 100) + '%';
        Array.prototype.forEach.call(percentages, function (el) { el.textContent = pct; });
        Array.prototype.forEach.call(mount.querySelectorAll('.tb-battery-charge'), function (el) { el.setAttribute('width', Math.max(3, 37 * level).toFixed(1)); });
        Array.prototype.forEach.call(indicators, function (el) { el.classList.toggle('is-charging', Boolean(charging)); });
      }
      renderBattery(1, false);
      if (typeof navigator.getBattery !== 'function') return;
      navigator.getBattery().then(function (battery) {
        var update = function () { renderBattery(battery.level, battery.charging); };
        update();
        battery.addEventListener('levelchange', update);
        battery.addEventListener('chargingchange', update);
      }).catch(function () {});
    }
    function expand() { expanded = true; notch.classList.add('expanded'); }
    function collapse() { expanded = false; notch.classList.remove('expanded'); }

    notch.addEventListener('click', function (e) {
      if (e.target.closest('button, input')) return;
      if (expanded) collapse(); else expand();
    });
    document.addEventListener('pointerdown', function (e) {
      if (expanded && !e.target.closest('#notch-root')) collapse();
    });
    toggleEl.addEventListener('click', function () {
      compact = !compact;
      notch.classList.toggle('compact', compact);
      toggleEl.textContent = compact ? 'Expanded player' : 'Compact player';
      toggleEl.setAttribute('aria-pressed', String(compact));
      expand();
    });
    /* initial mode: apply the compact class on boot so the first expand shows
       the compact single-track player (toggle switches to the full player) */
    notch.classList.toggle('compact', compact);
    Array.prototype.forEach.call(mount.querySelectorAll('.tb-track-play, .tb-full-play'), function (button) {
      button.addEventListener('click', function () {
        if (!audio) return;
        if (audio.paused) audio.play().catch(function () {}); else audio.pause();
      });
    });
    progressEl.addEventListener('input', function () {
      progressEl.style.setProperty('--tb-progress', progressEl.value + '%');
      if (audio && isFinite(audio.duration)) audio.currentTime = audio.duration * (Number(progressEl.value) / 100);
    });
    Array.prototype.forEach.call(mount.querySelectorAll('.tb-full-tab'), function (tab) {
      tab.addEventListener('click', function () {
        var isAirDrop = tab.getAttribute('data-notch-view') === 'airdrop';
        mount.querySelector('.tb-full-player').classList.toggle('is-airdrop', isAirDrop);
        Array.prototype.forEach.call(mount.querySelectorAll('.tb-full-tab'), function (item) { item.classList.toggle('is-active', item === tab); });
      });
    });
    Array.prototype.forEach.call(mount.querySelectorAll('.tb-track-btn:not(.tb-track-play)'), function (button) { button.disabled = true; });
    if (!audio) { Array.prototype.forEach.call(mount.querySelectorAll('.tb-track-play, .tb-full-play'), function (button) { button.disabled = true; }); progressEl.disabled = true; }

    (function buildFullCalendar() {
      var now = new Date();
      mount.querySelector('.tb-full-month').textContent = now.toLocaleString(undefined, { month: 'short' });
      mount.querySelector('.tb-full-year').textContent = now.getFullYear();
      var start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      var days = '';
      for (var i = 0; i < 7; i += 1) {
        var day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
        days += '<span' + (day.toDateString() === now.toDateString() ? ' class="today"' : '') + '>' + day.getDate() + '</span>';
      }
      mount.querySelector('.tb-full-days').innerHTML = days;
    }());

    window.addEventListener('tb:open-app', function (e) { if (e && e.detail && e.detail.app === 'music') expand(); });
    window.TBMusic = {
      play: function () { if (audio) audio.play().catch(function () {}); }, pause: function () { if (audio) audio.pause(); },
      toggle: function () { if (audio) { if (audio.paused) audio.play().catch(function () {}); else audio.pause(); } },
      next: function () {}, prev: function () {}, setVolume: function (v) { volume = Math.min(1, Math.max(0, Number(v) || 0)); if (audio) audio.volume = volume; },
      state: function () { return { playing: playing, station: track, volume: volume }; }
    };
    initBattery();
    dispatchState();
  });
})();
