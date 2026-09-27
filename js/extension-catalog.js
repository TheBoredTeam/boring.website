/* Shared by the storefront and the repository validator. No dependencies. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TBExtensionCatalog = api;
}(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  var statuses = ['available', 'preview', 'coming-soon'];
  function https(value) {
    try {
      var url = new URL(value);
      return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password;
    } catch (_) { return false; }
  }
  function text(value, max) { return typeof value === 'string' && value.trim().length > 0 && value.length <= max; }
  function validate(catalog) {
    var errors = [], ids = new Set(), slugs = new Set();
    if (!catalog || catalog.schemaVersion !== 1 || !Array.isArray(catalog.extensions)) return ['Expected schemaVersion 1 and an extensions array.'];
    if (catalog.extensions.length > 500) errors.push('Catalog exceeds 500 entries.');
    catalog.extensions.forEach(function (item, index) {
      var label = 'Entry ' + (index + 1) + ': ';
      function require(ok, message) { if (!ok) errors.push(label + message); }
      if (!item || typeof item !== 'object') { errors.push(label + 'expected an object.'); return; }
      require(text(item.id, 180) && /^[a-z0-9]+(?:[.-][a-z0-9]+)+$/.test(item.id), 'invalid ID.');
      require(text(item.slug, 80) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug), 'invalid slug.');
      require(!ids.has(item.id) && !slugs.has(item.slug), 'duplicate ID or slug.');
      ids.add(item.id); slugs.add(item.slug);
      ['name', 'tagline', 'description', 'statusNote', 'version', 'artworkAlt', 'privacy'].forEach(function (key) {
        require(text(item[key], key === 'name' ? 80 : 2000), 'missing or oversized ' + key + '.');
      });
      require(statuses.includes(item.status), 'unknown status.');
      require(typeof item.featured === 'boolean', 'featured must be a boolean.');
      if (item.featured) require(text(item.heroTitle, 100), 'featured entries need a heroTitle.');
      require(item.developer && text(item.developer.name, 100) && https(item.developer.url), 'invalid developer.');
      ['categories', 'requirements', 'installSteps'].forEach(function (key) {
        require(Array.isArray(item[key]) && item[key].length > 0 && item[key].length <= 12 && item[key].every(function (v) { return text(v, 800); }), 'invalid ' + key + '.');
      });
      require(Array.isArray(item.features) && item.features.length > 0 && item.features.length <= 12 && item.features.every(function (v) {
        return v && text(v.title, 100) && text(v.description, 1000);
      }), 'invalid features.');
      ['icon', 'artwork'].forEach(function (key) {
        require(typeof item[key] === 'string' && /^assets\/extensions\/[a-z0-9-]+\.(svg|png|webp|jpg)$/.test(item[key]), 'invalid local ' + key + ' path.');
      });
      if (item.previews !== undefined) require(Array.isArray(item.previews) && item.previews.length > 0 && item.previews.length <= 8 && item.previews.every(function (preview) {
        return preview && typeof preview.image === 'string' && /^assets\/extensions\/[a-z0-9-]+\.(svg|png|webp|jpg)$/.test(preview.image) && text(preview.alt, 2000) && text(preview.caption, 160);
      }), 'invalid preview gallery.');
      ['purchaseUrl', 'downloadUrl', 'sourceUrl', 'supportUrl'].forEach(function (key) {
        if (item[key] !== undefined) require(https(item[key]), key + ' must be a public HTTPS URL without credentials.');
      });
      require(https(item.supportUrl), 'supportUrl is required.');
      var p = item.price;
      var validPrice = p && Number.isFinite(p.amount) && p.amount >= 0 && p.amount <= 100000 &&
        typeof p.currency === 'string' && /^[A-Z]{3}$/.test(p.currency) && ['free', 'one-time', 'monthly', 'yearly'].includes(p.billing) &&
        ((p.amount === 0 && p.billing === 'free') || (p.amount > 0 && p.billing !== 'free'));
      require(validPrice, 'invalid price or billing.');
      if (item.status === 'available' && validPrice) require(https(p.amount > 0 ? item.purchaseUrl : item.downloadUrl), 'available listings need a working purchase/download URL.');
      if (item.status === 'preview') require(https(item.sourceUrl) || https(item.downloadUrl), 'previews need source or a download.');
    });
    if (catalog.extensions.filter(function (item) { return item && item.featured; }).length > 1) errors.push('Only one entry may be featured.');
    return errors;
  }
  function price(item) {
    if (item.price.amount === 0) return 'Free';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: item.price.currency, maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(item.price.amount);
  }
  function billing(item) {
    return { free: 'Free', 'one-time': 'One-time purchase', monthly: 'Per month', yearly: 'Per year' }[item.price.billing];
  }
  function action(item) {
    if (item.status === 'coming-soon') return { label: 'Coming soon', url: null };
    if (item.status === 'preview') return { label: item.sourceUrl ? 'View source' : 'Try preview', url: item.sourceUrl || item.downloadUrl };
    return { label: item.price.amount > 0 ? 'Buy for ' + price(item) : 'Get extension', url: item.price.amount > 0 ? item.purchaseUrl : item.downloadUrl };
  }
  function filter(items, state) {
    var words = (state.query || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
    return items.filter(function (item) {
      var content = [item.name, item.tagline, item.description, item.developer.name].concat(item.categories).join(' ').toLowerCase();
      return words.every(function (word) { return content.includes(word); }) &&
        (!state.category || item.categories.includes(state.category)) &&
        (!state.price || (state.price === 'free' ? item.price.amount === 0 : item.price.amount > 0));
    });
  }
  return { validate: validate, filter: filter, price: price, billing: billing, action: action };
}));
