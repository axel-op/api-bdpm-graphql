module.exports = {
    buildGraph
}

const data = require('./data.js');
const { removeLeadingZeros } = require('./utils.js');

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

function removeLeadingZerosOfFields(objects, fields) {
    objects.forEach(o => fields.forEach(f => o[f] = removeLeadingZeros(o[f])));
}

async function buildGraph() {
    console.log('Building graph...');
    console.time('Graph built');
    const props = data.files;
    Object.keys(props).forEach(k => props[k] = data.getProperties(props[k]));

    let presentations = await props.presentations;
    removeLeadingZerosOfFields(presentations, ['CIS']);
    presentations = indexByIds(presentations, ['CIP7', 'CIP13', 'CIS'], [false, false, true]);

    let substances = await props.substances;
    removeLeadingZerosOfFields(substances, ['code_substance', 'CIS']);
    substances = indexByIds(substances, ['code_substance', 'CIS'], [true, true]);

    let groupesGeneriques = await props.groupesGeneriques;
    removeLeadingZerosOfFields(groupesGeneriques, ['CIS']);
    groupesGeneriques = indexByIds(groupesGeneriques, ['id', 'CIS'], [true, true]);

    let medicaments = await props.medicaments;
    removeLeadingZerosOfFields(medicaments, ['CIS']);
    medicaments.forEach(m => {
        const codeCis = m['CIS'];
        addGetter(m, 'presentations', () => presentations['CIS'][codeCis] || []);
        addGetter(m, 'substances', () => substances['CIS'][codeCis] || []);
        addGetter(m, 'groupes_generiques', () => groupesGeneriques['CIS'][codeCis] || []);
        m['conditions_prescription'] = [];
    });
    medicaments = indexByIds(medicaments, ['CIS'])['CIS'];
    medicaments = addFieldToIndexedObjects(medicaments, await props.conditions, 'conditions_prescription', 'CIS', o => o['conditions_prescription']);

    Object.values(substances['CIS']).flat().forEach(s => {
        addGetter(s, 'substance', () => s);
        addGetter(s, 'medicament', () => medicaments[s['CIS']]);
        addGetter(s, 'medicaments', () => mapToIndex(substances['code_substance'][s['code_substance']], 'CIS', medicaments));
    });

    Object.values(groupesGeneriques['CIS']).flat().forEach(g => {
        addGetter(g, 'medicaments', () => mapToIndex(groupesGeneriques['id'][g['id']], 'CIS', medicaments));
    });

    Object.values(presentations['CIS']).flat().forEach(p => {
        addGetter(p, 'medicament', () => medicaments[p['CIS']]);
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