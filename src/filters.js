module.exports = {
    applyDateFilters,
    applyStringFilters,
}

function applyFilters(objects, filters, fields, filterFunction) {
    return objects.filter(object => {
        for (let i = 0; i < filters.length; i++) {
            const filter = filters[i];
            if (!filter || Object.keys(filter).length === 0) continue;
            if (!filterFunction(filter, object[fields[i]])) return false;
        }
        return true;
    });
}

function applyDateFilters(objects, filters, fields) {
    return applyFilters(objects, filters, fields, (filter, date) => {
        const [before, after] = [filter.before, filter.after];
        return (!before || date <= before) && (!after || date >= after);
    });
}

function applyStringFilters(objects, filters, fields) {
    return applyFilters(objects, filters, fields, (f, str) => {
        if (!str) return false;
        str = str.toLowerCase();
        if (f['contains_one_of']
            && !f['contains_one_of'].find(s => str.includes(s.toLowerCase()))
        ) return false;
        if (f['starts_with_one_of']
            && !f['starts_with_one_of'].find(s => str.startsWith(s.toLowerCase()))
        ) return false;
        if (f['ends_with_one_of']
            && !f['ends_with_one_of'].find(s => str.endsWith(s.toLowerCase()))
        ) return false;
        for (let s of (f['contains_all'] || [])) {
            if (!str.includes(s.toLowerCase())) return false;
        }
        return true;
    });
}