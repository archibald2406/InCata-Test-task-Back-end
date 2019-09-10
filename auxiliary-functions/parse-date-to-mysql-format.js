function parseDate(date) {
  const parsedDate = new Date(date);
  return parsedDate.getUTCFullYear() + '-' +
    ('00' + (parsedDate.getUTCMonth() + 1)).slice(-2) + '-' +
    ('00' + parsedDate.getUTCDate()).slice(-2) + ' ' +
    ('00' + parsedDate.getHours()).slice(-2) + ':' +
    ('00' + parsedDate.getMinutes()).slice(-2) + ':' +
    ('00' + parsedDate.getSeconds()).slice(-2);
}

module.exports = {parseDate};
