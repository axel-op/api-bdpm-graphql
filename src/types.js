const { Kind } = require("graphql");
const { dateToStr, strToDate } = require("./utils");

const types = {
    Date: {
        name: 'Date',
        serialize: dateToStr,
        parseLiteral: (ast, variables) => {
            const [kind, value] = [ast.kind, ast.value];
            if (kind !== Kind.STRING && kind !== Kind.NULL) {
                // I think this will never happen, as there is already a precheck for this
                throw new Error('Date must be a string');
            }
            return value ? strToDate(value) : value;
        },
        parseValue: (_) => { throw new Error('Date must be a string'); },
    }
}

module.exports = { types }