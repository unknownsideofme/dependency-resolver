import { test } from 'node:test';
import assert from 'node:assert';
import Resolver from '../src/base/resolver/ResolverClass.js';

test('Resolver Class Test Suite', async (t) => {
    const testDeps = {
        "express": "4.18.2",
        "express-rate-limit": "7.5.0",
        "axios": "^1.7.0"
    };
    const resolver = new Resolver(testDeps);

    await t.test('1. resolve', async () => {
        const solution = await resolver.resolve();
        assert.ok(solution, 'Resolver should return a solution Map');
        assert.strictEqual(solution.has('express'), true, 'Solution should include express');
        assert.strictEqual(solution.has('axios'), true, 'Solution should include axios');
    });
});
