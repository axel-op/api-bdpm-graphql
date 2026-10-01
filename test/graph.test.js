const assert = require('assert');
const Graph = require('../src/index_builder');
const { files } = require('../src/file_parser');

describe("integration test", function() {
    this.timeout(30000);
    it("should be able to build the graph repeatedly without changing file names", async function() {
        const originalFiles = { ...files };
        for (let i = 0; i < 2; i++) {
            const graph = await Graph.buildGraph();
            assert(Object.keys(graph.medicaments).length > 0);
            assert(Object.values(graph.medicaments).some(m => m.conditions_prescription.length > 0));
            assert.deepStrictEqual(files, originalFiles);
        }
    });
});
