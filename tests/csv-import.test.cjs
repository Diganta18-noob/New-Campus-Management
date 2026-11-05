const { test } = require('node:test');
const assert = require('node:assert/strict');
test('CSV import accepts quoted commas and line breaks and rejects malformed rows', async () => {
  const { parseCsv } = await import('../frontend/src/utils/csvImport.js');
  const data = parseCsv('firstname,lastname,email\r\n"Ada, Jr.","Line\nTwo",ada@example.test\r\n');
  assert.deepEqual(data.rows, [['Ada, Jr.', 'Line\nTwo', 'ada@example.test']]);
  assert.throws(() => parseCsv('firstname,email\n"unclosed,ada@example.test'), /Unclosed/);
  assert.throws(() => parseCsv('firstname,email\nAda,ada@example.test,extra'), /header columns/);
});
