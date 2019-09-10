const mysql = require('mysql');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password : 'pass123',
  database: 'incata_tasks',
  multipleStatements: true
});

module.exports = connection;
