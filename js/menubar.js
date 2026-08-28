/* js/menubar.js — menu bar: logo/app menus, battery + Power popup, Wi-Fi,
   Spotlight, Control Center, two-part clock.
   Owner: Dev A (shell/left cluster), Dev M (right cluster rework).
   Renders into #menubar-root; degrades silently if peers are absent. */
(function () {
  'use strict';

  var APPLE_SVG =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M12.7 6.5c-.4-1.7.4-3.5 2-4.4.2-.1.4.1.4.3.1 1.7-.7 3.4-2.2 4.3-.2.2-.4 0-.2-.2z"/>' +
    '<path d="M12 7.4c-1.2-1-2.9-1.3-4.4-.6-2 .9-3.1 3.1-3 5.5.1 3.9 3.1 9.4 5.9 9.4 1.1 0 1.6-.6 2.9-.6s1.8.6 2.9.6c2.8 0 5.8-5.5 5.9-9.4.1-2.4-1-4.6-3-5.5-1.5-.7-3.2-.4-4.4.6-.4.3-.9.3-1.2 0z"/>' +
    '</svg>';

  /* reference-clone Wi-Fi glyph (shared by the bar icon + CC grid toggle) */
  var WIFI_PATHS =
    '<path d="M12 6c3.537 0 6.837 1.353 9.293 3.809l1.414-1.414C19.874 5.561 16.071 4 12 4 7.929 4.001 4.126 5.561 1.293 8.395l1.414 1.414C5.163 7.353 8.463 6 12 6zM17.671 14.307c-3.074-3.074-8.268-3.074-11.342 0l1.414 1.414c2.307-2.307 6.207-2.307 8.514 0L17.671 14.307z"/>' +
    '<path d="M20.437,11.293c-4.572-4.574-12.301-4.574-16.873,0l1.414,1.414c3.807-3.807,10.238-3.807,14.045,0L20.437,11.293z"/>' +
    '<circle cx="12" cy="18" r="2"></circle>';

  function wifiSVG(size) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      WIFI_PATHS + '</svg>';
  }

  var SPOT_SVG =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M10,18c1.846,0,3.543-0.635,4.897-1.688l4.396,4.396l1.414-1.414l-4.396-4.396C17.365,13.543,18,11.846,18,10 c0-4.411-3.589-8-8-8s-8,3.589-8,8S5.589,18,10,18z M10,4c3.309,0,6,2.691,6,6s-2.691,6-6,6s-6-2.691-6-6S6.691,4,10,4z"/>' +
    '</svg>';

  var CC_SVG =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<line x1="2.5" y1="8" x2="12.6" y2="8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>' +
    '<line x1="18.8" y1="8" x2="21.5" y2="8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>' +
    '<circle cx="15.7" cy="8" r="2.3" fill="currentColor"/>' +
    '<line x1="2.5" y1="16" x2="5.2" y2="16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>' +
    '<line x1="11.4" y1="16" x2="21.5" y2="16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>' +
    '<circle cx="8.3" cy="16" r="2.3" fill="currentColor"/>' +
    '</svg>';

  /* small glyphs for the Control Center rows/toggles (stroke inherits button color) */
  var GLYPHS = {
    airdrop: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">' +
      '<circle cx="12" cy="16" r="2.1" fill="currentColor" stroke="none"/>' +
      '<path d="M7.6 12.4a6.2 6.2 0 0 1 8.8 0"/><path d="M4.6 9.4a10.4 10.4 0 0 1 14.8 0"/></svg>',
    bluetooth: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M6.8 7.2l10.4 9.6L12 21V3l5.2 4.2L6.8 16.8"/></svg>',
    dnd: '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<path d="M20.6 13.6A8.8 8.8 0 0 1 10.4 3.4 8.8 8.8 0 1 0 20.6 13.6z"/></svg>',
    sun: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="4.2"/>' +
      '<g stroke="currentColor" stroke-width="1.8" stroke-linecap="round">' +
      '<path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6"/></g></svg>',
    speaker: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<path d="M4 9v6h4l5 4V5L8 9H4z"/>' +
      '<path d="M16 8.8a4.4 4.4 0 0 1 0 6.4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    play: '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
  };

  /* Spotlight's fixed app registry: label + glyph + the exact tb:open-app detail. */
  var SPOTLIGHT_APPS = [
    { glyph: '🧭', label: 'Safari', detail: { app: 'safari' } },
    { glyph: '🎵', label: 'Boring.Notch', detail: { app: 'music' } },
    { glyph: '⬇️', label: 'Downloads', detail: { app: 'download' } },
    { glyph: '☕', label: 'Buy Me a Coffee', detail: { app: 'coffee' } },
    { glyph: '🖥️', label: 'About This Mac', detail: { app: 'about' } },
    { glyph: '📁', label: 'boring.notch Folder', detail: { app: 'folder', folder: 'project', title: 'boring.notch' } },
    { glyph: '🖼️', label: 'wallpapers Folder', detail: { app: 'folder', folder: 'wallpapers', title: 'wallpapers' } },
  ];

  function el(tag, cls) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  }

  /* (a) wallpaper: crossfading slideshow through TB_CONFIG.wallpapers (falls
     back to the single TB_CONFIG.wallpaper, then to the CSS gradient). Two
     stacked layers swap opacity with an ease transition. */
  function initWallpaper() {
    var cfg = (typeof window.TB_CONFIG === 'object' && window.TB_CONFIG) || {};
    var desktop = document.getElementById('desktop');
    if (!desktop) return;
    var list = [];
    if (Array.isArray(cfg.wallpapers) && cfg.wallpapers.length) {
      list = cfg.wallpapers.slice();
    } else if (typeof cfg.wallpaper === 'string' && cfg.wallpaper) {
      list = [cfg.wallpaper];
    }
    if (!list.length) return;
    var interval = (typeof cfg.wallpaperInterval === 'number' && cfg.wallpaperInterval >= 2000)
      ? cfg.wallpaperInterval : 5000;
    var fade = (typeof cfg.wallpaperFade === 'number' && cfg.wallpaperFade > 0)
      ? cfg.wallpaperFade : 1200;

    /* entries may be plain src strings or {src,title,artist,year,link} */
    var entries = list.map(function (w) { return (typeof w === 'string') ? { src: w } : w; });

    var layers = [el('div', 'tb-wall-layer'), el('div', 'tb-wall-layer')];
    layers.forEach(function (l) {
      l.style.transitionDuration = fade + 'ms';
      desktop.appendChild(l);
    });

    /* artwork attribution chip: names the current piece, links to Commons */
    var credit = el('a', 'tb-wall-credit');
    credit.target = '_blank';
    credit.rel = 'noopener';
    desktop.appendChild(credit);
    function updateCredit(entry) {
      if (entry && entry.title) {
        credit.textContent = '🖼 ' + entry.title + ' — ' +
          (entry.artist || 'unknown artist') + (entry.year ? ' (' + entry.year + ')' : '');
        credit.href = entry.link || '#';
        credit.classList.add('tb-wall-credit--on');
      } else {
        credit.classList.remove('tb-wall-credit--on');
      }
    }

    /* preload every frame; drop the ones that fail */
    var ok = [];
    var pending = entries.length;
    entries.forEach(function (entry) {
      var img = new Image();
      img.onload = function () { ok.push(entry); if (--pending === 0) start(); };
      img.onerror = function () { if (--pending === 0) start(); };
      img.src = entry.src;
    });

    function start() {
      if (!ok.length) return; /* keep the CSS gradient fallback */
      var idx = 0;
      var active = 0;
      layers[0].style.backgroundImage = 'url("' + ok[0].src + '")';
      layers[0].style.opacity = '1';
      updateCredit(ok[0]);
      if (ok.length === 1) return;
      setInterval(function () {
        idx = (idx + 1) % ok.length;
        var front = layers[active];
        var back = layers[1 - active];
        back.style.backgroundImage = 'url("' + ok[idx].src + '")';
        back.style.opacity = '1';
        front.style.opacity = '0';
        active = 1 - active;
        updateCredit(ok[idx]);
      }, interval);
    }
  }

  function batterySVG(level) {
    var pct = Math.max(0, Math.min(1, level));
    var w = Math.round(pct * 19 * 10) / 10;
    return '<svg width="25" height="12" viewBox="0 0 27 13" aria-hidden="true">' +
      '<rect x="0.6" y="0.6" width="22" height="11.8" rx="3.4" fill="none" stroke="currentColor" opacity=".45"/>' +
      (w > 0 ? '<rect x="2" y="2" width="' + w + '" height="9" rx="1.8" fill="currentColor"/>' : '') +
      '<path d="M24.8 4.4v4.2a2.3 2.3 0 0 0 0-4.2z" fill="currentColor" opacity=".45"/>' +
      '</svg>';
  }

  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* (e) two-part clock: "Fri Aug 28 2026" + "07:49 PM" (hour12 zero-padded) */
  function fmtDate(d) {
    return DAYS[d.getDay()] + ' ' + MONTHS[d.getMonth()] + ' ' + d.getDate() + ' ' + d.getFullYear();
  }

  function fmtTime(d) {
    var h = d.getHours();
    var ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    var m = d.getMinutes();
    return (h < 10 ? '0' + h : '' + h) + ':' + (m < 10 ? '0' + m : '' + m) + ' ' + ampm;
  }

  function openApp(app) {
    window.dispatchEvent(new CustomEvent('tb:open-app', { detail: { app: app } }));
  }

  /* Spotlight rows carry richer details (folders), so dispatch them whole. */
  function openDetail(detail) {
    window.dispatchEvent(new CustomEvent('tb:open-app', { detail: detail }));
  }

  function buildMenus(siteName) {
    return [
      {
        logo: true,
        items: [
          { label: 'About This Mac', app: 'about' },
          { sep: true },
          { label: 'Restart…', disabled: true },
          { label: 'Shut Down', disabled: true },
        ],
      },
      { bold: true, label: siteName },
      {
        label: 'File',
        items: [
          { label: 'New Tab', disabled: true },
          { label: 'New Window', disabled: true },
          { label: 'Open…', disabled: true },
          { sep: true },
          { label: 'Close Window', disabled: true },
        ],
      },
      {
        label: 'Edit',
        items: [
          { label: 'Undo', disabled: true },
          { label: 'Redo', disabled: true },
          { sep: true },
          { label: 'Cut', disabled: true },
          { label: 'Copy', disabled: true },
          { label: 'Paste', disabled: true },
          { label: 'Select All', disabled: true },
        ],
      },
      {
        label: 'View',
        items: [
          { label: 'Enter Full Screen', disabled: true },
          { sep: true },
          { label: 'Show Toolbar', disabled: true },
          { label: 'Customize Toolbar…', disabled: true },
        ],
      },
      { label: 'Window', items: [{ label: 'Safari — GitHub', app: 'safari' }] },
      { label: 'Help', items: [{ label: siteName + ' Help', app: 'about' }] },
    ];
  }

  function init() {
    var root = document.getElementById('menubar-root');
    if (!root) return;

    initWallpaper();

    var cfg = (typeof window.TB_CONFIG === 'object' && window.TB_CONFIG) || {};
    var siteName = (typeof cfg.siteName === 'string' && cfg.siteName) || 'theboringwebsite';

    root.innerHTML = '';
    var bar = el('div', 'tb-menubar');
    var left = el('div', 'tb-menubar-left');
    var right = el('div', 'tb-menubar-right');
    bar.appendChild(left);
    bar.appendChild(right);
    root.appendChild(bar);

    var openMenu = null;
    var ccBtn = null;
    var ccPanel = null;
    var batt = null;        /* battery <button> */
    var powerPanel = null;  /* battery's Power popup */
    var spotBtn = null;     /* Spotlight <button> */
    var spot = null;        /* Spotlight overlay (appended to body) */
    var ccBattIcon = null;  /* CC battery row bits (filled in below) */
    var ccBattText = null;

    function closeMenus() {
      if (openMenu) openMenu.classList.remove('tb-open');
      openMenu = null;
    }

    function closeCC() {
      if (!ccPanel) return;
      ccPanel.hidden = true;
      if (ccBtn) ccBtn.classList.remove('tb-open');
    }

    function closePower() {
      if (!powerPanel) return;
      powerPanel.hidden = true;
      if (batt) batt.classList.remove('tb-open');
    }

    function closeSpotlight() {
      if (!spot) return;
      spot.hidden = true;
      if (spotBtn) spotBtn.classList.remove('tb-open');
    }

    /* one popup family: menus, Power, CC, Spotlight — only one open at a time */
    function closeAll() {
      closeMenus();
      closeCC();
      closePower();
      closeSpotlight();
    }

    /* (c) left cluster: logo menu, bold site name, File/Edit/View/Window/Help */
    buildMenus(siteName).forEach(function (m) {
      if (m.bold) {
        var name = el('span', 'tb-menu-label tb-bold');
        name.textContent = m.label;
        left.appendChild(name);
        return;
      }
      var menu = el('div', 'tb-menu');
      var label = el('button', 'tb-menu-label');
      label.type = 'button';
      if (m.logo) {
        var logoImg = new Image();
        logoImg.className = 'tb-apple-logo';
        logoImg.alt = '';
        logoImg.setAttribute('aria-hidden', 'true');
        logoImg.draggable = false;
        logoImg.onerror = function () { label.innerHTML = APPLE_SVG; };
        logoImg.src = 'https://macosweb.netlify.app/icon/apple-white.png';
        label.appendChild(logoImg);
        label.setAttribute('aria-label', siteName + ' menu');
      } else {
        label.textContent = m.label;
      }
      var dd = el('div', 'tb-dropdown');
      m.items.forEach(function (item) {
        if (item.sep) {
          dd.appendChild(el('div', 'tb-dropdown-sep'));
          return;
        }
        var it = el('div', 'tb-dropdown-item' + (item.disabled ? ' tb-disabled' : ''));
        it.textContent = item.label;
        if (item.disabled) {
          it.setAttribute('aria-disabled', 'true');
        } else {
          it.addEventListener('click', function () {
            if (item.app) openApp(item.app);
            closeMenus();
          });
        }
        dd.appendChild(it);
      });
      menu.appendChild(label);
      menu.appendChild(dd);
      /* (d) click toggles; hover switches while one is open */
      label.addEventListener('click', function (e) {
        e.stopPropagation();
        if (openMenu === menu) {
          closeMenus();
        } else {
          closeAll();
          menu.classList.add('tb-open');
          openMenu = menu;
        }
      });
      label.addEventListener('mouseenter', function () {
        if (openMenu && openMenu !== menu) {
          closeMenus();
          menu.classList.add('tb-open');
          openMenu = menu;
        }
      });
      left.appendChild(menu);
    });

    /* (e) right cluster: 🎵 | 🌙 | battery | wifi | spotlight | cc | clock */

    /* music glyph, hidden until tb:music-state says playing */
    var glyph = el('span', 'tb-music-glyph');
    glyph.textContent = '🎵';
    glyph.title = 'Now playing';
    window.addEventListener('tb:music-state', function (e) {
      var playing = !!(e && e.detail && e.detail.playing);
      glyph.style.display = playing ? 'inline' : 'none';
    });
    right.appendChild(glyph);

    /* DND indicator, shown only while the CC Do-Not-Disturb toggle is on */
    var dndGlyph = el('span', 'tb-dnd-glyph');
    dndGlyph.textContent = '🌙';
    dndGlyph.title = 'Do Not Disturb is on';
    right.appendChild(dndGlyph);

    /* battery button + Power popup (fallback 100% full when the API is
       missing/rejects); charging adds a ⚡ overlay on the battery SVG. */
    var battState = { level: 1, charging: false };
    var battMgr = null;

    batt = el('button', 'tb-battery');
    batt.type = 'button';
    batt.setAttribute('aria-label', 'Battery');
    batt.title = 'Battery';
    var battPct = el('span', 'tb-battery-pct');
    var battIcon = el('span', 'tb-battery-icon');
    var battSvg = el('span', 'tb-battery-svg');
    var battBolt = el('span', 'tb-battery-bolt');
    battBolt.textContent = '⚡';
    battIcon.appendChild(battSvg);
    battIcon.appendChild(battBolt);
    batt.appendChild(battPct);
    batt.appendChild(battIcon);

    function renderBattery() {
      var pct = Math.round(battState.level * 100);
      battPct.textContent = pct + '%';
      battSvg.innerHTML = batterySVG(battState.level);
      battBolt.style.display = battState.charging ? 'flex' : 'none';
      if (ccBattText) ccBattText.textContent = pct + '%';
      if (ccBattIcon) ccBattIcon.innerHTML = batterySVG(battState.level);
    }

    function readBattery() { /* live re-read from the BatteryManager */
      if (battMgr) {
        battState.level = battMgr.level;
        battState.charging = !!battMgr.charging;
      }
      renderBattery();
    }

    renderBattery();
    if (typeof navigator !== 'undefined' && typeof navigator.getBattery === 'function') {
      try {
        var bp = navigator.getBattery();
        if (bp && typeof bp.then === 'function') {
          bp.then(function (b) {
            battMgr = b;
            b.addEventListener('levelchange', readBattery);
            b.addEventListener('chargingchange', readBattery);
            readBattery();
          }).catch(function () { /* keep 100% fallback */ });
        }
      } catch (err) { /* keep 100% fallback */ }
    }
    right.appendChild(batt);

    /* Power popup: frosted, right-aligned under the bar */
    powerPanel = el('div', 'tb-power-panel');
    powerPanel.hidden = true;
    var pHead = el('div', 'tb-power-head');
    var pTitle = el('span', 'tb-power-title');
    pTitle.textContent = 'Power';
    var pPct = el('span', 'tb-power-pct');
    pHead.appendChild(pTitle);
    pHead.appendChild(pPct);
    var pSrc = el('div', 'tb-power-sub');
    var pSep = el('div', 'tb-power-sep');
    var pBtn = el('button', 'tb-power-prefs');
    pBtn.type = 'button';
    pBtn.textContent = 'Power Preferences…';
    pBtn.setAttribute('aria-label', 'Power Preferences');
    pBtn.addEventListener('click', function () {
      openApp('about');
      closePower();
    });
    powerPanel.appendChild(pHead);
    powerPanel.appendChild(pSrc);
    powerPanel.appendChild(pSep);
    powerPanel.appendChild(pBtn);
    root.appendChild(powerPanel);

    batt.addEventListener('click', function (e) {
      e.stopPropagation();
      if (powerPanel.hidden) {
        closeAll();
        readBattery();
        pPct.textContent = Math.round(battState.level * 100) + '%';
        pSrc.textContent = 'Power Source: ' + (battState.charging ? 'Power Adapter' : 'Battery');
        powerPanel.hidden = false;
        batt.classList.add('tb-open');
      } else {
        closePower();
      }
    });

    /* static Wi-Fi icon (decorative) */
    var wifi = el('span', 'tb-wifi');
    wifi.innerHTML = wifiSVG(16);
    wifi.title = 'Wi-Fi';
    right.appendChild(wifi);

    /* Spotlight: magnifier button + centered search overlay (app-launcher) */
    spotBtn = el('button', 'tb-spot-btn');
    spotBtn.type = 'button';
    spotBtn.innerHTML = SPOT_SVG;
    spotBtn.title = 'Spotlight';
    spotBtn.setAttribute('aria-label', 'Spotlight');
    right.appendChild(spotBtn);

    spot = el('div', 'tb-spotlight');
    spot.hidden = true;
    var spotRow = el('div', 'tb-spot-row');
    var spotGlyph = el('span', 'tb-spot-glyph');
    spotGlyph.textContent = '🔍';
    var spotInput = el('input', 'tb-spot-input');
    spotInput.type = 'text';
    spotInput.placeholder = 'Spotlight Search';
    spotInput.setAttribute('aria-label', 'Spotlight Search');
    spotRow.appendChild(spotGlyph);
    spotRow.appendChild(spotInput);
    var spotList = el('div', 'tb-spot-results');
    spot.appendChild(spotRow);
    spot.appendChild(spotList);
    (document.body || root).appendChild(spot);

    var spotMatches = [];
    var spotActive = 0;

    function renderSpot() {
      var q = spotInput.value.trim().toLowerCase();
      spotMatches = SPOTLIGHT_APPS.filter(function (a) {
        return !q || a.label.toLowerCase().indexOf(q) !== -1;
      });
      spotActive = 0;
      spotList.innerHTML = '';
      if (!spotMatches.length) {
        var none = el('div', 'tb-spot-none');
        none.textContent = 'No Results';
        spotList.appendChild(none);
        return;
      }
      spotMatches.forEach(function (a, i) {
        var row = el('button', 'tb-spot-item' + (i === spotActive ? ' tb-spot-active' : ''));
        row.type = 'button';
        var g = el('span', 'tb-spot-emoji');
        g.textContent = a.glyph;
        var t = el('span', 'tb-spot-name');
        t.textContent = a.label;
        row.appendChild(g);
        row.appendChild(t);
        row.addEventListener('click', function () {
          openDetail(a.detail);
          closeSpotlight();
        });
        spotList.appendChild(row);
      });
    }

    function paintSpotActive() {
      var rows = spotList.children;
      for (var i = 0; i < rows.length; i++) {
        rows[i].classList.toggle('tb-spot-active', i === spotActive);
      }
    }

    spotInput.addEventListener('input', renderSpot);
    spotInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        if (spotMatches[spotActive]) {
          openDetail(spotMatches[spotActive].detail);
          closeSpotlight();
        }
        e.preventDefault();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (spotMatches.length) {
          var d = e.key === 'ArrowDown' ? 1 : -1;
          spotActive = (spotActive + d + spotMatches.length) % spotMatches.length;
          paintSpotActive();
        }
        e.preventDefault();
      } else if (e.key === 'Escape') {
        closeSpotlight();
      }
    });

    spotBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (spot.hidden) {
        closeAll();
        spotInput.value = '';
        renderSpot();
        spot.hidden = false;
        spotBtn.classList.add('tb-open');
        if (typeof spotInput.focus === 'function') spotInput.focus();
      } else {
        closeSpotlight();
      }
    });

    /* control center pill + reworked frosted panel */
    ccBtn = el('button', 'tb-cc-btn');
    ccBtn.type = 'button';
    ccBtn.innerHTML = CC_SVG;
    ccBtn.title = 'Control Center';
    ccBtn.setAttribute('aria-label', 'Control Center');
    right.appendChild(ccBtn);

    ccPanel = el('div', 'tb-cc-panel');
    ccPanel.hidden = true;

    /* (4a) 2×2 toggle grid; DND is the only one with a side effect (bar glyph) */
    var ccState = { wifi: true, airdrop: false, bt: true, dnd: false };
    var grid = el('div', 'tb-cc-grid');
    [
      { key: 'wifi', label: 'Wi-Fi', svg: wifiSVG(18) },
      { key: 'airdrop', label: 'AirDrop', svg: GLYPHS.airdrop },
      { key: 'bt', label: 'Bluetooth', svg: GLYPHS.bluetooth },
      { key: 'dnd', label: 'Do Not Disturb', svg: GLYPHS.dnd },
    ].forEach(function (t) {
      var cell = el('div', 'tb-cc-toggle');
      var b = el('button', 'tb-cc-tbtn');
      b.type = 'button';
      b.innerHTML = t.svg;
      b.setAttribute('aria-label', t.label);
      var lab = el('span', 'tb-cc-tlabel');
      lab.textContent = t.label;
      function paint() { b.classList.toggle('tb-on', !!ccState[t.key]); }
      b.addEventListener('click', function () {
        ccState[t.key] = !ccState[t.key];
        paint();
        if (t.key === 'dnd') {
          dndGlyph.style.display = ccState.dnd ? 'inline' : 'none';
        }
      });
      paint();
      cell.appendChild(b);
      cell.appendChild(lab);
      grid.appendChild(cell);
    });
    ccPanel.appendChild(grid);

    /* (4b) brightness slider → full-screen dim overlay (persisted) */
    var dim = el('div', 'tb-dim');
    (document.body || root).appendChild(dim);

    function storedBrightness() {
      try {
        var v = Number(localStorage.getItem('tb-brightness'));
        if (isFinite(v) && v >= 10 && v <= 100) return v;
      } catch (e) { /* no storage */ }
      return 100;
    }

    function applyBrightness(v) {
      dim.style.opacity = ((100 - v) / 100 * 0.55).toFixed(3);
      try { localStorage.setItem('tb-brightness', String(v)); } catch (e) { /* no storage */ }
    }

    var brightRow = el('div', 'tb-cc-row');
    var brightIcon = el('span', 'tb-cc-ricon');
    brightIcon.innerHTML = GLYPHS.sun;
    var bright = el('input', 'tb-cc-slider');
    bright.type = 'range';
    bright.min = '10';
    bright.max = '100';
    bright.value = String(storedBrightness());
    bright.setAttribute('aria-label', 'Display Brightness');
    bright.addEventListener('input', function () { applyBrightness(Number(bright.value)); });
    brightRow.appendChild(brightIcon);
    brightRow.appendChild(bright);
    ccPanel.appendChild(brightRow);
    applyBrightness(Number(bright.value));

    /* (4c) battery row: icon + live percent (renderBattery keeps it fresh) */
    var battRow = el('div', 'tb-cc-row tb-cc-battrow');
    ccBattIcon = el('span', 'tb-cc-ricon');
    ccBattText = el('span', 'tb-cc-battpct');
    battRow.appendChild(ccBattIcon);
    battRow.appendChild(ccBattText);
    ccPanel.appendChild(battRow);
    renderBattery();

    /* (4d) volume slider → TBMusic.setVolume(v/100), guarded */
    var volRow = el('div', 'tb-cc-row');
    var volIcon = el('span', 'tb-cc-ricon');
    volIcon.innerHTML = GLYPHS.speaker;
    var vol = el('input', 'tb-cc-slider');
    vol.type = 'range';
    vol.min = '0';
    vol.max = '100';
    vol.setAttribute('aria-label', 'Music Volume');
    volRow.appendChild(volIcon);
    volRow.appendChild(vol);
    ccPanel.appendChild(volRow);

    function musicApi() {
      return (typeof window.TBMusic !== 'undefined' && window.TBMusic) || null;
    }

    function musicVolumeFn() {
      var api = musicApi();
      return (api && typeof api.setVolume === 'function') ? api.setVolume.bind(api) : null;
    }

    function refreshVolume() {
      var fn = musicVolumeFn();
      vol.disabled = !fn;
      vol.title = fn ? 'Music Volume' : 'Music not loaded';
      var api = musicApi();
      if (api && typeof api.state === 'function') {
        var st = null;
        try { st = api.state(); } catch (e) { /* guard */ }
        if (st && typeof st.volume === 'number') {
          vol.value = String(Math.round(st.volume * 100));
        }
      }
    }

    vol.addEventListener('input', function () {
      var fn = musicVolumeFn();
      if (fn) fn(Number(vol.value) / 100);
    });
    refreshVolume();

    /* (4e) music mini-player row: art tile + labels + one action button.
       The notch's Spotify embed is cross-origin, so playback can't be driven
       from here — the button opens the notch player panel instead (play lives
       inside Spotify's own iframe). The static ▶ glyph is honest: embed
       playback state is unknowable (tb:music-state always says false). */
    var musicRow = el('div', 'tb-cc-music');
    var art = el('span', 'tb-cc-art');
    var artEmoji = el('span', 'tb-cc-art-emoji');
    art.appendChild(artEmoji);
    var mTexts = el('span', 'tb-cc-mtexts');
    var mTitle = el('span', 'tb-cc-mtitle');
    mTitle.textContent = 'Music';
    var mName = el('span', 'tb-cc-mname');
    mTexts.appendChild(mTitle);
    mTexts.appendChild(mName);
    var mBtns = el('span', 'tb-cc-mbtns');
    var mPlay = el('button', 'tb-cc-mbtn');
    mPlay.type = 'button';
    mPlay.innerHTML = GLYPHS.play;
    mPlay.setAttribute('aria-label', 'Show music player');
    mPlay.title = 'Show music player in the notch';
    mBtns.appendChild(mPlay);
    musicRow.appendChild(art);
    musicRow.appendChild(mTexts);
    musicRow.appendChild(mBtns);
    ccPanel.appendChild(musicRow);

    function refreshMusic() {
      var api = musicApi();
      var ok = !!(api && typeof api.state === 'function');
      musicRow.classList.toggle('tb-cc-disabled', !ok);
      mPlay.disabled = !ok;
      var st = null;
      if (ok) {
        try { st = api.state(); } catch (e) { /* guard */ }
      }
      var station = st && st.station;
      if (station) {
        art.style.background = (station.grad && station.grad.length >= 2)
          ? 'linear-gradient(135deg,' + station.grad[0] + ',' + station.grad[1] + ')'
          : 'linear-gradient(135deg,#3a3a3c,#1c1c1e)';
        artEmoji.textContent = station.emoji || '🎵';
        mName.textContent = station.name || '';
      } else {
        art.style.background = 'linear-gradient(135deg,#3a3a3c,#1c1c1e)';
        artEmoji.textContent = '🎵';
        mName.textContent = ok ? 'Not Playing' : 'Not loaded';
      }
    }

    /* TBMusic.toggle() is a documented no-op on the embed build, so the real
       expand path is the tb:open-app event the notch listens for. */
    mPlay.addEventListener('click', function () {
      openApp('music');
      closeCC();
    });
    window.addEventListener('tb:music-state', refreshMusic);
    refreshMusic();

    root.appendChild(ccPanel);

    ccBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (ccPanel.hidden) {
        closeAll();
        refreshVolume();
        refreshMusic();
        readBattery();
        ccPanel.hidden = false;
        ccBtn.classList.add('tb-open');
      } else {
        closeCC();
      }
    });

    /* two-part live clock: "Fri Aug 28 2026" + "07:49 PM", refreshed every 15 s */
    var clock = el('span', 'tb-clock');
    var clockDate = el('span', 'tb-clock-date');
    var clockTime = el('span', 'tb-clock-time');
    clock.appendChild(clockDate);
    clock.appendChild(clockTime);
    function tickClock() {
      var now = new Date();
      clockDate.textContent = fmtDate(now);
      clockTime.textContent = fmtTime(now);
    }
    tickClock();
    setInterval(tickClock, 15000);
    right.appendChild(clock);

    /* (d) global close: click elsewhere or Escape */
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (openMenu && !openMenu.contains(t)) closeMenus();
      if (ccPanel && !ccPanel.hidden && !ccPanel.contains(t) && !ccBtn.contains(t)) closeCC();
      if (powerPanel && !powerPanel.hidden && !powerPanel.contains(t) && !batt.contains(t)) closePower();
      if (spot && !spot.hidden && !spot.contains(t) && !spotBtn.contains(t)) closeSpotlight();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAll();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
