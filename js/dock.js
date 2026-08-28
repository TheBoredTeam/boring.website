/* js/dock.js — macOS-style Dock. Owned by Dev C.
   Renders into <div id="dock-root">. Dispatches 'tb:open-app' on icon clicks,
   listens for 'tb:music-state' / 'tb:window-state' to drive running dots.
   Degrades silently if the mount point or peer modules are missing. */
(function () {
  'use strict';

  var BASE = 52;        /* icon layout size (px) */
  var MAX_SCALE = 1.6;  /* peak magnification at cursor center (~84px) */
  var RANGE = 100;      /* cosine falloff radius (px) */
  var LIFT = 14;        /* max translateY lift at full scale (px) */

  /* window-state app name -> dock icon id (GitHub shares app 'safari' but
     has no dot of its own — the Safari icon carries that indicator). */
  var WINDOW_APP_TO_ICON = {
    about: 'finder',
    safari: 'safari',
    download: 'download',
    coffee: 'coffee'
  };

  /* null entries render as 1px vertical separators. Defs with an `icon` path
     render a PNG instead of the emoji/gradient; defs with an `href` open a new
     tab instead of dispatching 'tb:open-app'. */
  var ICONS = [
    { id: 'finder',   label: 'Finder',          icon: 'assets/icons/finder.png',       app: 'about'    },
    { id: 'apps',     label: 'Apps',      icon: 'assets/icons/apps.png'      },
    { id: 'messages', label: 'Messages',  icon: 'assets/icons/messages.png'  },
    { id: 'facetime', label: 'FaceTime',  icon: 'assets/icons/facetime.png'  },
    { id: 'music',    label: 'Boring.Notch',    icon: 'assets/icons/boring-notch.png', app: 'music'    },
    { id: 'github',   label: 'GitHub',          icon: 'assets/icons/github.png',       app: 'safari'   },
    { id: 'music2',   label: 'Music',     icon: 'assets/icons/music.png'     },
    { id: 'maps',     label: 'Maps',      icon: 'assets/icons/maps.png'      },
    { id: 'appstore', label: 'App Store', icon: 'assets/icons/app-store.png' },
    { id: 'notes',    label: 'Notes',     icon: 'assets/icons/notes.png'     },
    { id: 'safari',   label: 'Safari',          icon: 'assets/icons/safari.png',       app: 'safari'   },
    null,
    { id: 'download', label: 'Downloads',       icon: 'assets/icons/downloads.png',    app: 'download' },
    { id: 'coffee',   label: 'Buy Me a Coffee', icon: 'assets/icons/google-play-app.webp', app: 'coffee' },
    { id: 'claude',   label: 'Claude',          icon: 'assets/icons/claude.png',       href: 'https://claude.ai' },
    { id: 'discord',  label: 'Discord',   icon: 'assets/icons/discord.png'   },
    { id: 'settings', label: 'Settings',  icon: 'assets/icons/settings.png'  },
    { id: 'spotify',  label: 'Spotify',   icon: 'assets/icons/spotify.png'   },
    { id: 'slack',    label: 'Slack',     icon: 'assets/icons/slack.png'     },
    { id: 'xcode',    label: 'Xcode',     icon: 'assets/icons/xcode.png'     },
    { id: 'terminal', label: 'Terminal',  icon: 'assets/icons/terminal.png'  },
    { id: 'whatsapp', label: 'WhatsApp',  icon: 'assets/icons/whatsapp.png'  },
    null,
    { id: 'trash',    label: 'Trash',           icon: 'https://s3-new.macosicons.com/macosicons/parse/macOS_Bin_full_n13LwuIChY_lowResPng-46c4e9cea2.png', app: null      }
  ];

  function init() {
    var mount = document.getElementById('dock-root');
    if (!mount) { return; }

    var tray = document.createElement('nav');
    tray.className = 'tb-dock';
    tray.setAttribute('aria-label', 'Dock');

    var items = []; /* { item, btn } for magnification */
    var dots = {};  /* icon id -> dot element */

    ICONS.forEach(function (def) {
      if (def === null) {
        var sep = document.createElement('div');
        sep.className = 'tb-dock-separator';
        sep.setAttribute('aria-hidden', 'true');
        tray.appendChild(sep);
        return;
      }

      var item = document.createElement('div');
      item.className = 'tb-dock-item';

      var tooltip = document.createElement('span');
      tooltip.className = 'tb-dock-tooltip';
      tooltip.setAttribute('aria-hidden', 'true');
      tooltip.textContent = def.label;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tb-dock-icon';
      btn.setAttribute('aria-label', def.label);

      var img = document.createElement('span');
      img.className = 'tb-dock-icon-img';
      img.setAttribute('aria-hidden', 'true');
      if (def.icon) {
        /* PNG icon: full-bleed squircle, no gradient or emoji. */
        var file = document.createElement('img');
        file.className = 'tb-dock-icon-img-file';
        file.src = def.icon;
        file.alt = '';
        file.setAttribute('aria-hidden', 'true');
        file.draggable = false;
        img.appendChild(file);
      } else {
        img.style.background =
          'linear-gradient(180deg, ' + def.colors[0] + ' 0%, ' + def.colors[1] + ' 100%)';
        img.textContent = def.emoji;
      }

      var dot = document.createElement('span');
      dot.className = 'tb-dock-dot';
      dot.setAttribute('aria-hidden', 'true');

      btn.appendChild(img);
      item.appendChild(tooltip);
      item.appendChild(btn);
      item.appendChild(dot);
      tray.appendChild(item);

      items.push({ item: item, btn: btn });
      dots[def.id] = dot;

      if (def.href) {
        /* External link: open in a new tab, no app dispatch, no dot. */
        btn.addEventListener('click', function () {
          window.open(def.href, '_blank', 'noopener');
        });
      } else if (def.app) {
        btn.addEventListener('click', function () {
          window.dispatchEvent(new CustomEvent('tb:open-app', { detail: { app: def.app } }));
        });
      } else {
        /* Trash: decorative — wiggle instead of dispatching. */
        btn.addEventListener('click', function () {
          btn.classList.remove('tb-dock-icon--wiggle');
          void btn.offsetWidth; /* restart the animation */
          btn.classList.add('tb-dock-icon--wiggle');
        });
        btn.addEventListener('animationend', function () {
          btn.classList.remove('tb-dock-icon--wiggle');
        });
      }
    });

    mount.appendChild(tray);

    /* ---- Magnification: scale by cursor distance AND push neighbors apart
       (each icon shifts by the accumulated extra width before it), so scaled
       icons spread with a real gap instead of stacking on each other. Rest
       centers are cached per hover session so tray padding growth and item
       shifts can't feed back into the distance math. ---- */
    var restCenters = null;

    function cacheRestCenters() {
      restCenters = items.map(function (it) {
        var r = it.item.getBoundingClientRect();
        return r.left + r.width / 2;
      });
    }

    function magnify(clientX) {
      if (!restCenters) { cacheRestCenters(); }
      var scales = [];
      var i;
      for (i = 0; i < items.length; i++) {
        var dist = Math.abs(clientX - restCenters[i]);
        var scale = 1;
        if (dist < RANGE) {
          /* cosine falloff: 1 at the cursor, 0 at the range edge */
          var t = (Math.cos((dist / RANGE) * Math.PI) + 1) / 2;
          scale = 1 + (MAX_SCALE - 1) * t;
        }
        scales.push(scale);
      }
      var baseTotal = 0;
      var scaledTotal = 0;
      for (i = 0; i < items.length; i++) {
        var w = BASE * scales[i];
        var shift = (scaledTotal + w / 2) - (baseTotal + BASE / 2);
        var lift = (scales[i] - 1) * LIFT;
        /* the wrapper shifts (tooltip + dot track the icon); the button
           scales + lifts inside it */
        items[i].item.style.transform = 'translateX(' + shift.toFixed(2) + 'px)';
        items[i].btn.style.transform =
          'translateY(' + (-lift).toFixed(2) + 'px) scale(' + scales[i].toFixed(3) + ')';
        baseTotal += BASE;
        scaledTotal += w;
      }
      /* the frosted tray grows with the spread (visual only — the distance
         math above uses the cached rest centers, never live rects) */
      var extra = Math.max(0, scaledTotal - baseTotal);
      tray.style.paddingLeft = (10 + extra / 2) + 'px';
      tray.style.paddingRight = (10 + extra / 2) + 'px';
    }

    function reset() {
      for (var i = 0; i < items.length; i++) {
        items[i].item.style.transform = '';
        items[i].btn.style.transform = '';
      }
      tray.style.paddingLeft = '';
      tray.style.paddingRight = '';
      restCenters = null;
    }

    /* magnification is a hover feature — off on narrow/touch layouts where
       the tray scrolls instead (scroll offsets would corrupt the math) */
    tray.addEventListener('mousemove', function (e) {
      if (window.innerWidth <= 768) { return; }
      magnify(e.clientX);
    });
    tray.addEventListener('mouseleave', reset);

    /* ---- Running-indicator dots ---- */
    function setDot(iconId, on) {
      var dot = dots[iconId];
      if (dot) { dot.classList.toggle('tb-dock-dot--on', !!on); }
    }

    /* Music dot follows playback state from the notch module. */
    window.addEventListener('tb:music-state', function (e) {
      var d = e && e.detail;
      if (!d) { return; }
      setDot('music', d.playing === true);
    });

    /* Finder/Safari/Downloads/Coffee dots follow window state. */
    window.addEventListener('tb:window-state', function (e) {
      var d = e && e.detail;
      if (!d || typeof d.app !== 'string') { return; }
      var iconId = WINDOW_APP_TO_ICON[d.app];
      if (!iconId) { return; }
      setDot(iconId, d.state !== 'closed');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
