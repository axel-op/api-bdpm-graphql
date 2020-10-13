module.exports = {
    buildGraph
}

const data = require('./data.js');

function indexByIds(objects, ids, accumulate) {
    return objects.reduce(
        (indexes, o) => {
            for (let i = 0; i < ids.length; i++) {
                const id = ids[i];
                const index = indexes[id];
                const acc = accumulate && i < accumulate.length && accumulate[i];
                if (index[o[id]]) {
                    if (acc) index[o[id]].push(o);
                    else throw new Error(`Duplicate key in ${id}: ${o[id]}`);
                }
                else index[o[id]] = acc ? [o] : o;
            }
            return indexes;
        },
        ids.reduce((indexes, id) => { indexes[id] = {}; return indexes; }, {})
    );
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

function keepFirstElementOfArrayValues(object) {
    return Object.keys(object).reduce((newObj, key) => {
        newObj[key] = object[key][0];
        return newObj;
    }, {});
}

function mapToIndex(array, key, index) {
    let keys = array.map(o => o[key]);
    keys = Array.from(new Set(keys));
    return keys.sort().map(k => index[k]).filter(e => e);
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
    presentations = indexByIds(presentations, ['code_CIP7', 'code_CIP13', 'code_CIS'], [false, false, true]);

    let substances = await props.substances;
    substances = indexByIds(substances, ['code_substance', 'code_CIS'], [true, true]);

    let groupesGeneriques = await props.groupesGeneriques;
    groupesGeneriques = indexByIds(groupesGeneriques, ['id', 'code_CIS'], [true, true]);

    let medicaments = await props.medicaments;
    medicaments.forEach(m => {
        const codeCis = m['code_CIS'];
        addGetter(m, 'presentations', () => presentations['code_CIS'][codeCis] || []);
        addGetter(m, 'substances', () => substances['code_CIS'][codeCis]);
        addGetter(m, 'groupes_generiques', () => groupesGeneriques['code_CIS'][codeCis] || []);
        m['conditions_prescription'] = [];
    });
    medicaments = indexByIds(medicaments, ['code_CIS'])['code_CIS'];
    medicaments = addFieldToIndexedObjects(medicaments, await props.conditions, 'conditions_prescription', 'code_CIS', o => o['conditions_prescription']);

    Object.values(substances['code_CIS']).flat().forEach(s => {
        addGetter(s, 'substance', () => s);
        addGetter(s, 'medicament', () => medicaments[s['code_CIS']]);
        addGetter(s, 'medicaments', () => mapToIndex(['code_substance'][s['code_substance']], 'code_CIS', medicaments));
    });

    Object.values(groupesGeneriques['code_CIS']).flat().forEach(g => {
        addGetter(g, 'medicaments', () => mapToIndex(groupesGeneriques['id'][g['id']], 'code_CIS', medicaments));
    });

    Object.values(presentations['code_CIS']).flat().forEach(p => {
        addGetter(p, 'medicament', () => medicaments[p['code_CIS']]);
    });

    const graph = {
        'substances': keepFirstElementOfArrayValues(substances['code_substance']),
        'medicaments': medicaments,
        'presentations': presentations,
        'groupes_generiques': keepFirstElementOfArrayValues(groupesGeneriques['id']),
    };
    console.timeEnd('Graph built');
    return graph;
}