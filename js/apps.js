/* js/apps.js — content that lives INSIDE the windows.
   Exposes window.TBApps.render(appId, opts) -> HTMLElement. Renderers are
   self-contained; folder rows fire-and-forget 'tb:open-app' for the window
   manager. Outbound links come from window.TB_CONFIG and degrade to '#'. */
(function () {
  'use strict';

  /* ---------- config helpers (never throw when TB_CONFIG is missing) ---------- */

  function cfg() {
    return (typeof window.TB_CONFIG !== 'undefined' && window.TB_CONFIG) || {};
  }

  function siteName() {
    var c = cfg();
    return typeof c.appName === 'string' && c.appName ? c.appName : 'theboringwebsite';
  }

  function link(key) {
    var c = cfg();
    if (c.links && typeof c.links[key] === 'string' && c.links[key]) {
      return c.links[key];
    }
    return '#';
  }

  /* ---------- tiny DOM utilities ---------- */

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function el(tag, className, html) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (html) node.innerHTML = html;
    return node;
  }

  function parseRepo(url) {
    var parts = String(url || '').replace(/\/+$/, '').split('/');
    if (parts.length >= 2 && parts[parts.length - 2] && parts[parts.length - 1]) {
      return { org: parts[parts.length - 2], repo: parts[parts.length - 1] };
    }
    return { org: 'TheBoredTeam', repo: siteName() };
  }

  function copyText(text, btn) {
    function done() {
      btn.textContent = 'Copied!';
      setTimeout(function () { btn.textContent = '📋 Copy'; }, 1600);
    }
    function legacy() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'absolute';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) { /* best effort */ }
      document.body.removeChild(ta);
      done();
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, legacy);
    } else {
      legacy();
    }
  }

  /* ---------- safari: self-contained GitHub repo page replica ---------- */

  function renderSafari() {
    var github = link('github');
    var repo = parseRepo(github);
    var cloneUrl = github === '#' ? '#' : github + '.git';
    var name = siteName();
    var root = el('div', 'tb-gh-page');

    root.appendChild(el('div', 'tb-gh-header',
      '<div class="tb-gh-header-left">' +
        '<span class="tb-gh-book">📖</span>' +
        '<a class="tb-gh-org" href="' + esc(github) + '" target="_blank" rel="noopener">' + esc(repo.org) + '</a>' +
        '<span class="tb-gh-slash">/</span>' +
        '<a class="tb-gh-repo" href="' + esc(github) + '" target="_blank" rel="noopener">' + esc(repo.repo) + '</a>' +
        '<span class="tb-gh-pill">Public</span>' +
      '</div>' +
      '<div class="tb-gh-header-right">' +
        '<span class="tb-gh-btn">👁 Watch <b>12</b></span>' +
        '<span class="tb-gh-btn">🍴 Fork <b>8</b></span>' +
        '<span class="tb-gh-btn">★ Star <b>128</b></span>' +
      '</div>'));

    root.appendChild(el('div', 'tb-gh-tabs',
      '<span class="tb-gh-tab tb-gh-tab-active">&lt;&gt; Code</span>' +
      '<span class="tb-gh-tab">⊙ Issues</span>' +
      '<span class="tb-gh-tab">⑂ Pull requests</span>' +
      '<span class="tb-gh-tab">▶ Actions</span>'));

    root.appendChild(el('div', 'tb-gh-branch-row',
      '<span class="tb-gh-branch-pill">⑂ main</span>' +
      '<span class="tb-gh-filecount">42 files · 6 folders</span>'));

    var cloneWrap = el('div', 'tb-gh-clone-wrap');
    var codeBtn = el('button', 'tb-gh-code-btn', '‹› Code ▾');
    codeBtn.type = 'button';
    var cloneBox = el('div', 'tb-gh-clone-box',
      '<div class="tb-gh-clone-label">Clone with HTTPS</div>' +
      '<div class="tb-gh-clone-row">' +
        '<input class="tb-gh-clone-field" type="text" readonly value="' + esc(cloneUrl) + '">' +
        '<button class="tb-gh-copy-btn" type="button">📋 Copy</button>' +
      '</div>');
    cloneBox.style.display = 'none';
    codeBtn.addEventListener('click', function () {
      cloneBox.style.display = cloneBox.style.display === 'none' ? 'block' : 'none';
    });
    var copyBtn = cloneBox.querySelector('.tb-gh-copy-btn');
    copyBtn.addEventListener('click', function () { copyText(cloneUrl, copyBtn); });
    cloneWrap.appendChild(codeBtn);
    cloneWrap.appendChild(cloneBox);
    root.appendChild(cloneWrap);

    root.appendChild(el('div', 'tb-gh-readme',
      '<div class="tb-gh-readme-head">📄 README.md</div>' +
      '<div class="tb-gh-readme-body">' +
        '<h1 class="tb-gh-h1">🎧 ' + esc(name) + '</h1>' +
        '<p class="tb-gh-badges">' +
          '<span class="tb-badge"><i>version</i><b class="tb-badge-blue tb-live-version" data-version-tpl="{v}">…</b></span>' +
          '<span class="tb-badge"><i>license</i><b class="tb-badge-green">MIT</b></span>' +
          '<span class="tb-badge"><i>made with</i><b class="tb-badge-brown">☕</b></span>' +
        '</p>' +
        '<p class="tb-gh-p">A pixel-faithful macOS desktop that lives in your browser. ' +
          'Functional Dynamic-Island notch streaming lofi radio, magnifying dock, and a self-contained Safari.</p>' +
        '<ul class="tb-gh-ul">' +
          '<li>🎵 lofi radio notch</li>' +
          '<li>🖥️ macOS desktop</li>' +
          '<li>🧭 in-page Safari</li>' +
          '<li>⬇️ free download</li>' +
        '</ul>' +
        '<a class="tb-btn-primary" href="' + esc(github) + '" target="_blank" rel="noopener">View on GitHub ↗</a>' +
      '</div>'));

    setVersionInto(root);
    return root;
  }

  /* live version labels: swaps the {v} slot of every .tb-live-version's
     data-version-tpl for the repo's latest tag (via config.js, cached). */
  function setVersionInto(node) {
    var cfg = (typeof window.TB_CONFIG === 'object' && window.TB_CONFIG) || null;
    if (!cfg || typeof cfg.getLatestTag !== 'function' || !node) { return; }
    cfg.getLatestTag(function (tag) {
      var els = node.querySelectorAll('.tb-live-version');
      for (var i = 0; i < els.length; i++) {
        var tpl = els[i].getAttribute('data-version-tpl');
        els[i].textContent = tpl ? tpl.replace('{v}', tag) : tag;
      }
    });
  }

  /* ---------- download: App-Store-style card ---------- */

  function renderDownload() {
    var card = el('div', 'tb-card tb-card-pad32',
      '<img class="tb-dl-icon-img" src="assets/icons/boring-notch.png" alt="theboringwebsite app icon">' +
      '<div class="tb-card-title">' + esc(siteName()) + ' for macOS</div>' +
      '<div class="tb-card-sub tb-live-version" data-version-tpl="{v} · Universal (Apple Silicon + Intel) · Free &amp; open source">…</div>' +
      '<a class="tb-btn-primary tb-btn-big" href="' + esc(link('githubReleases')) + '" target="_blank" rel="noopener">Download from GitHub Releases</a>' +
      '<div class="tb-card-caption">Requires macOS 13 Ventura or later</div>');
    setVersionInto(card);
    return card;
  }

  /* ---------- coffee: BuyMeACoffee donation card ---------- */

  function renderCoffee() {
    return el('div', 'tb-card tb-card-pad32',
      '<div class="tb-coffee-icon">☕</div>' +
      '<h2 class="tb-card-h2">Fuel the boredom</h2>' +
      '<p class="tb-card-p">' + esc(siteName()) + ' is free and always will be. If the notch kept you company, ' +
        'buy us a coffee — it literally compiles into more features.</p>' +
      '<a class="tb-coffee-btn" href="' + esc(link('buymeacoffee')) + '" target="_blank" rel="noopener">☕ Buy me a coffee</a>' +
      '<div class="tb-card-caption">buymeacoffee.com</div>');
  }

  /* ---------- about: About This Mac replica ---------- */

  function renderAbout() {
    var rows = [
      ['Chip', 'Apple B1 Boring'],
      ['Memory', '16 GB of calm'],
      ['Startup disk', 'Macintosh HD-ish'],
      ['Serial', 'B0R1NG-W3B-2610'],
      ['macOS', 'BoringOS 26.0']
    ];
    var html = '<div class="tb-about-icon">💻</div>' +
      '<div class="tb-about-name">theBoringBook Pro</div>' +
      '<div class="tb-about-rows">';
    rows.forEach(function (r) {
      html += '<div class="tb-about-row">' +
        '<span class="tb-about-label">' + esc(r[0]) + '</span>' +
        '<span class="tb-about-value">' + esc(r[1]) + '</span></div>';
    });
    html += '</div>' +
      '<a class="tb-btn-secondary" href="' + esc(link('github')) + '" target="_blank" rel="noopener">More Info…</a>';
    return el('div', 'tb-card tb-card-pad28', html);
  }

  /* ---------- video: embedded YouTube player ---------- */

  function renderVideo() {
    var root = el('div', 'tb-video');
    var frame = document.createElement('iframe');
    frame.setAttribute('loading', 'lazy');
    frame.style.cssText = 'position:absolute;top:0;left:0;height:100%;width:100%';
    frame.title = 'Youtube Video';
    frame.setAttribute('allow', 'presentation; fullscreen; accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture');
    frame.src = 'https://www.youtube.com/embed/k69HSz155Bo?iv_load_policy=3&rel=0&modestbranding=1&playsinline=1&autoplay=0';
    frame.setAttribute('frameborder', '0');
    root.appendChild(frame);
    return root;
  }

  /* ---------- office: live theboringoffice product window ----------
     office.theboring.name sends no X-Frame-Options / frame-ancestors, so
     unlike github.com it can be genuinely iframed — a real live embed. */
  function renderOffice() {
    var wrap = el('div', 'tb-video tb-office');
    var src = link('office'); /* '#' when config is missing */
    if (src && src !== '#') {
      var frame = document.createElement('iframe');
      frame.setAttribute('loading', 'lazy');
      frame.style.cssText = 'position:absolute;top:0;left:0;height:100%;width:100%';
      frame.title = 'theboringoffice';
      frame.setAttribute('referrerpolicy', 'no-referrer');
      frame.src = src;
      wrap.appendChild(frame);
    } else {
      wrap.appendChild(el('div', 'tb-app-unknown', 'theboringoffice — link unavailable'));
    }
    return wrap;
  }

  /* ---------- VFS: virtual filesystem mirroring the real project ---------- */

  var README_TEXT = [
    '# theboringwebsite',
    '',
    'A macOS desktop in your browser: lofi notch, dock, finder, widgets.',
    '',
    '- 🎧 the notch streams lofi radio while you browse',
    '- 🧲 the dock magnifies, launches and restores apps',
    '- 🗂️ this Finder browses the real files that build the site',
    '- 🧩 widgets keep the time and date on the desktop',
    '',
    'No frameworks, no build step — just HTML, CSS and JS.'
  ].join('\n');

  function vfDir(name, path, children) {
    return { name: name, path: path, dir: true, children: children };
  }

  function vfFile(name, path, kind, size) {
    return { name: name, path: path, dir: false, kind: kind, size: size || null };
  }

  function vfTexts(dirPath, names) {
    return names.map(function (n) { return vfFile(n, dirPath + '/' + n, 'text'); });
  }

  function vfImages(dirPath, entries) {
    return entries.map(function (pair) { return vfFile(pair[0], dirPath + '/' + pair[0], 'image', pair[1]); });
  }

  var VFS_ROOT = vfDir('theboringwebsite', '', [
    vfFile('index.html', 'index.html', 'text'),
    vfFile('README.md', 'README.md', 'virtual'),
    vfDir('css', 'css', vfTexts('css', [
      'apps.css', 'desktop-icons.css', 'desktop.css', 'dock.css',
      'main.css', 'notch.css', 'widgets.css', 'windows.css'
    ])),
    vfDir('js', 'js', vfTexts('js', [
      'apps.js', 'config.js', 'desktop-icons.js', 'dock.js',
      'menubar.js', 'notch.js', 'widgets.js', 'windows.js'
    ])),
    vfDir('assets', 'assets', [
      vfDir('icons', 'assets/icons', vfImages('assets/icons', [
        ['app-store.png'], ['apple.png'], ['apps.png'], ['boring-notch.png'],
        ['claude.png'], ['discord.png'], ['downloads.png'], ['facetime.png'],
        ['finder.png'], ['github.png'], ['google-play-app.webp'], ['maps.png'],
        ['messages.png'], ['music.png'], ['notes.png'], ['safari.png'],
        ['settings.png'], ['slack.png'], ['spotify.png'], ['terminal.png'],
        ['whatsapp.png'], ['xcode.png']
      ])),
      vfDir('wallpapers', 'assets/wallpapers', vfImages('assets/wallpapers', [
        ['renoir-boating.jpg', '2.1 MB'],
        ['courbet-snow.jpg', '2.1 MB'],
        ['monet-magpie.jpg', '1.5 MB'],
        ['davinci-last-supper.jpg', '2.0 MB'],
        ['kenzler-winter.jpg', '2.2 MB'],
        ['vangogh-yellow-house.jpg', '2.4 MB'],
        ['vangogh-harvest.jpg', '3.2 MB'],
        ['kruseman-castle.jpg', '1.7 MB']
      ]))
    ])
  ]);

  function vfsResolve(path) {
    var clean = String(path || '').replace(/^\/+|\/+$/g, '');
    if (!clean) return VFS_ROOT;
    var node = VFS_ROOT;
    var parts = clean.split('/');
    for (var i = 0; i < parts.length; i++) {
      if (!node || !node.dir) return null;
      var next = null;
      for (var j = 0; j < node.children.length; j++) {
        if (node.children[j].name === parts[i]) { next = node.children[j]; break; }
      }
      node = next;
    }
    return node;
  }

  function clearKids(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  /* ---------- folder: full Finder (toolbar, sidebar, navigable VFS) ---------- */

  var FINDER_FAVORITES = [
    ['🏠', 'theboringwebsite', ''],
    ['📁', 'css', 'css'],
    ['📁', 'js', 'js'],
    ['📁', 'icons', 'assets/icons'],
    ['🖼️', 'wallpapers', 'assets/wallpapers']
  ];

  function finderGlyph(node) {
    if (node.dir) return '📁';
    return node.kind === 'image' ? '🖼️' : '📄';
  }

  function finderMeta(node) {
    if (node.dir) return node.children.length + ' items';
    return node.size || '—';
  }

  function renderFolder(opts) {
    var name = (opts && typeof opts.name === 'string' && opts.name) || '';
    var startPath = name === 'wallpapers' ? 'assets/wallpapers' : '';
    var startNode = vfsResolve(startPath);
    if (!startNode || !startNode.dir) startPath = '';

    var root = el('div', 'tb-fx');

    /* toolbar: back/forward buttons + breadcrumb trail */
    var toolbar = el('div', 'tb-fx-toolbar');
    var backBtn = el('button', 'tb-fx-nav-btn', '‹');
    backBtn.type = 'button';
    backBtn.setAttribute('aria-label', 'Back');
    var fwdBtn = el('button', 'tb-fx-nav-btn', '›');
    fwdBtn.type = 'button';
    fwdBtn.setAttribute('aria-label', 'Forward');
    var crumbs = el('div', 'tb-fx-crumbs');
    toolbar.appendChild(backBtn);
    toolbar.appendChild(fwdBtn);
    toolbar.appendChild(crumbs);

    /* body: favorites sidebar + file list */
    var body = el('div', 'tb-fx-body');
    var sidebar = el('div', 'tb-fx-sidebar');
    sidebar.appendChild(el('div', 'tb-fx-side-head', 'Favorites'));
    var sideRows = FINDER_FAVORITES.map(function (fav) {
      var row = el('div', 'tb-fx-side-row');
      row.appendChild(el('span', 'tb-fx-side-glyph', fav[0]));
      row.appendChild(el('span', 'tb-fx-side-name', esc(fav[1])));
      row.addEventListener('click', function () { navigate(fav[2]); });
      sidebar.appendChild(row);
      return { path: fav[2], row: row };
    });
    var list = el('div', 'tb-fx-list');
    body.appendChild(sidebar);
    body.appendChild(list);

    var status = el('div', 'tb-fx-status');

    root.appendChild(toolbar);
    root.appendChild(body);
    root.appendChild(status);

    /* real history stack, private to this window instance */
    var history = [startPath];
    var hi = 0;

    function navigate(path) {
      var node = vfsResolve(path);
      if (!node || !node.dir) path = '';
      if (path === history[hi]) { render(); return; }
      history = history.slice(0, hi + 1);
      history.push(path);
      hi = history.length - 1;
      render();
    }

    function render() {
      var dir = vfsResolve(history[hi]) || VFS_ROOT;
      var segs = dir.path ? dir.path.split('/') : [];

      /* breadcrumb: root name › each segment; every segment but the last jumps */
      clearKids(crumbs);
      var labels = [VFS_ROOT.name].concat(segs);
      labels.forEach(function (label, i) {
        if (i > 0) crumbs.appendChild(el('span', 'tb-fx-sep', ' › '));
        var last = i === labels.length - 1;
        var crumb = el('span', last ? 'tb-fx-crumb tb-fx-crumb-cur' : 'tb-fx-crumb', esc(label));
        if (!last) {
          (function (idx) {
            crumb.addEventListener('click', function () {
              navigate(idx === 0 ? '' : segs.slice(0, idx).join('/'));
            });
          })(i);
        }
        crumbs.appendChild(crumb);
      });

      /* sidebar: highlight the favorite matching the current directory */
      sideRows.forEach(function (r) {
        r.row.classList.toggle('tb-fx-side-active', r.path === dir.path);
      });

      /* list: folders first, then files, alphabetical within each group */
      clearKids(list);
      var kids = dir.children.slice().sort(function (a, b) {
        if (a.dir !== b.dir) return a.dir ? -1 : 1;
        var an = a.name.toLowerCase();
        var bn = b.name.toLowerCase();
        return an < bn ? -1 : (an > bn ? 1 : 0);
      });
      var selected = null;
      kids.forEach(function (node) {
        var row = el('div', 'tb-fx-row');
        row.appendChild(el('span', 'tb-fx-glyph', finderGlyph(node)));
        row.appendChild(el('span', 'tb-fx-name', esc(node.name)));
        row.appendChild(el('span', 'tb-fx-meta', esc(finderMeta(node))));
        row.addEventListener('click', function () {
          if (selected) selected.classList.remove('tb-fx-row-sel');
          selected = row;
          row.classList.add('tb-fx-row-sel');
        });
        row.addEventListener('dblclick', function () {
          if (node.dir) {
            navigate(node.path);
          } else {
            try {
              window.dispatchEvent(new CustomEvent('tb:open-app', {
                detail: {app:'viewer', title: node.name, path: node.path}
              }));
            } catch (e) { /* fire-and-forget: nobody may be listening */ }
          }
        });
        list.appendChild(row);
      });

      status.textContent = kids.length + ' items';
      backBtn.disabled = hi <= 0;
      fwdBtn.disabled = hi >= history.length - 1;
    }

    backBtn.addEventListener('click', function () {
      if (hi > 0) { hi -= 1; render(); }
    });
    fwdBtn.addEventListener('click', function () {
      if (hi < history.length - 1) { hi += 1; render(); }
    });

    render();
    return root;
  }

  /* ---------- viewer: file preview (live text fetch / image / embedded) ---------- */

  var VIEWER_MAX_LINES = 400;

  function viewerCard(icon, title, sub) {
    return el('div', 'tb-pv-card',
      '<div class="tb-pv-card-icon">' + icon + '</div>' +
      '<div class="tb-pv-card-title">' + esc(title) + '</div>' +
      (sub ? '<div class="tb-pv-card-sub">' + esc(sub) + '</div>' : ''));
  }

  function viewerTextPane(text) {
    var pane = el('div', 'tb-pv-text');
    var lines = String(text).replace(/\r\n?/g, '\n').split('\n');
    var total = lines.length;
    if (total > VIEWER_MAX_LINES) lines = lines.slice(0, VIEWER_MAX_LINES);
    var htmlLines = lines.map(function (ln, i) {
      return '<span class="tb-pv-ln">' + (i + 1) + '</span>' + esc(ln);
    });
    pane.appendChild(el('pre', 'tb-pv-pre', htmlLines.join('\n')));
    if (total > VIEWER_MAX_LINES) {
      pane.appendChild(el('div', 'tb-pv-trunc',
        '… truncated — showing ' + VIEWER_MAX_LINES + ' of ' + total + ' lines'));
    }
    return pane;
  }

  function renderViewer(opts) {
    var path = (opts && typeof opts.path === 'string') ? opts.path : '';
    var node = vfsResolve(path);
    var root = el('div', 'tb-pv');

    if (!node || node.dir) {
      root.appendChild(viewerCard('🗂️', 'File not found',
        path ? '“' + path + '” isn’t part of this site’s filesystem.' : 'No file was specified.'));
      return root;
    }

    if (node.kind === 'image') {
      var imgPane = el('div', 'tb-pv-image');
      var img = el('img', 'tb-pv-img');
      img.src = node.path;
      img.alt = node.name;
      imgPane.appendChild(img);
      root.appendChild(imgPane);
      return root;
    }

    if (node.kind === 'virtual') {
      root.appendChild(viewerTextPane(README_TEXT));
      return root;
    }

    /* real text file: fetched live, same-origin, via its VFS-whitelisted path */
    root.appendChild(viewerCard('⏳', 'Loading…', node.name));
    if (typeof fetch !== 'function') {
      clearKids(root);
      root.appendChild(viewerCard('⚠️', 'Could not load file.', node.name));
      return root;
    }
    try {
      fetch(node.path).then(function (res) {
        if (!res || !res.ok) throw new Error('http ' + (res && res.status));
        return res.text();
      }).then(function (text) {
        clearKids(root);
        root.appendChild(viewerTextPane(text));
      }).catch(function () {
        clearKids(root);
        root.appendChild(viewerCard('⚠️', 'Could not load file.',
          '“' + node.name + '” couldn’t be fetched from this origin.'));
      });
    } catch (e) {
      clearKids(root);
      root.appendChild(viewerCard('⚠️', 'Could not load file.', node.name));
    }
    return root;
  }

  /* ---------- public API ---------- */

  window.TBApps = {
    render: function (appId, opts) {
      try {
        switch (appId) {
          case 'safari': return renderSafari();
          case 'download': return renderDownload();
          case 'coffee': return renderCoffee();
          case 'about': return renderAbout();
          case 'video': return renderVideo();
          case 'office': return renderOffice();
          case 'folder': return renderFolder(opts);
          case 'viewer': return renderViewer(opts);
          default: break;
        }
      } catch (e) {
        /* degrade silently — never throw into the window manager */
      }
      return el('div', 'tb-app-unknown', 'Unknown app');
    }
  };
})();
