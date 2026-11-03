const { test } = require('node:test');
const assert = require('node:assert/strict');
const { withTestDatabase } = require('./helpers/testDatabase.cjs');

test('real MongoDB report, insights and setup queue reconcile', { skip: !process.env.TEST_MONGODB_URI && 'Set TEST_MONGODB_URI to a local /campus_test database' }, async () => {
  await withTestDatabase(async mongoose => {
    const app = require('../../backend/app');
    const User = require('../../backend/models/User.model');
    const Batch = require('../../backend/models/Batch.model');
    const Attendance = require('../../backend/models/Attendance.model');
    const Department = require('../../backend/models/Department.model');
    const Classroom = require('../../backend/models/Classroom.model');
    const jwt = require('../../backend/node_modules/jsonwebtoken');
    const ids = Array.from({ length: 8 }, () => new mongoose.Types.ObjectId());
    const [adminId, trainerId, learner1, learner2, deptId, roomId, batchId, otherBatchId] = ids;
    const originalSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'isolated-campus-integration-only';
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    try {
      for (const [id, role, firstName] of [[adminId, 'ADMIN', 'Admin'], [trainerId, 'TRAINER', 'Trainer'], [learner1, 'LEARNER', 'First'], [learner2, 'LEARNER', 'Second']]) {
        await User.collection.insertOne({ _id: id, role, firstName, lastName: 'Fixture', email: `${id}@example.test`, username: String(id), isActive: true, requiresPasswordReset: false });
      }
      await Department.collection.insertOne({ _id: deptId, name: 'Test department', code: 'TD', createdBy: adminId });
      await Classroom.collection.insertOne({ _id: roomId, name: 'Test room', code: 'TR', location: 'A', capacity: 20, createdBy: adminId });
      const baseBatch = { clientName: 'Test', department: deptId, startDate: new Date('2026-11-01'), endDate: new Date('2026-11-30'), status: 'ONGOING', learners: [learner1, learner2], trainers: [trainerId], classroom: roomId, createdBy: adminId };
      await Batch.collection.insertMany([{ ...baseBatch, _id: batchId, name: 'First batch', code: 'FIRST' }, { ...baseBatch, _id: otherBatchId, name: 'Needs setup', code: 'SECOND', trainers: [], learners: [], classroom: null }]);
      await Attendance.collection.insertMany([
        { date: new Date('2026-11-02T23:59:59.999Z'), batch: batchId, classroom: roomId, createdBy: trainerId, attendanceRecords: [{ learner: learner1, status: 'PRESENT', markedBy: trainerId }, { learner: learner2, status: 'ABSENT', markedBy: trainerId }] },
        { date: new Date('2026-11-03T00:00:00.000Z'), batch: batchId, classroom: roomId, createdBy: trainerId, attendanceRecords: [{ learner: learner1, status: 'LATE', markedBy: trainerId }] },
      ]);
      const base = `http://127.0.0.1:${server.address().port}/api`;
      const get = async (path, role = adminId) => fetch(base + path, { headers: { Authorization: `Bearer ${jwt.sign({ id: String(role) }, process.env.JWT_SECRET)}` } });
      const qs = '?startDate=2026-11-01&endDate=2026-11-02';
      const report = await get('/attendance/report' + qs);
      assert.equal(report.status, 200);
      const reportData = (await report.json()).data;
      assert.equal(reportData.total, 2); assert.equal(reportData.summary.sessionCount, 1);
      assert.deepEqual(reportData.rows.map(row => row.learner.firstName).sort(), ['First', 'Second']);
      assert.equal(reportData.summary.statusCounts.PRESENT, 1);
      const insights = (await (await get('/dashboard/insights' + qs)).json()).data;
      assert.deepEqual(insights.summary, reportData.summary);
      assert.equal(insights.trend[0].sessionCount, null); assert.equal(insights.trend[1].sessionCount, 1);
      const queue = (await (await get('/dashboard/operations' + qs)).json()).data;
      assert.deepEqual(queue.rows[0].issues, ['NO_TRAINER', 'NO_CLASSROOM', 'NO_LEARNERS']);
      assert.equal((await get('/dashboard/insights' + qs, trainerId)).status, 403);
      assert.equal((await get(`/attendance/report${qs}&batch=${otherBatchId}`, trainerId)).status, 403);
      assert.equal((await get('/attendance/report' + qs, learner1)).status, 403);
    } finally { await new Promise(resolve => server.close(resolve)); process.env.JWT_SECRET = originalSecret; }
  });
});
