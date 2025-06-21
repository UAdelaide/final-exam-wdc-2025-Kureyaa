const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET /api/dogs — return all dogs with owner username
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.dog_id, d.name, d.size, u.username AS owner_username
        FROM Dogs d
        JOIN Users u ON d.owner_id = u.user_id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

module.exports = router;
