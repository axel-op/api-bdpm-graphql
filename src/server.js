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
        medicaments(codes_CIS: [ID]): [Medicament]!
        presentations: [Presentation]!
    }
`);

// The root provides the top-level API endpoints
var root = {
    medicaments: async ({ codes_CIS }) => {
        const p = await data.getProperties('CIS_bdpm');
        return p.filter(o => codes_CIS.includes(o['code_CIS']));
    },
    presentations: async () => {
        const p = await data.getProperties('CIS_CIP_bdpm');
        return p;
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