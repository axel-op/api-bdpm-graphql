const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');

const data = require('./data.js');

// Construct a schema, using GraphQL schema language
var schema = buildSchema(`
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
    }

    type Query {
        medicaments(codes_CIS: [ID]): [Medicament]!
    }
`);

// The root provides the top-level API endpoints
var root = {
    medicaments: async ({ codes_CIS }) => {
        const p = await data.getProperties('CIS_bdpm');
        return p.filter(o => codes_CIS.includes(o['code_CIS']));
    }
}

var app = express();
var port = 4000;
app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
}));
app.listen(port);
console.log(`Running a GraphQL API server at http://localhost:${port}/graphql`);