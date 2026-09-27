(function () {
  'use strict';
  var root = document.getElementById('extension-store');
  if (!root) return;
  var model = window.TBExtensionCatalog, catalog, main, search, results, editorial, count, filterButtons, pageTitle, collectionTitle;
  var embedded = new URLSearchParams(location.search).get('embedded') === '1';
  var guide = 'https://github.com/TheBoredTeam/boring.notch/blob/e4ca1a8ba000b95cda742cf74c5c2bfa656af4fd/docs/extensions.md';
  var submit = 'https://github.com/TheBoredTeam/boring.website/blob/main/extensions/README.md';
  var statusNames = { available: 'Available', preview: 'Developer preview', 'coming-soon': 'Coming soon' };
  var state = readState();
  var paths = {
    search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
    discover: 'm12 2 3.1 6.3 7 .9-5.1 5 1.2 7-6.2-3.3-6.2 3.3 1.2-7-5.1-5 7-.9Z',
    music: 'M9 18V5l11-3v13M9 8l11-3M9 18c0 1.7-1.8 3-4 3s-3-1-3-2.5S4 16 6 16s3 .5 3 2ZM20 15c0 1.7-1.8 3-4 3s-3-1-3-2.5 2-2.5 4-2.5 3 .5 3 2Z',
    work: 'm22 2-7 20-4-9-9-4ZM22 2 11 13',
    develop: 'm3 21 10-10M11 6l5-4 6 6-4 5-7-7ZM3 21l-1-3 8-8 3 3-8 8Z',
    grid: 'M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z',
    back: 'm15 4-8 8 8 8',
    share: 'M8 8H4v14h16V8h-4M12 15V2m-4 4 4-4 4 4',
    mac: 'M4 3h16v13H4ZM2 20h20M9 16v4m6-4v4',
    code: 'm8 5-6 7 6 7m8-14 6 7-6 7M14 3l-4 18'
  };
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function icon(name) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.7'); svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true'); svg.classList.add('store-symbol');
    var path = document.createElementNS(svg.namespaceURI, 'path'); path.setAttribute('d', paths[name] || paths.grid); svg.appendChild(path); return svg;
  }
  function link(text, url, cls, external) {
    var a = el('a', cls, text); a.href = url;
    if (external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    return a;
  }
  function button(text, cls, action) {
    var b = el('button', cls, text); b.type = 'button'; b.addEventListener('click', action); return b;
  }
  function img(path, alt, cls) {
    var image = el('img', cls); image.src = '../' + path; image.alt = alt; image.decoding = 'async'; return image;
  }
  function readState() {
    var params = new URLSearchParams(location.search);
    return { query: (params.get('q') || '').slice(0, 200), category: params.get('category') || '', price: ['free', 'paid'].includes(params.get('price')) ? params.get('price') : '', extension: params.get('extension') || '' };
  }
  function urlFor(slug, share) {
    var url = new URL('./', location.href);
    if (embedded && !share) url.searchParams.set('embedded', '1');
    if (slug) url.searchParams.set('extension', slug);
    if (!share) {
      if (state.query) url.searchParams.set('q', state.query);
      if (state.category) url.searchParams.set('category', state.category);
      if (state.price) url.searchParams.set('price', state.price);
    }
    return url;
  }
  function navigate(slug) {
    state.extension = slug;
    history.pushState(null, '', urlFor(slug, false)); render();
    main.focus({ preventScroll: true }); main.scrollTop = 0;
    if (!embedded) window.scrollTo(0, 0);
  }
  function detailLink(item, text, cls) {
    var a = link(text, urlFor(item.slug, true), cls);
    a.addEventListener('click', function (event) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); navigate(item.slug);
    });
    return a;
  }
  function sidebarView() {
    var sidebar = el('aside', 'store-sidebar');
    var brand = link('', '../', 'store-sidebar-brand');
    brand.append(img('assets/icons/app-store.png', '', 'store-app-icon'), el('span', '', 'App Store'));
    sidebar.appendChild(brand);
    var label = el('label', 'store-search');
    label.append(icon('search'), el('span', 'store-sr-only', 'Search extensions'));
    search = el('input'); search.type = 'search'; search.placeholder = 'Search'; search.value = state.query; search.maxLength = 200;
    search.addEventListener('input', function () {
      state.query = search.value;
      if (state.extension) { navigate(''); search.focus(); } else updateResults();
    });
    label.appendChild(search); sidebar.appendChild(label);
    var nav = el('nav', 'store-nav'); nav.setAttribute('aria-label', 'Extension categories'); filterButtons = [];
    function categoryButton(label, category, glyph) {
      var b = button('', 'store-nav-item', function () {
        state.category = category;
        if (!category) { state.query = ''; state.price = ''; search.value = ''; }
        if (state.extension) navigate(''); else updateResults();
      });
      b.append(icon(glyph), el('span', '', label)); b.dataset.category = category;
      b.setAttribute('aria-pressed', String(category === state.category));
      filterButtons.push(b); nav.appendChild(b);
    }
    categoryButton('Discover', '', 'discover');
    var categories = Array.from(new Set(catalog.extensions.flatMap(function (item) { return item.categories; }))).sort();
    categories.forEach(function (category) { categoryButton(category, category, category === 'Music' ? 'music' : category === 'Developer tools' ? 'develop' : 'work'); });
    sidebar.appendChild(nav);
    var bottom = el('div', 'store-sidebar-bottom');
    bottom.append(link('Build an extension ↗', guide, '', true), link('Submit an extension ↗', submit, '', true));
    if (embedded) bottom.appendChild(link('Open in browser ↗', urlFor(state.extension, true), '', true));
    var home = link('', '../', 'store-home', embedded); home.append(img('assets/icons/boring-notch.png', '', ''), el('span', '', 'boring.notch'));
    bottom.appendChild(home); sidebar.appendChild(bottom); return sidebar;
  }
  function toolbar(item) {
    var bar = el('div', 'store-page-toolbar');
    if (state.extension) {
      var back = button('', 'store-round-button', function () { navigate(''); });
      back.setAttribute('aria-label', 'Browse extensions'); back.appendChild(icon('back')); bar.appendChild(back);
    }
    pageTitle = el('div', 'store-page-title', state.extension ? '' : 'Discover'); bar.appendChild(pageTitle);
    if (item) {
      var share = button('', 'store-round-button store-share', async function () {
        try {
          await navigator.clipboard.writeText(urlFor(item.slug, true).href);
          status.textContent = 'Link copied';
        } catch (_) {
          status.replaceChildren(link('Open shareable page ↗', urlFor(item.slug, true), 'store-text-link', true));
        }
      });
      share.appendChild(icon('share')); share.setAttribute('aria-label', 'Share ' + item.name);
      var status = el('span', 'store-share-status'); status.setAttribute('role', 'status'); bar.append(status, share);
    }
    return bar;
  }
  function card(item) {
    var card = el('article', 'store-card');
    var picture = detailLink(item, '', 'store-card-icon'); picture.setAttribute('aria-label', item.name + ' details'); picture.appendChild(img(item.icon, '', 'store-icon'));
    var title = el('div', 'store-card-titles');
    var h = el('h3'); h.appendChild(detailLink(item, item.name, 'store-title-link'));
    title.append(h, el('p', '', item.tagline));
    var action = el('div', 'store-card-action');
    var pill = detailLink(item, item.price.amount ? model.price(item) : 'View', 'store-pill');
    pill.setAttribute('aria-label', 'View ' + item.name + ' · ' + model.price(item));
    action.append(pill, el('span', '', item.status === 'available' ? model.billing(item) : (item.price.amount === 0 ? 'Free · ' : '') + (item.status === 'preview' ? 'Preview' : statusNames[item.status])));
    card.append(picture, title, action); return card;
  }
  function story(item) {
    var article = el('article', 'store-story');
    var visual = detailLink(item, '', 'store-story-visual'); visual.setAttribute('aria-label', 'Explore ' + item.name);
    var image = img(item.artwork, item.artworkAlt, ''); image.loading = 'lazy'; visual.appendChild(image);
    visual.appendChild(el('span', 'store-preview-label', 'Design preview'));
    var kicker = item.featured ? 'MEET ' + item.name.toUpperCase() : 'MADE FOR DEVELOPERS';
    var h = el('h3'); h.appendChild(detailLink(item, item.heroTitle || item.name, 'store-title-link'));
    article.append(visual, el('p', 'store-eyebrow', kicker), h, el('p', 'store-story-description', item.tagline)); return article;
  }
  function makerCard() {
    var box = el('section', 'store-maker'); box.appendChild(icon('code'));
    var copy = el('div'); copy.append(el('h2', '', 'Make something for the notch.'), el('p', '', 'Free or paid. Your extension, your way.'));
    var links = el('div', 'store-maker-links'); links.append(link('Start building ↗', guide, 'store-text-link', true), link('Submit an extension ↗', submit, 'store-text-link', true));
    copy.appendChild(links); box.appendChild(copy); return box;
  }
  function collection() {
    main.appendChild(toolbar());
    var content = el('div', 'store-page-content'); main.appendChild(content);
    var heading = el('header', 'store-collection-heading');
    var title = el('div'); collectionTitle = el('h1', '', 'Made for your notch');
    count = el('p', 'store-count'); count.setAttribute('role', 'status'); count.setAttribute('aria-live', 'polite');
    title.append(collectionTitle, count); heading.appendChild(title);
    var filters = el('div', 'store-filters'); filters.setAttribute('role', 'group'); filters.setAttribute('aria-label', 'Price');
    [['All', ''], ['Free', 'free'], ['Paid', 'paid']].forEach(function (option) {
      var b = button(option[0], 'store-filter', function () { state.price = option[1]; updateResults(); });
      b.dataset.price = option[1]; filters.appendChild(b);
    });
    heading.appendChild(filters); content.appendChild(heading);
    results = el('div', 'store-grid'); content.appendChild(results);
    editorial = el('section', 'store-editorial'); editorial.appendChild(el('h2', 'store-section-title', 'A little more possibility.'));
    var stories = el('div', 'store-stories');
    catalog.extensions.slice().sort(function (a, b) { return Number(b.featured) - Number(a.featured); }).slice(0, 2).forEach(function (item) { stories.appendChild(story(item)); });
    editorial.appendChild(stories); content.appendChild(editorial);
    content.appendChild(makerCard());
    content.appendChild(el('p', 'store-footnote', 'Extensions require Boring Notch. Purchases, downloads, and support are handled by each publisher.'));
    updateResults();
  }
  function updateResults() {
    var items = model.filter(catalog.extensions, state);
    history.replaceState(null, '', urlFor('', false));
    filterButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.category === state.category)); });
    main.querySelectorAll('[data-price]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.price === state.price)); });
    editorial.hidden = !!(state.query.trim() || state.category || state.price || !catalog.extensions.length);
    pageTitle.textContent = state.query.trim() ? 'Search' : state.category || 'Discover';
    collectionTitle.textContent = state.query.trim() ? 'Search results' : state.category || (state.price ? (state.price === 'free' ? 'Free extensions' : 'Paid extensions') : 'Made for your notch');
    count.textContent = items.length + (items.length === 1 ? ' extension' : ' extensions') + (state.query.trim() ? ' matching “' + state.query.trim() + '”' : ' for Boring Notch');
    results.replaceChildren(); items.forEach(function (item) { results.appendChild(card(item)); });
    if (!items.length) {
      var empty = el('div', 'store-empty');
      empty.append(icon('search'), el('h2', '', 'No extensions found'), el('p', '', 'Try a different search or explore the whole collection.'), button('Clear filters', 'store-pill', function () {
        state.query = ''; state.category = ''; state.price = ''; search.value = ''; updateResults(); search.focus();
      }));
      results.appendChild(empty);
    }
  }
  function detail(item) {
    main.appendChild(toolbar(item));
    var content = el('div', 'store-page-content store-detail'); main.appendChild(content);
    if (!item) {
      content.append(el('h1', '', 'Extension not found'), el('p', 'store-description', 'This listing may have moved. Browse the collection to find something new.')); return;
    }
    document.title = item.name + ' — Boring Notch Extension Store';
    var top = el('header', 'store-product-header'); top.appendChild(img(item.icon, '', 'store-product-icon'));
    var title = el('div', 'store-product-title'); title.append(el('h1', '', item.name), el('p', '', item.tagline));
    var purchase = el('div', 'store-purchase'), action = model.action(item);
    if (action.url) purchase.appendChild(link(action.label, action.url, 'store-button', true));
    else { var disabled = button(action.label, 'store-button', function () {}); disabled.disabled = true; purchase.appendChild(disabled); }
    var price = el('span', 'store-purchase-note', model.price(item)); price.appendChild(el('small', '', model.billing(item))); purchase.appendChild(price);
    title.appendChild(purchase); top.appendChild(title); content.appendChild(top);
    var facts = el('dl', 'store-facts');
    [['PLATFORM', 'Mac', 'Requires Boring Notch'], ['DEVELOPER', item.developer.name, 'Publisher'], ['CATEGORY', item.categories[0], item.categories.slice(1).join(' · ') || 'Extension'], ['VERSION', item.version, statusNames[item.status]]].forEach(function (pair) {
      var fact = el('div'), value = el('dd'); value.append(el('strong', '', pair[1]), el('span', '', pair[2]));
      fact.append(el('dt', '', pair[0]), value); facts.appendChild(fact);
    });
    content.appendChild(facts);
    var gallery = el('div', 'store-gallery'); gallery.setAttribute('aria-label', 'Extension previews'); gallery.tabIndex = 0;
    (item.previews || [{ image: item.artwork, alt: item.artworkAlt, caption: 'Design preview · ' + item.name }]).forEach(function (preview) {
      var figure = el('figure', 'store-product-preview'), image = img(preview.image, preview.alt, ''); image.loading = 'lazy';
      figure.append(image, el('figcaption', '', preview.caption)); gallery.appendChild(figure);
    });
    content.appendChild(gallery);
    var compatibility = el('div', 'store-compatibility'); compatibility.append(icon('mac'), el('span', '', item.requirements[0])); content.appendChild(compatibility);
    var about = el('section', 'store-about');
    about.append(el('p', 'store-description', item.description), link(item.developer.name + ' ↗', item.developer.url, 'store-publisher', true)); content.appendChild(about);
    var availability = el('section', 'store-availability'); availability.append(el('h2', '', statusNames[item.status]), el('p', '', item.statusNote)); content.appendChild(availability);
    var features = el('div', 'store-feature-grid');
    item.features.forEach(function (feature) { var block = el('section'); block.append(el('h3', '', feature.title), el('p', '', feature.description)); features.appendChild(block); }); content.appendChild(features);
    var privacy = el('section', 'store-privacy'); privacy.append(el('h2', 'store-section-title', 'Privacy & access'), el('p', '', item.privacy)); content.appendChild(privacy);
    var info = el('div', 'store-information');
    var requirements = el('section'); requirements.appendChild(el('h2', 'store-section-title', 'Compatibility'));
    var list = el('ul'); item.requirements.forEach(function (value) { list.appendChild(el('li', '', value)); }); requirements.appendChild(list);
    var install = el('section'); install.appendChild(el('h2', 'store-section-title', 'How to install'));
    var steps = el('ol'); item.installSteps.forEach(function (value) { steps.appendChild(el('li', '', value)); }); install.appendChild(steps);
    info.append(requirements, install); content.appendChild(info);
    var links = el('div', 'store-detail-links'); links.append(link('Publisher support ↗', item.supportUrl, 'store-text-link', true), link('Open shareable page ↗', urlFor(item.slug, true), 'store-text-link', true)); content.appendChild(links);
  }
  function render() {
    document.title = 'Extension Store — boring.notch'; root.replaceChildren(); root.appendChild(sidebarView());
    main = el('main', 'store-main'); main.id = 'store-content'; main.tabIndex = -1; root.appendChild(main);
    if (state.extension) detail(catalog.extensions.find(function (item) { return item.slug === state.extension; })); else collection();
  }
  async function load() {
    var controller = new AbortController(); var timer = setTimeout(function () { controller.abort(); }, 10000);
    try {
      var response = await fetch(new URL('catalog.json', location.href), { signal: controller.signal });
      if (!response.ok) throw new Error('Catalog request failed');
      var text = await response.text(); if (text.length > 1000000) throw new Error('Catalog is too large');
      var next = JSON.parse(text); if (model.validate(next).length) throw new Error('Invalid extension catalog'); catalog = next; render();
    } catch (_) {
      root.replaceChildren(); var errorBox = el('main', 'store-main store-empty'); errorBox.id = 'store-content';
      errorBox.append(el('h1', '', 'The collection couldn’t load.'), el('p', '', 'Please try again in a moment.'), button('Try again', 'store-button', load)); root.appendChild(errorBox);
    } finally { clearTimeout(timer); }
  }
  window.addEventListener('popstate', function () { state = readState(); if (catalog) render(); });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && state.extension) { event.preventDefault(); navigate(''); }
  });
  load();
}());
