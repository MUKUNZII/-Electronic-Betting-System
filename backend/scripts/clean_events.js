require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const c = await mysql.createConnection({
    host: '127.0.0.1', port: 3306, user: 'root', password: '', database: 'betting_system'
  });

  // Remove old-format demo events
  const oldIds = ['demo-1','demo-2','demo-3','demo-4','demo-5','demo-6',
                  'demo-7','demo-8','demo-9','demo-10','demo-11','demo-12','demo-13','demo-14'];
  const placeholders = oldIds.map(() => '?').join(',');
  const [r1] = await c.query(`DELETE FROM events WHERE external_id IN (${placeholders})`, oldIds);
  console.log('Removed old demo events:', r1.affectedRows);

  // Remove events with no external_id (manually created test events)
  const [r2] = await c.query('DELETE FROM events WHERE external_id IS NULL AND created_by IS NULL');
  console.log('Removed null external_id events:', r2.affectedRows);

  const [[count]] = await c.query('SELECT COUNT(*) as c FROM events');
  console.log('Events remaining:', count.c);

  const [[live]] = await c.query("SELECT COUNT(*) as c FROM events WHERE status='live'");
  const [[upcoming]] = await c.query("SELECT COUNT(*) as c FROM events WHERE status='upcoming'");
  console.log('Live:', live.c, '| Upcoming:', upcoming.c);

  await c.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
