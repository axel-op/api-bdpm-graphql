module.exports = {
    downloadHttpFile,
}

const axios = require('axios');
const readline = require('readline');

async function downloadHttpFile(filename, {
    protocol = "https:",
    host = process.env.BDPM_URL_HOST || "base-donnees-publique.medicaments.gouv.fr",
    path = process.env.BDPM_URL_PATH || "/telechargement.php"
} = {}) {
    const url = `${protocol}//${host}${path}?fichier=${filename}.txt`;
    const response = await axios.get(url, { responseType: 'stream' });
    const stream = response.data;
    stream.setEncoding('latin1');
    return readline.createInterface({ input: stream });
};
