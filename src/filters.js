module.exports = {
    applyDateFilters,
}

function applyDateFilters(objects, filters, fields) {
    return objects.filter(object => {
        for (let i = 0; i < filters.length; i++) {
            const filter = filters[i];
            if (!filter) continue;
            const date = object[fields[i]];
            const [before, after] = [filter.before, filter.after];
            return (!before || date <= before) && (!after || date >= after);
        }
        return true;
    });
}