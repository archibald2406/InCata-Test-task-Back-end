const express = require('express');
const request = require('request');
const router = express.Router();
const connection = require('../connection');
const {parseDate} = require('../auxiliary-functions/parse-date-to-mysql-format');

connection.connect(err => {
  if (err) throw err;
  console.log('Connected to MySql DB.');

  connection.query(`CREATE TABLE IF NOT EXISTS \`cryptocurrency_symbols\`(
    \`id\` int NOT NULL AUTO_INCREMENT,
    \`symbol\` varchar(10) not null UNIQUE,
    primary key(\`id\`),
    UNIQUE INDEX \`symbol_UNIQUE\` (\`symbol\` ASC) VISIBLE
    ) ENGINE=InnoDB auto_increment=0;`, err => {
    if (err) throw err;

    connection.query(`CREATE TABLE IF NOT EXISTS \`cryptocurrency_courses\`(
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`last\` varchar(30) not null,
      \`timestamp\` datetime NOT NULL,
      \`userId\` varchar(50) default NULL,
      \`symbolId\` int not null,
      primary key(\`id\`),
      FOREIGN KEY (\`symbolId\`) REFERENCES \`cryptocurrency_symbols\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB auto_increment=0;`, err => {
      if (err) throw err;
    });
  });
});

router.get('/last-courses', (req, res) => {
  connection.query(`select cscc.symbol, cscc.last, cscc.timestamp from (
      select symbol, last, timestamp
      from cryptocurrency_courses cc
      join cryptocurrency_symbols cs on cc.symbolId = cs.id ) cscc
    inner join (
      select symbol, max(timestamp) timestamp from (
          select symbol, timestamp
          from cryptocurrency_courses cc
          join cryptocurrency_symbols cs on cc.symbolId = cs.id) tmp
      group by symbol) tmp2
    on cscc.symbol = tmp2.symbol and cscc.timestamp = tmp2.timestamp;`, (err, rows) => {
    if (err) throw err;
    res.send(rows);
  });
});

router.get('/courses-symbols', (req, res) => {
  connection.query(`select symbol from cryptocurrency_symbols;`, (err, rows) => {
    if (err) throw err;
    res.send(rows);
  });
});

router.post('/new-courses', (req, res) => {
  console.log(req.body);

  if (!req.body.symbol || !req.body.last || !req.body.timestamp || !req.body.userId) {
    res.writeHead(500, 'Invalid data in request.');
    res.end();
  }

  const parsedDate = parseDate(req.body.timestamp);
  connection.query(`select id from cryptocurrency_symbols where symbol = '${req.body.symbol}'`, (err, rows) => {
    if (err) throw err;
    let cryptoSymbolId = rows[0].id;

    connection.query(`insert into cryptocurrency_courses(last, timestamp, userId, symbolId) values('${req.body.last}',
        '${parsedDate}', '${req.body.userId}', ${cryptoSymbolId})`,
      (err, rows) => {
        if (err) throw err;
        console.log(rows);
        res.send({ message: 'Value of cryptocurrency pair successfully updated.' });
      });
  });
});

router.post('/', (req, res) => {
  request('https://api.hitbtc.com/api/2/public/ticker',(err, response, body) => {
    if (err) {
      res.writeHead(response.statusCode, err);
      res.end();
    }

    const result = JSON.parse(body);

    for (const item of result) {
      const parsedDate = parseDate(item.timestamp);

      connection.query(`insert into cryptocurrency_symbols(symbol) values('${item.symbol}')`, (err, rows) => {
        if (rows && rows.insertId) {
          let symbolId = rows.insertId;

          connection.query(`insert into cryptocurrency_courses(last, timestamp, symbolId) values('${item.last}',
        '${parsedDate}', ${symbolId})`,
            (err, rows) => {
            if (err) throw err;
              console.log(rows);
            });

        } else {
          connection.query(`select id from cryptocurrency_symbols where symbol = '${item.symbol}'`, (err, rows) => {
            if (err) throw err;
            connection.query(`insert into cryptocurrency_courses(last, timestamp, symbolId) values('${item.last}',
          '${parsedDate}', ${rows[0].id})`,
              (err, rows) => {
              if (err) throw err;
                console.log(rows);
              });
          });
        }

      });
    }

    res.send({ message: 'Importing data of cryptocurrency courses to database.'});
  });
});

module.exports = router;
