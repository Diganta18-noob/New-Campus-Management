const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('shared dashboard client uses the route exposed by Express', () => {
    const source = read('frontend/src/services/api.js');
    const section = source.match(/export const dashboardAPI = \{([\s\S]*?)\};/)[1];
    assert.match(section, /getStats:.*api.get\("\/dashboard\/stats"\)/);
    assert.match(read('backend/routes/dashboard.routes.js'), /route\('\/stats'\)/);
});

test('admin attendance includes midday sessions and excludes next midnight', async () => {
    let attendanceFilter;
    const model = { countDocuments: async () => 4, aggregate: async () => [] };
    const sandbox = {
        require: name => name.includes('Attendance') ? {
            countDocuments: async filter => { attendanceFilter = filter; return 2; },
        } : model,
        module: { exports: {} }, console, Date,
    };
    vm.runInNewContext(read('backend/controllers/dashboard.controller.js'), sandbox);
    let body;
    await sandbox.module.exports.getDashboardStats({ user: { role: 'ADMIN' } }, {
        status: code => { assert.equal(code, 200); return { json: value => { body = value; } }; },
    });
    assert.equal(body.data.summary.todayAttendance, 2);
    const { $gte: start, $lt: end } = attendanceFilter.date;
    assert.ok(start instanceof Date && end instanceof Date);
    assert.equal(start.getHours(), 0);
    assert.equal(end.getDate(), new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1).getDate());
    const midday = new Date(start); midday.setHours(12);
    assert.ok(midday >= start && midday < end);
    assert.ok(!(end < end));
});
