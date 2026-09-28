'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { lookupAll } = require('../modules/kb');

test('lookupAll ranks local documentation by keyword occurrence', () => {
  const matches = lookupAll([
    'TypeError: Cannot read properties of undefined',
    'TypeError: Cannot read properties of undefined',
    'ReferenceError: variable is not defined',
  ].join('\n'));

  assert.equal(matches[0].title, 'TypeError: Cannot read properties of undefined');
  assert.equal(matches[0].matchCount, 2);
  assert.match(matches[0].rootCause, /undefined/);
  assert.match(matches[0].fix, /null\/undefined guard/);
  assert.match(matches[0].ref, /^https:\/\/developer\.mozilla\.org\//);
  assert.equal(matches[1].title, 'ReferenceError: variable is not defined');
});

test('lookupAll returns no matches for empty or non-text logs', () => {
  assert.deepEqual(lookupAll('  '), []);
  assert.deepEqual(lookupAll(null), []);
});
