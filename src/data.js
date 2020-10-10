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
    ],
    'CIS_CIP_bdpm': [ // fichier des présentations
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
    'CIS_COMPO_bdpm': [
        'code_CIS',
        'designation_element_pharmaceutique',
        'code_substance',
        'denomination',
        'dosage_substance',
        'reference_dosage',
        'nature_composant',
        'numero_liaison_sa_ft'
    ],
    'CIS_CPD_bdpm': [
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
    'CIS_bdpm': (properties) => {
        const k = 'surveillance_renforcee';
        const v = properties[k];
        properties[k] = ouiNonToBooleans(v);
        return properties;
    },
    'CIS_CIP_bdpm': (properties) => {
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
