const fs = require('fs')
const path = require('path')
const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');

async function main() {

    const graph = await require('./graph.js').buildGraph();
    const medicaments = graph['medicaments'];
    const presentations = graph['presentations'];

    // Construct a schema, using GraphQL schema language
    const schema = buildSchema(fs.readFileSync(path.resolve(__dirname, '..', 'schema.graphql'), 'utf-8'));

    // The root provides the top-level API endpoints
    const root = {
        medicaments: async ({ codes_CIS }) => {
            const results = [];
            if (codes_CIS) codes_CIS.forEach(c => results.push(medicaments[c]));
            else results.push(...Object.values(medicaments));
            console.log(results);
            return results;
        },
        presentations: async ({ codes_CIP7 }) => {
            const results = [];
            if (codes_CIP7) codes_CIP7.forEach(c => results.push(presentations[c]));
            else results.push(...Object.values(presentations));
            return results;
        }
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