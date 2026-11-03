const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const toolkit = require(path.join(root, 'frontend/node_modules/@reduxjs/toolkit'));
const code = fs.readFileSync(path.join(root, 'frontend/src/store/slices/authSlice.js'), 'utf8')
    .replace(/^import .*;\r?\n/gm, '')
    .replace(/export const /g, 'const ')
    .replace('export default authSlice.reducer;', 'module.exports = authSlice.reducer;');
const context = { ...toolkit, authAPI: {}, module: { exports: {} }, console };
vm.runInNewContext(code, context);
const reducer = context.module.exports;
for (const type of ['auth/login/fulfilled', 'auth/register/fulfilled', 'auth/checkAuth/fulfilled']) {
    test(`${type} normalizes API id for assignment-dependent screens`, () => {
        const result = reducer(undefined, { type, payload: { id: 'api-user-id', role: 'TRAINER' } });
        assert.equal(result.user._id, 'api-user-id');
        assert.equal(result.isAuthenticated, true);
    });
}
for (const type of ['auth/logout/fulfilled', 'auth/checkAuth/rejected', 'auth/login/rejected', 'auth/register/rejected']) {
    test(`${type} clears the previous user and mandatory-reset flag`, () => {
        const previous = { user: { _id: 'old-user' }, isAuthenticated: true, requiresPasswordReset: true, loading: true, error: null };
        const result = reducer(previous, { type, payload: 'Rejected request' });
        assert.equal(result.user, null);
        assert.equal(result.isAuthenticated, false);
        assert.equal(result.requiresPasswordReset, false);
        assert.equal(result.loading, false);
    });
}
