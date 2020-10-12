module.exports = {
    buildGraph
}

const data = require('./data.js');

function indexById(objects, id, allow_duplicates = false) {
    return objects.reduce((map, o) => {
        if (map[o[id]]) {
            if (allow_duplicates) map[o[id]].push(o);
            else throw new Error(`Duplicate key: ${o[id]}`);
        }
        else map[o[id]] = allow_duplicates ? [o] : o;
        return map;
    }, {});
}

function addFieldToIndexedObjects(index, from, field, id, map) {
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

function addGetter(object, field, getter) {
    Object.defineProperty(object, field, { get: getter });
}

async function buildGraph() {
    console.log('Building graph...');
    console.time('Graph built');
    const props = data.files;
    Object.keys(props).forEach(k => props[k] = data.getProperties(props[k]));

    let presentations = await props.presentations;
    presentations = {
        'CIP7': indexById(presentations, 'code_CIP7'),
        'CIP13': indexById(presentations, 'code_CIP13'),
        'code_CIS': indexById(presentations, 'code_CIS', true),
    }

    let substances = await props.substances;
    substances = {
        'code_substance': indexById(substances, 'code_substance', true),
        'code_CIS': indexById(substances, 'code_CIS', true),
    }
    for (const [code, array] of Object.entries(substances['code_substance'])) {
        substances['code_substance'][code] = array[0]
    }

    let medicaments = await props.medicaments;
    medicaments.forEach(m => {
        addGetter(m, 'presentations', () => presentations['code_CIS'][m['code_CIS']])
        addGetter(m, 'substances', () => substances['code_CIS'][m['code_CIS']])
        m['conditions_prescription'] = [];
    });
    medicaments = indexById(medicaments, 'code_CIS');
    medicaments = addFieldToIndexedObjects(medicaments, await props.conditions, 'conditions_prescription', 'code_CIS', o => o['conditions_prescription']);

    Object.values(substances['code_CIS']).flat().forEach(s => {
        addGetter(s, 'substance', () => s);
        addGetter(s, 'medicament', () => medicaments[s['code_CIS']]);
    });

    const graph = {
        'substances': substances['code_substance'],
        'medicaments': medicaments,
        'presentations': presentations,
    };
    console.timeEnd('Graph built');
    return graph;
}