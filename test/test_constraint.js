import { test } from 'node:test';
import assert from 'node:assert';
import Constraint from '../src/base/constraints/ConstraintClass.js';

test('Constraint Class Test Suite', async (t) => {
    const constraintInstance = new Constraint();

    await t.test('1. addConstraint & getConstraints', () => {
        constraintInstance.addConstraint('axios', '^1.20.0', 'app');
        const constraints = constraintInstance.getConstraints();
        
        assert.ok(constraints, 'Constraints Map should exist');
        assert.strictEqual(constraints.has('axios'), true, 'Should contain axios constraint');
    });

    await t.test('2. getConflicts', () => {
        const conflicts = constraintInstance.getConflicts();
        assert.ok(conflicts, 'Conflicts Set should exist');
    });
});