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

  /* ---------- messages / whatsapp: real testimonials, shared data ----------
     Every quote below is a REAL Product Hunt comment about boring.notch,
     collected from producthunt.com/posts/theboringnotch. Do not invent more. */

  var MSG_PEOPLE = {
    chris: { name: 'Chris Hicken', grad: 'linear-gradient(135deg,#5f7cff,#9b5bff)', quotes: [
      'Great little project, clean design, and the open-source part makes it even cooler.',
      'We all hated the notch when it arrived, and now here we are turning it into a productivity dashboard, mirror, and music hub.'
    ]},
    navam: { name: 'Navam', grad: 'linear-gradient(135deg,#ff9f43,#ff5e62)', quotes: [
      'This is very cool. Installing it now!'
    ]},
    jim: { name: 'Jim Engine', grad: 'linear-gradient(135deg,#34c759,#0fa3a3)', quotes: [
      "Thanks, I didn't know I would actually love something like that"
    ]},
    yudha: { name: 'Yudha', grad: 'linear-gradient(135deg,#ffd60a,#ff9f0a)', quotes: [
      'But overall, this so cool, and love it!'
    ]},
    gabe: { name: 'Gabe Perez', grad: 'linear-gradient(135deg,#bf5af2,#ff375f)', quotes: [
      'I chose boring.notch because it was a) Open Source b) had all the main features I used from NotchNook and c) Free!',
      "It does everything I need so far. It's not quite as pretty as Alcove but it's just as functional."
    ]},
    bt: { name: 'boring team', grad: 'linear-gradient(135deg,#0a84ff,#5e5ce6)', quotes: [] }
  };

  /* the group thread, scripted in replay order */
  var MSG_GROUP_SCRIPT = [
    { kind: 'divider', text: 'Today 8:42 PM' },
    { kind: 'in', who: 'chris' },
    { kind: 'in', who: 'chris', quote: 1 },
    { kind: 'in', who: 'navam' },
    { kind: 'status', text: '⭐ 10.5k stars on GitHub · #3 Product of the Day' },
    { kind: 'in', who: 'jim' },
    { kind: 'in', who: 'yudha' },
    { kind: 'in', who: 'gabe' },
    { kind: 'in', who: 'gabe', quote: 1 },
    { kind: 'out', text: "you're all the best 🙏 ❤️" },
    { kind: 'receipt', text: 'Read 8:44 PM' }
  ];

  var MSG_REPLIES = [
    '❤️',
    'thanks for stopping by ✨',
    '⭐ the repo if you liked it!',
    '☕ fueled by your coffee'
  ];

  /* ---------- messages: iMessage replica, testimonials as a live chat ---------- */

  function msgText(item) {
    if (item.text) return item.text;
    var p = MSG_PEOPLE[item.who];
    return p ? p.quotes[item.quote || 0] : '';
  }

  function msgTyping() {
    return el('div', 'tb-msg-bubble tb-msg-typing',
      '<span class="tb-msg-dot"></span><span class="tb-msg-dot"></span><span class="tb-msg-dot"></span>');
  }

  function msgToggleTapback(bubble) {
    var existing = bubble.querySelector('.tb-msg-tapback');
    if (existing) {
      bubble.removeChild(existing);
    } else {
      bubble.appendChild(el('span', 'tb-msg-tapback', '❤️'));
    }
  }

  /* appends one scripted item; state tracks last sender for group labels
     and reduced consecutive-bubble margins */
  function msgAppend(content, item, state) {
    if (item.kind === 'divider') {
      var day = el('div', 'tb-msg-day');
      day.textContent = item.text;
      content.appendChild(day);
      state.lastWho = null;
      state.lastKind = 'divider';
      return;
    }
    if (item.kind === 'status') {
      var st = el('div', 'tb-msg-status');
      st.textContent = item.text;
      content.appendChild(st);
      state.lastWho = null;
      state.lastKind = 'status';
      return;
    }
    if (item.kind === 'receipt') {
      var rc = el('div', 'tb-msg-receipt');
      rc.textContent = item.text;
      content.appendChild(rc);
      return;
    }
    var out = item.kind === 'out';
    if (!out && state.lastWho !== item.who) {
      var person = MSG_PEOPLE[item.who];
      var label = el('div', 'tb-msg-sender');
      label.textContent = person ? person.name.split(' ')[0] : '';
      content.appendChild(label);
    }
    var same = state.lastWho === (out ? 'me' : item.who) && state.lastKind === item.kind;
    var bubble = el('div', 'tb-msg-bubble tb-msg-anim' +
      (out ? ' tb-msg-out' : '') + (same ? ' tb-msg-cont' : ''));
    bubble.textContent = msgText(item);
    if (!out) {
      bubble.addEventListener('dblclick', function () { msgToggleTapback(bubble); });
    }
    content.appendChild(bubble);
    state.lastWho = out ? 'me' : item.who;
    state.lastKind = item.kind;
  }

  function renderMessages() {
    var root = el('div', 'tb-msg');

    /* left sidebar: header + 4 conversation rows */
    var side = el('div', 'tb-msg-side');
    side.appendChild(el('div', 'tb-msg-side-head', 'Messages'));
    var convList = el('div', 'tb-msg-convs');
    side.appendChild(convList);

    /* main column: chat header + thread + input bar */
    var main = el('div', 'tb-msg-main');
    var head = el('div', 'tb-msg-chat-head');
    var headName = el('div', 'tb-msg-chat-name');
    head.appendChild(headName);
    head.appendChild(el('div', 'tb-msg-chat-sub', 'from around the internet 🌐 · Product Hunt &amp; GitHub'));
    var thread = el('div', 'tb-msg-thread');
    var bar = el('div', 'tb-msg-inputbar');
    var input = el('input', 'tb-msg-input');
    input.type = 'text';
    input.placeholder = 'iMessage';
    input.setAttribute('aria-label', 'iMessage');
    var send = el('button', 'tb-msg-send', '↑');
    send.type = 'button';
    send.setAttribute('aria-label', 'Send');
    bar.appendChild(input);
    bar.appendChild(send);
    main.appendChild(head);
    main.appendChild(thread);
    main.appendChild(bar);

    root.appendChild(side);
    root.appendChild(main);

    function scrollDown() {
      try { thread.scrollTop = thread.scrollHeight; } catch (e) { /* shim-safe */ }
    }

    /* one content node per conversation; the group one fills live via replay */
    var contents = {};
    var convs = [
      { id: 'group', name: 'boring notch fans 🎧', icon: '🎧',
        grad: 'linear-gradient(135deg,#0a84ff,#5e5ce6)', time: '8:44 PM',
        preview: "you're all the best 🙏 ❤️" },
      { id: 'chris', who: 'chris', time: '8:31 PM', preview: MSG_PEOPLE.chris.quotes[0] },
      { id: 'gabe', who: 'gabe', time: '8:36 PM', preview: MSG_PEOPLE.gabe.quotes[0] },
      { id: 'navam', who: 'navam', time: '8:33 PM', preview: MSG_PEOPLE.navam.quotes[0] }
    ];

    /* the 1:1 threads are short: the person's quote(s), rendered instantly */
    ['chris', 'gabe', 'navam'].forEach(function (who) {
      var c = el('div', 'tb-msg-conv-thread');
      var st = { lastWho: null, lastKind: null };
      msgAppend(c, { kind: 'divider', text: 'Today 8:3' + (who === 'chris' ? '1' : (who === 'gabe' ? '6' : '3')) + ' PM' }, st);
      MSG_PEOPLE[who].quotes.forEach(function (q, i) {
        msgAppend(c, { kind: 'in', who: who, quote: i }, st);
      });
      contents[who] = c;
    });
    contents.group = el('div', 'tb-msg-conv-thread');

    var rows = [];
    var active = 'group';

    function setActive(id) {
      active = id;
      rows.forEach(function (r) {
        r.row.classList.toggle('tb-msg-conv-sel', r.id === id);
      });
      var conv = null;
      for (var i = 0; i < convs.length; i++) {
        if (convs[i].id === id) { conv = convs[i]; break; }
      }
      headName.textContent = conv ? (conv.name || MSG_PEOPLE[conv.who].name) : '';
      clearKids(thread);
      thread.appendChild(contents[id]);
      scrollDown();
    }

    convs.forEach(function (conv) {
      var name = conv.name || MSG_PEOPLE[conv.who].name;
      var grad = conv.grad || MSG_PEOPLE[conv.who].grad;
      var row = el('div', 'tb-msg-conv');
      var avatar = el('div', 'tb-msg-avatar');
      avatar.style.background = grad;
      avatar.textContent = conv.icon || name.charAt(0);
      var meta = el('div', 'tb-msg-conv-meta');
      var top = el('div', 'tb-msg-conv-top');
      var nameEl = el('span', 'tb-msg-conv-name');
      nameEl.textContent = name;
      var timeEl = el('span', 'tb-msg-conv-time');
      timeEl.textContent = conv.time;
      top.appendChild(nameEl);
      top.appendChild(timeEl);
      var prev = el('div', 'tb-msg-conv-prev');
      prev.textContent = conv.preview;
      meta.appendChild(top);
      meta.appendChild(prev);
      row.appendChild(avatar);
      row.appendChild(meta);
      row.addEventListener('click', function () { setActive(conv.id); });
      convList.appendChild(row);
      rows.push({ id: conv.id, row: row });
    });

    /* live replay: typing indicator ~420ms -> bubble slides in; next ~300ms.
       Guards on root.isConnected so a closed window never throws. */
    var groupState = { lastWho: null, lastKind: null };
    function replay(i) {
      if (!root.isConnected || i >= MSG_GROUP_SCRIPT.length) return;
      var item = MSG_GROUP_SCRIPT[i];
      if (item.kind === 'in') {
        var typing = msgTyping();
        contents.group.appendChild(typing);
        scrollDown();
        setTimeout(function () {
          if (!root.isConnected) return;
          if (typing.parentNode) typing.parentNode.removeChild(typing);
          msgAppend(contents.group, item, groupState);
          scrollDown();
          setTimeout(function () { replay(i + 1); }, 300);
        }, 420);
      } else {
        msgAppend(contents.group, item, groupState);
        scrollDown();
        setTimeout(function () { replay(i + 1); }, item.kind === 'out' ? 300 : 180);
      }
    }
    setTimeout(function () { replay(0); }, 350);

    /* the input works: your message + a rotating canned reply ~1.2s later */
    var replyIdx = 0;
    function sendMsg() {
      var text = String(input.value || '').replace(/^\s+|\s+$/g, '');
      if (!text) return;
      input.value = '';
      var st = { lastWho: null, lastKind: null };
      msgAppend(contents.group, { kind: 'out', text: text }, st);
      scrollDown();
      var typing = msgTyping();
      setTimeout(function () {
        if (!root.isConnected) return;
        contents.group.appendChild(typing);
        scrollDown();
        setTimeout(function () {
          if (!root.isConnected) return;
          if (typing.parentNode) typing.parentNode.removeChild(typing);
          msgAppend(contents.group, {
            kind: 'in', who: 'bt',
            text: MSG_REPLIES[replyIdx++ % MSG_REPLIES.length]
          }, st);
          scrollDown();
        }, 500);
      }, 700);
    }
    input.addEventListener('keydown', function (e) {
      if (e && e.key === 'Enter') sendMsg();
    });
    send.addEventListener('click', sendMsg);

    setActive('group');
    return root;
  }

  /* ---------- whatsapp: WhatsApp-Web replica ----------
     web.whatsapp.com refuses framing (CSP frame-ancestors), so this is an
     honest replica that links out to the real thing. */

  var WA_COLORS = { chris: '#1fa855', navam: '#e542a3', jim: '#0291eb', yudha: '#91ac01', gabe: '#ba53de' };
  var WA_URL = 'https://web.whatsapp.com';

  function waBubbleIn(who, quote, time) {
    var bubble = el('div', 'tb-wa-bubble tb-wa-in');
    var whoEl = el('span', 'tb-wa-who');
    whoEl.textContent = MSG_PEOPLE[who].name;
    whoEl.style.color = WA_COLORS[who] || '#1fa855';
    var text = el('span', 'tb-wa-text');
    text.textContent = quote;
    var meta = el('span', 'tb-wa-meta');
    meta.textContent = time;
    bubble.appendChild(whoEl);
    bubble.appendChild(text);
    bubble.appendChild(meta);
    return bubble;
  }

  function waBubbleOut(text, time) {
    var bubble = el('div', 'tb-wa-bubble tb-wa-out');
    var textEl = el('span', 'tb-wa-text');
    textEl.textContent = text;
    var meta = el('span', 'tb-wa-meta');
    var timeEl = el('span', 'tb-wa-time');
    timeEl.textContent = time + ' ';
    meta.appendChild(timeEl);
    meta.appendChild(el('span', 'tb-wa-ticks', '✓✓'));
    bubble.appendChild(textEl);
    bubble.appendChild(meta);
    return bubble;
  }

  function renderWhatsapp() {
    var root = el('div', 'tb-wa');

    /* header bar: avatar + title + link out to the real thing */
    var header = el('div', 'tb-wa-header');
    header.appendChild(el('div', 'tb-wa-avatar', '✆'));
    header.appendChild(el('div', 'tb-wa-title', 'WhatsApp Web'));
    var open = el('a', 'tb-wa-open', 'Open real WhatsApp Web ↗');
    open.setAttribute('href', WA_URL);
    open.setAttribute('target', '_blank');
    open.setAttribute('rel', 'noopener');
    header.appendChild(open);
    root.appendChild(header);

    /* honesty strip */
    root.appendChild(el('div', 'tb-wa-note',
      "WhatsApp doesn't allow embedding (frame-ancestors) — this is a replica."));

    var body = el('div', 'tb-wa-body');

    /* chat list */
    var list = el('div', 'tb-wa-list');
    [
      { name: 'boring notch fans 🎧', grad: MSG_PEOPLE.bt.grad, icon: '🎧',
        preview: 'you\'re all the best 🙏 ❤️', time: '8:44 PM', unread: 4 },
      { name: 'Download squad', grad: 'linear-gradient(135deg,#00a884,#075e54)',
        preview: 'unzip and double-click, that\'s it', time: '7:12 PM' },
      { name: 'Mom ❤️', grad: 'linear-gradient(135deg,#f7b6c2,#e542a3)',
        preview: 'what is a notch?', time: '6:58 PM' }
    ].forEach(function (conv, i) {
      var row = el('div', 'tb-wa-row' + (i === 0 ? ' tb-wa-row-sel' : ''));
      var avatar = el('div', 'tb-wa-row-avatar');
      avatar.style.background = conv.grad;
      avatar.textContent = conv.icon || conv.name.charAt(0);
      var meta = el('div', 'tb-wa-row-meta');
      var top = el('div', 'tb-wa-row-top');
      var nameEl = el('span', 'tb-wa-row-name');
      nameEl.textContent = conv.name;
      var timeEl = el('span', 'tb-wa-row-time');
      timeEl.textContent = conv.time;
      top.appendChild(nameEl);
      top.appendChild(timeEl);
      var bottom = el('div', 'tb-wa-row-bottom');
      var prev = el('span', 'tb-wa-row-prev');
      prev.textContent = conv.preview;
      bottom.appendChild(prev);
      if (conv.unread) bottom.appendChild(el('span', 'tb-wa-unread', String(conv.unread)));
      meta.appendChild(top);
      meta.appendChild(bottom);
      row.appendChild(avatar);
      row.appendChild(meta);
      list.appendChild(row);
    });
    body.appendChild(list);

    /* conversation: the real quotes, WhatsApp-group style */
    var chat = el('div', 'tb-wa-chat');
    chat.appendChild(el('div', 'tb-wa-day', 'TODAY'));
    chat.appendChild(waBubbleIn('chris', MSG_PEOPLE.chris.quotes[0], '8:40 PM'));
    chat.appendChild(waBubbleIn('navam', MSG_PEOPLE.navam.quotes[0], '8:41 PM'));
    chat.appendChild(waBubbleIn('jim', MSG_PEOPLE.jim.quotes[0], '8:42 PM'));
    chat.appendChild(waBubbleIn('yudha', MSG_PEOPLE.yudha.quotes[0], '8:43 PM'));
    chat.appendChild(waBubbleIn('gabe', MSG_PEOPLE.gabe.quotes[0], '8:44 PM'));
    chat.appendChild(waBubbleOut("you're all the best 🙏 ❤️", '8:44 PM'));

    /* CTA bubble: green button linking out to the real WhatsApp Web */
    var ctaBubble = el('div', 'tb-wa-bubble tb-wa-out tb-wa-cta-bubble');
    var cta = el('a', 'tb-wa-cta', 'Chat with us on WhatsApp ↗');
    cta.setAttribute('href', WA_URL);
    cta.setAttribute('target', '_blank');
    cta.setAttribute('rel', 'noopener');
    ctaBubble.appendChild(cta);
    chat.appendChild(ctaBubble);

    body.appendChild(chat);
    root.appendChild(body);
    return root;
  }

  /* ---------- terminal: fake zsh with a boring CLI ---------- */

  function renderTerminal() {
    var root = el('div', 'tb-term');

    var PROMPT = 'harsh@boringbook ~ % ';
    var currentInput = null;

    function scrollBottom() {
      try { root.scrollTop = root.scrollHeight; } catch (e) { /* shim-safe */ }
    }

    /* output lines and prompt rows are appended straight to root, in order —
       async command output (version) then always lands after its command */
    function print(text) {
      String(text).split('\n').forEach(function (line) {
        root.appendChild(el('div', 'tb-term-line', esc(line)));
      });
    }

    function spawnPrompt() {
      var row = el('div', 'tb-term-prompt');
      row.appendChild(el('span', 'tb-term-ps1', PROMPT));
      var input = el('input', 'tb-term-input');
      input.type = 'text';
      input.size = 1;
      input.setAttribute('spellcheck', 'false');
      input.setAttribute('autocomplete', 'off');
      input.setAttribute('aria-label', 'terminal input');
      var cursor = el('span', 'tb-term-cursor');
      row.appendChild(input);
      row.appendChild(cursor);
      root.appendChild(row);
      input.addEventListener('input', function () {
        input.size = Math.max(1, String(input.value).length + 1);
      });
      input.addEventListener('keydown', function (e) {
        if (e && e.key === 'Enter') exec(input, row, cursor);
      });
      currentInput = input;
      try { input.focus(); } catch (e) { /* shim-safe */ }
      scrollBottom();
    }

    function openOut(url) {
      try { window.open(url, '_blank'); } catch (e) { /* best effort */ }
    }

    function fireApp(app) {
      try {
        window.dispatchEvent(new CustomEvent('tb:open-app', { detail: { app: app } }));
      } catch (e) { /* fire-and-forget */ }
    }

    function cowsay(text) {
      text = String(text || 'moo').slice(0, 40);
      var w = text.length + 2;
      print([
        ' ' + new Array(w + 1).join('_'),
        '< ' + text + ' >',
        ' ' + new Array(w + 1).join('-'),
        '        \\   ^__^',
        '         \\  (oo)\\_______',
        '            (__)\\       )\\/\\',
        '                ||----w |',
        '                ||     ||'
      ].join('\n'));
    }

    var HELP = [
      '  help               this list',
      '  about              what is boring.notch',
      '  version            latest release tag',
      '  download           open GitHub releases',
      '  repo               open the repo',
      '  coffee             fuel us (buymeacoffee)',
      '  music              start the notch',
      '  office             visit the boring office',
      '  cowsay <text>      moo',
      '  clear              wipe the screen',
      '  hello              hi'
    ].join('\n');

    function handle(line) {
      var trimmed = String(line).replace(/^\s+|\s+$/g, '');
      var sp = trimmed.indexOf(' ');
      var cmd = sp === -1 ? trimmed : trimmed.slice(0, sp);
      var rest = sp === -1 ? '' : trimmed.slice(sp + 1);
      switch (cmd) {
        case '':
          spawnPrompt();
          break;
        case 'help':
          print(HELP);
          spawnPrompt();
          break;
        case 'about':
          print('boring.notch — the notch your MacBook deserved.\n' +
            'open source · free · 10.5k stars and climbing.\n' +
            'this website is its desktop. the terminal is fake. the love is real.');
          spawnPrompt();
          break;
        case 'version':
          if (typeof cfg().getLatestTag === 'function') {
            cfg().getLatestTag(function (tag) {
              print('boring.notch ' + tag + ' (latest)');
              spawnPrompt();
            });
          } else {
            print('boring.notch v2.7.3 (latest)');
            spawnPrompt();
          }
          break;
        case 'download':
          openOut(link('githubReleases'));
          print('opening releases…');
          spawnPrompt();
          break;
        case 'repo':
          openOut(link('github'));
          print('opening github…');
          spawnPrompt();
          break;
        case 'coffee':
          openOut(link('buymeacoffee'));
          print('☕ thanks!');
          spawnPrompt();
          break;
        case 'music':
          fireApp('music');
          print('🎵 starting the notch…');
          spawnPrompt();
          break;
        case 'office':
          fireApp('office');
          print('🏢 opening the office…');
          spawnPrompt();
          break;
        case 'cowsay':
          cowsay(rest || 'moo');
          spawnPrompt();
          break;
        case 'clear':
          clearKids(root);
          spawnPrompt();
          break;
        case 'sudo':
          if (trimmed === 'sudo make me a sandwich') {
            print('ok ☕');
          } else {
            print(trimmed.split(' ')[0] + ': permission denied (nice try)');
          }
          spawnPrompt();
          break;
        case 'hello':
          print('hi. yes. this is the terminal.');
          spawnPrompt();
          break;
        default:
          print('zsh: command not found: ' + cmd);
          spawnPrompt();
      }
      scrollBottom();
    }

    function exec(inputEl, row, cursor) {
      var line = String(inputEl.value || '');
      row.removeChild(inputEl);
      row.removeChild(cursor);
      row.appendChild(el('span', 'tb-term-typed', esc(line)));
      currentInput = null;
      handle(line);
    }

    /* click anywhere focuses the live input */
    root.addEventListener('click', function () {
      if (currentInput) {
        try { currentInput.focus(); } catch (e) { /* shim-safe */ }
      }
    });

    print('Last login: ' + new Date().toString().slice(0, 24) + ' on ttys000');
    print('boring.notch OS 26.0 — type `help`');
    spawnPrompt();
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
          case 'messages': return renderMessages();
          case 'whatsapp': return renderWhatsapp();
          case 'terminal': return renderTerminal();
          default: break;
        }
      } catch (e) {
        /* degrade silently — never throw into the window manager */
      }
      return el('div', 'tb-app-unknown', 'Unknown app');
    }
  };
})();
