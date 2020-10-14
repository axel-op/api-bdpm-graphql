const fs = require('fs')
const path = require('path')
const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const { types } = require('./types.js');
const { getDateFilter } = require('./filters.js');
const { removeLeadingZeros } = require('./utils.js');

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
        medicaments: ({ CIS, from, limit, date_AMM }) => {
            let results = CIS
                ? getFromIndex(medicaments, CIS.map(c => removeLeadingZeros(c)))
                : sortValuesByKey(medicaments);
            if (date_AMM) {
                const filter = getDateFilter(date_AMM);
                results = results.filter(o => filter(o['date_AMM']));
            }
            return slice(results, from, limit);
        },
        presentations: ({ CIP7_ou_CIP13, from, limit }) => {
            const results = CIP7_ou_CIP13
                ? getFromIndex({ ...presentations['CIP7'], ...presentations['CIP13'] }, CIP7_ou_CIP13)
                : sortValuesByKey(presentations['CIP7']);
            return slice(results, from, limit);
        },
        substances: ({ codes_substances, from, limit }) => {
            const results = codes_substances
                ? getFromIndex(substances, codes_substances.map(c => removeLeadingZeros(c)))
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