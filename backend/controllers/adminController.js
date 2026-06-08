const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { createNotification } = require('../services/notificationService');
const { sendDepositNotification, sendWithdrawalNotification } = require('../services/emailService');

// GET /api/admin/dashboard
const getDashboard = async (req, res) => {
  try {
    const [[users]] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [[bets]] = await pool.query('SELECT COUNT(*) as count, SUM(stake) as total_staked FROM bets');
    const [[pendingDeposits]] = await pool.query("SELECT COUNT(*) as count, SUM(amount) as total FROM deposits WHERE status='pending'");
    const [[pendingWithdrawals]] = await pool.query("SELECT COUNT(*) as count, SUM(amount) as total FROM withdrawals WHERE status='pending'");
    const [[activeEvents]] = await pool.query("SELECT COUNT(*) as count FROM events WHERE status IN ('upcoming','live')");
    const [[revenue]] = await pool.query("SELECT SUM(amount) as total FROM deposits WHERE status='approved'");
    const [[wonBets]] = await pool.query("SELECT SUM(actual_winnings) as total FROM bets WHERE status='won'");

    // Recent activity
    const [recentBets] = await pool.query(
      `SELECT b.*, u.username, e.title as event_title FROM bets b
       JOIN users u ON u.id = b.user_id JOIN events e ON e.id = b.event_id
       ORDER BY b.created_at DESC LIMIT 10`
    );

    const [recentDeposits] = await pool.query(
      `SELECT d.*, u.username, u.email FROM deposits d JOIN users u ON u.id = d.user_id
       ORDER BY d.created_at DESC LIMIT 10`
    );

    res.json({
      success: true,
      stats: {
        total_users: users.count,
        total_bets: bets.count,
        total_staked: bets.total_staked || 0,
        pending_deposits: pendingDeposits.count,
        pending_deposits_amount: pendingDeposits.total || 0,
        pending_withdrawals: pendingWithdrawals.count,
        pending_withdrawals_amount: pendingWithdrawals.total || 0,
        active_events: activeEvents.count,
        total_revenue: revenue.total || 0,
        total_paid_out: wonBets.total || 0,
      },
      recent_bets: recentBets,
      recent_deposits: recentDeposits,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard' });
  }
};

// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT u.*, w.balance, w.total_deposited, w.total_winnings FROM users u LEFT JOIN wallets w ON w.user_id = u.id WHERE 1=1`;
    const params = [];

    if (search) { query += ' AND (u.username LIKE ? OR u.email LIKE ? OR u.full_name LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (status === 'active') { query += ' AND u.is_active = 1'; }
    if (status === 'suspended') { query += ' AND u.is_active = 0'; }

    const [total] = await pool.query(query.replace('SELECT u.*, w.balance, w.total_deposited, w.total_winnings', 'SELECT COUNT(*) as count'), params);
    query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [users] = await pool.query(query, params);
    res.json({ success: true, users, total: total[0].count });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

// PUT /api/admin/users/:id/toggle-status
const toggleUserStatus = async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, is_active, full_name FROM users WHERE id = ?', [req.params.id]);
    if (!users.length) return res.status(404).json({ success: false, message: 'User not found' });

    const newStatus = users[0].is_active ? 0 : 1;
    await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, req.params.id]);

    const statusText = newStatus ? 'activated' : 'suspended';
    await createNotification(req.params.id, `Account ${statusText}`, `Your account has been ${statusText} by admin.`, 'system');

    res.json({ success: true, message: `User ${statusText} successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update user status' });
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
};

// GET /api/admin/deposits
const getDeposits = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT d.*, u.username, u.email, u.full_name FROM deposits d JOIN users u ON u.id = d.user_id WHERE 1=1`;
    const params = [];
    if (status) { query += ' AND d.status = ?'; params.push(status); }
    query += ' ORDER BY d.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [deposits] = await pool.query(query, params);
    res.json({ success: true, deposits });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch deposits' });
  }
};

// PUT /api/admin/deposits/:id/approve
const approveDeposit = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [deposits] = await conn.query(
      `SELECT d.*, u.email, u.full_name FROM deposits d JOIN users u ON u.id = d.user_id WHERE d.id = ?`,
      [req.params.id]
    );
    if (!deposits.length) { await conn.rollback(); return res.status(404).json({ success: false, message: 'Deposit not found' }); }

    const deposit = deposits[0];
    if (deposit.status !== 'pending') { await conn.rollback(); return res.status(400).json({ success: false, message: 'Deposit already processed' }); }

    // Amount is stored in RWF
    const [wallets] = await conn.query('SELECT balance FROM wallets WHERE user_id = ? FOR UPDATE', [deposit.user_id]);
    const balanceBefore = parseFloat(wallets[0].balance);

    // Check for promo bonus
    const [promoUsage] = await conn.query('SELECT * FROM promo_code_usages WHERE deposit_id = ?', [deposit.id]);
    const bonusAmount = promoUsage.length ? parseFloat(promoUsage[0].bonus_amount) : 0;
    const totalCredit = parseFloat(deposit.amount) + bonusAmount;
    const balanceAfter = balanceBefore + totalCredit;

    // Credit wallet (RWF)
    await conn.query(
      'UPDATE wallets SET balance = balance + ?, total_deposited = total_deposited + ? WHERE user_id = ?',
      [totalCredit, totalCredit, deposit.user_id]
    );

    await conn.query(
      'UPDATE deposits SET status = "approved", processed_by = ?, processed_at = NOW() WHERE id = ?',
      [req.admin.id, deposit.id]
    );

    await conn.query(
      'INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, reference, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [deposit.user_id, 'deposit', totalCredit, balanceBefore, balanceAfter,
       deposit.reference,
       `Deposit approved: RF ${Math.round(deposit.amount).toLocaleString()}${bonusAmount > 0 ? ` + RF ${Math.round(bonusAmount).toLocaleString()} bonus` : ''}`]
    );

    await conn.commit();

    await createNotification(
      deposit.user_id,
      '✅ Deposit Approved!',
      `Your deposit of RF ${Math.round(deposit.amount).toLocaleString()} has been approved and credited to your wallet!`,
      'deposit'
    );
    sendDepositNotification(deposit.email, deposit.full_name, deposit.amount, 'approved').catch(console.error);

    res.json({ success: true, message: 'Deposit approved and wallet credited in RWF' });
  } catch (error) {
    await conn.rollback();
    console.error('Approve deposit error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve deposit' });
  } finally {
    conn.release();
  }
};

