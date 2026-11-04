const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateCandidate } = require('../backend/services/batchAllocation.service');

const base = { name: 'Test', code: 'TEST', startDate: '2026-11-01', endDate: '2026-11-30', status: 'PLANNING', learners: [], trainers: [], tas: [] };
test('allocation rejects duplicate and malformed identifiers before database work', async () => {
  const id = '507f1f77bcf86cd799439011';
  for (const invalid of [
    { learners: [id, id] }, { trainers: ['bad'] },
    { startDate: 'not-a-date' }, { endDate: '2026-10-01' },
    { classroom: 'bad' }, { status: 'UNKNOWN' },
  ]) {
    const result = await validateCandidate({ ...base, ...invalid });
    assert.ok(result.issues.length);
  }
});

test('preview route requires admin and rejects malformed candidate without writes', async () => {
  const express = require('../backend/node_modules/express');
  const jwt = require('../backend/node_modules/jsonwebtoken');
  const User = require('../backend/models/User.model');
  const old = User.findById, secret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'isolated-allocation-http-test';
  User.findById = id => ({ select: async () => ({ _id: id, role: id, isActive: true }) });
  const app = express(); app.use(express.json()); app.use('/api/batches', require('../backend/routes/batch.routes'));
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  try {
    const url = `http://127.0.0.1:${server.address().port}/api/batches/allocation-preview`;
    const post = role => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(role && { Authorization: `Bearer ${jwt.sign({ id: role }, process.env.JWT_SECRET)}` }) }, body: '{}' });
    assert.equal((await post(null)).status, 401);
    assert.equal((await post('LEARNER')).status, 403);
    const admin = await post('ADMIN'); assert.equal(admin.status, 200);
    assert.ok((await admin.json()).data.issues.some(issue => issue.code === 'INVALID_DATES'));
  } finally { await new Promise(resolve => server.close(resolve)); User.findById = old; process.env.JWT_SECRET = secret; }
});
