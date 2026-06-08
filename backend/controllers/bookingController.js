const { pool } = require('../config/database');

// Generate a random 6-char alphanumeric code
const genCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

// POST /api/booking — save a bet slip as a booking code
const createBooking = async (req, res) => {
  try {
    const { legs } = req.body;
    // legs = [{ event_id, selection, odds, team_a, team_b, league, market }]

    if (!legs || legs.length === 0) {
      return res.status(400).json({ success: false, message: 'No selections provided' });
    }
    if (legs.length > 20) {
      return res.status(400).json({ success: false, message: 'Maximum 20 selections' });
    }

    // Validate all events still exist and are bettable
    for (const leg of legs) {
      const [events] = await pool.query(
        "SELECT id FROM events WHERE id = ? AND status IN ('upcoming','live')",
        [leg.event_id]
      );
      if (!events.length) {
        return res.status(400).json({ success: false, message: `Event ${leg.event_id} is no longer available` });
      }
    }

    const totalOdds = legs.reduce((acc, l) => acc * parseFloat(l.odds), 1);

    // Generate unique code
    let code, attempts = 0;
    do {
      code = genCode();
      const [existing] = await pool.query('SELECT id FROM booking_codes WHERE code = ?', [code]);
      if (!existing.length) break;
      attempts++;
    } while (attempts < 10);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const userId = req.user?.id || null;

    await pool.query(
      'INSERT INTO booking_codes (code, user_id, legs, total_odds, leg_count, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      [code, userId, JSON.stringify(legs), totalOdds.toFixed(4), legs.length, expiresAt]
    );

    res.status(201).json({
      success: true,
      code,
      total_odds: totalOdds,
      leg_count: legs.length,
      expires_at: expiresAt,
      message: `Booking code ${code} created! Share it or use it to place your bet.`,
    });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ success: false, message: 'Failed to create booking code' });
  }
};

// GET /api/booking/:code — load a booking code
const loadBooking = async (req, res) => {
  try {
    const { code } = req.params;

    const [rows] = await pool.query(
      'SELECT * FROM booking_codes WHERE code = ? AND expires_at > NOW()',
      [code.toUpperCase()]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Booking code not found or expired' });
    }

    const booking = rows[0];
    let legs;
    try {
      legs = typeof booking.legs === 'string' ? JSON.parse(booking.legs) : booking.legs;
    } catch {
      return res.status(500).json({ success: false, message: 'Invalid booking data' });
    }

    // Verify events are still available
    const validLegs = [];
    for (const leg of legs) {
      const [events] = await pool.query(
        'SELECT id, title, team_a, team_b, league, odds_a, odds_b, odds_draw, odds_1x, odds_x2, odds_12, status FROM events WHERE id = ?',
        [leg.event_id]
      );
      if (events.length) {
        const ev = events[0];
        const available = ev.status === 'upcoming' || ev.status === 'live';
        validLegs.push({ ...leg, event_status: ev.status, available });
      }
    }

    res.json({
      success: true,
      booking: {
        code: booking.code,
        total_odds: parseFloat(booking.total_odds),
        leg_count: booking.leg_count,
        expires_at: booking.expires_at,
        created_at: booking.created_at,
        legs: validLegs,
      },
    });
  } catch (error) {
    console.error('Load booking error:', error);
    res.status(500).json({ success: false, message: 'Failed to load booking code' });
  }
};

module.exports = { createBooking, loadBooking };