// PUT /api/admin/deposits/:id/reject
const rejectDeposit = async (req, res) => {
  try {
    const { note } = req.body;
    const [deposits] = await pool.query(
      `SELECT d.*, u.email, u.full_name FROM deposits d JOIN users u ON u.id = d.user_id WHERE d.id = ?`,
      [req.params.id]
    );
    if (!deposits.length) return res.status(404).json({ success: false, message: 'Deposit not found' });
    if (deposits[0].status !== 'pending') return res.status(400).json({ success: false, message: 'Deposit already processed' });

    await pool.query(
      'UPDATE deposits SET status = "rejected", admin_note = ?, processed_by = ?, processed_at = NOW() WHERE id = ?',
      [note || null, req.admin.id, req.params.id]
    );

    await createNotification(deposits[0].user_id, 'Deposit Rejected', `Your deposit of $${parseFloat(deposits[0].amount).toFixed(2)} was rejected.${note ? ' Reason: ' + note : ''}`, 'deposit');
    sendDepositNotification(deposits[0].email, deposits[0].full_name, deposits[0].amount, 'rejected').catch(console.error);

    res.json({ success: true, message: 'Deposit rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reject deposit' });
  }
};

// GET /api/admin/withdrawals
const getWithdrawals = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT w.*, u.username, u.email, u.full_name FROM withdrawals w JOIN users u ON u.id = w.user_id WHERE 1=1`;
    const params = [];
    if (status) { query += ' AND w.status = ?'; params.push(status); }
    query += ' ORDER BY w.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [withdrawals] = await pool.query(query, params);
    res.json({ success: true, withdrawals });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch withdrawals' });
  }
};

// PUT /api/admin/withdrawals/:id/approve
const approveWithdrawal = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [withdrawals] = await conn.query(
      `SELECT w.*, u.email, u.full_name FROM withdrawals w JOIN users u ON u.id = w.user_id WHERE w.id = ?`,
      [req.params.id]
    );
    if (!withdrawals.length) { await conn.rollback(); return res.status(404).json({ success: false, message: 'Withdrawal not found' }); }

    const withdrawal = withdrawals[0];
    if (withdrawal.status !== 'pending') { await conn.rollback(); return res.status(400).json({ success: false, message: 'Withdrawal already processed' }); }

    const [wallets] = await conn.query('SELECT balance FROM wallets WHERE user_id = ?', [withdrawal.user_id]);
    const balanceBefore = parseFloat(wallets[0].balance);

    await conn.query(
      'UPDATE wallets SET total_withdrawn = total_withdrawn + ? WHERE user_id = ?',
      [withdrawal.amount, withdrawal.user_id]
    );

    await conn.query(
      'UPDATE withdrawals SET status = "approved", processed_by = ?, processed_at = NOW() WHERE id = ?',
      [req.admin.id, withdrawal.id]
    );

    await conn.query(
      'INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, reference, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [withdrawal.user_id, 'withdrawal', withdrawal.amount, balanceBefore, balanceBefore, withdrawal.reference, 'Withdrawal approved']
    );

    await conn.commit();

    await createNotification(withdrawal.user_id, 'Withdrawal Approved', `Your withdrawal of $${parseFloat(withdrawal.amount).toFixed(2)} has been approved!`, 'withdrawal');
    sendWithdrawalNotification(withdrawal.email, withdrawal.full_name, withdrawal.amount, 'approved').catch(console.error);

    res.json({ success: true, message: 'Withdrawal approved' });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ success: false, message: 'Failed to approve withdrawal' });
  } finally {
    conn.release();
  }
};

// PUT /api/admin/withdrawals/:id/reject
const rejectWithdrawal = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { note } = req.body;
    const [withdrawals] = await conn.query(
      `SELECT w.*, u.email, u.full_name FROM withdrawals w JOIN users u ON u.id = w.user_id WHERE w.id = ?`,
      [req.params.id]
    );
    if (!withdrawals.length) { await conn.rollback(); return res.status(404).json({ success: false, message: 'Withdrawal not found' }); }
    if (withdrawals[0].status !== 'pending') { await conn.rollback(); return res.status(400).json({ success: false, message: 'Already processed' }); }

    const withdrawal = withdrawals[0];

    // Refund the amount
    await conn.query('UPDATE wallets SET balance = balance + ? WHERE user_id = ?', [withdrawal.amount, withdrawal.user_id]);
    await conn.query(
      'UPDATE withdrawals SET status = "rejected", admin_note = ?, processed_by = ?, processed_at = NOW() WHERE id = ?',
      [note || null, req.admin.id, withdrawal.id]
    );

    await conn.commit();

    await createNotification(withdrawal.user_id, 'Withdrawal Rejected', `Your withdrawal of $${parseFloat(withdrawal.amount).toFixed(2)} was rejected. Amount refunded.${note ? ' Reason: ' + note : ''}`, 'withdrawal');
    sendWithdrawalNotification(withdrawal.email, withdrawal.full_name, withdrawal.amount, 'rejected').catch(console.error);

    res.json({ success: true, message: 'Withdrawal rejected and amount refunded' });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ success: false, message: 'Failed to reject withdrawal' });
  } finally {
    conn.release();
  }
};

// POST /api/admin/events
const createEvent = async (req, res) => {
  try {
    const { title, category, team_a, team_b, odds_a, odds_b, odds_draw, start_time, end_time, description } = req.body;

    const [result] = await pool.query(
      `INSERT INTO events (title, category, team_a, team_b, odds_a, odds_b, odds_draw, start_time, end_time, description, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, category, team_a, team_b, odds_a || 1.5, odds_b || 1.5, odds_draw || null, start_time, end_time, description || null, req.admin.id]
    );

    res.status(201).json({ success: true, message: 'Event created successfully', event_id: result.insertId });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ success: false, message: 'Failed to create event' });
  }
};

