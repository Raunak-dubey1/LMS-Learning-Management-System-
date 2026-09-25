import test from 'node:test';
import assert from 'node:assert/strict';

import { hasRequiredRole, normalizeRole } from '../src/utils/roleAccess.js';

test('normalizeRole lowercases and trims role names', () => {
  assert.equal(normalizeRole(' Student '), 'student');
});

test('hasRequiredRole accepts matching role and admin override', () => {
  assert.equal(hasRequiredRole('student', ['student']), true);
  assert.equal(hasRequiredRole('admin', ['student', 'instructor']), true);
  assert.equal(hasRequiredRole('student', ['instructor']), false);
});
