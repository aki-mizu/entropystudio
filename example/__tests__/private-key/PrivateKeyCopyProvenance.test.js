/**
 * @format
 */

const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const entropyLabEnglish = require('../../../entropylab/src/locales/en.json');
const { UPSTREAM_UI_FALLBACK_COPY } = require('../../src/features/upstreamUiCopy');

const upstreamAppJs = readFileSync(
  resolve(__dirname, '../../../entropylab/src/js/app.js'),
  'utf8',
);

describe('Brain wallet copy provenance', () => {
  test('copies only text rendered by app.js and unavailable in en.json', () => {
    const copiedText = collectStrings(UPSTREAM_UI_FALLBACK_COPY);
    const catalogText = Object.values(entropyLabEnglish);

    copiedText.forEach(text => {
      expect(upstreamAppJs).toContain(text);
      expect(catalogText).not.toContain(text);
    });
  });
});

function collectStrings(value) {
  if (typeof value === 'string') {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap(collectStrings);
  }
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(collectStrings);
  }
  return [];
}