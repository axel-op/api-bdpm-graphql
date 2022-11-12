module.exports = {
    buildGraph
}

const { Parser } = require('./bdpm_file_parser.js');
const { files } = require('./bdpm_files');
const { downloadHttpFile } = require('./bdpm_client');

class IndexKey {
    constructor(value, unique) {
        this.value = value;
        this.unique = unique;
    }
}

class Index {
    constructor(...keys) {
        this._keys = keys;
        for (const key of keys) {
            this[key.value] = {};
        }
    }

    addObject(obj) {
        for (const key of this._keys) {
            const id = obj[key.value];
            const index = this[key.value];
            const existing = index[id];
            if (existing && key.unique) {
                throw new Error(`Duplicate key in ${key.value}: ${id}`);
            } else if (existing) {
                existing.push(obj);
            } else {
                index[id] = key.unique ? obj : [obj];
            }
        }
    }
}

function mapToIndex(array, key, index) {
    let keys = array.map(o => o[key]);
    keys = Array.from(new Set(keys));
    return keys.sort().map(k => index[k]).filter(e => e);
}

function addGetter(object, field, getter) {
    Object.defineProperty(object, field, { get: getter });
}

async function processStream(streamPromise, fn, filename) {
    const stream = await streamPromise;
    const parser = new Parser(filename);
    const timer = `Processed ${filename}`;
    console.time(timer);
    for await (const line of stream) {
        if (!parser.isValidLine(line)) continue;
        fn(parser.parseLine(line));
    }
    console.timeEnd(timer);
}

async function processStreams(streamPromises, fns) {
    const promises = [];
    for (const key of Object.keys(fns)) {
        const filename = files[key];
        const fn = fns[key];
        const promise = processStream(streamPromises[key], fn, filename);
        promises.push(promise);
    }
    return Promise.all(promises);
}

async function buildGraph() {
    console.log('Building graph...');
    console.time('Graph built');

    const streams = Object.fromEntries(
        Object.entries(files).map(([key, filename]) => [key, downloadHttpFile(filename)])
    );

    const indexes = {
        presentations: new Index(
            new IndexKey('CIP7', true),
            new IndexKey('CIP13', true),
            new IndexKey('CIS', false),
        ),
        substances: new Index(
            new IndexKey('code_substance', false),
            new IndexKey('CIS', false),
        ),
        groupesGeneriques: new Index(
            new IndexKey('id', false),
        ),
        medicaments: new Index(
            new IndexKey('CIS', true),
        ),
        conditions: new Index(
            new IndexKey('CIS', false),
        ),
    }

    await processStreams(streams, {
        groupesGeneriques: indexes.groupesGeneriques.addObject.bind(indexes.groupesGeneriques),
        conditions: indexes.conditions.addObject.bind(indexes.conditions),
        substances: s => {
            indexes.substances.addObject(s);
            addGetter(s, 'medicament', () => indexes.medicaments.CIS[s.CIS]);
            addGetter(s, 'medicaments', () => mapToIndex(
                indexes.substances.code_substance[s.code_substance],
                'CIS',
                indexes.medicaments.CIS
            ));
        },
        presentations: p => {
            indexes.presentations.addObject(p);
            addGetter(p, 'medicament', () => indexes.medicaments.CIS[p.CIS]);
        },
        medicaments: m => {
            indexes.medicaments.addObject(m);
            const cis = m.CIS;
            addGetter(m, 'presentations', () => indexes.presentations.CIS[cis] || []);
            addGetter(m, 'substances', () => indexes.substances.CIS[cis] || []);
            addGetter(m, 'groupes_generiques', () => indexes.groupesGeneriques.CIS[cis] || []);
            addGetter(m, 'conditions_prescription',
                () => (indexes.conditions.CIS[cis] || [])
                    .map(o => o.conditions_prescription)
                    .filter(c => c)
            );
        },
    });

    Object.values(indexes.substances.code_substance).forEach(substances => {
        const denominations = Array.from(new Set(substances.map(s => s.denomination)));
        substances.forEach(s => s.denominations = denominations);
    });

    indexes.groupesGeneriques.CIS = {};
    const [
        groupesGeneriquesById,
        groupesGeneriquesByCIS,
    ] = [indexes.groupesGeneriques.id, indexes.groupesGeneriques.CIS];

    Object.keys(groupesGeneriquesById).forEach(id => {
        // chaque id correspond à un groupe
        const all = groupesGeneriquesById[id]
        const g = { id: id, libelle: all[0].libelle };
        const meds = [[], [], [], null, []]; // par type
        all.forEach(o => {
            const cis = o.CIS;
            if (!groupesGeneriquesByCIS[cis]) {
                // regroupe tous les groupes génériques associés au médicament dans un même tableau
                groupesGeneriquesByCIS[cis] = [];
            }
            groupesGeneriquesByCIS[cis].push(g);
            const medicament = indexes.medicaments.CIS[cis];
            if (medicament) {
                const type = parseInt(o.type, 10);
                meds[type].push(medicament);
            }
        });
        meds.splice(3, 1);
        [g.princeps, g.generiques, g.generiques_complementarite_posologique, g.generiques_substituables] = meds;
        groupesGeneriquesById[id] = g;
    });

    const graph = {
        'substances': Object.fromEntries(Object.entries(indexes.substances.code_substance)
            .map(([code, substances]) => [code, substances[0]])
        ),
        'medicaments': indexes.medicaments.CIS,
        'presentations': indexes.presentations,
        'groupes_generiques': groupesGeneriquesById,
    };

    console.timeEnd('Graph built');
    return graph;

}