// PUT /api/admin/events/:id
const updateEvent = async (req, res) => {
  try {
    const { title, category, team_a, team_b, odds_a, odds_b, odds_draw, start_time, end_time, status, description } = req.body;

    await pool.query(
      `UPDATE events SET title=?, category=?, team_a=?, team_b=?, odds_a=?, odds_b=?, odds_draw=?,
       start_time=?, end_time=?, status=?, description=? WHERE id=?`,
      [title, category, team_a, team_b, odds_a, odds_b, odds_draw || null, start_time, end_time, status, description || null, req.params.id]
    );

    res.json({ success: true, message: 'Event updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update event' });
  }
};

// PUT /api/admin/events/:id/result
const setEventResult = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { result } = req.body; // 'team_a', 'team_b', 'draw', 'cancelled'

    const [events] = await conn.query('SELECT * FROM events WHERE id = ?', [req.params.id]);
    if (!events.length) { await conn.rollback(); return res.status(404).json({ success: false, message: 'Event not found' }); }

    const event = events[0];

    await conn.query('UPDATE events SET result = ?, status = "completed" WHERE id = ?', [result, event.id]);

    // Settle bets
    const [bets] = await conn.query("SELECT * FROM bets WHERE event_id = ? AND status = 'pending'", [event.id]);

    for (const bet of bets) {
      let betStatus, actualWinnings = 0;

      if (result === 'cancelled') {
        betStatus = 'cancelled';
        actualWinnings = parseFloat(bet.stake);
        // Refund stake
        await conn.query('UPDATE wallets SET balance = balance + ?, total_losses = total_losses - ? WHERE user_id = ?', [bet.stake, bet.stake, bet.user_id]);
        await createNotification(bet.user_id, 'Bet Refunded', `Your bet on "${event.title}" was refunded due to event cancellation.`, 'bet');
      } else if (bet.selection === result) {
        betStatus = 'won';
        actualWinnings = parseFloat(bet.potential_winnings);
        // Credit winnings
        const [wallets] = await conn.query('SELECT balance FROM wallets WHERE user_id = ?', [bet.user_id]);
        const balanceBefore = parseFloat(wallets[0].balance);
        await conn.query(
          'UPDATE wallets SET balance = balance + ?, total_winnings = total_winnings + ?, total_losses = total_losses - ? WHERE user_id = ?',
          [actualWinnings, actualWinnings, bet.stake, bet.user_id]
        );
        await conn.query(
          'INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description) VALUES (?, ?, ?, ?, ?, ?)',
          [bet.user_id, 'bet_won', actualWinnings, balanceBefore, balanceBefore + actualWinnings, `Won bet on ${event.title}`]
        );
        await createNotification(bet.user_id, '🎉 You Won!', `Congratulations! You won $${actualWinnings.toFixed(2)} on "${event.title}"!`, 'bet');
      } else {
        betStatus = 'lost';
        await createNotification(bet.user_id, 'Bet Lost', `Your bet on "${event.title}" was lost.`, 'bet');
      }

      await conn.query(
        'UPDATE bets SET status = ?, actual_winnings = ?, settled_at = NOW() WHERE id = ?',
        [betStatus, actualWinnings, bet.id]
      );
    }

    await conn.commit();
    res.json({ success: true, message: `Event result set. ${bets.length} bets settled.` });
  } catch (error) {
    await conn.rollback();
    console.error('Set result error:', error);
    res.status(500).json({ success: false, message: 'Failed to set event result' });
  } finally {
    conn.release();
  }
};

