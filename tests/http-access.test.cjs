const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const backend = file => require(path.join(root, 'backend', file));
const express = backend('node_modules/express');
const jwt = backend('node_modules/jsonwebtoken');
const User = backend('models/User.model');
const Batch = backend('models/Batch.model');
const Attendance = backend('models/Attendance.model');
const DailyUpdate = backend('models/DailyUpdate.model');
const AuditLog = backend('models/AuditLog.model');
const logger = backend('utils/logger');

// Real Express routing, JWT verification and controllers; DB methods are isolated fixtures.
function query(value) {
    const result = { then: (resolve, reject) => Promise.resolve(value).then(resolve, reject) };
    for (const key of ['select', 'populate', 'sort', 'limit', 'skip']) result[key] = () => result;
    return result;
}
test('HTTP authentication and six-role access matrix', async t => {
    const oldSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'isolated-http-regression-fixture-only';
    const originals = [];
    const stub = (model, key, implementation) => { originals.push([model, key, model[key]]); model[key] = implementation; };
    stub(User, 'findById', role => query({ _id: 'fixture-viewer', role: role === 'RESET_REQUIRED' ? 'LEARNER' : role, isActive: true, requiresPasswordReset: role === 'RESET_REQUIRED', assignedBatches: [] }));
    for (const model of [User, Batch, Attendance, DailyUpdate]) {
        stub(model, 'countDocuments', async () => 0);
        stub(model, 'aggregate', async () => []);
        stub(model, 'find', () => query([]));
    }
    stub(AuditLog, 'create', async () => ({}));
    const app = express();
    app.use(express.json());
    app.use('/api/auth', backend('routes/auth.routes'));
    app.use('/api/dashboard', backend('routes/dashboard.routes'));
    app.use('/api/attendance', backend('routes/attendance.routes'));
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const headers = role => ({ Authorization: `Bearer ${jwt.sign({ id: role }, process.env.JWT_SECRET)}`, 'Content-Type': 'application/json' });
    try {
        await t.test('anonymous dashboard requests return 401', async () => {
            assert.equal((await fetch(`${base}/api/dashboard/stats`)).status, 401);
        });
        await t.test('tampered JWT returns 401', async () => {
            assert.equal((await fetch(`${base}/api/dashboard/stats`, { headers: { Authorization: 'Bearer invalid-token' } })).status, 401);
        });
        await t.test('mandatory reset blocks API access while allowing password change', async () => {
            const denied = await fetch(`${base}/api/dashboard/stats`, { headers: headers('RESET_REQUIRED') });
            assert.equal(denied.status, 403);
            assert.equal((await denied.json()).code, 'PASSWORD_RESET_REQUIRED');
            const reset = await fetch(`${base}/api/auth/change-password`, { method: 'PUT', headers: headers('RESET_REQUIRED'), body: '{}' });
            assert.equal(reset.status, 400); // Reaches required-password validation, not the access gate.
        });
        await t.test('public administrator signup returns 400 without a database write', async () => {
            const res = await fetch(`${base}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'fixture@example.test', username: 'fixture', firstName: 'Test', lastName: 'User', password: 'FixtureOnly123!', role: 'ADMIN' }) });
            assert.equal(res.status, 400);
            assert.match((await res.json()).message, /learners only/);
        });
        for (const role of ['ADMIN', 'MANAGER', 'TEAM_LEADER', 'TRAINER', 'TA', 'LEARNER']) {
            await t.test(`${role} gets its own dashboard response`, async () => {
                const res = await fetch(`${base}/api/dashboard/stats`, { headers: headers(role) });
                assert.equal(res.status, 200);
                const body = await res.json();
                assert.equal(body.success, true);
                assert.equal('roleStats' in body.data, role === 'ADMIN');
            });
            await t.test(`${role} attendance-write route enforces staff roles`, async () => {
                const res = await fetch(`${base}/api/attendance`, { method: 'POST', headers: headers(role), body: '{}' });
                assert.equal(res.status, ['TRAINER', 'TA'].includes(role) ? 400 : 403);
                await res.json();
            });
        }
    } finally {
        await new Promise(resolve => server.close(resolve));
        // Audit middleware schedules asynchronous writes after responses.
        await new Promise(resolve => setTimeout(resolve, 20));
        for (const [model, key, original] of originals) model[key] = original;
        if (oldSecret === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = oldSecret;
        logger.close(); logger.auditLogger.close();
    }
});
