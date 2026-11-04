const { test } = require('node:test');
const assert = require('node:assert/strict');
test('logout revokes the presented JWT for subsequent requests', async () => {
  const express = require('../backend/node_modules/express');
  const jwt = require('../backend/node_modules/jsonwebtoken');
  const User = require('../backend/models/User.model');
  const oldSecret = process.env.JWT_SECRET;
  const oldFind = User.findById, oldUpdate = User.findByIdAndUpdate;
  process.env.JWT_SECRET = 'isolated-revocation-test';
  let version = 0;
  User.findById = () => ({ select: async () => ({ _id: 'fixture', role: 'ADMIN', isActive: true, tokenVersion: version }) });
  User.findByIdAndUpdate = async () => { version++; };
  const app = express(); app.use('/api/auth', require('../backend/routes/auth.routes'));
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  const token = jwt.sign({ id: 'fixture', v: 0 }, process.env.JWT_SECRET);
  try {
    const base = `http://127.0.0.1:${server.address().port}/api/auth`;
    const headers = { Authorization: `Bearer ${token}` };
    assert.equal((await fetch(`${base}/logout`, { method: 'POST', headers })).status, 200);
    assert.equal((await fetch(`${base}/me`, { headers })).status, 401);
  } finally { await new Promise(resolve => server.close(resolve)); User.findById = oldFind; User.findByIdAndUpdate = oldUpdate; process.env.JWT_SECRET = oldSecret; }
});