// DELETE /api/admin/events/:id
const deleteEvent = async (req, res) => {
  try {
    await pool.query('DELETE FROM events WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete event' });
  }
};

// GET /api/admin/bets
const getAllBets = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT b.*, u.username, e.title as event_title FROM bets b JOIN users u ON u.id = b.user_id JOIN events e ON e.id = b.event_id WHERE 1=1`;
    const params = [];
    if (status) { query += ' AND b.status = ?'; params.push(status); }
    query += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [bets] = await pool.query(query, params);
    res.json({ success: true, bets });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch bets' });
  }
};

// POST /api/admin/promo-codes
const createPromoCode = async (req, res) => {
  try {
    const { code, discount_type, discount_value, min_deposit, max_uses, expires_at } = req.body;

    await pool.query(
      'INSERT INTO promo_codes (code, discount_type, discount_value, min_deposit, max_uses, expires_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [code.toUpperCase(), discount_type, discount_value, min_deposit || 0, max_uses || null, expires_at || null, req.admin.id]
    );

    res.status(201).json({ success: true, message: 'Promo code created' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Promo code already exists' });
    res.status(500).json({ success: false, message: 'Failed to create promo code' });
  }
};

// GET /api/admin/promo-codes
const getPromoCodes = async (req, res) => {
  try {
    const [codes] = await pool.query('SELECT * FROM promo_codes ORDER BY created_at DESC');
    res.json({ success: true, codes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch promo codes' });
  }
};

// ── ADMIN REVENUE WITHDRAWAL ─────────────────────────────────────────────────
const ADMIN_RECEIVING_NUMBER = '+250784214441';

// GET /api/admin/revenue — get platform revenue stats
const getRevenue = async (req, res) => {
  try {
    // Total deposited by all users (approved)
    const [[deposited]] = await pool.query(
      "SELECT COALESCE(SUM(amount),0) as total FROM deposits WHERE status='approved'"
    );
    // Total paid out to winners
    const [[paidOut]] = await pool.query(
      "SELECT COALESCE(SUM(actual_winnings),0) as total FROM bets WHERE status='won'"
    );
    // Total refunded (cancelled bets + rejected withdrawals refunds)
    const [[refunded]] = await pool.query(
      "SELECT COALESCE(SUM(actual_winnings),0) as total FROM bets WHERE status='cancelled'"
    );
    // Total withdrawn by users (approved)
    const [[withdrawn]] = await pool.query(
      "SELECT COALESCE(SUM(amount),0) as total FROM withdrawals WHERE status='approved'"
    );
    // Total admin withdrawals
    const [[adminWithdrawn]] = await pool.query(
      "SELECT COALESCE(SUM(amount),0) as total FROM admin_withdrawals WHERE status='completed'"
    );
    // Pending admin withdrawals
    const [[adminPending]] = await pool.query(
      "SELECT COALESCE(SUM(amount),0) as total, COUNT(*) as count FROM admin_withdrawals WHERE status='pending'"
    );

    const grossRevenue = parseFloat(deposited.total) - parseFloat(paidOut.total) - parseFloat(refunded.total) - parseFloat(withdrawn.total);
    const netRevenue = grossRevenue - parseFloat(adminWithdrawn.total);

    res.json({
      success: true,
      revenue: {
        total_deposited: parseFloat(deposited.total),
        total_paid_out: parseFloat(paidOut.total),
        total_refunded: parseFloat(refunded.total),
        total_user_withdrawals: parseFloat(withdrawn.total),
        gross_revenue: Math.max(0, grossRevenue),
        admin_withdrawn: parseFloat(adminWithdrawn.total),
        admin_pending: parseFloat(adminPending.total),
        admin_pending_count: parseInt(adminPending.count),
        available_to_withdraw: Math.max(0, netRevenue),
        receiving_number: ADMIN_RECEIVING_NUMBER,
      },
    });
  } catch (error) {
    console.error('Revenue error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch revenue' });
  }
};

// POST /api/admin/revenue/withdraw — admin requests a revenue withdrawal
const withdrawRevenue = async (req, res) => {
  try {
    const { amount, note } = req.body;
    const rwfAmount = Math.round(parseFloat(amount));

    if (!rwfAmount || rwfAmount < 1000) {
      return res.status(400).json({ success: false, message: 'Minimum withdrawal is RF 1,000' });
    }

    // Calculate available revenue
    const [[deposited]] = await pool.query("SELECT COALESCE(SUM(amount),0) as total FROM deposits WHERE status='approved'");
    const [[paidOut]] = await pool.query("SELECT COALESCE(SUM(actual_winnings),0) as total FROM bets WHERE status='won'");
    const [[refunded]] = await pool.query("SELECT COALESCE(SUM(actual_winnings),0) as total FROM bets WHERE status='cancelled'");
    const [[withdrawn]] = await pool.query("SELECT COALESCE(SUM(amount),0) as total FROM withdrawals WHERE status='approved'");
    const [[adminWithdrawn]] = await pool.query("SELECT COALESCE(SUM(amount),0) as total FROM admin_withdrawals WHERE status IN ('completed','pending')");

    const available = parseFloat(deposited.total) - parseFloat(paidOut.total) - parseFloat(refunded.total) - parseFloat(withdrawn.total) - parseFloat(adminWithdrawn.total);

    if (rwfAmount > available) {
      return res.status(400).json({
        success: false,
        message: `Insufficient revenue. Available: RF ${Math.max(0, Math.floor(available)).toLocaleString()}`,
      });
    }

    const { v4: uuidv4 } = require('uuid');
    const reference = 'ADM-' + uuidv4().substring(0, 8).toUpperCase();

    await pool.query(
      'INSERT INTO admin_withdrawals (admin_id, amount, receiving_number, reference, note, status) VALUES (?, ?, ?, ?, ?, ?)',
      [req.admin.id, rwfAmount, ADMIN_RECEIVING_NUMBER, reference, note || null, 'completed']
    );

    res.status(201).json({
      success: true,
      message: `RF ${rwfAmount.toLocaleString()} revenue withdrawal recorded. Send to ${ADMIN_RECEIVING_NUMBER}`,
      withdrawal: {
        reference,
        amount: rwfAmount,
        receiving_number: ADMIN_RECEIVING_NUMBER,
        status: 'completed',
      },
    });
  } catch (error) {
    console.error('Admin revenue withdrawal error:', error);
    res.status(500).json({ success: false, message: 'Failed to process withdrawal' });
  }
};

// GET /api/admin/revenue/history — admin withdrawal history
const getRevenueHistory = async (req, res) => {
  try {
    const [history] = await pool.query(
      `SELECT aw.*, a.full_name as admin_name, a.email as admin_email
       FROM admin_withdrawals aw
       JOIN admins a ON a.id = aw.admin_id
       ORDER BY aw.created_at DESC
       LIMIT 100`
    );
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch history' });
  }
};

module.exports = {
  getDashboard, getUsers, toggleUserStatus, deleteUser,
  getDeposits, approveDeposit, rejectDeposit,
  getWithdrawals, approveWithdrawal, rejectWithdrawal,
  createEvent, updateEvent, setEventResult, deleteEvent,
  getAllBets, createPromoCode, getPromoCodes,
  getRevenue, withdrawRevenue, getRevenueHistory,
};
