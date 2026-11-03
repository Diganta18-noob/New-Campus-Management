const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseReportFilters } = require('../backend/utils/reportFilters');

test('UTC reporting filters include end day and reject malformed input', () => {
  const filters = parseReportFilters({ startDate: '2026-11-01', endDate: '2026-11-03', page: '2', limit: '25' });
  assert.equal(filters.endExclusive.toISOString(), '2026-11-04T00:00:00.000Z');
  assert.equal(filters.page, 2);
  for (const query of [
    { startDate: '2026-02-30' }, { startDate: '2026-11-04', endDate: '2026-11-03' },
    { startDate: '2026-01-01', endDate: '2026-04-01' }, { batch: 'foreign' },
    { page: '0' }, { page: '1.2' }, { limit: '101' },
  ]) assert.throws(() => parseReportFilters(query), { status: 400 });
});

test('report HTTP route enforces roles, scope and paging with isolated model fixtures', async () => {
  const express = require('../backend/node_modules/express');
  const jwt = require('../backend/node_modules/jsonwebtoken');
  const User = require('../backend/models/User.model');
  const Batch = require('../backend/models/Batch.model');
  const Attendance = require('../backend/models/Attendance.model');
  const oldSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'isolated-report-http-fixture';
  const originals = [User.findById, Batch.find, Attendance.aggregate, Attendance.countDocuments];
  const batchId = '507f1f77bcf86cd799439011';
  const otherBatch = '507f1f77bcf86cd799439012';
  User.findById = id => ({ select: async () => ({ _id: id, role: id, isActive: true, requiresPasswordReset: id === 'RESET' }) });
  Batch.find = () => ({ distinct: async () => [batchId] });
  const entry = (id, name) => ({ sessionId: '507f1f77bcf86cd799439020', learnerId: id, date: new Date('2026-11-02T23:59:59.999Z'), batchId, batch: { name: 'A', code: 'A' }, learner: { firstName: name, lastName: 'Student' }, status: 'PRESENT' });
  Attendance.aggregate = async () => [entry('507f1f77bcf86cd799439021', 'First'), entry('507f1f77bcf86cd799439022', 'Second')];
  Attendance.countDocuments = async () => 1;
  const app = express(); app.use('/api/attendance', require('../backend/routes/attendance.routes'));
  app.use((error, req, res, next) => res.status(error.status || 500).json({ message: error.message }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/attendance/report?startDate=2026-11-02&endDate=2026-11-02`;
  const request = (role, suffix = '') => fetch(base + suffix, { headers: role ? { Authorization: `Bearer ${jwt.sign({ id: role }, process.env.JWT_SECRET)}` } : {} });
  try {
    assert.equal((await request(null)).status, 401);
    assert.equal((await request('LEARNER')).status, 403);
    assert.equal((await request('RESET')).status, 403);
    assert.equal((await request('TRAINER', `&batch=${otherBatch}`)).status, 403);
    assert.equal((await request('ADMIN', '&page=0')).status, 400);
    for (const role of ['ADMIN', 'MANAGER', 'TEAM_LEADER', 'TRAINER', 'TA']) {
      const response = await request(role, '&page=2&limit=1');
      assert.equal(response.status, 200);
      const data = (await response.json()).data;
      assert.equal(data.total, 2); assert.equal(data.rows.length, 1);
      assert.equal(data.summary.sessionCount, 1); assert.equal(data.summary.entryCount, 2);
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
    [User.findById, Batch.find, Attendance.aggregate, Attendance.countDocuments] = originals;
    process.env.JWT_SECRET = oldSecret;
  }
});

test('admin insights and operations routes deny staff and learners before querying data', async () => {
  const express = require('../backend/node_modules/express');
  const jwt = require('../backend/node_modules/jsonwebtoken');
  const User = require('../backend/models/User.model');
  const oldSecret = process.env.JWT_SECRET;
  const originalFindById = User.findById;
  process.env.JWT_SECRET = 'isolated-admin-route-fixture';
  User.findById = id => ({ select: async () => ({ _id: id, role: id, isActive: true }) });
  const app = express(); app.use('/api/dashboard', require('../backend/routes/dashboard.routes'));
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  try {
    for (const path of ['insights', 'operations']) {
      assert.equal((await fetch(`http://127.0.0.1:${server.address().port}/api/dashboard/${path}`)).status, 401);
      for (const role of ['MANAGER', 'TEAM_LEADER', 'TRAINER', 'TA', 'LEARNER']) {
        const token = jwt.sign({ id: role }, process.env.JWT_SECRET);
        const response = await fetch(`http://127.0.0.1:${server.address().port}/api/dashboard/${path}`, { headers: { Authorization: `Bearer ${token}` } });
        assert.equal(response.status, 403);
      }
    }
  } finally { await new Promise(resolve => server.close(resolve)); User.findById = originalFindById; process.env.JWT_SECRET = oldSecret; }
});
