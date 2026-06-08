require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const c = await mysql.createConnection({
    host: '127.0.0.1', port: 3306, user: 'root', password: '', database: 'betting_system'
  });

  await c.query(`
    CREATE TABLE IF NOT EXISTS booking_codes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(10) UNIQUE NOT NULL,
      user_id INT DEFAULT NULL,
      legs TEXT NOT NULL,
      total_odds DECIMAL(10,4) NOT NULL,
      leg_count INT NOT NULL DEFAULT 1,
      expires_at TIMESTAMP NOT NULL,
      used_at TIMESTAMP NULL DEFAULT NULL,
      used_by INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('✅ booking_codes table created');
  await c.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
