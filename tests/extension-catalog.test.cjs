const { test } = require('node:test');
const assert = require('node:assert/strict');
const catalog = require('../extensions/catalog.json');
const model = require('../js/extension-catalog.js');
const copy = () => structuredClone(catalog);

test('repository catalog is valid and preserves the single $1 bundle', () => {
  assert.deepEqual(model.validate(catalog), []);
  const lock = catalog.extensions.find(e => e.slug === 'lock-screen');
  assert.equal(lock.price.amount, 1);
  assert.equal(lock.price.billing, 'one-time');
  assert.equal(model.action(lock).url, null, 'unreleased products cannot send buyers to checkout');
});
test('free, paid, category, and multiword searches compose', () => {
  assert.deepEqual(model.filter(catalog.extensions, { price: 'free', query: 'now playing' }).map(e => e.slug), ['now-playing-example']);
  assert.deepEqual(model.filter(catalog.extensions, { price: 'paid', category: 'Productivity' }).map(e => e.slug), ['lock-screen']);
  assert.equal(model.filter(catalog.extensions, { price: 'free', category: 'Productivity' }).length, 0);
  assert.equal(model.filter(catalog.extensions, { query: 'nothing-matches' }).length, 0);
});
test('unsafe URLs, path traversal, duplicate IDs, and bad prices fail validation', () => {
  for (const update of [
    e => { e.supportUrl = 'javascript:alert(1)'; },
    e => { e.purchaseUrl = 'https://user:secret@example.com'; },
    e => { e.icon = 'assets/extensions/../../secret.png'; },
    e => { e.previews = [{ image: 'https://example.com/tracker.svg', alt: 'Preview', caption: 'Preview' }]; },
    e => { e.previews = [{ image: e.artwork, caption: 'Missing alternative text' }]; },
    e => { e.price.amount = -1; },
    e => { e.price.billing = 'free'; }
  ]) { const c = copy(); update(c.extensions[0]); assert.ok(model.validate(c).length); }
  const c = copy(); c.extensions.push(c.extensions[0]); assert.ok(model.validate(c).length);
});
test('release actions require a usable destination and reflect publisher pricing', () => {
  const c = copy(), paid = c.extensions[0], free = c.extensions[1];
  paid.status = 'available'; delete paid.purchaseUrl;
  assert.ok(model.validate(c).length);
  paid.purchaseUrl = 'https://example.com/checkout';
  free.status = 'available'; free.downloadUrl = 'https://example.com/example.bnplugin';
  assert.deepEqual(model.validate(c), []);
  assert.deepEqual(model.action(paid), {label:'Buy for $1',url:paid.purchaseUrl});
  assert.equal(model.action(free).url, free.downloadUrl);
  paid.price.billing = 'monthly';
  assert.equal(model.billing(paid), 'Per month');
});
test('malformed entries fail without crashing; empty catalogs remain valid', () => {
  assert.deepEqual(model.validate({schemaVersion:1,extensions:[]}), []);
  for (const value of [null, {}, {schemaVersion:1,extensions:[null]}, {schemaVersion:1,extensions:[{}]}]) assert.ok(model.validate(value).length);
});
