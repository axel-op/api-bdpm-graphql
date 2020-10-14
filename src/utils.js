module.exports = {
    strToDate,
    dateToStr,
    removeLeadingZeros,
}

function strToDate(str) {
    const regexes = [
        /^(?<day>[0-9]{2})\/(?<month>[0-9]{2})\/(?<year>[0-9]{4})$/,
        /^(?<day>[0-9]{2})-(?<month>[0-9]{2})-(?<year>[0-9]{4})$/,
        /^(?<year>[0-9]{4})-(?<month>[0-9]{2})-(?<day>[0-9]{2})$/,
    ];
    for (let regex of regexes) {
        if (regex.test(str)) {
            const groups = str.match(regex).groups;
            return new Date(groups['year'], groups['month'] - 1, groups['day']);
        }
    }
    throw new Error(`The format of this date is not accepted: "${str}".`);
}

function dateToStr(date) {
    const numberToStr = function (number, length = 2) {
        number = number.toString();
        while (number.length < length) number = `0${number}`;
        return number;
    };
    const day = numberToStr(date.getDate());
    const month = numberToStr(date.getMonth() + 1);
    const year = numberToStr(date.getFullYear(), 4);
    return `${day}/${month}/${year}`;
}

function removeLeadingZeros(str) {
    const replaced = str.replace(/^[0]+/g, "");
    if (replaced.length === 0) throw new Error(`Incorrect string: ${str}`);
    return replaced;
}
