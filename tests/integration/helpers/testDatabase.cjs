const crypto = require('node:crypto');
const mongoose = require('../../../backend/node_modules/mongoose');

function testDatabaseName(uri = process.env.TEST_MONGODB_URI) {
  if (!uri) throw new Error('TEST_MONGODB_URI is required');
  let parsed;
  try { parsed = new URL(uri); } catch { throw new Error('Invalid test database URI'); }
  if (parsed.protocol !== 'mongodb:' || !['127.0.0.1', 'localhost', '::1', '[::1]'].includes(parsed.hostname)) {
    throw new Error('Test MongoDB must use a loopback mongodb:// host');
  }
  if (parsed.username || parsed.password || parsed.searchParams.has('authSource')) throw new Error('Test MongoDB must not use credentials');
  if (parsed.pathname !== '/' && parsed.pathname !== '/campus_test') throw new Error('Test MongoDB URI must target /campus_test');
  return `campus_test_${crypto.randomBytes(8).toString('hex')}`;
}

async function withTestDatabase(run, uri = process.env.TEST_MONGODB_URI) {
  const name = testDatabaseName(uri);
  if (mongoose.connection.readyState !== 0) throw new Error('Default MongoDB connection is already active');
  const connection = await mongoose.connect(uri, { dbName: name, serverSelectionTimeoutMS: 3000 });
  try { return await run(connection); }
  finally {
    if (!mongoose.connection.name.startsWith('campus_test_') || mongoose.connection.name !== name) throw new Error('Unsafe test database cleanup refused');
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
}
module.exports = { testDatabaseName, withTestDatabase };
