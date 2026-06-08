const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'betting_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Test connection with retry logic
const testConnection = async (retries = 5, delay = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const connection = await pool.getConnection();
      console.log('✅ MySQL Database connected successfully');
      connection.release();
      return;
    } catch (error) {
      if (attempt === retries) {
        console.error('❌ Database connection failed after', retries, 'attempts:', error.message);
        console.error('');
        console.error('  Make sure XAMPP MySQL is running:');
        console.error('  1. Open XAMPP Control Panel');
        console.error('  2. Click START next to MySQL');
        console.error('  3. Wait for green light, then restart this server');
        console.error('');
        process.exit(1);
      }
      console.log(`⏳ MySQL not ready (attempt ${attempt}/${retries}), retrying in ${delay/1000}s...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
};

module.exports = { pool, testConnection };
