const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'local host',
  user: 'root',
  password: 'root',
  database: 'DogWalkService'
});

module.exports = db;
