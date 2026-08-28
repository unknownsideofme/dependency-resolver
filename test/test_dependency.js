import { test } from 'node:test';
import assert from 'node:assert';
import Dependency from '../src/base/dependencies/DependencyClass.js';

test('Dependency Class Test Suite', async (t) => {
    await t.test('1. Singleton pattern for Dependency class', () => {
        const dummy = new Dependency(); 
        const dummy2 = new Dependency(); 

        assert.strictEqual(dummy, dummy2, "Dependency instances should be strictly equal (Singleton)");
    });
});