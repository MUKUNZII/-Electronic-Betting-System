const { pool } = require('../config/database');

// GET /api/events
const getEvents = async (req, res) => {
  try {
    const { page = 1, limit = 50, category, status, search } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM events WHERE 1=1';
    const params = [];

    if (category && category !== 'All') { query += ' AND category = ?'; params.push(category); }
    if (status && status !== 'all')     { query += ' AND status = ?';   params.push(status); }
    if (search) {
      query += ' AND (title LIKE ? OR team_a LIKE ? OR team_b LIKE ? OR league LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const [total] = await pool.query(countQuery, params);

    // Live first, then upcoming by start_time
    query += ' ORDER BY FIELD(status,"live","upcoming","completed","cancelled"), start_time ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [events] = await pool.query(query, params);

    res.json({ success: true, events, total: total[0].count, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error('getEvents error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch events' });
  }
};

// GET /api/events/live
const getLiveEvents = async (req, res) => {
  try {
    const [events] = await pool.query(
      "SELECT * FROM events WHERE status = 'live' ORDER BY elapsed DESC"
    );
    res.json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch live events' });
  }
};

// GET /api/events/categories
const getCategories = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT DISTINCT category FROM events WHERE status IN ('upcoming','live') ORDER BY category"
    );
    const cats = rows.map(r => r.category);
    res.json({ success: true, categories: ['All', ...cats] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
};

// GET /api/events/:id
const getEventById = async (req, res) => {
  try {
    const [events] = await pool.query('SELECT * FROM events WHERE id = ?', [req.params.id]);
    if (!events.length) return res.status(404).json({ success: false, message: 'Event not found' });

    const [betCount] = await pool.query(
      'SELECT COUNT(*) as count, SUM(stake) as total_staked FROM bets WHERE event_id = ?',
      [req.params.id]
    );
    events[0].bet_count   = betCount[0].count;
    events[0].total_staked = betCount[0].total_staked || 0;

    res.json({ success: true, event: events[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch event' });
  }
};

// GET /api/events/stats — for dashboard
const getEventStats = async (req, res) => {
  try {
    const [[live]]     = await pool.query("SELECT COUNT(*) as c FROM events WHERE status='live'");
    const [[upcoming]] = await pool.query("SELECT COUNT(*) as c FROM events WHERE status='upcoming'");
    res.json({ success: true, live: live.c, upcoming: upcoming.c });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};

module.exports = { getEvents, getEventById, getCategories, getLiveEvents, getEventStats };
