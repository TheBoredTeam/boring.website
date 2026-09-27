const fs = require('node:fs');
const path = require('node:path');
const { validate } = require('../js/extension-catalog.js');
const root = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'extensions/catalog.json'), 'utf8'));
const errors = validate(catalog);
for (const item of catalog.extensions || []) {
  if (!item || typeof item !== 'object') continue;
  for (const key of ['icon', 'artwork']) {
    if (typeof item[key] === 'string' && !fs.existsSync(path.join(root, item[key]))) errors.push(`${item.slug}: missing ${key} file.`);
  }
  if (Array.isArray(item.previews)) for (const preview of item.previews) {
    if (preview && typeof preview.image === 'string' && !fs.existsSync(path.join(root, preview.image))) errors.push(`${item.slug}: missing preview file.`);
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`Validated ${catalog.extensions.length} extension listings and their assets.`);
