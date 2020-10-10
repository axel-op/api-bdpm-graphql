const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');

async function main() {

    const graph = await require('./graph.js').buildGraph();
    const medicaments = graph['medicaments'];
    const presentations = graph['presentations'];

    // Construct a schema, using GraphQL schema language
    const schema = buildSchema(`
    scalar Date

    type Medicament {
        code_CIS: ID!
        denomination: String!
        forme_pharmaceutique: String!
        voies_administration: String!
        statut_admin_AMM: String!
        type_procedure_AMM: String!
        etat_commercialisation: String!
        date_AMM: Date!
        statut_BDM: String
        numero_autorisation_europeenne: String
        titulaires: String
        surveillance_renforcee: Boolean!
        presentations: [Presentation!]
    }

    type Presentation {
        code_CIS: String!
        code_CIP7: ID!
        libelle: String!
        statut_admin: String
        etat_commercialisation: String
        date_declaration_commercialisation: Date
        code_CIP13: String!
        agrement_collectivites: Boolean
        taux_remboursement: Int
        prix_sans_honoraires: Float
        prix_avec_honoraires: Float
        honoraires: Float
        indications_remboursement: String
    }

    type Query {
        medicaments(codes_CIS: [ID!]): [Medicament!]!
        presentations(codes_CIP7: [ID!]): [Presentation!]!
    }
`);

    // The root provides the top-level API endpoints
    const root = {
        medicaments: async ({ codes_CIS }) => {
            const results = [];
            if (codes_CIS) codes_CIS.forEach(c => results.push(medicaments[c]));
            else results.push(...Object.values(medicaments));
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