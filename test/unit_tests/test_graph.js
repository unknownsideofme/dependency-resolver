import { test } from 'node:test';
import assert from 'node:assert';
import Graph from '../../src/base/graph/GraphClass.js';

test('Graph Class Test Suite', async (t) => {
    const graphObj = new Graph();
    const testDeps = { "axios": "^1.7.0" };
    let graph;

    await t.test('1. buildGraph', async () => {
        graph = await graphObj.buildGraph(testDeps);
        assert.ok(graph, 'Graph should be generated');
        assert.ok(graph.size > 0, 'Graph should contain nodes');
    });

    await t.test('2. printGraph', () => {
        assert.doesNotThrow(() => {
            graphObj.printGraph(graph);
        }, 'printGraph should execute without throwing error');
    });
});