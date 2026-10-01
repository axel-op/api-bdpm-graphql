module.exports = {
    downloadFile
}

const https = require('https');

function downloadFile(filename, {
    protocol = "https:",
    host = process.env.BDPM_URL_HOST || "base-donnees-publique.medicaments.gouv.fr",
    path = process.env.BDPM_URL_PATH || "/download/file/"
} = {}) {
    const timer = `Downloaded ${filename}`;
    console.time(timer);
    return new Promise((resolve, reject) => {
        // Keep support for mirrors using the former PHP download endpoint.
        const file = `${encodeURIComponent(filename)}.txt`;
        const downloadPath = path.endsWith('.php')
            ? `${path}?fichier=${file}`
            : `${path.replace(/\/$/, '')}/${file}`;
        const url = new URL(`${protocol}//${host}${downloadPath}`);
        const req = https.request(url, res => {
            if (res.statusCode !== 200) {
                reject(new Error(`Error downloading ${filename} (${url}): ${res.statusCode} ${res.statusMessage}`));
                res.resume();
                return;
            }
            res.setEncoding('latin1');
            res.on('error', reject);
            let data = '';
            res.on('data', d => { data += d; });
            res.on('end', () => {
                resolve(data);
            });
        })
        req.on('error', e => reject(e));
        req.end();
    }).finally(() => console.timeEnd(timer));
};
