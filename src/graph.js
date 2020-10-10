module.exports = {
    buildGraph: buildGraph
}

const data = require('./data.js');

function indexById(objects, id) {
    return objects.reduce((map, o) => {
        if (map[o[id]]) throw new Error('Duplicate key');
        map[o[id]] = o;
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
    });
    medicaments = indexById(medicaments, 'code_CIS');
    let presentations = await data.getProperties('CIS_CIP_bdpm');
    medicaments = addField(presentations, medicaments, 'presentations', 'code_CIS');
    let conditions = await data.getProperties('CIS_CPD_bdpm');
    medicaments = addField(conditions, medicaments, 'conditions_prescription', 'code_CIS', o => o['conditions_prescription']);
    const graph = {
        'medicaments': medicaments,
        'presentations': indexById(presentations, 'code_CIP7'),
    };
    console.log('Graph built');
    return graph;
}