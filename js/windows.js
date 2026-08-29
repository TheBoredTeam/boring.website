/* js/windows.js — Dev D: in-page macOS window manager.
   Owns .tb-window lifecycle (open/focus/minimize/restore/close/zoom/drag),
   renders content via window.TBApps (with fallback), reports to the dock via
   'tb:window-state', consumes 'tb:open-app'. IIFE, self-initializes. */
(function () {
  "use strict";

  var zCounter = 100,
    root = null;
  var windowsByApp = {}; /* app -> { el, app, state, zoomed, preZoom, token } */

  /* App -> window spec (hardcoded per contract). */
  var APP_SPECS = {
    safari: { title: "Safari", chrome: "safari", emoji: "🧭" },
    download: { title: "Downloads", chrome: "plain", emoji: "⬇️" },
    coffee: { title: "Buy Me a Coffee", chrome: "plain", emoji: "☕" },
    about: { title: "About This Mac", chrome: "plain", emoji: "🖥️" },
    folder: { title: "Folder", chrome: "plain", emoji: "📁" },
    viewer: { title: "Preview", chrome: "plain", emoji: "👁️" },
    /* width/height are optional: absent -> the shared 620x420 formula below. */
    video: {
      title: "YouTube",
      chrome: "plain",
      emoji: "📺",
      width: 480,
      height: 340,
    },
    office: {
      title: "theboringoffice",
      chrome: "safari",
      emoji: "🏢",
      width: 900,
      height: 520,
      top: 400,
      urlLabel: "office.theboring.name",
    },
    messages: {
      title: "Messages",
      chrome: "plain",
      emoji: "💬",
      width: 680,
      height: 520,
    },
    whatsapp: {
      title: "WhatsApp",
      chrome: "plain",
      emoji: "💚",
      width: 720,
      height: 540,
    },
    terminal: {
      title: "Terminal — zsh",
      chrome: "plain",
      emoji: "⬛",
      width: 620,
      height: 440,
    },
    facetime: {
      title: "FaceTime",
      chrome: "plain",
      emoji: "📹",
      width: 640,
      height: 480,
    },
    /* Launchpad grid, opened by the dock's 'apps' icon. */
    apps: {
      title: "Applications",
      chrome: "plain",
      emoji: "🧩",
      width: 760,
      height: 560,
    },
    discord: {
      title: "Discord",
      chrome: "plain",
      emoji: "💬",
      width: 520,
      height: 560,
    },
    settings: {
      title: "System Settings",
      chrome: "plain",
      emoji: "⚙️",
      width: 720,
      height: 520,
    },
    spotify: {
      title: "Spotify",
      chrome: "plain",
      emoji: "🟢",
      width: 560,
      height: 600,
    },
  };
  /* Fallback-card external link per app (read live from TB_CONFIG). */
  var FALLBACK_LINKS = {
    safari: function (c) {
      return c && c.links && c.links.github;
    },
    download: function (c) {
      return c && c.links && c.links.githubReleases;
    },
    coffee: function (c) {
      return c && c.links && c.links.buymeacoffee;
    },
    about: function (c) {
      return c && c.links && c.links.github;
    },
  };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) {
      n.className = cls;
    }
    if (text != null) {
      n.textContent = text;
    }
    return n;
  }
  function dispatchState(app, state) {
    window.dispatchEvent(
      new CustomEvent("tb:window-state", {
        detail: { app: app, state: state },
      }),
    );
  }
  function safariUrlLabel() {
    var cfg = window.TB_CONFIG;
    var url = cfg && cfg.links && cfg.links.github;
    if (!url) {
      return "";
    }
    try {
      var u = new URL(url);
      return u.host + u.pathname.replace(/\/$/, "");
    } catch (err) {
      return String(url)
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "");
    }
  }

  /* ---- focus / topmost ---- */
  function focusWindow(rec) {
    rec.el.style.zIndex = String(++zCounter);
  }
  function topmostRecord() {
    var best = null;
    Object.keys(windowsByApp).forEach(function (app) {
      var rec = windowsByApp[app];
      if (rec.state !== "open") {
        return;
      }
      if (
        !best ||
        Number(rec.el.style.zIndex || 0) > Number(best.el.style.zIndex || 0)
      ) {
        best = rec;
      }
    });
    return best;
  }

  /* ---- state transitions ---- */
  function closeWindow(rec) {
    delete windowsByApp[rec.app];
    if (rec.el.parentNode) {
      rec.el.parentNode.removeChild(rec.el);
    }
    dispatchState(rec.app, "closed");
  }
  function minimizeWindow(rec) {
    if (rec.state !== "open") {
      return;
    }
    rec.state = "minimized";
    rec.token += 1;
    var token = rec.token,
      el = rec.el,
      r = el.getBoundingClientRect();
    var dx = window.innerWidth / 2 - (r.left + r.width / 2);
    var dy = window.innerHeight - r.top - 24;
    el.style.transform =
      "translate(" + Math.round(dx) + "px," + Math.round(dy) + "px) scale(0.1)";
    el.style.opacity = "0";
    el.style.pointerEvents = "none";
    var finish = function () {
      if (token !== rec.token) {
        return;
      } /* restored meanwhile */
      el.style.display = "none";
      dispatchState(rec.app, "minimized");
    };
    el.addEventListener("transitionend", function onEnd(ev) {
      if (ev.propertyName !== "transform") {
        return;
      }
      el.removeEventListener("transitionend", onEnd);
      finish();
    });
    setTimeout(finish, 450); /* fallback if transitionend never fires */
  }
  function restoreWindow(rec) {
    if (rec.state !== "minimized") {
      return;
    }
    rec.state = "open";
    rec.token += 1; /* cancel any pending minimize finish */
    var el = rec.el;
    el.style.display = "flex";
    void el.offsetHeight; /* force reflow so the transition runs */
    el.style.transform = "";
    el.style.opacity = "";
    el.style.pointerEvents = "";
    focusWindow(rec);
    dispatchState(rec.app, "restored");
  }
  function toggleZoom(rec) {
    if (rec.state !== "open") {
      return;
    }
    var el = rec.el,
      rootRect = root.getBoundingClientRect();
    el.classList.add("tb-animating");
    if (rec.zoomed && rec.preZoom) {
      el.style.left = rec.preZoom.left + "px";
      el.style.top = rec.preZoom.top + "px";
      el.style.width = rec.preZoom.width + "px";
      el.style.height = rec.preZoom.height + "px";
      rec.zoomed = false;
    } else {
      rec.preZoom = {
        left: el.offsetLeft,
        top: el.offsetTop,
        width: el.offsetWidth,
        height: el.offsetHeight,
      };
      /* Contract zoom rect: {left:5vw, top:4vh, width:90vw, height:82vh} */
      el.style.left = window.innerWidth * 0.05 - rootRect.left + "px";
      el.style.top = window.innerHeight * 0.04 - rootRect.top + "px";
      el.style.width = window.innerWidth * 0.9 + "px";
      el.style.height = window.innerHeight * 0.82 + "px";
      rec.zoomed = true;
    }
    setTimeout(function () {
      el.classList.remove("tb-animating");
    }, 420);
  }

  /* ---- dragging (titlebar only, clamped: >=60px stays in viewport) ---- */
  function attachDrag(rec, titlebar) {
    titlebar.addEventListener("pointerdown", function (e) {
      if (e.button !== 0 || e.target.closest(".tb-window-traffic")) {
        return;
      }
      var el = rec.el,
        startX = e.clientX,
        startY = e.clientY;
      var origLeft = el.offsetLeft,
        origTop = el.offsetTop;
      try {
        titlebar.setPointerCapture(e.pointerId);
      } catch (err) {
        /* noop */
      }
      var move = function (ev) {
        var nl = Math.max(
          60 - el.offsetWidth,
          Math.min(root.clientWidth - 60, origLeft + ev.clientX - startX),
        );
        var nt = Math.max(
          0,
          Math.min(root.clientHeight - 60, origTop + ev.clientY - startY),
        );
        el.style.left = nl + "px";
        el.style.top = nt + "px";
      };
      var up = function () {
        titlebar.removeEventListener("pointermove", move);
        titlebar.removeEventListener("pointerup", up);
        titlebar.removeEventListener("pointercancel", up);
      };
      titlebar.addEventListener("pointermove", move);
      titlebar.addEventListener("pointerup", up);
      titlebar.addEventListener("pointercancel", up);
    });
  }

  /* ---- touch dragging (legacy browsers without Pointer Events) ----
     Modern browsers (incl. iOS 13+) already drag via the pointerdown path
     above — `touch-action: none` on the titlebar (css/windows.css) keeps the
     gesture off the scroll path. This fallback is inert wherever
     window.PointerEvent exists, so mouse behavior is byte-for-byte
     identical; it mirrors the pointer drag logic 1:1. */
  function attachTouchDragFallback(rec, titlebar) {
    if (window.PointerEvent) {
      return;
    }
    titlebar.addEventListener("touchstart", function (e) {
      if (e.target.closest(".tb-window-traffic")) {
        return;
      }
      focusWindow(rec);
      var t = e.touches[0];
      var el = rec.el,
        startX = t.clientX,
        startY = t.clientY;
      var origLeft = el.offsetLeft,
        origTop = el.offsetTop;
      var move = function (ev) {
        var m = ev.touches[0];
        var nl = Math.max(
          60 - el.offsetWidth,
          Math.min(root.clientWidth - 60, origLeft + m.clientX - startX),
        );
        var nt = Math.max(
          0,
          Math.min(root.clientHeight - 60, origTop + m.clientY - startY),
        );
        el.style.left = nl + "px";
        el.style.top = nt + "px";
        ev.preventDefault(); /* stop the page rubber-banding mid-drag */
      };
      var up = function () {
        titlebar.removeEventListener("touchmove", move);
        titlebar.removeEventListener("touchend", up);
        titlebar.removeEventListener("touchcancel", up);
      };
      titlebar.addEventListener("touchmove", move, { passive: false });
      titlebar.addEventListener("touchend", up);
      titlebar.addEventListener("touchcancel", up);
    });
  }

  /* ---- content ---- */
  function buildFallback(app, spec) {
    var card = el("div", "tb-fallback");
    card.appendChild(el("div", "tb-fallback-emoji", spec.emoji || "🪟"));
    card.appendChild(el("div", "tb-fallback-title", spec.title));
    var href = FALLBACK_LINKS[app]
      ? FALLBACK_LINKS[app](window.TB_CONFIG)
      : null;
    if (href) {
      var a = el("a", "tb-fallback-link", "Open in new tab ↗");
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener";
      card.appendChild(a);
    } else {
      /* TB_CONFIG missing -> plain text */
      card.appendChild(
        el("span", "tb-fallback-link tb-fallback-plain", "Open in new tab ↗"),
      );
    }
    return card;
  }
  function fillContent(app, spec, contentEl) {
    var node = null,
      apps = window.TBApps;
    if (apps && typeof apps.render === "function") {
      var ropts;
      if (spec && spec.folder) {
        ropts = { name: spec.folder };
      } else if (spec && spec.path) {
        ropts = { path: spec.path };
      }
      try {
        node = apps.render(app, ropts);
      } catch (err) {
        node = null;
      }
    }
    contentEl.appendChild(
      node && node.nodeType === 1 ? node : buildFallback(app, spec),
    );
  }

  /* ---- construction ---- */
  function buildWindow(app, spec) {
    var w = el("section", "tb-window");
    w.setAttribute("data-app", app);
    w.setAttribute("role", "dialog");
    w.setAttribute("aria-label", spec.title);
    var titlebar = el("header", "tb-window-titlebar");
    var traffic = el("div", "tb-window-traffic");
    [
      ["tb-tl-close", "Close"],
      ["tb-tl-min", "Minimize"],
      ["tb-tl-zoom", "Zoom"],
    ].forEach(function (p) {
      var b = el("button", "tb-tl " + p[0]);
      b.type = "button";
      b.tabIndex = -1;
      b.setAttribute("aria-label", p[1]);
      traffic.appendChild(b);
    });
    titlebar.appendChild(traffic);
    titlebar.appendChild(el("span", "tb-window-title", spec.title));
    w.appendChild(titlebar);

    if (spec.chrome === "safari") {
      var bar = el("div", "tb-window-addressbar");
      bar.appendChild(el("span", "tb-ab-nav", "‹"));
      bar.appendChild(el("span", "tb-ab-nav", "›"));
      var field = el("div", "tb-ab-field");
      field.appendChild(el("span", "tb-ab-lock", "🔒"));
      field.appendChild(el("span", "tb-ab-url", spec.urlLabel || ""));
      bar.appendChild(field);
      bar.appendChild(el("span", "tb-ab-reload", "↻"));
      w.appendChild(bar);
    }

    var content = el("div", "tb-window-content");
    w.appendChild(content);
    fillContent(app, spec, content);

    /* Cascade: 24px steps from center, by existing window count.
       Spec width/height (video) override the shared default size. */
    var count = Object.keys(windowsByApp).length;
    var cw = spec.width || Math.min(620, Math.max(480, root.clientWidth - 80));
    var ch =
      spec.height || Math.min(420, Math.max(320, root.clientHeight - 60));
    w.style.width = cw + "px";
    w.style.height = ch + "px";
    /* Clamp to >=0: the 480px min-width floor makes the center-cascade
       formula go negative on viewports narrower than cw (e.g. -52px at
       375px). No-op at >=480px wide, where the formula is already >=0. */
    w.style.left =
      Math.max(
        0,
        typeof spec.left === "number"
          ? Math.round(spec.left)
          : Math.round((root.clientWidth - cw) / 2 + count * 24),
      ) + "px";
    w.style.top =
      Math.max(
        0,
        typeof spec.top === "number"
          ? Math.round(spec.top)
          : Math.round((root.clientHeight - ch) / 2 + count * 24),
      ) + "px";
    w.style.zIndex = String(++zCounter);

    var rec = {
      el: w,
      app: app,
      state: "open",
      zoomed: false,
      preZoom: null,
      token: 0,
    };
    traffic.children[0].addEventListener("click", function () {
      closeWindow(rec);
    });
    traffic.children[1].addEventListener("click", function () {
      minimizeWindow(rec);
    });
    traffic.children[2].addEventListener("click", function () {
      toggleZoom(rec);
    });
    w.addEventListener(
      "pointerdown",
      function () {
        focusWindow(rec);
      },
      true,
    );
    attachDrag(rec, titlebar);
    attachTouchDragFallback(rec, titlebar);
    return rec;
  }

  /* ---- public open path (event listener + TBWindows.open share this) ---- */
  function openApp(app, overrides) {
    if (!root) {
      return;
    }
    var base = APP_SPECS[app] || { title: app, chrome: "plain", emoji: "🪟" };
    var spec = {
      title: (overrides && overrides.title) || base.title,
      chrome: (overrides && overrides.chrome) || base.chrome,
      urlLabel:
        (overrides && overrides.urlLabel) ||
        base.urlLabel ||
        (base.chrome === "safari" ? safariUrlLabel() : ""),
      emoji: base.emoji,
      folder: (overrides && overrides.folder) || null,
      path: (overrides && overrides.path) || null,
      width: (overrides && overrides.width) || base.width || 0,
      height: (overrides && overrides.height) || base.height || 0,
      left:
        overrides && typeof overrides.left === "number"
          ? overrides.left
          : typeof base.left === "number"
            ? base.left
            : null,
      top:
        overrides && typeof overrides.top === "number"
          ? overrides.top
          : typeof base.top === "number"
            ? base.top
            : null,
    };
    /* folder windows key per folder, viewer windows per path */
    var key =
      app +
      (spec.folder ? ":" + spec.folder : "") +
      (spec.path ? ":" + spec.path : "");
    var rec = windowsByApp[key];
    if (rec && rec.state === "minimized") {
      restoreWindow(rec);
      return;
    } /* dispatches 'restored' */
    if (rec && rec.state === "open") {
      focusWindow(rec);
      return;
    } /* focus alone dispatches nothing */
    rec = buildWindow(app, spec);
    windowsByApp[key] = rec;
    root.appendChild(rec.el);
    dispatchState(app, "open");
  }

  /* ---- wiring ---- */
  function onOpenApp(e) {
    var d = e.detail || {};
    var app = d.app;
    if (!app || !APP_SPECS[app]) {
      return;
    } /* 'music' belongs to notch.js */
    openApp(app, {
      title: typeof d.title === "string" && d.title ? d.title : undefined,
      folder: typeof d.folder === "string" && d.folder ? d.folder : undefined,
      path: typeof d.path === "string" && d.path ? d.path : undefined,
    });
  }
  function init() {
    root = document.getElementById("windows-root");
    if (!root) {
      return;
    } /* mount point missing: degrade silently */
    window.TBWindows = {
      open: function (opts) {
        if (!opts || !opts.app) {
          return;
        }
        openApp(opts.app, opts);
      },
    };
    window.addEventListener("tb:open-app", onOpenApp);
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") {
        return;
      }
      var top = topmostRecord();
      if (top) {
        closeWindow(top);
      }
    });
    /* Boot: the YouTube demo window sits already-open on EVERY screen (it's
       the product trailer; the @768 window rules render it near-fullscreen
       on phones). theboringoffice joins it SIDE BY SIDE with a 24px gap only
       on wide screens — the live iframe embed is a desktop experience.
       Closing deletes their records, so nothing re-opens them afterwards. */
    if (root.clientWidth > 900) {
      var pairW = 480 + 24 + 700;
      var startX = Math.max(14, Math.round((root.clientWidth - pairW) / 2));
      openApp("video", { left: startX, top: 400 });
      openApp("office", {
        left: startX + 480 + 24,
        top: 400,
        width: 700,
        height: 480,
      });
    } else {
      openApp("video");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
