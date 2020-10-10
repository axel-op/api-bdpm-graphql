module.exports = {
    buildGraph: buildGraph
}

const data = require('./data.js');

function indexById(objects, id, allow_duplicates = false) {
    return objects.reduce((map, o) => {
        if (map[o[id]]) {
            if (allow_duplicates) map[o[id]].push(o);
            else throw new Error('Duplicate key');
        }
        else map[o[id]] = allow_duplicates ? [o] : o;
        return map;
    }, {});
}

function addField(from, index, field, id, map) {
    for (let o of from) {
        const t = index[o[id]];
        if (map) o = map(o);
        if (t) {
            if (t[field] === undefined) t[field] = o;
            else if (Array.isArray(t[field])) t[field].push(o);
            else throw new Error(`Duplicate id: ${id}`);
        }
    }
    return index;
}

async function buildGraph() {
    console.log('Building graph...');
    let medicaments = await data.getProperties('CIS_bdpm');
    medicaments.forEach(m => {
        m['presentations'] = [];
        m['conditions_prescription'] = [];
        m['substances'] = [];
    });
    medicaments = indexById(medicaments, 'code_CIS');
    const presentations = await data.getProperties('CIS_CIP_bdpm');
    medicaments = addField(presentations, medicaments, 'presentations', 'code_CIS');
    const conditions = await data.getProperties('CIS_CPD_bdpm');
    medicaments = addField(conditions, medicaments, 'conditions_prescription', 'code_CIS', o => o['conditions_prescription']);
    let substances = await data.getProperties('CIS_COMPO_bdpm');
    for (let substance of substances) substance['substance'] = {
        'code_substance': substance['code_substance'],
        'denomination': substance['denomination']
    };
    medicaments = addField(substances, medicaments, 'substances', 'code_CIS');
    substances = indexById(substances, 'code_substance', true);
    Object.keys(substances).forEach((c, _) => substances[c] = substances[c][0]);
    const graph = {
        'medicaments': medicaments,
        'presentations': {
            'CIP7': indexById(presentations, 'code_CIP7'),
            'CIP13': indexById(presentations, 'code_CIP13'),
        },
        'substances': substances,
    };
    console.log('Graph built');
    return graph;
}