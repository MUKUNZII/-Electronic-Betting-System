const { pool } = require('../config/database');
const { createNotification } = require('../services/notificationService');

// POST /api/betslip — place single or accumulator bet
const placeBetSlip = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { legs, stake } = req.body;
    // legs = [{ event_id, selection }]

    if (!legs || legs.length === 0) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'No selections provided' });
    }
    if (legs.length > 20) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Maximum 20 selections per bet slip' });
    }

    const parsedStake = parseFloat(stake);
    if (parsedStake < 100) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Minimum stake is RF 100' });
    }

    // Validate all events and get odds
    const resolvedLegs = [];
    for (const leg of legs) {
      const [events] = await conn.query(
        "SELECT * FROM events WHERE id = ? AND status IN ('upcoming','live')",
        [leg.event_id]
      );
      if (!events.length) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: `Event ${leg.event_id} is not available for betting` });
      }
      const event = events[0];
      let odds;
      if (leg.selection === 'team_a') odds = parseFloat(event.odds_a);
      else if (leg.selection === 'team_b') odds = parseFloat(event.odds_b);
      else if (leg.selection === 'draw' && event.odds_draw) odds = parseFloat(event.odds_draw);
      else if (leg.selection === '1x' && event.odds_1x) odds = parseFloat(event.odds_1x);
      else if (leg.selection === 'x2' && event.odds_x2) odds = parseFloat(event.odds_x2);
      else if (leg.selection === '12' && event.odds_12) odds = parseFloat(event.odds_12);
      else {
        await conn.rollback();
        return res.status(400).json({ success: false, message: `Invalid selection "${leg.selection}" for event: ${event.title}` });
      }
      resolvedLegs.push({ event, selection: leg.selection, odds });
    }

    // Check for duplicate events in same slip
    const eventIds = resolvedLegs.map(l => l.event.id);
    if (new Set(eventIds).size !== eventIds.length) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Cannot select the same event twice in one slip' });
    }

    // Calculate combined odds (multiply all)
    const totalOdds = resolvedLegs.reduce((acc, l) => acc * l.odds, 1);
    const potentialWinnings = parseFloat((parsedStake * totalOdds).toFixed(2));
    const slipType = resolvedLegs.length === 1 ? 'single' : 'accumulator';

    // Check wallet balance
    const [wallets] = await conn.query('SELECT balance FROM wallets WHERE user_id = ? FOR UPDATE', [req.user.id]);
    if (!wallets.length || parseFloat(wallets[0].balance) < parsedStake) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Insufficient balance. Please deposit funds.' });
    }

    const balanceBefore = parseFloat(wallets[0].balance);
    const balanceAfter = parseFloat((balanceBefore - parsedStake).toFixed(2));

    // Deduct stake
    await conn.query(
      'UPDATE wallets SET balance = balance - ?, total_losses = total_losses + ? WHERE user_id = ?',
      [parsedStake, parsedStake, req.user.id]
    );

    // Create bet slip
    const [slipResult] = await conn.query(
      `INSERT INTO bet_slips (user_id, slip_type, total_stake, total_odds, potential_winnings)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, slipType, parsedStake, totalOdds, potentialWinnings]
    );
    const slipId = slipResult.insertId;

    // Create legs
    for (const leg of resolvedLegs) {
      await conn.query(
        'INSERT INTO bet_slip_legs (slip_id, event_id, selection, odds) VALUES (?, ?, ?, ?)',
        [slipId, leg.event.id, leg.selection, leg.odds]
      );
    }

    // Record transaction
    await conn.query(
      'INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, 'bet_placed', parsedStake, balanceBefore, balanceAfter,
       slipType === 'accumulator'
         ? `Accumulator (${resolvedLegs.length} legs) @ ${totalOdds.toFixed(2)}x`
         : `Single bet on ${resolvedLegs[0].event.title}`]
    );

    await conn.commit();

    const legSummary = resolvedLegs.map(l => `${l.event.title} → ${l.selection.replace('_', ' ')} @ ${l.odds}x`).join('\n');
    await createNotification(
      req.user.id,
      slipType === 'accumulator' ? `🎯 Accumulator Placed (${resolvedLegs.length} legs)` : '🎯 Bet Placed',
      `Stake: RF ${parsedStake.toLocaleString()} | Odds: ${totalOdds.toFixed(2)}x | Potential win: RF ${potentialWinnings.toLocaleString()}`,
      'bet'
    );

    res.status(201).json({
      success: true,
      message: slipType === 'accumulator'
        ? `Accumulator placed! ${resolvedLegs.length} selections @ ${totalOdds.toFixed(2)}x`
        : 'Bet placed successfully!',
      slip: {
        id: slipId,
        type: slipType,
        legs: resolvedLegs.length,
        stake: parsedStake,
        total_odds: totalOdds,
        potential_winnings: potentialWinnings,
      },
    });
  } catch (error) {
    await conn.rollback();
    console.error('Bet slip error:', error);
    res.status(500).json({ success: false, message: 'Failed to place bet' });
  } finally {
    conn.release();
  }
};

// GET /api/betslip — get user's bet slips
const getBetSlips = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM bet_slips WHERE user_id = ?';
    const params = [req.user.id];
    if (status) { query += ' AND status = ?'; params.push(status); }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [slips] = await pool.query(query, params);

    // Fetch legs for each slip
    for (const slip of slips) {
      const [legs] = await pool.query(
        `SELECT l.*, e.title as event_title, e.team_a, e.team_b, e.team_a_logo, e.team_b_logo,
                e.score_a, e.score_b, e.elapsed, e.status as event_status, e.league
         FROM bet_slip_legs l
         JOIN events e ON e.id = l.event_id
         WHERE l.slip_id = ?`,
        [slip.id]
      );
      slip.legs = legs;
    }

    const [total] = await pool.query(
      'SELECT COUNT(*) as count FROM bet_slips WHERE user_id = ?' + (status ? ' AND status = ?' : ''),
      status ? [req.user.id, status] : [req.user.id]
    );

    res.json({ success: true, slips, total: total[0].count });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch bet slips' });
  }
};

// GET /api/betslip/stats
const getBetSlipStats = async (req, res) => {
  try {
    const [stats] = await pool.query(
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN status='won' THEN 1 ELSE 0 END) as won,
         SUM(CASE WHEN status='lost' THEN 1 ELSE 0 END) as lost,
         SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) as pending,
         SUM(total_stake) as total_staked,
         SUM(actual_winnings) as total_won,
         SUM(CASE WHEN slip_type='accumulator' THEN 1 ELSE 0 END) as accumulators
       FROM bet_slips WHERE user_id = ?`,
      [req.user.id]
    );
    res.json({ success: true, stats: stats[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};

// Settle a bet slip (called when event result is set)
const settleSlipsByEvent = async (eventId, result, conn) => {
  const [legs] = await conn.query(
    "SELECT l.*, s.user_id, s.total_stake, s.total_odds, s.potential_winnings FROM bet_slip_legs l JOIN bet_slips s ON s.id = l.slip_id WHERE l.event_id = ? AND l.status = 'pending'",
    [eventId]
  );

  for (const leg of legs) {
    let legStatus;
    if (result === 'cancelled') legStatus = 'cancelled';
    else if (leg.selection === result) legStatus = 'won';
    else legStatus = 'lost';

    await conn.query('UPDATE bet_slip_legs SET status = ?, settled_at = NOW() WHERE id = ?', [legStatus, leg.id]);

    // Check if all legs in this slip are settled
    const [allLegs] = await conn.query('SELECT status FROM bet_slip_legs WHERE slip_id = ?', [leg.slip_id]);
    const pending = allLegs.filter(l => l.status === 'pending').length;
    const lost = allLegs.filter(l => l.status === 'lost').length;
    const cancelled = allLegs.filter(l => l.status === 'cancelled').length;
    const won = allLegs.filter(l => l.status === 'won').length;

    if (pending === 0) {
      let slipStatus;
      if (lost > 0) slipStatus = 'lost';
      else if (cancelled === allLegs.length) slipStatus = 'cancelled';
      else if (won === allLegs.length) slipStatus = 'won';
      else slipStatus = 'partial';

      let actualWinnings = 0;
      if (slipStatus === 'won') {
        actualWinnings = parseFloat(leg.potential_winnings);
        const [wallets] = await conn.query('SELECT balance FROM wallets WHERE user_id = ?', [leg.user_id]);
        const balanceBefore = parseFloat(wallets[0].balance);
        await conn.query(
          'UPDATE wallets SET balance = balance + ?, total_winnings = total_winnings + ?, total_losses = total_losses - ? WHERE user_id = ?',
          [actualWinnings, actualWinnings, leg.total_stake, leg.user_id]
        );
        await conn.query(
          'INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description) VALUES (?, ?, ?, ?, ?, ?)',
          [leg.user_id, 'bet_won', actualWinnings, balanceBefore, balanceBefore + actualWinnings,
           `Accumulator won @ ${parseFloat(leg.total_odds).toFixed(2)}x`]
        );
        await createNotification(leg.user_id, '🎉 Accumulator Won!',
          `Your accumulator won RF ${actualWinnings.toLocaleString()}!`, 'bet');
      } else if (slipStatus === 'cancelled') {
        // Refund stake
        actualWinnings = parseFloat(leg.total_stake);
        await conn.query('UPDATE wallets SET balance = balance + ?, total_losses = total_losses - ? WHERE user_id = ?',
          [actualWinnings, actualWinnings, leg.user_id]);
        await createNotification(leg.user_id, 'Bet Refunded', `Your bet stake of RF ${parseFloat(leg.total_stake).toLocaleString()} was refunded.`, 'bet');
      } else {
        await createNotification(leg.user_id, 'Bet Lost', `Your ${allLegs.length > 1 ? 'accumulator' : 'bet'} was lost.`, 'bet');
      }

      await conn.query(
        'UPDATE bet_slips SET status = ?, actual_winnings = ?, settled_at = NOW() WHERE id = ?',
        [slipStatus, actualWinnings, leg.slip_id]
      );
    }
  }
};

module.exports = { placeBetSlip, getBetSlips, getBetSlipStats, settleSlipsByEvent };
