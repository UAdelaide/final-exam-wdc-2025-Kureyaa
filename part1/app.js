var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2/promise');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

let db;

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: ''
    });

    await connection.query('CREATE DATABASE IF NOT EXISTS DogWalkService');
    await connection.end();

    db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'DogWalkService'
    });

    const [rows] = await db.execute('SELECT COUNT(*) AS count FROM Users');
    if (rows[0].count === 0) {
      await db.execute(`
        INSERT INTO Users (username, email, password_hash, role) VALUES
        ('alice123', 'alice@example.com', 'hashed123', 'owner'),
        ('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
        ('carol123', 'carol@example.com', 'hashed789', 'owner'),
        ('davewalker', 'dave@example.com', 'hashed321', 'walker'),
        ('eve123', 'eve@example.com', 'hashed234', 'owner');
      `);
    }
  } catch (err) {
    console.error('Error setting up database. Ensure Mysql is running: service mysql start', err);
  }
})();

app.get('/', async (req, res) => {
  try {
    const [users] = await db.execute('SELECT * FROM Users');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/dogs', async (req, res) => {
  try {
    const [rows] = await db.query(
        `SELECT d.name AS dog_name, d.size AS size, u.username AS owner_username
         FROM Dogs d
         JOIN Users u ON d.owner_id = u.user_id`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

app.get('/api/walkrequests/open', async (req, res) => {
  try {
    const [rows] = await db.query(
        `SELECT wr.request_id, d.name AS dog_name, wr.requested_time, wr.duration_minutes,
        wr.location, u.username AS owner_username FROM WalkRequests wr
         JOIN Dogs d ON wr.dog_id = d.dog_id
         JOIN Users u ON d.owner_id = u.user_id
         WHERE wr.status = 'open'`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch open walk requests' });
  }
});

app.get('/api/walkers/summary', async (req, res) => {
  try {
    const [rows] = await db.query(
        `SELECT u.username AS walker_username, COUNT(r.rating_id) AS total_ratings,
        AVG(r.rating) AS average_rating, COUNT(r.rating_id) AS completed_walks
         FROM Users u
         LEFT JOIN WalkRatings r ON r.walker_id = u.user_id
         WHERE u.role = 'walker'
         GROUP BY u.username`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch open walk requests' });
  }
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;
