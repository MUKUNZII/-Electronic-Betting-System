const { pool } = require('../config/database');
const { createNotification } = require('../services/notificationService');

// POST /api/bets
const placeBet = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { event_id, selection, stake, bet_type = 'single' } = req.body;
    const parsedStake = parseFloat(stake);

    if (parsedStake < 1) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Minimum stake is $1' });
    }

    // Check event
    const [events] = await conn.query(
      'SELECT * FROM events WHERE id = ? AND status IN ("upcoming","live")',
      [event_id]
    );
    if (!events.length) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Event not available for betting' });
    }

    const event = events[0];

    // Determine odds based on selection
    let odds;
    if (selection === 'team_a') odds = parseFloat(event.odds_a);
    else if (selection === 'team_b') odds = parseFloat(event.odds_b);
    else if (selection === 'draw' && event.odds_draw) odds = parseFloat(event.odds_draw);
    else {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Invalid selection' });
    }

    const potentialWinnings = parseFloat((parsedStake * odds).toFixed(2));

    // Check wallet balance
    const [wallets] = await conn.query('SELECT balance FROM wallets WHERE user_id = ? FOR UPDATE', [req.user.id]);
    if (!wallets.length || parseFloat(wallets[0].balance) < parsedStake) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Insufficient balance. Please deposit funds.' });
    }

    const balanceBefore = parseFloat(wallets[0].balance);
    const balanceAfter = parseFloat((balanceBefore - parsedStake).toFixed(2));

    // Deduct stake
    await conn.query('UPDATE wallets SET balance = balance - ?, total_losses = total_losses + ? WHERE user_id = ?', [parsedStake, parsedStake, req.user.id]);

    // Create bet
    const [result] = await conn.query(
      'INSERT INTO bets (user_id, event_id, bet_type, selection, odds, stake, potential_winnings) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, event_id, bet_type, selection, odds, parsedStake, potentialWinnings]
    );

    // Record transaction
    await conn.query(
      'INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, 'bet_placed', parsedStake, balanceBefore, balanceAfter, `Bet placed on ${event.title} - ${selection}`]
    );

    await conn.commit();

    await createNotification(
      req.user.id,
      'Bet Placed Successfully',
      `Your bet of $${parsedStake.toFixed(2)} on "${event.title}" has been placed. Potential winnings: $${potentialWinnings.toFixed(2)}`,
      'bet'
    );

    res.status(201).json({
      success: true,
      message: 'Bet placed successfully',
      bet: { id: result.insertId, event_id, selection, odds, stake: parsedStake, potential_winnings: potentialWinnings, status: 'pending' },
    });
  } catch (error) {
    await conn.rollback();
    console.error('Bet error:', error);
    res.status(500).json({ success: false, message: 'Failed to place bet' });
  } finally {
    conn.release();
  }
};

// GET /api/bets
const getUserBets = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT b.*, e.title as event_title, e.category, e.team_a, e.team_b, e.start_time
      FROM bets b
      JOIN events e ON e.id = b.event_id
      WHERE b.user_id = ?
    `;
    const params = [req.user.id];

    if (status) { query += ' AND b.status = ?'; params.push(status); }
    query += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [bets] = await pool.query(query, params);
    const [total] = await pool.query(
      'SELECT COUNT(*) as count FROM bets WHERE user_id = ?' + (status ? ' AND status = ?' : ''),
      status ? [req.user.id, status] : [req.user.id]
    );

    res.json({ success: true, bets, total: total[0].count, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch bets' });
  }
};

// GET /api/bets/:id
const getBetById = async (req, res) => {
  try {
    const [bets] = await pool.query(
      `SELECT b.*, e.title as event_title, e.category, e.team_a, e.team_b, e.start_time, e.status as event_status
       FROM bets b JOIN events e ON e.id = b.event_id
       WHERE b.id = ? AND b.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!bets.length) return res.status(404).json({ success: false, message: 'Bet not found' });
    res.json({ success: true, bet: bets[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch bet' });
  }
};

// GET /api/bets/stats
const getBetStats = async (req, res) => {
  try {
    const [stats] = await pool.query(
      `SELECT 
        COUNT(*) as total_bets,
        SUM(CASE WHEN status='won' THEN 1 ELSE 0 END) as won_bets,
        SUM(CASE WHEN status='lost' THEN 1 ELSE 0 END) as lost_bets,
        SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) as pending_bets,
        SUM(stake) as total_staked,
        SUM(actual_winnings) as total_winnings
       FROM bets WHERE user_id = ?`,
      [req.user.id]
    );
    res.json({ success: true, stats: stats[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};

module.exports = { placeBet, getUserBets, getBetById, getBetStats };
