require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const c = await mysql.createConnection({
    host: '127.0.0.1', port: 3306, user: 'root', password: '', database: 'betting_system'
  });

  // Add double_chance odds columns to events
  const alters = [
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS odds_1x DECIMAL(8,2) DEFAULT NULL AFTER odds_draw`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS odds_x2 DECIMAL(8,2) DEFAULT NULL AFTER odds_1x`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS odds_12 DECIMAL(8,2) DEFAULT NULL AFTER odds_x2`,
    `CREATE TABLE IF NOT EXISTS booking_codes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(10) UNIQUE NOT NULL,
      user_id INT DEFAULT NULL,
      legs JSON NOT NULL,
      total_odds DECIMAL(10,4) NOT NULL,
      leg_count INT NOT NULL DEFAULT 1,
      expires_at TIMESTAMP NOT NULL,
      used_at TIMESTAMP NULL DEFAULT NULL,
      used_by INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  ];

  for (const sql of alters) {
    try {
      await c.query(sql);
      console.log('✅', sql.substring(0, 70));
    } catch (e) {
      if (e.message.includes('Duplicate') || e.code === 'ER_DUP_FIELDNAME') {
        console.log('⏭  Already exists');
      } else {
        console.log('⚠️ ', e.message.substring(0, 80));
      }
    }
  }

  // Compute double chance odds for existing events (1X, X2, 12)
  // 1X = 1/(1/odds_a + 1/odds_draw), X2 = 1/(1/odds_draw + 1/odds_b), 12 = 1/(1/odds_a + 1/odds_b)
  const [events] = await c.query('SELECT id, odds_a, odds_b, odds_draw FROM events WHERE odds_draw IS NOT NULL');
  for (const ev of events) {
    const a = parseFloat(ev.odds_a), b = parseFloat(ev.odds_b), d = parseFloat(ev.odds_draw);
    const odds_1x = (1 / (1/a + 1/d)).toFixed(2);
    const odds_x2 = (1 / (1/d + 1/b)).toFixed(2);
    const odds_12 = (1 / (1/a + 1/b)).toFixed(2);
    await c.query('UPDATE events SET odds_1x=?, odds_x2=?, odds_12=? WHERE id=?', [odds_1x, odds_x2, odds_12, ev.id]);
  }
  console.log(`✅ Double chance odds computed for ${events.length} events`);

  await c.end();
  console.log('✅ Done!');
}

run().catch(e => { console.error(e.message); process.exit(1); });
