const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { createNotification } = require('../services/notificationService');

// ── All amounts stored in RWF (Rwandan Franc) ────────────────────────────────
// Receiving number for all deposits
const RECEIVING_NUMBER = '+250784214441';

// Exchange rates → RWF  (1 unit of currency = X RWF)
const RATES_TO_RWF = {
  RWF: 1,
  USD: 1320,
  EUR: 1430,
  GBP: 1670,
  KES: 10.20,   // Kenya
  TZS: 0.498,   // Tanzania
  UGX: 0.352,   // Uganda
  ETB: 23.37,   // Ethiopia
  BIF: 0.460,   // Burundi
  DJF: 7.43,    // Djibouti
  ERN: 88.0,    // Eritrea
  SOS: 2.31,    // Somalia
  SSP: 1.015,   // South Sudan
  MWK: 0.763,   // Malawi
  ZMW: 49.81,   // Zambia
  ZWL: 4.10,    // Zimbabwe
  MZN: 20.69,   // Mozambique
  MGA: 0.293,   // Madagascar
  MUR: 29.01,   // Mauritius
  SCR: 97.78,   // Seychelles
  KMF: 2.933,   // Comoros
  NGN: 0.835,   // Nigeria
  GHS: 84.62,   // Ghana
  XOF: 2.133,   // CFA (Senegal, Ivory Coast, Mali, Burkina, Benin, Togo, Niger, Guinea-Bissau)
  GNF: 0.1535,  // Guinea
  SLL: 0.0600,  // Sierra Leone
  LRD: 6.840,   // Liberia
  GMD: 19.56,   // Gambia
  CVE: 12.69,   // Cape Verde
  MRU: 33.17,   // Mauritania
};

const toRWF = (amount, currency) => {
  const rate = RATES_TO_RWF[currency] || RATES_TO_RWF['USD'];
  return Math.round(parseFloat(amount) * rate);
};

const MIN_DEPOSIT_RWF = 1000;   // RF 1,000 minimum deposit
const MIN_WITHDRAW_RWF = 2000;  // RF 2,000 minimum withdrawal

