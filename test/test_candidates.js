import { test } from 'node:test';
import assert from 'node:assert';
import Candidates from '../src/base/candidate/CandidateClass.js';

test('Candidates Class Test Suite', async (t) => {
    const candidateObj = new Candidates();
    const dummyConflict = {
        packageName: "debug",
        constraints: [
            { requester: "express@4.18.2", range: "2.6.9" },
            { requester: "https-proxy-agent@5.0.1", range: "4" }
        ]
    };

    await t.test('1. generateCandidates', async () => {
        const candidates = await candidateObj.generateCandidates(dummyConflict);
        assert.ok(Array.isArray(candidates), 'Candidates result should be an array');
        assert.ok(candidates.length > 0, 'Should generate alternative candidates');
    });
});
