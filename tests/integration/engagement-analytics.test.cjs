const { test } = require('node:test');
const assert = require('node:assert/strict');
const { withTestDatabase } = require('./helpers/testDatabase.cjs');

test('tracked sessions report per-person activity with admin-only access', { skip: !process.env.TEST_MONGODB_URI && 'Set TEST_MONGODB_URI to local MongoDB' }, async () => {
  await withTestDatabase(async mongoose => {
    const previousSecret = process.env.JWT_SECRET;
    const previousExpiry = process.env.JWT_EXPIRE;
    process.env.JWT_SECRET = 'engagement-test-secret-long-enough';
    process.env.JWT_EXPIRE = '1d';
    const app = require('../../backend/app');
    const User = require('../../backend/models/User.model');
    const UserSession = require('../../backend/models/UserSession.model');
    const [admin, learner] = await Promise.all([
      User.create({ firstName: 'Admin', lastName: 'Test', username: 'admin-engagement', email: 'admin-engagement@test.local', password: 'StrongPassword123!', role: 'ADMIN' }),
      User.create({ firstName: 'Learner', lastName: 'Test', username: 'learner-engagement', email: 'learner-engagement@test.local', password: 'StrongPassword123!', role: 'LEARNER' }),
    ]);
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const call = async (path, method = 'GET', token, body) => {
      const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) }, body: body === undefined ? undefined : JSON.stringify(body) });
      return { status: response.status, body: await response.json() };
    };
    try {
      const adminLogin = await call('/auth/login', 'POST', null, { email: admin.email, password: 'StrongPassword123!' });
      const learnerLogin = await call('/auth/login', 'POST', null, { email: learner.email, password: 'StrongPassword123!' });
      assert.equal(adminLogin.status, 200);
      assert.equal(learnerLogin.status, 200);
      const learnerToken = learnerLogin.body.token;
      const adminToken = adminLogin.body.token;
      const session = await UserSession.findOne({ user: learner._id });
      assert.ok(session);
      await UserSession.updateOne({ _id: session._id }, { $set: { lastSeenAt: new Date(Date.now() - 35_000) } });
      assert.equal((await call('/auth/heartbeat', 'POST', learnerToken)).status, 200);
      const updated = await UserSession.findById(session._id);
      assert.ok(updated.observedSeconds >= 30 && updated.observedSeconds <= 45);
      await UserSession.updateOne({ _id: session._id }, { $set: { lastSeenAt: new Date(Date.now() - 300_000) } });
      assert.equal((await call('/auth/heartbeat', 'POST', learnerToken)).status, 200);
      assert.equal(Math.round((await UserSession.findById(session._id)).observedSeconds), Math.round(updated.observedSeconds));
      assert.equal((await call('/dashboard/engagement', 'GET', learnerToken)).status, 403);
      assert.equal((await call('/dashboard/engagement?days=999', 'GET', adminToken)).status, 400);
      const analytics = await call('/dashboard/engagement?days=7&role=LEARNER&search=Learner', 'GET', adminToken);
      assert.equal(analytics.status, 200);
      assert.equal(analytics.body.data.summary.people, 1);
      assert.equal(analytics.body.data.summary.logins, 1);
      assert.equal(analytics.body.data.daily.length, 7);
      assert.equal(analytics.body.data.people.length, 1);
      assert.equal(analytics.body.data.people[0].observedSeconds >= 30, true);
      assert.equal(analytics.body.data.people[0].online, true);
      assert.equal((await call('/auth/logout', 'POST', learnerToken)).status, 200);
      assert.ok((await UserSession.findById(session._id)).endedAt);
      assert.equal((await call('/auth/heartbeat', 'POST', learnerToken)).status, 401);
      const afterLogout = await call('/dashboard/engagement?days=7&role=LEARNER', 'GET', adminToken);
      assert.equal(afterLogout.body.data.people[0].online, false);
      assert.equal(afterLogout.body.data.summary.onlineSessions, 0);
    } finally {
      await new Promise(resolve => server.close(resolve));
      process.env.JWT_SECRET = previousSecret;
      process.env.JWT_EXPIRE = previousExpiry;
    }
  });
});