// GET /api/wallet
const getWallet = async (req, res) => {
  try {
    const [wallets] = await pool.query('SELECT * FROM wallets WHERE user_id = ?', [req.user.id]);
    if (!wallets.length) return res.status(404).json({ success: false, message: 'Wallet not found' });
    res.json({ success: true, wallet: wallets[0], currency: 'RWF', symbol: 'RF' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch wallet' });
  }
};

// POST /api/wallet/deposit
const requestDeposit = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const {
      local_amount,
      local_currency = 'RWF',
      sender_phone,
      payment_method = 'mobile_money',
      promo_code,
    } = req.body;

    if (!sender_phone) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Sender phone number is required' });
    }
    if (!local_amount || parseFloat(local_amount) <= 0) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Amount is required' });
    }

    // Convert to RWF
    const rwfAmount = toRWF(local_amount, local_currency);
    const exchangeRate = RATES_TO_RWF[local_currency] || RATES_TO_RWF['USD'];

    if (rwfAmount < MIN_DEPOSIT_RWF) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: `Minimum deposit is RF ${MIN_DEPOSIT_RWF.toLocaleString()}`,
      });
    }

    const reference = 'DEP-' + uuidv4().substring(0, 8).toUpperCase();

    // Check promo code
    let bonusRWF = 0;
    let promoCodeId = null;
    if (promo_code) {
      const [promos] = await conn.query(
        `SELECT * FROM promo_codes WHERE code = ? AND is_active = 1
         AND (expires_at IS NULL OR expires_at > NOW())
         AND (max_uses IS NULL OR used_count < max_uses)`,
        [promo_code]
      );
      if (promos.length) {
        const promo = promos[0];
        const minDepRWF = toRWF(promo.min_deposit, 'USD');
        if (rwfAmount >= minDepRWF) {
          promoCodeId = promo.id;
          bonusRWF = promo.discount_type === 'percentage'
            ? Math.round((rwfAmount * promo.discount_value) / 100)
            : toRWF(promo.discount_value, 'USD');
        }
      }
    }

    const totalCredit = rwfAmount + bonusRWF;

    // Get current balance
    const [wallets] = await conn.query('SELECT balance FROM wallets WHERE user_id = ? FOR UPDATE', [req.user.id]);
    const balanceBefore = parseFloat(wallets[0]?.balance || 0);
    const balanceAfter = balanceBefore + totalCredit;

    // Insert deposit record as APPROVED immediately
    const [result] = await conn.query(
      `INSERT INTO deposits
         (user_id, amount, payment_method, sender_phone,
          local_amount, local_currency, exchange_rate, rwf_amount,
          reference, status, processed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', NOW())`,
      [
        req.user.id, rwfAmount, payment_method,
        sender_phone,
        parseFloat(local_amount), local_currency, exchangeRate, rwfAmount,
        reference,
      ]
    );

    // Credit wallet immediately
    await conn.query(
      'UPDATE wallets SET balance = balance + ?, total_deposited = total_deposited + ? WHERE user_id = ?',
      [totalCredit, totalCredit, req.user.id]
    );

    // Record transaction
    await conn.query(
      `INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, reference, description)
       VALUES (?, 'deposit', ?, ?, ?, ?, ?)`,
      [
        req.user.id, totalCredit, balanceBefore, balanceAfter,
        reference,
        `Deposit confirmed: RF ${rwfAmount.toLocaleString()}${bonusRWF > 0 ? ` + RF ${bonusRWF.toLocaleString()} bonus` : ''}`,
      ]
    );

    if (promoCodeId) {
      await conn.query('UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?', [promoCodeId]);
      await conn.query(
        'INSERT INTO promo_code_usages (promo_code_id, user_id, deposit_id, bonus_amount) VALUES (?, ?, ?, ?)',
        [promoCodeId, req.user.id, result.insertId, bonusRWF]
      );
    }

    await conn.commit();

    await createNotification(
      req.user.id,
      '✅ Deposit Confirmed!',
      `RF ${rwfAmount.toLocaleString()} has been added to your wallet. New balance: RF ${balanceAfter.toLocaleString()}`,
      'deposit'
    );

    res.status(201).json({
      success: true,
      message: 'Deposit confirmed! Your wallet has been credited.',
      deposit: {
        id: result.insertId,
        reference,
        rwf_amount: rwfAmount,
        bonus_rwf: bonusRWF,
        total_credited: totalCredit,
        local_amount: parseFloat(local_amount),
        local_currency,
        new_balance: balanceAfter,
        status: 'approved',
      },
    });
  } catch (error) {
    await conn.rollback();
    console.error('Deposit error:', error);
    res.status(500).json({ success: false, message: 'Deposit failed. Please try again.' });
  } finally {
    conn.release();
  }
};
// POST /api/wallet/withdraw
const requestWithdrawal = async (req, res) => {
  try {
    const { amount, payment_method, account_details } = req.body;
    const rwfAmount = Math.round(parseFloat(amount));

    if (rwfAmount < MIN_WITHDRAW_RWF) {
      return res.status(400).json({ success: false, message: `Minimum withdrawal is RF ${MIN_WITHDRAW_RWF.toLocaleString()}` });
    }

    const [wallets] = await pool.query('SELECT balance FROM wallets WHERE user_id = ?', [req.user.id]);
    if (!wallets.length || parseFloat(wallets[0].balance) < rwfAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    const reference = 'WIT-' + uuidv4().substring(0, 8).toUpperCase();

    // Hold the amount immediately
    await pool.query('UPDATE wallets SET balance = balance - ? WHERE user_id = ?', [rwfAmount, req.user.id]);

    await pool.query(
      'INSERT INTO withdrawals (user_id, amount, payment_method, account_details, reference) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, rwfAmount, payment_method || 'mobile_money', JSON.stringify(account_details || {}), reference]
    );

    await createNotification(
      req.user.id,
      'Withdrawal Request Submitted',
      `Your withdrawal of RF ${rwfAmount.toLocaleString()} (Ref: ${reference}) is pending approval.`,
      'withdrawal'
    );

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted. Awaiting admin approval.',
      reference,
      rwf_amount: rwfAmount,
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ success: false, message: 'Withdrawal request failed' });
  }
};

// GET /api/wallet/transactions
const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM transactions WHERE user_id = ?';
    const params = [req.user.id];
    if (type) { query += ' AND type = ?'; params.push(type); }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    const [transactions] = await pool.query(query, params);
    const [total] = await pool.query(
      'SELECT COUNT(*) as count FROM transactions WHERE user_id = ?' + (type ? ' AND type = ?' : ''),
      type ? [req.user.id, type] : [req.user.id]
    );
    res.json({ success: true, transactions, total: total[0].count });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
};

// GET /api/wallet/deposits
const getDeposits = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM deposits WHERE user_id = ?';
    const params = [req.user.id];
    if (status) { query += ' AND status = ?'; params.push(status); }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    const [deposits] = await pool.query(query, params);
    res.json({ success: true, deposits });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch deposits' });
  }
};

// GET /api/wallet/withdrawals
const getWithdrawals = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM withdrawals WHERE user_id = ?';
    const params = [req.user.id];
    if (status) { query += ' AND status = ?'; params.push(status); }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    const [withdrawals] = await pool.query(query, params);
    res.json({ success: true, withdrawals });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch withdrawals' });
  }
};

// Export rates for use in other controllers
module.exports = {
  getWallet, requestDeposit, requestWithdrawal,
  getTransactions, getDeposits, getWithdrawals,
  RATES_TO_RWF, toRWF,
};
