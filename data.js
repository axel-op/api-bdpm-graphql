module.exports = {
    getProperties: getProperties
};

const http = require('http');

const dbSchema = {
    'CIS_bdpm': [
        'code_CIS',
        'denomination',
        'forme_pharmaceutique',
        'voies_administration',
        'statut_admin_AMM',
        'type_procedure_AMM',
        'etat_commercialisation',
        'date_AMM',
        'statut_BDM',
        'numero_autorisation_europeenne',
        'titulaires',
        'surveillance_renforcee'
    ]
};

function readFile(filename) {
    return new Promise((resolve, reject) => {
        const url = new URL(`http://base-donnees-publique.medicaments.gouv.fr/telechargement.php?fichier=${filename}.txt`);
        const req = http.request(url, res => {
            // TODO: handle errors
            if (res.statusCode !== 200) {
                reject('Status code != 200');
                res.resume();
                return;
            }
            res.setEncoding('latin1');
            let data = '';
            res.on('data', d => { data += d; });
            res.on('end', () => resolve(data));
        })
        req.on('error', e => reject(e));
        req.end();
    });
};

async function getProperties(filename) {
    let content = await readFile(filename);
    content = content.split(/\r?\n/);
    return content.map((line, _) => {
        const obj = {};
        for (const [i, p] of line.split('\t').entries()) {
            obj[dbSchema[filename][i]] = p;
        };
        return obj;
    });
};
