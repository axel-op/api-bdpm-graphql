module.exports = {
    strToDate,
    dateToStr,
}

function strToDate(str) {
    const regex = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/
    if (!regex.test(str)) throw new Error(`Format error: "${str}". Expected format: DD/MM/YYYY.`);
    const match = str.match(regex);
    const date = new Date(match[3], match[2] - 1, match[1]);
    return date;
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
