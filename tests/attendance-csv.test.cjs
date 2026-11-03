const { test } = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

test('CSV quotes multiline values and neutralizes spreadsheet formulas', async () => {
  const { attendanceCsv } = await import(pathToFileURL(path.resolve(__dirname, '../frontend/src/utils/attendanceCsv.js')));
  const csv = attendanceCsv([{ date: '2026-11-02T00:00:00.000Z', batch: { name: 'A,"B"' }, learner: { firstName: 'First', lastName: 'Student' }, status: 'PRESENT', remarks: '=1+2\n"next"', markedBy: null }], { startDate: '2026-11-01', endDate: '2026-11-02' });
  assert.match(csv, /2026-11-01 to 2026-11-02 UTC/);
  assert.match(csv, /"A,""B"""/);
  assert.match(csv, /"'=1\+2\n""next"""/);
});

test('CSV export fetches all filtered pages and refuses silent truncation', async () => {
  const { fetchAttendanceExport } = await import(pathToFileURL(path.resolve(__dirname, '../frontend/src/utils/attendanceCsv.js')));
  const calls = [];
  const getReport = async params => { calls.push(params); return { data: { rows: Array.from({ length: params.page === 1 ? 100 : 1 }, (_, index) => ({ id: (params.page - 1) * 100 + index })) } }; };
  const rows = await fetchAttendanceExport(getReport, { batch: 'fixture', startDate: '2026-11-01' }, 101);
  assert.equal(rows.length, 101); assert.deepEqual(calls.map(call => call.page), [1, 2]);
  assert.equal(calls[0].batch, 'fixture'); assert.equal(calls[1].startDate, '2026-11-01');
  await assert.rejects(fetchAttendanceExport(getReport, {}, 5001), /Narrow/);
  await assert.rejects(fetchAttendanceExport(async () => ({ data: { rows: [] } }), {}, 1), /changed during export/);
});
