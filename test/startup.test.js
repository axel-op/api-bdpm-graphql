const assert = require('assert');
const { spawnSync } = require('child_process');
const path = require('path');

describe('Graph startup failures', function() {
    it('handles a fast failure while other downloads are still pending', function() {
        const result = spawnSync(process.execPath, ['--unhandled-rejections=strict', '-e', `
            const assert = require('assert');
            const client = require('./src/bdpm_client');
            const { files } = require('./src/file_parser');
            const originalFiles = { ...files };
            client.downloadFile = filename => filename === 'CIS_CPD_bdpm'
                ? Promise.reject(new Error('404 Not Found'))
                : new Promise(resolve => setTimeout(() => resolve(''), 30));
            const { buildGraph } = require('./src/index_builder');
            assert.rejects(buildGraph(), /404 Not Found/).then(() => {
                assert.deepStrictEqual(files, originalFiles);
            }).catch(error => {
                console.error(error);
                process.exitCode = 1;
            });
        `], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8', timeout: 5000 });
        assert.ifError(result.error);
        assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    });
});
