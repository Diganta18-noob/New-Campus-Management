const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
function load(file, dependencies) {
    const context = { require: name => {
        if (name.includes('batchAllocation.service')) return { allowed: ['learners','trainers','tas','name','code','startDate','endDate','status','classroom'], validateCandidate: async input => ({ candidate: input, issues: [], capacity: null }) };
        if (name.includes('listQuery')) return require('../backend/utils/listQuery');
        for (const [key, value] of Object.entries(dependencies)) if (name.includes(key)) return value;
        throw new Error(`Unexpected dependency: ${name}`);
    }, module: { exports: {} }, console, Date, process: { env: {} } };
    vm.runInNewContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
    return context.module.exports;
}
function response() {
    return { code: 200, body: null, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
}
function query(rows, calls = []) {
    const chain = { then: (resolve, reject) => Promise.resolve(rows).then(resolve, reject) };
    for (const method of ['select', 'populate', 'sort', 'limit', 'skip']) chain[method] = (...args) => { calls.push([method, ...args]); return chain; };
    return chain;
}

test('manager cannot replace attendance scope with another batch query parameter', async () => {
    let exposed = false;
    const { getAttendance } = load('backend/controllers/attendance.controller.js', {
        'Batch.model': { find: () => query([{ _id: 'owned-batch' }]) },
        'DailyUpdate.model': {},
        'Attendance.model': { find: filter => { exposed = filter.batch === 'foreign-batch'; return query([]); }, countDocuments: async () => 0 },
    });
    const res = response();
    await getAttendance({ user: { role: 'MANAGER', _id: 'manager' }, query: { batch: 'foreign-batch' } }, res);
    assert.equal(res.code, 403);
    assert.equal(exposed, false);
});

for (const role of ['MANAGER', 'TRAINER', 'TA', 'LEARNER']) {
    test(`${role} cannot fetch an unrelated batch by ID`, async () => {
        const { getBatch } = load('backend/controllers/batch.controller.js', {
            'Batch.model': { findById: () => query({ _id: 'foreign', createdBy: 'other', learners: ['other'], trainers: ['other'], tas: ['other'] }) },
            'User.model': {}, 'Attendance.model': {}, 'Classroom.model': {},
        });
        const res = response();
        await getBatch({ user: { role, _id: 'viewer' }, params: { id: 'foreign' } }, res);
        assert.equal(res.code, 403);
    });
}

test('manager cannot replace daily-update scope with another batch query parameter', async () => {
    const { getDailyUpdates } = load('backend/controllers/dailyUpdate.controller.js', {
        'Batch.model': { find: () => query([{ _id: 'owned' }]) }, 'Attendance.model': {},
        'DailyUpdate.model': { find: () => query([]), countDocuments: async () => 0 },
    });
    const res = response();
    await getDailyUpdates({ user: { role: 'MANAGER', _id: 'manager' }, query: { batch: 'foreign' } }, res);
    assert.equal(res.code, 403);
});

test('unassigned trainer cannot publish updates or spoof an author', async () => {
    const { createDailyUpdate } = load('backend/controllers/dailyUpdate.controller.js', {
        'Batch.model': { findById: async () => ({ trainers: ['other'], tas: [] }) }, 'Attendance.model': {},
        'DailyUpdate.model': { findOne: async () => null, create: async () => { throw new Error('Unauthorized write reached'); } },
    });
    const res = response();
    await createDailyUpdate({ user: { role: 'TRAINER', _id: 'trainer' }, body: { date: '2026-11-03', batch: 'foreign', dailySummary: 'Summary', postedBy: 'other' } }, res);
    assert.equal(res.code, 403);
});

test('daily-update creation pins its author and rejects forged feedback fields', async () => {
    let created;
    const { createDailyUpdate } = load('backend/controllers/dailyUpdate.controller.js', {
        'Batch.model': { findById: async () => ({ trainers: ['trainer'] }) },
        'Attendance.model': { findOneAndUpdate: async () => null },
        'DailyUpdate.model': { findOne: async () => null, create: async data => { created = data; return { _id: 'update' }; }, findById: () => query({}) },
    });
    const res = response();
    await createDailyUpdate({ user: { role: 'TRAINER', _id: 'trainer' }, body: { date: '2026-11-03', batch: 'owned', dailySummary: 'Summary', postedBy: 'forged', feedback: [{ rating: 5 }], _id: 'forged-id' } }, res);
    assert.equal(res.code, 201);
    assert.equal(created.postedBy, 'trainer');
    assert.equal(created.feedback, undefined);
    assert.equal(created._id, undefined);
});

test('daily-update edits cannot reassign batch, author or feedback', async () => {
    let changes;
    const record = { batch: 'owned', date: '2026-11-03', postedBy: 'trainer', toObject: () => ({}) };
    const { updateDailyUpdate } = load('backend/controllers/dailyUpdate.controller.js', {
        'Batch.model': { findById: async () => ({ trainers: ['trainer'] }) },
        'Attendance.model': { findOneAndUpdate: async () => null },
        'DailyUpdate.model': { findById: async () => record, findByIdAndUpdate: (id, update) => { changes = update; return query({}); } },
    });
    const res = response();
    await updateDailyUpdate({ user: { role: 'TRAINER', _id: 'trainer' }, params: { id: 'update' }, body: { batch: 'foreign', postedBy: 'forged', feedback: [], dailySummary: 'Updated' } }, res);
    assert.equal(res.code, 200);
    assert.equal(changes.$set.dailySummary, 'Updated');
    for (const field of ['batch', 'postedBy', 'feedback']) assert.equal(changes.$set[field], undefined);
});

test('unassigned trainer cannot create attendance for another batch', async () => {
    const { markAttendance } = load('backend/controllers/attendance.controller.js', {
        'Batch.model': { findById: async () => ({ trainers: ['other-trainer'], learners: ['learner'] }) },
        'DailyUpdate.model': {},
        'Attendance.model': { findOne: async () => null, create: async () => { throw new Error('Unauthorized write reached'); } },
    });
    const res = response();
    await markAttendance({ user: { role: 'TRAINER', _id: 'trainer' }, body: { date: '2026-11-03', batch: 'batch', classroom: 'room', attendanceRecords: [{ learner: 'learner', status: 'PRESENT' }] } }, res);
    assert.equal(res.code, 403);
});

test('assigned trainer can update attendance without an undefined authorization variable', async () => {
    let saved = false;
    const record = { _id: 'attendance', batch: 'batch', attendanceRecords: [], isLocked: false, toObject: () => ({}), save: async () => { saved = true; } };
    let reads = 0;
    const { updateAttendance } = load('backend/controllers/attendance.controller.js', {
        'Batch.model': { findById: async () => ({ trainers: ['trainer'], learners: [] }) },
        'DailyUpdate.model': {},
        'Attendance.model': { findById: () => ++reads === 1 ? Promise.resolve(record) : query(record) },
    });
    const res = response();
    await updateAttendance({ user: { role: 'TRAINER', _id: 'trainer' }, params: { id: 'attendance' }, body: {} }, res);
    assert.equal(res.code, 200);
    assert.equal(saved, true);
});

for (const [role, field] of [['MANAGER', 'createdBy'], ['TRAINER', 'trainers'], ['TA', 'tas'], ['LEARNER', 'learners']]) {
    test(`${role} attendance list retains batch scope and learner privacy`, async () => {
        let scope, filter;
        const calls = [];
        const { getAttendance } = load('backend/controllers/attendance.controller.js', {
            'Batch.model': { find: value => { scope = value; return query([{ _id: 'owned-batch' }]); } },
            'DailyUpdate.model': {},
            'Attendance.model': { find: value => { filter = value; return query([], calls); }, countDocuments: async () => 0 },
        });
        const res = response();
        await getAttendance({ user: { role, _id: 'viewer' }, query: {} }, res);
        assert.equal(res.code, 200);
        assert.equal(scope[field], 'viewer');
        assert.equal(filter.batch.$in[0], 'owned-batch');
        if (role === 'LEARNER') {
            assert.equal(filter['attendanceRecords.learner'], 'viewer');
            assert.ok(calls.some(call => call[0] === 'select' && call[1].includes('attendanceRecords.$')));
        }
    });
}

test('learner single-record response removes classmates and staff daily updates', async () => {
    const record = { batch: 'batch', attendanceRecords: [{ learner: { _id: 'viewer' }, status: 'PRESENT' }, { learner: { _id: 'other' }, status: 'ABSENT' }], dailyUpdate: { trainerRemarks: 'Private' } };
    record.toObject = () => ({ ...record });
    const { getAttendanceRecord } = load('backend/controllers/attendance.controller.js', {
        'Batch.model': {}, 'DailyUpdate.model': {}, 'Attendance.model': { findById: () => query(record) },
    });
    const res = response();
    await getAttendanceRecord({ user: { role: 'LEARNER', _id: 'viewer' }, params: { id: 'record' } }, res);
    assert.equal(res.code, 200);
    assert.equal(res.body.data.attendanceRecords.length, 1);
    assert.equal(res.body.data.attendanceRecords[0].learner._id, 'viewer');
    assert.equal(res.body.data.dailyUpdate, undefined);
});

for (const records of [
    [{ learner: 'outsider', status: 'PRESENT' }],
    [{ learner: 'enrolled', status: 'PRESENT' }, { learner: 'enrolled', status: 'ABSENT' }],
    [{ learner: 'enrolled', status: 'INVALID' }],
]) {
    test(`attendance rejects invalid roster ${JSON.stringify(records)}`, async () => {
        const { markAttendance } = load('backend/controllers/attendance.controller.js', {
            'Batch.model': { findById: async () => ({ trainers: ['trainer'], learners: ['enrolled'] }) },
            'DailyUpdate.model': {}, 'Attendance.model': { findOne: async () => null },
        });
        const res = response();
        await markAttendance({ user: { role: 'TRAINER', _id: 'trainer' }, body: { date: '2026-11-03', batch: 'batch', classroom: 'room', attendanceRecords: records } }, res);
        assert.equal(res.code, 400);
    });
}

test('public signup rejects privileged and invalid roles before accessing the database', async () => {
    let writes = 0;
    const { register } = load('backend/controllers/auth.controller.js', {
        'User.model': { findOne: async () => null, create: async data => { writes++; return { ...data, _id: 'new-user' }; } },
        jsonwebtoken: { sign: () => 'fixture-token' }, logger: { auditLogger: { info() {} } },
    });
    for (const role of ['ADMIN', 'MANAGER', 'TEAM_LEADER', 'TRAINER', 'TA', 'INVALID']) {
        const res = response();
        await register({ body: { email: 'learner@example.test', username: 'learner', password: 'Password123!', firstName: 'Test', lastName: 'Learner', role }, headers: {} }, res);
        assert.equal(res.code, 400, `public role ${role} must be rejected`);
    }
    assert.equal(writes, 0);
});

test('public signup defaults to learner when role is omitted', async () => {
    let created;
    const { register } = load('backend/controllers/auth.controller.js', {
        'User.model': { findOne: async () => null, create: async data => { created = data; return { ...data, _id: 'new-user' }; } },
        jsonwebtoken: { sign: () => 'fixture-token' }, logger: { auditLogger: { info() {} } },
    });
    const res = response();
    await register({ body: { email: 'learner@example.test', username: 'learner', password: 'Password123!', firstName: 'Test', lastName: 'Learner' }, headers: {} }, res);
    assert.equal(res.code, 201);
    assert.equal(created.role, 'LEARNER');
});

test('team-leader attendance uses recorded learner entries and latest sessions', async () => {
    const calls = [];
    const { getDashboardStats } = load('backend/controllers/dashboard.controller.js', {
        'User.model': { countDocuments: async () => 3 },
        'Batch.model': { find: () => query([{ _id: 'batch-1', name: 'Batch', code: 'B1' }]), countDocuments: async () => 1 },
        'DailyUpdate.model': { countDocuments: async () => 0, find: () => query([]) },
        'Attendance.model': { find: () => query([
            { attendanceRecords: [{ status: 'PRESENT' }, { status: 'ABSENT' }] },
            { attendanceRecords: [{ status: 'LATE' }, { status: 'HALF_DAY' }, { status: 'ABSENT' }] },
        ], calls) },
    });
    const res = response();
    await getDashboardStats({ user: { role: 'TEAM_LEADER', _id: 'leader' } }, res);
    assert.equal(res.code, 200);
    assert.equal(res.body.data.batchStats[0].avgAttendance, '60.00');
    const sorting = calls.find(call => call[0] === 'sort');
    assert.equal(sorting?.[1].date, -1);
    assert.equal(calls.find(call => call[0] === 'limit')?.[1], 30);
});

for (const [role, assignment] of [['TRAINER', 'trainers'], ['TA', 'tas']]) {
    test(`${role} dashboard scopes batches and attendance to assignments`, async () => {
        let batchFilter, attendanceFilter, todayFilter, learnerFilter;
        const { getDashboardStats } = load('backend/controllers/dashboard.controller.js', {
            'User.model': { countDocuments: async filter => { learnerFilter = filter; return 0; } },
            'Batch.model': { find: filter => { batchFilter = filter; return query([{ _id: 'assigned-batch', name: 'Assigned', learners: [] }]); }, countDocuments: async () => 99 },
            'DailyUpdate.model': {},
            'Attendance.model': {
                countDocuments: async filter => { todayFilter = filter; return 0; },
                find: filter => { attendanceFilter = filter; return query([]); },
            },
        });
        const res = response();
        await getDashboardStats({ user: { role, _id: 'staff-id' } }, res);
        assert.equal(res.code, 200);
        assert.equal(batchFilter?.[assignment], 'staff-id');
        assert.equal(res.body.data.summary.totalBatches, 1);
        for (const filter of [attendanceFilter, todayFilter, learnerFilter]) assert.equal(filter?.batch?.$in?.[0] || filter?.assignedBatches?.$in?.[0], 'assigned-batch');
        assert.ok(todayFilter.date.$gte instanceof Date);
        assert.ok(todayFilter.date.$lt instanceof Date);
    });
}
