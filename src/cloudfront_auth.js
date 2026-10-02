const crypto = require('crypto');
const fs = require('fs');

function encode(value) {
    return Buffer.from(value).toString('base64')
        .replace(/\+/g, '-').replace(/=/g, '_').replace(/\//g, '~');
}

function getSignedCookie(url) {
    const keyId = process.env.BDPM_CLOUDFRONT_KEY_ID;
    const keyFile = process.env.BDPM_CLOUDFRONT_PRIVATE_KEY_FILE;
    if (!keyId && !keyFile) return undefined;
    if (!keyId || !keyFile) throw new Error('Incomplete CloudFront signing configuration');
    if (url.protocol !== 'https:' || url.host !== process.env.BDPM_URL_HOST) {
        throw new Error('CloudFront signing is restricted to the configured HTTPS mirror');
    }
    const policy = JSON.stringify({
        Statement: [{
            Resource: url.href,
            Condition: { DateLessThan: { 'AWS:EpochTime': Math.floor(Date.now() / 1000) + 300 } },
        }],
    });
    const signature = crypto.sign('RSA-SHA256', Buffer.from(policy), fs.readFileSync(keyFile));
    return [
        `CloudFront-Policy=${encode(policy)}`,
        `CloudFront-Signature=${encode(signature)}`,
        `CloudFront-Key-Pair-Id=${keyId}`,
        'CloudFront-Hash-Algorithm=SHA256',
    ].join('; ');
}

module.exports = { getSignedCookie };
