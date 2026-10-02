const assert = require('assert');
const https = require('https');
const { EventEmitter } = require('events');
const { downloadFile } = require('../src/bdpm_client');

describe('BDPM downloads', function() {
    let originalRequest;
    let originalHost;
    let originalPath;

    beforeEach(function() {
        originalRequest = https.request;
        originalHost = process.env.BDPM_URL_HOST;
        originalPath = process.env.BDPM_URL_PATH;
        delete process.env.BDPM_URL_HOST;
        delete process.env.BDPM_URL_PATH;
    });

    afterEach(function() {
        https.request = originalRequest;
        for (const [key, value] of [['BDPM_URL_HOST', originalHost], ['BDPM_URL_PATH', originalPath]]) {
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        }
    });

    function respond(statusCode, body = '') {
        let requestedUrl;
        https.request = (url, options, callback) => {
            requestedUrl = url;
            const request = new EventEmitter();
            request.end = () => process.nextTick(() => {
                const response = new EventEmitter();
                response.statusCode = statusCode;
                response.statusMessage = statusCode === 200 ? 'OK' : 'Not Found';
                response.setEncoding = encoding => assert.strictEqual(encoding, 'latin1');
                response.resume = () => {};
                callback(response);
                response.emit('data', body);
                response.emit('end');
            });
            return request;
        };
        return () => requestedUrl;
    }

    it('uses the current official download URL and retains accented data', async function() {
        const url = respond(200, '60000001\tPrescription réservée\n');
        assert.strictEqual(await downloadFile('CIS_CPD_bdpm'), '60000001\tPrescription réservée\n');
        assert.strictEqual(url().href, 'https://base-donnees-publique.medicaments.gouv.fr/download/file/CIS_CPD_bdpm.txt');
    });

    it('supports a custom directory without a trailing slash', async function() {
        process.env.BDPM_URL_HOST = 'mirror.example';
        process.env.BDPM_URL_PATH = '/files';
        const url = respond(200);
        await downloadFile('CIS_bdpm');
        assert.strictEqual(url().href, 'https://mirror.example/files/CIS_bdpm.txt');
    });

    it('rejects HTTP failures with an Error containing the file, URL and status', async function() {
        respond(404);
        await assert.rejects(downloadFile('CIS_CPD_bdpm'), error => {
            assert(error instanceof Error);
            assert.match(error.message, /CIS_CPD_bdpm.*https:.*404 Not Found/);
            return true;
        });
    });

    it('rejects an interrupted response', async function() {
        https.request = (url, options, callback) => {
            const request = new EventEmitter();
            request.end = () => process.nextTick(() => {
                const response = new EventEmitter();
                response.statusCode = 200;
                response.setEncoding = () => {};
                callback(response);
                response.emit('error', new Error('Connection reset'));
            });
            return request;
        };
        await assert.rejects(downloadFile('CIS_bdpm'), /Connection reset/);
    });
});
