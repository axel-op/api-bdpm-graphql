const fs = require('fs')
const path = require('path')
const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');

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

function slice(array, limit) {
    return limit ? array.slice(0, limit) : array;
}

async function main() {

    const graph = await require('./graph.js').buildGraph();
    const medicaments = graph['medicaments'];
    const presentations = graph['presentations'];
    const substances = graph['substances'];

    // Construct a schema, using GraphQL schema language
    const schema = buildSchema(fs.readFileSync(path.resolve(__dirname, '..', 'schema.graphql'), 'utf-8'));

    // The root provides the top-level API endpoints
    const root = {
        medicaments: async ({ codes_CIS, limit }) => {
            const results = codes_CIS
                ? getFromIndex(medicaments, codes_CIS)
                : sortValuesByKey(medicaments);
            return slice(results, limit);
        },
        presentations: async ({ codes_CIP7_ou_CIP13, limit }) => {
            const codes = codes_CIP7_ou_CIP13;
            const results = codes
                ? codes.map((c, _) => presentations[c.length <= 7 ? 'CIP7' : 'CIP13'][c])
                : sortValuesByKey(presentations['CIP7']);
            return slice(results, limit);
        },
        substances: async ({ codes_substances, limit }) => {
            const results = codes_substances
                ? getFromIndex(substances, codes_substances)
                : sortValuesByKey(substances);
            return slice(results, limit);
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