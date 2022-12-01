module.exports = {
    downloadHttpFile,
}

const readline = require('readline');
const { Readable } = require('stream');

async function downloadHttpFile(filename, {
    protocol = "https:",
    host = process.env.BDPM_URL_HOST || "base-donnees-publique.medicaments.gouv.fr",
    path = process.env.BDPM_URL_PATH || "/telechargement.php"
} = {}) {
    const url = `${protocol}//${host}${path}?fichier=${filename}.txt`;
    const response = await fetch(url);
    const stream = response.body.pipeThrough(new TextDecoderStream("latin1"));
    return readline.createInterface({ input: Readable.fromWeb(stream) });
};
