require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const c = await mysql.createConnection({
    host: '127.0.0.1', port: 3306, user: 'root', password: '', database: 'betting_system'
  });

  // Add external_id to events for deduplication
  const alters = [
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS external_id VARCHAR(100) DEFAULT NULL AFTER id`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS league VARCHAR(100) DEFAULT NULL AFTER category`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS league_logo VARCHAR(255) DEFAULT NULL AFTER league`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS team_a_logo VARCHAR(255) DEFAULT NULL AFTER team_a`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS team_b_logo VARCHAR(255) DEFAULT NULL AFTER team_b`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS score_a INT DEFAULT NULL AFTER odds_draw`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS score_b INT DEFAULT NULL AFTER score_a`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS elapsed INT DEFAULT NULL AFTER score_b`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS venue VARCHAR(150) DEFAULT NULL AFTER elapsed`,
    `ALTER TABLE events ADD UNIQUE INDEX IF NOT EXISTS idx_external_id (external_id)`,

    // Accumulator bets table
    `CREATE TABLE IF NOT EXISTS bet_slips (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      slip_type ENUM('single','accumulator') DEFAULT 'single',
      total_stake DECIMAL(15,2) NOT NULL,
      total_odds DECIMAL(10,4) NOT NULL,
      potential_winnings DECIMAL(15,2) NOT NULL,
      actual_winnings DECIMAL(15,2) DEFAULT 0.00,
      status ENUM('pending','won','lost','partial','cancelled') DEFAULT 'pending',
      settled_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // Individual legs of an accumulator
    `CREATE TABLE IF NOT EXISTS bet_slip_legs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slip_id INT NOT NULL,
      event_id INT NOT NULL,
      selection VARCHAR(50) NOT NULL,
      odds DECIMAL(8,4) NOT NULL,
      status ENUM('pending','won','lost','cancelled') DEFAULT 'pending',
      settled_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (slip_id) REFERENCES bet_slips(id) ON DELETE CASCADE,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  ];

  for (const sql of alters) {
    try {
      await c.query(sql);
      console.log('✅', sql.substring(0, 70));
    } catch (e) {
      if (e.code === 'ER_DUP_KEYNAME' || e.message.includes('Duplicate')) {
        console.log('⏭  Already exists:', sql.substring(0, 50));
      } else {
        console.log('⚠️ ', e.message.substring(0, 80));
      }
    }
  }

  await c.end();
  console.log('\n✅ All done!');
}

run().catch(e => { console.error(e.message); process.exit(1); });
