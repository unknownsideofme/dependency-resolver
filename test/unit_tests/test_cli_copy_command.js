import test from 'node:test';
import assert from 'node:assert/strict';
import { buildResolveCommand } from '../../src/cli/resolveCommand.js';

test('buildResolveCommand returns the install command for resolved dependency conflicts', () => {
  const command = buildResolveCommand({
    axios: '^1.7.0',
    semver: '^7.6.0'
  }, new Map([
    ['axios', { version: '1.20.0' }],
    ['semver', { version: '7.8.5' }]
  ]));

  assert.equal(command, 'npm install axios@1.20.0 semver@7.8.5 --save');
});

test('buildResolveCommand supports scoped package names in the install command', () => {
  const command = buildResolveCommand({
    '@my-scope/my-lib': '^1.0.0'
  }, new Map([
    ['@my-scope/my-lib', { version: '1.2.3' }]
  ]));

  assert.equal(command, 'npm install @my-scope/my-lib@1.2.3 --save');
});
