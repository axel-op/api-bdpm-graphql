module.exports = {
    buildGraph: buildGraph
}

const data = require('./data.js');

function indexById(objects, id) {
    return objects.reduce((map, o) => {
        map[o[id]] = o;
        return map;
    }, {});
}

async function buildGraph() {
    console.log('Building graph...');
    let medicaments = await data.getProperties('CIS_bdpm');
    let presentations = await data.getProperties('CIS_CIP_bdpm');
    medicaments = indexById(medicaments, 'code_CIS');
    presentations = indexById(presentations, 'code_CIP7');
    for (p of Object.values(presentations)) {
        let m = medicaments[p['code_CIS']];
        if (m) {
            if (!m.hasOwnProperty('presentations')) m['presentations'] = [];
            m['presentations'].push(p);
        };
    };
    const graph = {
        'medicaments': medicaments,
        'presentations': presentations
    };
    console.log('Graph built');
    return graph;
}