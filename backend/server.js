const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { generalLimiter } = require('./middleware/rateLimiter');

const app = express();

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const allowedOrigins = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, mobile apps, curl)
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    if (allowed) return callback(null, true);
    console.warn('CORS blocked:', origin);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', generalLimiter);

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/bets', require('./routes/bets'));
app.use('/api/betslip', require('./routes/betslip'));
app.use('/api/booking', require('./routes/booking'));
app.use('/api/events', require('./routes/events'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Electronic Betting System API is running', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await testConnection();

  // ── Sports data sync ──────────────────────────────────────────────────────
  const cron = require('node-cron');
  const { fetchAndSyncFixtures, updateLiveScores } = require('./services/sportsDataService');

  // Sync fixtures on startup
  fetchAndSyncFixtures().catch(console.error);

  // Sync new fixtures every 6 hours
  cron.schedule('0 */6 * * *', () => {
    console.log('⏰ Cron: syncing fixtures...');
    fetchAndSyncFixtures().catch(console.error);
  });

  // Update live scores every 60 seconds
  cron.schedule('* * * * *', () => {
    updateLiveScores().catch(console.error);
  });

  // ─────────────────────────────────────────────────────────────────────────

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`⚽ Sports sync: ${process.env.RAPIDAPI_KEY ? 'LIVE (API-Football)' : 'DEMO mode'}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use.`);
      console.error(`   Run this to fix it:  npx kill-port ${PORT}`);
      console.error(`   Or close the other terminal running the backend.`);
      process.exit(1);
    } else {
      throw err;
    }
  });
};

startServer();
