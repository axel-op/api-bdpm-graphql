const fs = require('fs')
const path = require('path')
const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema, GraphQLEnumType } = require('graphql');
const { types } = require('./types.js');
const { applyDateFilters, applyStringFilters } = require('./filters.js');
const { removeLeadingZeros } = require('./utils.js');
const { buildGraph } = require('./graph.js');

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

function getQueryArgs(schema, query) {
    return Object.values(schema['_queryType']['_fields'][query]['args']);
}

function findArgsOfType(schema, query, type) {
    return getQueryArgs(schema, query)
        .filter(a => a['type']['name'] === type)
        .map(a => a['name']);
}

function findEnumArgs(schema, query) {
    return getQueryArgs(schema, query)
        .filter(a => a['type'] instanceof GraphQLEnumType)
        .map(a => a['name']);        
}

function resolve(schema, query, args, {
    ids,
    indexes,
} = {}) {
    const [dateFilters, stringFilters] = ['DateFilter', 'StringFilter'].map(name => findArgsOfType(schema, query, name));
    const enumFilters = findEnumArgs(schema, query);
    let results = ids
        ? ids.map(id => (indexes.find(index => id in index) || {})[id]).filter(o => o)
        : getValuesBySortedKey(indexes[0]);
    if (dateFilters) results = applyDateFilters(results, dateFilters.map(a => args[a]), dateFilters);
    if (stringFilters) results = applyStringFilters(results, stringFilters.map(a => args[a]), stringFilters);
    if (enumFilters) results = results.filter(r => !enumFilters.find(e => args[e] && args[e] !== r[e]));
    return slice(results, args.from, args.limit);
}

async function main() {

    // Build a schema, using GraphQL schema language
    const schema = buildSchema(fs.readFileSync(path.resolve(__dirname, '..', 'schema.graphql'), 'utf-8'));
    Object.keys(types).forEach(t => Object.assign(schema._typeMap[t], types[t]));

    const graph = await buildGraph();
    const medicaments = graph['medicaments'];
    const presentations = Object.values(graph['presentations']);
    const substances = graph['substances'];
    const groupesGeneriques = graph['groupes_generiques'];
    
    // The root provides the top-level API endpoints
    const root = {
        medicaments: (args) => resolve(schema, 'medicaments', args, {
            ids: args.CIS ? args.CIS.map(c => removeLeadingZeros(c)) : null,
            indexes: [medicaments],
        }),
        presentations: (args) => resolve(schema, 'presentations', args, {
            ids: args.CIP,
            indexes: Object.values(presentations),
        }),
        substances: (args) => resolve(schema, 'substances', args, {
            ids: args.codes_substances ? args.codes_substances.map(c => removeLeadingZeros(c)) : null,
            indexes: [substances],
        }),
        groupes_generiques: (args) => resolve(schema, 'groupes_generiques', args, {
            ids: args.ids,
            indexes: [groupesGeneriques],
        }),
    }

    const app = express();
    const port = process.env.PORT || 4000;
    app.use('/graphql', graphqlHTTP({
        schema: schema,
        rootValue: root,
        graphiql: true,
    }));
    app.listen(port);
    console.log(`Running a GraphQL API server at http://localhost:${port}/graphql`);
}

main();
