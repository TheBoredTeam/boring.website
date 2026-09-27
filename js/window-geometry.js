/* Geometry shared by pointer/keyboard resizing and the focused boundary tests. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TBWindowGeometry = factory();
}(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function bounds(viewport) {
    var width = Math.max(1, viewport.width - 28), height = Math.max(1, viewport.height - 118);
    return { left:14, top:8, right:14 + width, bottom:8 + height, width:width, height:height, minWidth:Math.min(520, width), minHeight:Math.min(360, height) };
  }
  function fit(rect, viewport) {
    var b = bounds(viewport), width = clamp(rect.width, b.minWidth, b.width), height = clamp(rect.height, b.minHeight, b.height);
    return { left:clamp(rect.left, b.left, b.right - width), top:clamp(rect.top, b.top, b.bottom - height), width:width, height:height };
  }
  function resize(rect, direction, dx, dy, viewport) {
    var b = bounds(viewport), r = fit(rect, viewport), right = r.left + r.width, bottom = r.top + r.height;
    if (direction.includes('e')) r.width = clamp(r.width + dx, b.minWidth, b.right - r.left);
    if (direction.includes('s')) r.height = clamp(r.height + dy, b.minHeight, b.bottom - r.top);
    if (direction.includes('w')) { r.left = clamp(r.left + dx, b.left, right - b.minWidth); r.width = right - r.left; }
    if (direction.includes('n')) { r.top = clamp(r.top + dy, b.top, bottom - b.minHeight); r.height = bottom - r.top; }
    return r;
  }
  return { fit:fit, resize:resize };
}));
