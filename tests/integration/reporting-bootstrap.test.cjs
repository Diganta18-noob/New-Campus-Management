const { test } = require('node:test');
const assert = require('node:assert/strict');
const { testDatabaseName } = require('./helpers/testDatabase.cjs');

test('integration harness rejects absent, remote and arbitrary database URIs', () => {
  assert.throws(() => testDatabaseName(''));
  assert.throws(() => testDatabaseName('mongodb://example.com/campus_test'));
  assert.throws(() => testDatabaseName('mongodb://127.0.0.1/production'));
  assert.match(testDatabaseName('mongodb://127.0.0.1:27017/campus_test'), /^campus_test_[0-9a-f]{16}$/);
});

test('importing app does not connect or listen', () => {
  const mongoose = require('../../backend/node_modules/mongoose');
  const before = mongoose.connection.readyState;
  const app = require('../../backend/app');
  assert.equal(typeof app, 'function');
  assert.equal(mongoose.connection.readyState, before);
  assert.equal(app.listening, undefined);
});
