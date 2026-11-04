const { test } = require('node:test');
const assert = require('node:assert/strict');
const { withTestDatabase } = require('./helpers/testDatabase.cjs');
test('real MongoDB allocation checks room capacity and active roles', { skip: !process.env.TEST_MONGODB_URI && 'Set TEST_MONGODB_URI for isolated MongoDB' }, async () => {
  await withTestDatabase(async mongoose => {
    const User = require('../../backend/models/User.model');
    const Classroom = require('../../backend/models/Classroom.model');
    const { validateCandidate } = require('../../backend/services/batchAllocation.service');
    const admin = new mongoose.Types.ObjectId(), learnerA = new mongoose.Types.ObjectId(), learnerB = new mongoose.Types.ObjectId(), room = new mongoose.Types.ObjectId();
    await User.collection.insertMany([learnerA, learnerB].map((_id, index) => ({ _id, role: 'LEARNER', isActive: true, firstName: `Learner${index}`, lastName: 'Test', email: `${_id}@test.example`, username: String(_id) })));
    await Classroom.collection.insertOne({ _id: room, name: 'Room', code: 'ROOM', location: 'A', capacity: 1, isActive: true, createdBy: admin });
    const input = { name: 'A', code: 'A', clientName: 'Test', department: String(admin), status: 'PLANNING', startDate: '2026-11-01', endDate: '2026-11-30', learners: [String(learnerA), String(learnerB)], trainers: [], tas: [], classroom: String(room) };
    const rejected = await validateCandidate(input);
    assert.equal(rejected.issues.find(value => value.code === 'CAPACITY_EXCEEDED').field, 'learners');
    const accepted = await validateCandidate({ ...input, learners: [String(learnerA)] });
    assert.deepEqual(accepted.issues, []);
    assert.deepEqual(accepted.capacity, { seats: 1, enrolled: 1 });
    const Department = require('../../backend/models/Department.model');
    await User.collection.insertOne({ _id: admin, role: 'ADMIN', isActive: true, firstName: 'Admin', lastName: 'Test', email: `${admin}@test.example`, username: String(admin) });
    await Department.collection.insertOne({ _id: admin, name: 'Test department', code: 'TEST', createdBy: admin });
    const jwt = require('../../backend/node_modules/jsonwebtoken');
    const oldSecret = process.env.JWT_SECRET; process.env.JWT_SECRET = 'isolated-batch-integration-only';
    const server = require('../../backend/app').listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    try {
      const url = `http://127.0.0.1:${server.address().port}/api/batches`;
      const post = (candidate, role = admin) => fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${jwt.sign({ id: String(role) }, process.env.JWT_SECRET)}`, 'Content-Type': 'application/json' }, body: JSON.stringify(candidate) });
      assert.equal((await post(input, learnerA)).status, 403);
      const refused = await post({ ...input, department: String(admin) });
      assert.equal(refused.status, 400);
      assert.equal(await require('../../backend/models/Batch.model').countDocuments(), 0);
      const saved = await post({ ...input, department: String(admin), learners: [String(learnerA)] });
      assert.equal(saved.status, 201);
      assert.equal(await require('../../backend/models/Batch.model').countDocuments(), 1);
      const historical = await post({ ...input, name: 'Historical', code: 'HIST', status: 'COMPLETED', learners: [String(learnerA)] });
      assert.equal(historical.status, 201);
      const historicalId = (await historical.json()).data._id;
      const reactivate = await fetch(`${url}/${historicalId}`, { method: 'PUT', headers: { Authorization: `Bearer ${jwt.sign({ id: String(admin) }, process.env.JWT_SECRET)}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'ONGOING' }) });
      assert.equal(reactivate.status, 400);
      assert.equal((await require('../../backend/models/Batch.model').findById(historicalId)).status, 'COMPLETED');
    } finally { await new Promise(resolve => server.close(resolve)); process.env.JWT_SECRET = oldSecret; }
  });
});
