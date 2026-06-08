# 🎰 Electronic Betting System

A full-stack web application for online sports betting with user authentication, wallet management, event betting, and a complete admin panel.

---

## 🛠 Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React.js 18, React Router v6, Chart.js |
| Backend    | Node.js, Express.js                 |
| Database   | MySQL 8+                            |
| Auth       | T + bcryptjs                      |
| Email      | Nodemailer (SMTP)                   |
| Styling    | Custom CSS (dark/light mode)        |

---

## 📁 Project Structure

```
betting/
├── backend/
│   ├── config/
│   │   ├── database.js          # MySQL connection pool
│   │   └── migrate.js           # Auto-migration script
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── adminController.js
│   │   ├── betController.js
│   │   ├── eventController.js
│   │   ├── notificationController.js
│   │   ├── userController.js
│   │   └── walletController.js
│   ├── middleware/
│   │   ├── auth.js              # JWT middleware
│   │   ├── rateLimiter.js
│   │   ├── upload.js            # Multer file upload
│   │   └── validate.js          # express-validator
│   ├── routes/
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── bets.js
│   │   ├── events.js
│   │   ├── notifications.js
│   │   ├── users.js
│   │   └── wallet.js
│   ├── services/
│   │   ├── emailService.js
│   │   └── notificationService.js
│   ├── uploads/                 # Profile photos (auto-created)
│   ├── .env                     # Environment variables
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       │   └── layout/
│       │       ├── AdminLayout.js
│       │       ├── AdminSidebar.js
│       │       └── Navbar.js
│       ├── context/
│       │   ├── AuthContext.js
│       │   └── ThemeContext.js
│       ├── pages/
│       │   ├── admin/
│       │   │   ├── AdminBets.js
│       │   │   ├── AdminDashboard.js
│       │   │   ├── AdminDeposits.js
│       │   │   ├── AdminEvents.js
│       │   │   ├── AdminLoginPage.js
│       │   │   ├── AdminPromoCodes.js
│       │   │   └── AdminWithdrawals.js
│       │   ├── BetHistoryPage.js
│       │   ├── BettingPage.js
│       │   ├── DashboardPage.js
│       │   ├── DepositPage.js
│       │   ├── ForgotPasswordPage.js
│       │   ├── LandingPage.js
│       │   ├── LeaderboardPage.js
│       │   ├── LoginPage.js
│       │   ├── NotificationsPage.js
│       │   ├── ProfilePage.js
│       │   ├── RegisterPage.js
│       │   ├── ResetPasswordPage.js
│       │   ├── VerifyEmailPage.js
│       │   └── WithdrawPage.js
│       ├── services/
│       │   └── api.js
│       ├── App.js
│       ├── index.css
│       └── index.js
│
└── database/
    └── schema.sql               # Full MySQL schema + seed data
```

---

## ⚡ Quick Start (Step-by-Step)

### Prerequisites

Make sure you have these installed:
- **Node.js** v18+ → https://nodejs.org
- **MySQL** 8+ → https://dev.mysql.com/downloads/
- **Git** (optional)

---

### Step 1 — Set Up MySQL Database

Open MySQL Workbench or your MySQL client and run:

```sql
CREATE DATABASE betting_system;
```

Or run the full schema file:

```bash
mysql -u root -p < database/schema.sql
```

This creates all tables and inserts a default admin account.

---

### Step 2 — Configure Backend

```bash
cd backend
```

Open `.env` and update these values:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD   ← change this
DB_NAME=betting_system

JWT_SECRET=any_long_random_string_here

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_gmail_app_password  ← see note below

FRONTEND_URL=http://localhost:3000
```

> **Gmail App Password:** Go to Google Account → Security → 2-Step Verification → App Passwords → Generate one for "Mail".

---

### Step 3 — Run Database Migration

```bash
cd backend
npm run migrate
```

This creates all tables automatically and seeds the default admin.

---

### Step 4 — Start the Backend

```bash
cd backend
npm run dev
```

Backend runs at: **http://localhost:5000**

You should see:
```
✅ MySQL Database connected successfully
🚀 Server running on http://localhost:5000
```

---

### Step 5 — Start the Frontend

Open a **new terminal window**:

```bash
cd frontend
npm start
```

Frontend runs at: **http://localhost:3000**

---

## 🌐 Open in Browser

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Landing page |
| http://localhost:3000/register | User registration |
| http://localhost:3000/login | User login |
| http://localhost:3000/dashboard | User dashboard |
| http://localhost:3000/betting | Place bets |
| http://localhost:3000/deposit | Deposit funds |
| http://localhost:3000/withdraw | Withdraw funds |
| http://localhost:3000/bet-history | Bet history |
| http://localhost:3000/leaderboard | Top winners |
| http://localhost:3000/admin/login | **Admin login** |
| http://localhost:3000/admin/dashboard | Admin dashboard |

---

## 🔐 Default Admin Credentials

```
Email:    admin@bettingsystem.com
Password: Admin@123
```

> Change this immediately after first login via the database.

---

## 🔑 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/admin/login` | Admin login |
| GET  | `/api/auth/verify-email?token=` | Verify email |
| POST | `/api/auth/forgot-password` | Request reset link |
| POST | `/api/auth/reset-password` | Reset password |
| GET  | `/api/auth/me` | Get current user |

