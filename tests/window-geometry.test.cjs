const {test} = require('node:test');
const assert = require('node:assert/strict');
const {fit, resize} = require('../js/window-geometry.js');
const viewport = {width:1400, height:900};
const initial = {left:200, top:70, width:850, height:600};

test('resizing the top and left keeps the opposite edges anchored', () => {
  const next = resize(initial, 'nw', 80, 50, viewport);
  assert.deepEqual(next, {left:280, top:120, width:770, height:550});
  assert.equal(next.left + next.width, initial.left + initial.width);
  assert.equal(next.top + next.height, initial.top + initial.height);
});
test('all edges and corners respect minimum sizes and screen bounds', () => {
  for (const direction of ['n','s','e','w','ne','nw','se','sw']) {
    for (const delta of [-10000,10000]) {
      const next = resize(initial, direction, delta, delta, viewport);
      assert.ok(next.width >= 520 && next.height >= 360);
      assert.ok(next.left >= 14 && next.top >= 8);
      assert.ok(next.left + next.width <= viewport.width - 14);
      assert.ok(next.top + next.height <= viewport.height - 110);
    }
  }
});
test('smaller browser viewports bring a moved window back on screen', () => {
  const next = fit({left:-300, top:900, width:1600, height:1100}, {width:800, height:600});
  assert.deepEqual(next, {left:14, top:8, width:772, height:482});
});
test('keyboard-sized changes use the same bounded geometry', () => {
  assert.deepEqual(resize(initial, 'se', 20, -20, viewport), {...initial,width:870,height:580});
});
