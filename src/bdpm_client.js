module.exports = {
    downloadFile
}

const https = require('https');

function downloadFile(filename, {
    protocol = "https:",
    host = process.env.BDPM_URL_HOST || "base-donnees-publique.medicaments.gouv.fr",
    path = process.env.BDPM_URL_PATH || "/telechargement.php"
} = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${protocol}//${host}${path}?fichier=${filename}.txt`);
        const timer = `Downloaded ${filename}`;
        console.time(timer);
        const req = https.request(url, res => {
            // TODO: handle errors
            if (res.statusCode !== 200) {
                reject(`Error downloading ${filename}: ${res.statusCode} ${res.statusMessage}`);
                res.resume();
                return;
            }
            res.setEncoding('latin1');
            let data = '';
            res.on('data', d => { data += d; });
            res.on('end', () => {
                console.timeEnd(timer);
                resolve(data);
            });
        })
        req.on('error', e => reject(e));
        req.end();
    });
};
