const files = {
    medicaments: 'CIS_bdpm',
    presentations: 'CIS_CIP_bdpm',
    conditions: 'CIS_CPD_bdpm',
    substances: 'CIS_COMPO_bdpm',
    groupesGeneriques: 'CIS_GENER_bdpm',
};

module.exports = {
    getProperties,
    files,
};

const { strToDate } = require('./utils');

const dbSchema = {
    [files.medicaments]: [
        'CIS',
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
        'CIS',
        'CIP7',
        'libelle',
        'statut_admin',
        'etat_commercialisation',
        'date_declaration_commercialisation',
        'CIP13',
        'agrement_collectivites',
        'taux_remboursement',
        'prix_sans_honoraires',
        'prix_avec_honoraires',
        'honoraires',
        'indications_remboursement'
    ],
    [files.substances]: [
        'CIS',
        'designation_element_pharmaceutique',
        'code_substance',
        'denomination',
        'dosage_substance',
        'reference_dosage',
        'nature_composant',
        'numero_liaison_sa_ft'
    ],
    [files.conditions]: [
        'CIS',
        'conditions_prescription'
    ],
    [files.groupesGeneriques]: [
        'id',
        'libelle',
        'CIS',
        'type',
        'numero_tri'
    ],
};

const mappings = {
    [files.medicaments]: {
        'surveillance_renforcee': ouiNonToBooleans,
        'date_AMM': v => v ? strToDate(v) : v,
        'titulaires': v => v ? v.split(';').map(s => s.trim()) : [],
    },
    [files.presentations]: {
        'taux_remboursement': v => v ? v.replace(/%$/, '').trim() : v,
        'agrement_collectivites': ouiNonToBooleans,
        'prix_sans_honoraires': formatFloatNumber,
        'prix_avec_honoraires': formatFloatNumber,
        'honoraires': formatFloatNumber,
        'date_declaration_commercialisation': v => v ? strToDate(v) : v,
    },
}

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

async function getProperties(filename, content) {
    const schema = dbSchema[filename];
    return content
        .split(/\r?\n/)
        .map(line => line.trimEnd()) // il y a des tabulations en trop à la fin
        .filter(line => line) // ignorer les lignes vides
        .map(line => line.split('\t'))
        .filter(line => line.length <= schema.length) // ignorer les lignes mal formatées
        .map((line, _) => {
            const obj = {};
            const mappings_ = mappings[filename] || {};
            for (let [i, p] of line.entries()) {
                const prop = schema[i];
                const mapping = mappings_[prop];
                p = p.trim() || null; // empty values are set to null
                if (mapping) {
                    p = mapping(p);
                }
                obj[prop] = p;
            };
            return obj;
        });
};
