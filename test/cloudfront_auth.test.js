const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { getSignedCookie } = require('../src/cloudfront_auth');

function decode(value) {
    return Buffer.from(value.replace(/-/g, '+').replace(/_/g, '=').replace(/~/g, '/'), 'base64');
}

describe('CloudFront authentication', function() {
    const keys = ['BDPM_URL_HOST', 'BDPM_CLOUDFRONT_KEY_ID', 'BDPM_CLOUDFRONT_PRIVATE_KEY_FILE'];
    let previous;
    let directory;
    let publicKey;

    before(function() {
        directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bdpm-auth-test-'));
        const pair = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
        publicKey = pair.publicKey;
        fs.writeFileSync(path.join(directory, 'private.pem'), pair.privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });
    });
    after(function() { fs.rmSync(directory, { recursive: true }); });
    beforeEach(function() {
        previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
        process.env.BDPM_URL_HOST = 'mirror.cloudfront.net';
        process.env.BDPM_CLOUDFRONT_KEY_ID = 'KTEST';
        process.env.BDPM_CLOUDFRONT_PRIVATE_KEY_FILE = path.join(directory, 'private.pem');
    });
    afterEach(function() {
        for (const key of keys) {
            if (previous[key] === undefined) delete process.env[key];
            else process.env[key] = previous[key];
        }
    });

    it('signs an exact resource with a five minute expiration and a verifiable RSA signature', function() {
        const url = new URL('https://mirror.cloudfront.net/CIS_bdpm.txt');
        const before = Math.floor(Date.now() / 1000);
        const cookie = getSignedCookie(url);
        const fields = Object.fromEntries(cookie.split('; ').map(part => {
            const index = part.indexOf('=');
            return [part.slice(0, index), part.slice(index + 1)];
        }));
        const policy = decode(fields['CloudFront-Policy']);
        const statement = JSON.parse(policy).Statement[0];
        assert.strictEqual(statement.Resource, url.href);
        assert(statement.Condition.DateLessThan['AWS:EpochTime'] >= before + 300);
        assert(statement.Condition.DateLessThan['AWS:EpochTime'] <= Math.floor(Date.now() / 1000) + 300);
        assert.strictEqual(fields['CloudFront-Key-Pair-Id'], 'KTEST');
        assert.strictEqual(fields['CloudFront-Hash-Algorithm'], 'SHA256');
        assert(crypto.verify('RSA-SHA256', policy, publicKey, decode(fields['CloudFront-Signature'])));
        assert(!crypto.verify('RSA-SHA256', Buffer.from(policy.toString().replace('CIS_bdpm', 'CIS_CIP_bdpm')), publicKey, decode(fields['CloudFront-Signature'])));
    });
    it('does not expose signing cookies to another host or over HTTP', function() {
        assert.throws(() => getSignedCookie(new URL('https://other.example/CIS_bdpm.txt')), /restricted/);
        assert.throws(() => getSignedCookie(new URL('http://mirror.cloudfront.net/CIS_bdpm.txt')), /restricted/);
    });
    it('fails rather than silently downloading anonymously when configuration is incomplete', function() {
        delete process.env.BDPM_CLOUDFRONT_PRIVATE_KEY_FILE;
        assert.throws(() => getSignedCookie(new URL('https://mirror.cloudfront.net/CIS_bdpm.txt')), /Incomplete/);
    });
    it('allows normal BDPM downloads when CloudFront authentication is not configured', function() {
        delete process.env.BDPM_CLOUDFRONT_KEY_ID;
        delete process.env.BDPM_CLOUDFRONT_PRIVATE_KEY_FILE;
        assert.strictEqual(getSignedCookie(new URL('https://official.example/CIS_bdpm.txt')), undefined);
    });
});
