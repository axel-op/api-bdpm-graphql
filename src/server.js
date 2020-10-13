const fs = require('fs')
const path = require('path')
const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const { types } = require('./types.js');
const { getDateFilter } = require('./filters.js');

function getFromIndex(index, keys) {
    const results = [];
    keys.forEach(k => {
        const v = index[k];
        if (v) results.push(v);
    });
    return results;
}

function sortValuesByKey(object) {
    return Object.keys(object)
        .sort()
        .map(k => object[k]);
}

function slice(array, from, limit) {
    if (!from) from = 0;
    if (from >= array.length) return [];
    return array.slice(from, limit ? from + limit : limit);
}

async function main() {

    const graph = await require('./graph.js').buildGraph();
    const medicaments = graph['medicaments'];
    const presentations = graph['presentations'];
    const substances = graph['substances'];
    const groupesGeneriques = graph['groupes_generiques'];

    // Construct a schema, using GraphQL schema language
    const schema = buildSchema(fs.readFileSync(path.resolve(__dirname, '..', 'schema.graphql'), 'utf-8'));
    Object.assign(schema._typeMap.Date, types.Date)

    // The root provides the top-level API endpoints
    const root = {
        medicaments: ({ codes_CIS, from, limit, date_AMM }) => {
            let results = codes_CIS
                ? getFromIndex(medicaments, codes_CIS)
                : sortValuesByKey(medicaments);
            if (date_AMM) {
                const filter = getDateFilter(date_AMM);
                results = results.filter(o => filter(o['date_AMM']));
            }
            return slice(results, from, limit);
        },
        presentations: ({ codes_CIP7_ou_CIP13, from, limit }) => {
            const results = codes_CIP7_ou_CIP13
                ? getFromIndex({ ...presentations['code_CIP7'], ...presentations['code_CIP13'] }, codes_CIP7_ou_CIP13)
                : sortValuesByKey(presentations['code_CIP7']);
            return slice(results, from, limit);
        },
        substances: ({ codes_substances, from, limit }) => {
            const results = codes_substances
                ? getFromIndex(substances, codes_substances)
                : sortValuesByKey(substances);
            return slice(results, from, limit);
        },
        groupes_generiques: ({ ids, from, limit, type }) => {
            let results = ids
                ? getFromIndex(groupesGeneriques, ids)
                : sortValuesByKey(groupesGeneriques);
            if (type) results = results.filter(g => g['type'] === type);
            return slice(results, from, limit);
        },
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