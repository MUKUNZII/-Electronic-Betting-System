require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const c = await mysql.createConnection({
    host: '127.0.0.1', port: 3306, user: 'root', password: '', database: 'betting_system'
  });

  await c.query(`
    CREATE TABLE IF NOT EXISTS admin_withdrawals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      admin_id INT NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      receiving_number VARCHAR(30) NOT NULL DEFAULT '+250784214441',
      reference VARCHAR(100) UNIQUE,
      note TEXT DEFAULT NULL,
      status ENUM('pending','completed','failed') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('✅ admin_withdrawals table created');
  await c.end();
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
