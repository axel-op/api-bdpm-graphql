const files = {
    medicaments: 'CIS_bdpm', 
    presentations: 'CIS_CIP_bdpm',
    conditions: 'CIS_CPD_bdpm',
    substances: 'CIS_COMPO_bdpm',
};

module.exports = {
    getProperties,
    files,
};

const http = require('http');
const { strToDate } = require('./utils');

const dbSchema = {
    [files.medicaments]: [
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
    ],
    [files.presentations]: [
        'code_CIS',
        'code_CIP7',
        'libelle',
        'statut_admin',
        'etat_commercialisation',
        'date_declaration_commercialisation',
        'code_CIP13',
        'agrement_collectivites',
        'taux_remboursement',
        'prix_sans_honoraires',
        'prix_avec_honoraires',
        'honoraires',
        'indications_remboursement'
    ],
    [files.substances]: [
        'code_CIS',
        'designation_element_pharmaceutique',
        'code_substance',
        'denomination',
        'dosage_substance',
        'reference_dosage',
        'nature_composant',
        'numero_liaison_sa_ft'
    ],
    [files.conditions]: [
        'code_CIS',
        'conditions_prescription'
    ],
};

function ouiNonToBooleans(value) {
    if (value) {
        if (value.toLowerCase() === 'non') return false;
        if (value.toLowerCase() === 'oui') return true;
    }
    return value;
}

function formatFloatNumber(value) {
    // Replace only the last occurrence of ',' by '.', remove the other ones
    if (value) value = value
        .replace(/,([0-9]+)$/, '.' + '$1')
        .replace(',', '');
    return value;
}

const filters = {
    [files.medicaments]: (properties) => {
        let k = 'surveillance_renforcee';
        let v = properties[k];
        properties[k] = ouiNonToBooleans(v);
        k = 'date_AMM';
        v = properties[k];
        if (v) properties[k] = strToDate(v);
        return properties;
    },
    [files.presentations]: (properties) => {
        let k = 'taux_remboursement';
        let v = properties[k];
        if (v) properties[k] = v.replace(/%$/, '').trim();
        k = 'agrement_collectivites';
        properties[k] = ouiNonToBooleans(properties[k]);
        ['prix_sans_honoraires', 'prix_avec_honoraires', 'honoraires']
            .forEach(key => properties[key] = formatFloatNumber(properties[key]));
        return properties;
    }
}

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
    content = content
        .split(/\r?\n/)
        .filter(line => line) // we ignore empty lines
        .map((line, _) => {
            const obj = {};
            for (const [i, p] of line.split('\t').entries()) {
                obj[dbSchema[filename][i]] = p.trim() || null; // empty values are set to null
            };
            return obj;
        });
    const filter = filters[filename];
    return filter
        ? content.map((p, _) => { return filter(p); })
        : content;
};
