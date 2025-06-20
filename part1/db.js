const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'local host',
  user: 'root',
  password: '',
  database: 'textbook_marketplace'
});

module.exports = db;