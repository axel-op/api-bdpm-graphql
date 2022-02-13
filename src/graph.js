module.exports = {
    buildGraph
}

const data = require('./data.js');
const { removeLeadingZeros } = require('./utils.js');

/**
 * @param {Array} objects 
 * @param {Array<String>} ids 
 * @param {Array<Boolean>} accumulate 
 * @returns {{ [k: String]: Array }}
 */
function indexByIds(objects, ids, accumulate) {
    return objects.reduce(
        (indexes, o) => {
            for (let i = 0; i < ids.length; i++) {
                const id = ids[i];
                const index = indexes[id];
                const acc = accumulate && accumulate[i];
                const value = o[id];
                const existing = index[value];
                if (existing !== undefined && !acc) {
                    throw new Error(`Duplicate key in ${id}: ${value}`);
                } else if (existing) {
                    existing.push(o);
                } else {
                    index[value] = acc ? [o] : o;
                }
            }
            return indexes;
        },
        Object.fromEntries(ids.map(id => [id, {}])),
    );
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
    Object.values(substances.code_substance).forEach(substances => {
        const denominations = Array.from(new Set(substances.map(s => s.denomination)));
        substances.forEach(s => s.denominations = denominations);
    });

    let groupesGeneriques = await props.groupesGeneriques;
    removeLeadingZerosOfFields(groupesGeneriques, ['CIS']);
    groupesGeneriques = indexByIds(groupesGeneriques, ['id'], [true]);
    groupesGeneriques.CIS = {};
    const [
        groupesGeneriquesById,
        groupesGeneriquesByCIS,
    ] = [groupesGeneriques.id, groupesGeneriques.CIS];

    let medicaments = await props.medicaments;
    removeLeadingZerosOfFields(medicaments, ['CIS']);
    medicaments.forEach(m => {
        const cis = m['CIS'];
        addGetter(m, 'presentations', () => presentations.CIS[cis] || []);
        addGetter(m, 'substances', () => substances.CIS[cis] || []);
        addGetter(m, 'groupes_generiques', () => groupesGeneriquesByCIS[cis] || []);
        m.conditions_prescription = [];
    });
    medicaments = indexByIds(medicaments, ['CIS']).CIS;

    const conditionsPrescription = await props.conditions;
    conditionsPrescription.forEach(o => {
        const medicament = medicaments[o.CIS];
        if (medicament) {
            medicament.conditions_prescription.push(o.conditions_prescription);
        }
    })

    Object.values(substances.CIS).flat().forEach(s => {
        addGetter(s, 'substance', () => s);
        addGetter(s, 'medicament', () => medicaments[s.CIS]);
        addGetter(s, 'medicaments', () => mapToIndex(substances.code_substance[s.code_substance], 'CIS', medicaments));
    });

    Object.keys(groupesGeneriquesById).forEach(id => {
        // chaque id correspond à un groupe
        const all = groupesGeneriquesById[id]
        const g = { id: id, libelle: all[0].libelle };
        const meds = [[], [], [], null, []]; // par type
        all.forEach(o => {
            const cis = o.CIS;
            if (!groupesGeneriquesByCIS.hasOwnProperty(cis)) {
                // regroupe tous les groupes génériques associés au médicament dans un même tableau
                groupesGeneriquesByCIS[cis] = [];
            }
            groupesGeneriquesByCIS[cis].push(g);
            if (medicaments.hasOwnProperty(cis)) {
                const type = parseInt(o.type, 10);
                meds[type].push(medicaments[cis]);
            }
        });
        meds.splice(3, 1);
        [g.princeps, g.generiques, g.generiques_complementarite_posologique, g.generiques_substituables] = meds;
        groupesGeneriquesById[id] = g;
    });

    Object.values(presentations['CIS']).flat().forEach(p => {
        addGetter(p, 'medicament', () => medicaments[p.CIS]);
    });

    const graph = {
        'substances': Object.fromEntries(Object.entries(substances.code_substance)
            .map(([code, substances]) => [code, substances[0]])
        ),
        'medicaments': medicaments,
        'presentations': presentations,
        'groupes_generiques': groupesGeneriquesById,
    };
    console.timeEnd('Graph built');
    return graph;
}