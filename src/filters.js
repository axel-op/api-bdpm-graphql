module.exports = {
    getDateFilter: getDateFilter
}

function getDateFilter(filter) {
    return function (date) {
        const [before, after] = [filter.before, filter.after];
        return (!before || date <= before) && (!after || date >= after);
    }
}