### Wallet
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/wallet` | Get wallet balance |
| POST | `/api/wallet/deposit` | Request deposit |
| POST | `/api/wallet/withdraw` | Request withdrawal |
| GET  | `/api/wallet/transactions` | Transaction history |
| GET  | `/api/wallet/deposits` | Deposit history |
| GET  | `/api/wallet/withdrawals` | Withdrawal history |

### Bets
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bets` | Place a bet |
| GET  | `/api/bets` | Get user bets |
| GET  | `/api/bets/stats` | Bet statistics |
| GET  | `/api/bets/:id` | Get single bet |

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | List events (filter by category/status) |
| GET | `/api/events/live` | Live events |
| GET | `/api/events/:id` | Single event |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/admin/dashboard` | Dashboard stats |
| GET  | `/api/admin/users` | All users |
| PUT  | `/api/admin/users/:id/toggle-status` | Suspend/activate |
| GET  | `/api/admin/deposits` | All deposits |
| PUT  | `/api/admin/deposits/:id/approve` | Approve deposit |
| PUT  | `/api/admin/deposits/:id/reject` | Reject deposit |
| GET  | `/api/admin/withdrawals` | All withdrawals |
| PUT  | `/api/admin/withdrawals/:id/approve` | Approve withdrawal |
| PUT  | `/api/admin/withdrawals/:id/reject` | Reject + refund |
| POST | `/api/admin/events` | Create event |
| PUT  | `/api/admin/events/:id` | Update event |
| PUT  | `/api/admin/events/:id/result` | Set result + settle bets |
| GET  | `/api/admin/bets` | All bets |
| POST | `/api/admin/promo-codes` | Create promo code |

---

## ✨ Features

### User Features
- ✅ Register / Login / Logout
- ✅ Email verification
- ✅ Forgot / Reset password via email
- ✅ Dashboard with wallet stats and charts
- ✅ Deposit funds (bank transfer, card, crypto, mobile money)
- ✅ Withdraw funds with account details
- ✅ Browse and search betting events by sport
- ✅ Place bets with real-time odds
- ✅ Bet history with win/loss tracking
- ✅ In-app notifications
- ✅ Profile management + photo upload
- ✅ Referral bonus system
- ✅ Promo code support on deposits
- ✅ Leaderboard
- ✅ Dark / Light mode toggle

### Admin Features
- ✅ Separate admin login portal
- ✅ Dashboard with revenue charts
- ✅ Manage users (suspend/activate/delete)
- ✅ Approve/reject deposits
- ✅ Approve/reject withdrawals (auto-refund on reject)
- ✅ Create/edit/delete betting events
- ✅ Set event results → auto-settle all bets
- ✅ View all bets
- ✅ Create promo codes

### Security
- ✅ bcrypt password hashing (12 rounds)
- ✅ JWT authentication
- ✅ Rate limiting on auth routes
- ✅ Helmet.js security headers
- ✅ CORS protection
- ✅ Input validation (express-validator)
- ✅ SQL injection prevention (parameterized queries)
- ✅ Role-based access control

---

## 🚀 Deployment

### Backend → Render / Railway

1. Push backend folder to GitHub
2. Create new Web Service on Render
3. Set environment variables from `.env`
4. Build command: `npm install`
5. Start command: `npm start`

### Frontend → Vercel / Netlify

1. Create `.env.production` in frontend:
   ```
   REACT_APP_API_URL=https://your-backend.onrender.com/api
   ```
2. Build: `npm run build`
3. Deploy `build/` folder to Vercel or Netlify

### Database → PlanetScale / Railway MySQL

1. Create MySQL database on PlanetScale or Railway
2. Import `database/schema.sql`
3. Update `DB_*` variables in backend `.env`

---

## 🐛 Troubleshooting

**"Database connection failed"**
- Check MySQL is running: `net start mysql` (Windows) or `sudo service mysql start` (Linux)
- Verify DB_PASSWORD in `.env` matches your MySQL root password

**"Cannot GET /api/..."**
- Make sure backend is running on port 5000
- Check `npm run dev` output for errors

**Frontend shows blank page**
- Run `npm install` in the frontend folder
- Check browser console for errors

**Emails not sending**
- Email is non-blocking — the app works without it
- To enable: set correct SMTP credentials in `.env`
- For Gmail: use an App Password, not your regular password

---

## 📄 License

MIT License — free to use and modify.

---

*Built with ❤️ — Electronic Betting System v1.0*
