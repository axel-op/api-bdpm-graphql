const { files, schemas } = require('./bdpm_files');
const { strToDate, removeLeadingZeros } = require('./utils');

const mappings = {
    [files.medicaments]: {
        'CIS': removeLeadingZeros,
        'surveillance_renforcee': ouiNonToBooleans,
        'date_AMM': v => v ? strToDate(v) : v,
        'titulaires': v => v ? v.split(';').map(s => s.trim()) : [],
    },
    [files.presentations]: {
        'CIS': removeLeadingZeros,
        'taux_remboursement': v => v ? v.replace(/%$/, '').trim() : v,
        'agrement_collectivites': ouiNonToBooleans,
        'prix_sans_honoraires': formatFloatNumber,
        'prix_avec_honoraires': formatFloatNumber,
        'honoraires': formatFloatNumber,
        'date_declaration_commercialisation': v => v ? strToDate(v) : v,
    },
    [files.substances]: {
        'CIS': removeLeadingZeros,
        'code_substance': removeLeadingZeros,
    },
    [files.groupesGeneriques]: {
        'CIS': removeLeadingZeros,
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

class Parser {
    constructor(filename) {
        this.filename = filename;
    }

    parseLine(content) {
        const schema = schemas[this.filename];
        if (!this.isValidLine(content)) {
            throw new Error(`Invalid line in ${this.filename}: "${content}"`);
        }
        const parts = this.splitLine(content);
        const obj = {};
        const mappings_ = mappings[this.filename] || {};
        for (let [i, p] of parts.entries()) {
            p = p.trim() || null; // empty values are set to null
            const prop = schema[i];
            const mapping = mappings_[prop];
            if (mapping) {
                p = mapping(p);
            }
            obj[prop] = p;
        };
        return obj;
    }

    splitLine(content) {
        content = content.trimEnd(); // il y a des tabulations en trop à la fin de certaines lignes
        return content.split('\t');
    }

    isValidLine(content) {
        const schema = schemas[this.filename];
        const parts = this.splitLine(content);
        return parts && parts.length <= schema.length;
    }
}

module.exports = {
    Parser,
};
