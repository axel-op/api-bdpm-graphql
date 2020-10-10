const fs = require('fs')
const path = require('path')
const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');

async function main() {

    const graph = await require('./graph.js').buildGraph();
    const medicaments = graph['medicaments'];
    const presentations = graph['presentations'];
    const substances = graph['substances'];

    // Construct a schema, using GraphQL schema language
    const schema = buildSchema(fs.readFileSync(path.resolve(__dirname, '..', 'schema.graphql'), 'utf-8'));

    // The root provides the top-level API endpoints
    const root = {
        medicaments: async ({ codes_CIS }) => {
            if (codes_CIS) return getFromIndex(medicaments, codes_CIS);
            return Object.values(medicaments);
        },
        presentations: async ({ codes_CIP7_ou_CIP13 }) => {
            const codes = codes_CIP7_ou_CIP13;
            if (codes) return codes.map((c, _) => presentations[c.length <= 7 ? 'CIP7' : 'CIP13'][c]);
            return Object.values(presentations);
        },
        substances: async ({ codes_substances }) => {
            if (codes_substances) return getFromIndex(substances, codes_substances);
            return Object.values(substances);
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