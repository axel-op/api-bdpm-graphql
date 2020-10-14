const fs = require('fs')
const path = require('path')
const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const { types } = require('./types.js');
const { applyDateFilters } = require('./filters.js');
const { removeLeadingZeros } = require('./utils.js');

function getValuesBySortedKey(object) {
    return Object.keys(object)
        .sort()
        .map(k => object[k]);
}

function slice(array, from, limit) {
    if (!from) from = 0;
    if (from >= array.length) return [];
    return array.slice(from, limit ? from + limit : limit);
}

function resolve(args, {
    ids,
    indexes,
    dateFilters,
    enumFilters,
} = {}) {
    let results = ids
        ? ids.map(id => (indexes.find(index => id in index) || {})[id]).filter(o => o)
        : getValuesBySortedKey(indexes[0]);
    if (dateFilters) results = applyDateFilters(results, dateFilters.map(a => args[a]), dateFilters);
    if (enumFilters) results = results.filter(r => {
        for (let e of enumFilters) if (args[e] && args[e] !== r[e]) return false;
        return true;
    })
    return slice(results, args.from, args.limit);
}

async function main() {

    const graph = await require('./graph.js').buildGraph();
    const medicaments = graph['medicaments'];
    const presentations = graph['presentations'];
    const substances = graph['substances'];
    const groupesGeneriques = graph['groupes_generiques'];

    // Construct a schema, using GraphQL schema language
    const schema = buildSchema(fs.readFileSync(path.resolve(__dirname, '..', 'schema.graphql'), 'utf-8'));
    Object.keys(types).forEach(t => Object.assign(schema._typeMap[t], types[t]));

    // The root provides the top-level API endpoints
    const root = {
        medicaments: (args) => resolve(args, {
            ids: args.CIS ? args.CIS.map(c => removeLeadingZeros(c)) : null,
            indexes: [medicaments],
            dateFilters: ['date_AMM'],
        }),
        presentations: (args) => resolve(args, {
            ids: args.CIP,
            indexes: Object.values(presentations),
        }),
        substances: (args) => resolve(args, {
            ids: args.codes_substances ? args.codes_substances.map(c => removeLeadingZeros(c)) : null,
            indexes: [substances],
        }),
        groupes_generiques: (args) => resolve(args, {
            ids: args.ids,
            indexes: [groupesGeneriques],
            enumFilters: ['type'],
        }),
    }

    const app = express();
    const port = 4000;
    app.use('/graphql', graphqlHTTP({
        schema: schema,
        rootValue: root,
        graphiql: true,
    }));
    app.listen(port);
    console.log(`Running a GraphQL API server at http://localhost:${port}/graphql`);
}

main();
