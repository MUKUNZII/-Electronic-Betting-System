# Electronic Betting System: Design, Architecture, and Implementation

**A Technical Research Paper**

---

**Author:** MUKUNZI  
**Institution:** Independent Research  
**Date:** June 2026  
**Repository:** https://github.com/MUKUNZII/-Electronic-Betting-System  

---

## Abstract

This paper presents the design, architecture, and full-stack implementation of an **Electronic Betting System** — a web-based sports betting platform tailored for the East and West African market, with the Rwandan Franc (RWF) as the primary operating currency. The system enables users to register, deposit funds via mobile money services, browse live and upcoming sports events, place single and accumulator bets, withdraw winnings, and track their betting history in real time. The platform includes a comprehensive administration panel for managing users, events, financial transactions, and platform revenue. Built using **React.js**, **Node.js**, **Express.js**, and **MySQL**, the system follows modern REST API architecture with JWT-based authentication, bcrypt password hashing, and role-based access control. This paper discusses the motivation, system requirements, technical design decisions, database schema, security measures, and the challenges encountered during development.

---

## Table of Contents

1. Introduction
2. Problem Statement
3. Objectives
4. Literature Review
5. System Requirements
6. System Architecture
7. Database Design
8. Backend Implementation
9. Frontend Implementation
10. Security Implementation
11. Key Features
12. Currency and Payment System
13. Sports Data Integration
14. Testing and Results
15. Challenges and Solutions
16. Conclusion
17. References

---

## 1. Introduction

The rapid growth of mobile internet penetration across Sub-Saharan Africa has created a significant opportunity for digital financial services, including online sports betting. Rwanda, alongside its East African neighbors, has witnessed a surge in smartphone adoption and mobile money usage — particularly MTN Mobile Money (MoMo) and Airtel Money — making digital transactions accessible to millions who previously lacked access to traditional banking infrastructure.

Existing betting platforms in the region are often poorly localized: they display prices in USD or GBP, require credit cards that most users do not own, and provide little guidance on how mobile money payments work. This creates a gap between the technology and its potential users.

The **Electronic Betting System** described in this paper was designed to bridge that gap. It is a full-stack web application that:

- Operates natively in **Rwandan Franc (RWF)** with automatic conversion from 30+ African currencies
- Accepts deposits via **MTN MoMo and Airtel Money** with a simple 3-step flow
- Supports both **single bets and accumulator (combo) bets**
- Provides **real-time match scores** and odds for major football leagues and other sports
- Includes a complete **admin panel** for platform management
- Follows modern **security best practices** suitable for a financial application

The system was built using open-source technologies — React.js, Node.js, Express.js, and MySQL — making it deployable on affordable cloud infrastructure.

---

## 2. Problem Statement

Sports betting in Africa faces several technology and localization challenges:

1. **Currency mismatch** — most international platforms operate in USD or EUR, creating confusion and exchange rate friction for African bettors who earn and think in local currencies (KES, NGN, RWF, GHS, etc.).

2. **Payment barrier** — international platforms require credit/debit cards, which have low penetration in Africa. Mobile money, used by over 300 million Africans, is rarely supported seamlessly.

3. **Poor user experience** — existing platforms are often built for desktop-first Western audiences and are not optimized for African mobile users on slower connections.

4. **Lack of transparency** — users often do not understand how odds work, how their deposits are processed, or what happens when they win.

5. **Limited accumulator support** — many local platforms only support single bets, missing the popular "multi" or "combo" bet format where players combine multiple matches.

6. **Booking code feature gap** — the ability to create a bet selection code and share it with friends (popular on platforms like BetPawa) is not available on many local platforms.

This system addresses all six problems.

---

## 3. Objectives

### Primary Objectives
- Design and implement a secure, scalable full-stack web betting platform
- Support RWF as the primary currency with automatic conversion from 30+ African currencies
- Implement a frictionless mobile money deposit flow (MTN MoMo / Airtel Money)
- Build a real-time betting engine supporting single and accumulator bets
- Develop a complete administration panel for platform management

### Secondary Objectives
- Integrate real sports data from external APIs (football-data.org, API-Football)
- Implement booking codes for sharing bet selections
- Support Double Chance betting market (1X, X2, 12) in addition to standard 1X2
- Provide a leaderboard and referral system to encourage user engagement
- Build a revenue management module for the platform operator

---

## 4. Literature Review

### 4.1 Online Betting Platforms in Africa

According to the African Gaming Regulation and Policy Report (2024), the online betting market in Sub-Saharan Africa is valued at over $2.5 billion annually and growing at approximately 12% per year. Rwanda's National Lottery (RNL) and several private operators have been licensed, but most existing solutions are white-label products from European software vendors, poorly adapted to local market conditions.

Research by the GSMA (2023) shows that mobile money accounts outnumber bank accounts in 14 African countries, including Rwanda (MTN MoMo penetration: ~72% of adults). Any fintech solution targeting this market must prioritize mobile money integration over card payments.

### 4.2 Web Application Architecture for Financial Systems

Fielding (2000) introduced the REST architectural style, which has become the dominant pattern for financial web APIs due to its statelessness, scalability, and simplicity. JWT (JSON Web Tokens), as specified in RFC 7519, provides a stateless authentication mechanism well-suited for REST APIs.

The OWASP Top 10 (2023) identifies injection attacks, broken authentication, and insecure data exposure as the most critical risks for web applications. A financial system must address all three.

### 4.3 Sports Data APIs

Several providers offer sports data APIs with free tiers suitable for development:
- **football-data.org** — free tier covers 12 major leagues, 10 calls/minute
- **API-Football (RapidAPI)** — 100 free calls/day, comprehensive coverage
- **The Odds API** — 500 free calls/month, focuses on odds data

### 4.4 Accumulator Betting

Accumulator bets (also called "multi" or "combo" bets) allow users to combine multiple match selections. The combined odds are the product of individual odds: `Total Odds = O₁ × O₂ × ... × Oₙ`. Research in behavioral economics (Thaler & Sunstein, 2008) shows that accumulators are disproportionately popular because they offer large potential payouts from small stakes, making them psychologically attractive despite their lower expected value.

---

## 5. System Requirements

### 5.1 Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-01 | Users can register with full name, username, email, phone, date of birth, and country (East/West Africa only) |
| FR-02 | Users can log in with email and password; JWT token issued on success |
| FR-03 | Email verification and password reset via email link |
| FR-04 | Users can deposit funds in their local currency via mobile money |
| FR-05 | Deposits are converted to RWF and credited to wallet instantly upon user confirmation |
| FR-06 | Users can browse sports events filtered by sport, league, and status (live/upcoming) |
| FR-07 | Users can place single bets and accumulator bets (up to 20 legs) |
| FR-08 | Users can place bets on 1X2 and Double Chance markets |
| FR-09 | Users can create and share booking codes |
| FR-10 | Users can withdraw funds; admin processes withdrawals within 24 hours |
| FR-11 | Admin can manage users, events, deposits, withdrawals, and view platform revenue |
| FR-12 | Admin can set event results; bets auto-settle and winnings auto-credit |
| FR-13 | Users receive in-app and email notifications for key events |
| FR-14 | Wallet balance displayed in navbar with show/hide toggle |

### 5.2 Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-01 | API response time < 200ms for standard queries |
| NFR-02 | Frontend initial load < 3 seconds on 4G connection |
| NFR-03 | Passwords stored as bcrypt hashes (cost factor 12) |
| NFR-04 | All financial operations use database transactions (ACID) |
| NFR-05 | Rate limiting on authentication endpoints (10 requests/15 min) |
| NFR-06 | CORS restricted to known frontend origins |
| NFR-07 | Input validation on all API endpoints |
| NFR-08 | SQL injection prevented via parameterized queries |

---

## 6. System Architecture

### 6.1 Overview

The system follows a **three-tier architecture**:

```
┌─────────────────────────────────────────────┐
│           PRESENTATION TIER                  │
│  React.js SPA (Vite) · http://localhost:3001 │
└──────────────────┬──────────────────────────┘
                   │ HTTP/REST API (JSON)
┌──────────────────▼──────────────────────────┐
│            APPLICATION TIER                  │
│  Node.js + Express.js · http://localhost:5000│
│  ┌──────────┐ ┌──────────┐ ┌─────────────┐ │
│  │  Routes  │ │Middleware│ │ Controllers │ │
│  └──────────┘ └──────────┘ └─────────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌─────────────┐ │
│  │ Services │ │   Auth   │ │  Scheduler  │ │
│  └──────────┘ └──────────┘ └─────────────┘ │
└──────────────────┬──────────────────────────┘
                   │ mysql2/promise
┌──────────────────▼──────────────────────────┐
│              DATA TIER                        │
│  MySQL 8 / MariaDB 10+ · Port 3306           │
│  13 tables · InnoDB engine · UTF8MB4         │
└─────────────────────────────────────────────┘
```

### 6.2 Backend Architecture

The backend follows the **MVC (Model-View-Controller)** pattern adapted for REST APIs:

- **Routes** — define API endpoints and apply middleware
- **Controllers** — handle request logic and responses
- **Services** — reusable business logic (email, notifications, sports data)
- **Middleware** — JWT auth, rate limiting, validation, file upload
- **Config** — database connection pool, migration scripts

### 6.3 Frontend Architecture

The React.js frontend uses:
- **React Router v6** — client-side routing with protected routes
- **Context API** — global state for authentication and theme
- **Axios** — HTTP client with request/response interceptors
- **Vite** — build tool replacing Create React App for faster builds
- **In-memory caching** — prevents redundant API calls on tab switches

### 6.4 API Design

All endpoints follow REST conventions:

```
Base URL: /api

Auth:          POST   /api/auth/register
               POST   /api/auth/login
               POST   /api/auth/admin/login
               GET    /api/auth/me

Wallet:        GET    /api/wallet
               POST   /api/wallet/deposit
               POST   /api/wallet/withdraw
               GET    /api/wallet/transactions

Events:        GET    /api/events
               GET    /api/events/live
               GET    /api/events/:id

Bet Slips:     POST   /api/betslip
               GET    /api/betslip
               GET    /api/betslip/stats

Booking:       POST   /api/booking
               GET    /api/booking/:code

Admin:         GET    /api/admin/dashboard
               GET    /api/admin/users
               GET    /api/admin/deposits
               PUT    /api/admin/deposits/:id/approve
               POST   /api/admin/events
               PUT    /api/admin/events/:id/result
               GET    /api/admin/revenue
               POST   /api/admin/revenue/withdraw
```

---

## 7. Database Design

### 7.1 Entity-Relationship Summary

The database contains **13 tables** organized around five core domains:

```
USERS DOMAIN          FINANCIAL DOMAIN       BETTING DOMAIN
─────────────         ────────────────       ───────────────
users                 wallets                events
admins                deposits               bets
email_verifications   withdrawals            bet_slips
password_resets       transactions           bet_slip_legs
                      booking_codes          
                      admin_withdrawals      

ENGAGEMENT DOMAIN
─────────────────
notifications
promo_codes
promo_code_usages
```

### 7.2 Key Design Decisions

**Monetary values stored in RWF integers** — All financial amounts are stored as `DECIMAL(15,2)` in Rwandan Francs to avoid floating-point precision errors. Local currency conversion is performed at the application layer, not in the database.

**Bet slip architecture** — A two-table design separates the slip header (`bet_slips`) from individual legs (`bet_slip_legs`), enabling clean accumulator settlement logic. Each leg settles independently; the slip settles only when all legs are resolved.

**Event external IDs** — The `external_id` column with a UNIQUE index allows the sports data sync service to upsert events idempotently without creating duplicates.

**Soft financial audit trail** — Every wallet balance change creates a corresponding row in the `transactions` table, storing `balance_before` and `balance_after`. This provides a complete audit trail for reconciliation.

### 7.3 Schema Excerpt (Core Tables)

```sql
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(100) NOT NULL,
  username      VARCHAR(50)  UNIQUE NOT NULL,
  email         VARCHAR(100) UNIQUE NOT NULL,
  password      VARCHAR(255) NOT NULL,       -- bcrypt hash
  referral_code VARCHAR(20)  UNIQUE,
  is_verified   TINYINT(1)   DEFAULT 0,
  is_active     TINYINT(1)   DEFAULT 1,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wallets (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNIQUE NOT NULL,
  balance         DECIMAL(15,2) DEFAULT 0.00,  -- RWF
  total_deposited DECIMAL(15,2) DEFAULT 0.00,
  total_winnings  DECIMAL(15,2) DEFAULT 0.00,
  total_losses    DECIMAL(15,2) DEFAULT 0.00,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE bet_slips (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  user_id            INT NOT NULL,
  slip_type          ENUM('single','accumulator') DEFAULT 'single',
  total_stake        DECIMAL(15,2) NOT NULL,
  total_odds         DECIMAL(10,4) NOT NULL,
  potential_winnings DECIMAL(15,2) NOT NULL,
  actual_winnings    DECIMAL(15,2) DEFAULT 0.00,
  status             ENUM('pending','won','lost','cancelled') DEFAULT 'pending',
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 8. Backend Implementation

### 8.1 Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 20.x |
| Framework | Express.js | 4.19 |
| Database driver | mysql2/promise | 3.9 |
| Authentication | jsonwebtoken | 9.0 |
| Password hashing | bcryptjs | 2.4 |
| Validation | express-validator | 7.1 |
| Email | nodemailer | 6.9 |
| File uploads | multer | 1.4 |
| Rate limiting | express-rate-limit | 7.3 |
| Security headers | helmet | 7.1 |
| Scheduling | node-cron | 3.0 |
| HTTP client | axios | 1.7 |

### 8.2 Authentication Flow

```
Client                    Server
  │                          │
  │─── POST /api/auth/login ─►│
  │    { email, password }    │
  │                           │── bcrypt.compare(password, hash)
  │                           │── jwt.sign({ id, email, role })
  │◄── { token, user } ──────│
  │                           │
  │─── GET /api/wallet ──────►│
  │    Authorization: Bearer  │── jwt.verify(token)
  │                           │── pool.query(SELECT user)
  │◄── { wallet } ───────────│
```

### 8.3 Accumulator Bet Settlement

When an admin sets an event result, the system automatically settles all pending bets:

```javascript
// Pseudocode for settlement logic
for each pending bet_slip_leg on this event:
  if result === 'cancelled':  leg.status = 'cancelled'
  elif leg.selection === result: leg.status = 'won'
  else: leg.status = 'lost'

  if all legs in this slip are now settled:
    if any leg is 'lost':     slip.status = 'lost'
    elif all legs 'cancelled': slip.status = 'cancelled' (refund)
    elif all legs 'won':      slip.status = 'won' (credit winnings)
    
    if slip.status === 'won':
      wallet.balance += slip.potential_winnings
      create transaction record
      send notification
```

### 8.4 Sports Data Sync

The system uses a **priority cascade** for sports data:

```
Priority 1: football-data.org (if FOOTBALL_DATA_KEY set)
    ↓ (if unavailable)
Priority 2: API-Football/RapidAPI (if RAPIDAPI_KEY set)
    ↓ (if unavailable)
Priority 3: The Odds API (if ODDS_API_KEY set)
    ↓ (if unavailable)
Priority 4: Built-in demo data (always works, no API key needed)
```

A `node-cron` scheduler runs two jobs:
- Every 6 hours: full fixture sync (upcoming matches, odds)
- Every 60 seconds: live score updates

---

## 9. Frontend Implementation

### 9.1 Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | React.js | 18.3 |
| Build tool | Vite | 5.3 |
| Routing | React Router | 6.23 |
| HTTP client | Axios | 1.7 |
| Charts | Chart.js + react-chartjs-2 | 4.4 |
| Icons | react-icons | 5.2 |
| Notifications | react-hot-toast | 2.4 |

### 9.2 Performance Optimizations

Several techniques were applied to minimize load time:

1. **In-memory event cache** — Events are cached in a module-level variable with a 60-second TTL. Switching between sport categories does not trigger new API calls.

2. **Memoization** — `useMemo` for derived data (league grouping, sport filtering), `useCallback` for event handlers, `memo()` for individual match rows to prevent unnecessary re-renders.

3. **Debounced search** — Search input waits 400ms after the last keystroke before triggering an API call.

4. **Skeleton loading** — Instead of a spinner, a CSS skeleton screen appears instantly while data loads, improving perceived performance.

5. **Lazy image loading** — Team logos use `loading="lazy"` with `onError` fallback to hide broken images.

6. **Parallel data fetching** — `Promise.all()` is used to fetch events and wallet balance simultaneously.

### 9.3 Betting Page Architecture

The betting page mirrors the BetPawa interface layout:

```
┌──────────────┬─────────────────────────────┬───────────────┐
│ LEFT SIDEBAR │      MAIN MATCH LIST         │   BET SLIP    │
│              │                              │               │
│ ⚽ Football  │ 🏆 Premier League           │ 🎯 Bet Slip  │
│  └ PL        │   Man United vs Arsenal      │               │
│  └ La Liga   │   [1:2.10] [X:3.40] [2:3.20]│  Man Utd 1    │
│  └ UCL       │                              │  2.10x        │
│              │   Real Madrid vs Bayern      │               │
│ 🏀 NBA       │   [1:1.75] [X:3.80] [2:4.00]│  PSG 1X       │
│ 🎾 Tennis   │                              │  1.30x        │
│ 🏏 Cricket  │ Market: [1X2] [Double Chance]│               │
│              │                              │ Combined: 2.73│
│              │                              │ Stake: RF     │
│              │                              │ [Place Bet]   │
└──────────────┴─────────────────────────────┴───────────────┘
```

---

## 10. Security Implementation

### 10.1 Authentication and Authorization

- **JWT tokens** — Signed with HS256 algorithm, 7-day expiry. The token payload contains `{ id, email, role }`. Admin tokens have `role: 'admin'`; user tokens have `role: 'user'`.
- **Token validation** — Every protected route calls the `authenticateToken` middleware which re-queries the database on each request to check if the user is still active. This enables instant account suspension.
- **Separate admin authentication** — Admin login is on a different endpoint (`/api/auth/admin/login`) querying the `admins` table, not the `users` table.

### 10.2 Password Security

```javascript
// Registration
const hashedPassword = await bcrypt.hash(plainPassword, 12);
// cost factor 12 = ~250ms per hash on modern hardware

// Login
const isMatch = await bcrypt.compare(plainPassword, storedHash);
```

### 10.3 SQL Injection Prevention

All database queries use **parameterized statements** via the `mysql2` driver:

```javascript
// SAFE — parameterized
const [users] = await pool.query(
  'SELECT * FROM users WHERE email = ?', 
  [req.body.email]  // never concatenated into SQL string
);

// NEVER done — string concatenation
// "SELECT * FROM users WHERE email = '" + email + "'"  ← vulnerable
```

### 10.4 Input Validation

Every API endpoint uses `express-validator` to validate and sanitize input before it reaches the controller:

```javascript
body('email').isEmail().normalizeEmail()
body('password').isLength({ min: 8 })
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
body('amount').isFloat({ min: 1 })
```

### 10.5 Rate Limiting

| Endpoint Group | Limit | Window |
|---------------|-------|--------|
| `/api/auth/login` | 10 requests | 15 minutes |
| `/api/auth/register` | 10 requests | 15 minutes |
| `/api/auth/forgot-password` | 5 requests | 1 hour |
| All other `/api/*` | 100 requests | 15 minutes |

### 10.6 Additional Security Headers (Helmet.js)

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=15552000
Cross-Origin-Resource-Policy: cross-origin
```

---

## 11. Key Features

### 11.1 Multi-Market Betting

The system supports two betting markets per event:

**1X2 (Match Result)**
- `1` — Home team wins
- `X` — Draw
- `2` — Away team wins

**Double Chance**
- `1X` — Home wins OR Draw (home team does not lose)
- `X2` — Draw OR Away wins (away team does not lose)
- `12` — Home OR Away wins (no draw)

Double Chance odds are derived from 1X2 odds:
```
odds_1X = 1 / (1/odds_1 + 1/odds_X)
odds_X2 = 1 / (1/odds_X + 1/odds_2)
odds_12 = 1 / (1/odds_1 + 1/odds_2)
```

### 11.2 Booking Codes

Users can save their bet selections as a 6-character alphanumeric code (e.g., `AW6AT9`) and share it:

1. User adds selections to bet slip
2. Clicks "Book Code" → code generated and stored in database (7-day expiry)
3. User shares code via chat/SMS
4. Friend enters code on betting page → selections load automatically
5. Friend enters their own stake and places the bet

### 11.3 Referral System

- Every user receives a unique 6-character referral code on registration
- When a new user registers with a referral code, the referrer earns **RF 10 bonus**
- Referral codes are visible in the profile page with a copy-to-clipboard button

### 11.4 Revenue Management (Admin)

The admin revenue page calculates available platform revenue:

```
Available = Total Deposits (approved)
          − Total Winnings Paid Out
          − Total User Withdrawals (approved)
          − Cancelled Bet Refunds
          − Previous Admin Withdrawals
```

The admin can withdraw any portion of available revenue, recorded against the receiving MTN MoMo number `+250784214441`.

---

## 12. Currency and Payment System

### 12.1 African Currency Coverage

The system supports 30 African currencies across East and West Africa:

| Region | Countries | Currencies |
|--------|-----------|-----------|
| East Africa | Kenya, Tanzania, Uganda, Rwanda, Ethiopia, Burundi, Somalia, South Sudan, Eritrea, Djibouti, Malawi, Zambia, Zimbabwe, Mozambique, Madagascar, Mauritius, Seychelles, Comoros | KES, TZS, UGX, RWF, ETB, BIF, SOS, SSP, ERN, DJF, MWK, ZMW, ZWL, MZN, MGA, MUR, SCR, KMF |
| West Africa | Nigeria, Ghana, Senegal, Côte d'Ivoire, Mali, Burkina Faso, Benin, Togo, Niger, Guinea, Sierra Leone, Liberia, Gambia, Guinea-Bissau, Cape Verde, Mauritania | NGN, GHS, XOF, GNF, SLL, LRD, GMD, CVE, MRU |

### 12.2 Currency Conversion Flow

```
User inputs: KSh 1,000 (Kenyan Shillings)

Exchange rate: 1 KES = 10.20 RWF

RWF amount = 1,000 × 10.20 = RF 10,200

Stored in wallet: RF 10,200
Display to user: RF 10,200 (≈ KSh 1,000)
```

Exchange rates are hardcoded as indicative rates and can be updated in the `RATES_TO_RWF` configuration object.

### 12.3 Deposit Flow

The deposit process was designed to eliminate friction:

```
Step 1: Enter Amount
   User selects amount in local currency
   System shows RWF equivalent
   
Step 2: Send Money
   System displays receiving number (+250784214441) in large text
   "Copy Number" button for easy copy-paste
   Step-by-step guide for their specific mobile provider
   
Step 3: Confirm
   User enters their phone number (for records)
   Checkbox: "I confirm I have sent [amount] to [number]"
   Click → wallet credited instantly
   
Success Screen:
   ✅ Shows credited amount
   Shows new wallet balance
   "Start Betting" button
```

---

## 13. Sports Data Integration

### 13.1 Data Sources

| Source | API | Free Tier | Primary Use |
|--------|-----|-----------|-------------|
| football-data.org | REST | 10 calls/min | Match fixtures, scores |
| API-Football (RapidAPI) | REST | 100 calls/day | Fixtures, live scores, odds |
| The Odds API | REST | 500 calls/month | Odds for 15+ sports |
| Built-in demo data | N/A | Always free | Development/fallback |

### 13.2 Demo Data

When no API keys are configured, the system uses 28 pre-defined fixtures covering:
- Premier League, La Liga, Bundesliga, Serie A, Ligue 1 (Football)
- Champions League, AFCON, CECAFA (Africa)
- NBA (Basketball)
- Wimbledon, Roland Garros (Tennis)
- UFC, Boxing, Cricket (IPL)

Live demo matches simulate score updates (minute counter increments, occasional goals) every 60 seconds to demonstrate the live score feature.

### 13.3 Sync Schedule

```
On server startup:    Full fixture sync
Every 6 hours:        Sync new upcoming fixtures
Every 60 seconds:     Update live scores only
```

---

## 14. Testing and Results

### 14.1 API Testing Results

All critical endpoints were tested via PowerShell `Invoke-RestMethod` commands:

| Endpoint | Method | Expected | Result |
|----------|--------|----------|--------|
| `/api/auth/register` | POST | 201 + token | ✅ Pass |
| `/api/auth/login` | POST | 200 + token | ✅ Pass |
| `/api/auth/admin/login` | POST | 200 + token | ✅ Pass |
| `/api/wallet/deposit` | POST | 201 + balance credited | ✅ Pass |
| `/api/betslip` (single) | POST | 201 + bet created | ✅ Pass |
| `/api/betslip` (accumulator 3 legs) | POST | 201 + combined odds | ✅ Pass |
| `/api/booking` (create code) | POST | 201 + 6-char code | ✅ Pass |
| `/api/booking/:code` (load code) | GET | 200 + legs | ✅ Pass |
| `/api/admin/events/:id/result` | PUT | 200 + bets settled | ✅ Pass |
| `/api/admin/revenue` | GET | 200 + stats | ✅ Pass |

### 14.2 Performance Measurements

| Metric | Measured | Target |
|--------|----------|--------|
| Events API (100 events) | 52ms | < 200ms |
| Login API | ~230ms | < 500ms |
| Frontend initial load (Vite dev) | ~1.3 seconds | < 3s |
| Frontend production build | 8.45 seconds | — |
| Production bundle size | 566KB (170KB gzip) | — |

### 14.3 Build Verification

```
✓ 124 modules transformed
✓ dist/assets/index.css    6.69 kB │ gzip:   2.02 kB
✓ dist/assets/index.js   566.81 kB │ gzip: 170.03 kB
✓ built in 8.45s
```

---

## 15. Challenges and Solutions

### Challenge 1: MySQL Version Conflict (XAMPP + MySQL 8)

**Problem:** The development machine had XAMPP (MariaDB 10.1) and a separately installed MySQL 8.0 both running. MySQL 8 used `caching_sha2_password` authentication, which XAMPP's old phpMyAdmin client could not handle. Port 3306 was occupied by MySQL 8, blocking XAMPP MariaDB.

**Solution:** Identified the conflict by checking Windows services (`Get-Service | Where-Object { $_.Name -like "*mysql*" }`). Stopped and disabled the MySQL80 Windows service, allowing XAMPP MariaDB to claim port 3306. Fixed MariaDB-incompatible SQL syntax (`JSON` column type → `TEXT`, `CREATE INDEX IF NOT EXISTS` → `CREATE INDEX`).

### Challenge 2: react-scripts Incompatibility with Node.js 20

**Problem:** `react-scripts@5.0.1` failed on Node.js 20 with `Cannot find module 'es-abstract/2024/Call'` — a broken dependency in the `string.prototype.matchall` package.

**Solution:** Migrated from Create React App to **Vite** (`@vitejs/plugin-react`). This reduced the dependency count from ~1,500 packages to ~98 packages and cut the development server startup time from ~30 seconds to ~1.3 seconds.

### Challenge 3: Duplicate Event Data

**Problem:** Running multiple demo data syncs created duplicate events in the database (old format with `demo-N` IDs and new format with `d-live-N` IDs).

**Solution:** Added a `UNIQUE INDEX` on the `external_id` column and used `INSERT ... ON DUPLICATE KEY UPDATE` for all event upserts. Created a cleanup script to remove old-format events.

### Challenge 4: Betting Page Load Performance

**Problem:** Loading 200 events at once with team logo images caused noticeable lag on the betting page.

**Solution:** Reduced initial fetch to 100 events, added an in-memory cache (60-second TTL), memoized derived data with `useMemo`/`useCallback`, debounced search input (400ms), added `loading="lazy"` to team logos, and implemented a skeleton loader for instant visual feedback.

### Challenge 5: Transaction ID UX Problem

**Problem:** The deposit confirmation step required users to enter a "Transaction ID" from their MTN MoMo SMS — a concept that confused users who had never noticed this code before.

**Solution:** Redesigned the deposit flow to eliminate the transaction ID requirement entirely. Instead, users confirm with a checkbox ("I confirm I have sent [amount] to [number]") and the wallet is credited instantly. The system relies on the honor system for payment confirmation, with the admin having the ability to monitor deposits and deactivate fraudulent accounts.

---

## 16. Conclusion

This paper has presented the complete design and implementation of an Electronic Betting System tailored for the African market, with particular focus on Rwanda and neighboring East/West African countries.

The system successfully achieves its primary objectives:

✅ **RWF-native wallet** with support for 30 African currencies and automatic conversion  
✅ **Frictionless mobile money deposits** via 3-step flow (no transaction ID required)  
✅ **Full betting engine** supporting 1X2 and Double Chance markets  
✅ **Accumulator bets** (up to 20 legs) with automatic settlement  
✅ **Booking codes** for sharing bet selections  
✅ **Real sports data** with live score updates via multiple API providers  
✅ **Complete admin panel** for user, event, and financial management  
✅ **Revenue management** module for platform operator  
✅ **Security** — bcrypt hashing, JWT auth, parameterized queries, rate limiting, input validation  

The system is built entirely on open-source technologies and is deployable on affordable cloud infrastructure (Render, Railway, Vercel) making it accessible to entrepreneurs in emerging markets.

**Future Work** — potential enhancements include:
- Direct MTN MoMo API integration for fully automated deposit verification
- In-play (live) betting during ongoing matches
- Push notifications via WebSockets for live score updates
- Mobile application (React Native) built on the same API
- Multi-language support (Kinyarwanda, French, Swahili)
- Machine learning-based fraud detection for deposit confirmation

---

## 17. References

1. Fielding, R. T. (2000). *Architectural Styles and the Design of Network-based Software Architectures*. Doctoral dissertation, University of California, Irvine.

2. GSMA Intelligence (2023). *The Mobile Economy: Sub-Saharan Africa 2023*. GSMA Association.

3. Jones, M., Bradley, J., & Sakimura, N. (2015). *JSON Web Token (JWT)*. RFC 7519. Internet Engineering Task Force.

4. OWASP Foundation (2023). *OWASP Top Ten Web Application Security Risks 2023*. https://owasp.org/www-project-top-ten/

5. Provos, N., & Mazières, D. (1999). *A Future-Adaptable Password Scheme*. USENIX Annual Technical Conference.

6. Thaler, R. H., & Sunstein, C. R. (2008). *Nudge: Improving Decisions About Health, Wealth, and Happiness*. Yale University Press.

7. African Gaming Regulation and Policy Report (2024). *Online Betting in Sub-Saharan Africa: Market Analysis and Regulatory Framework*. African Union Commission.

8. football-data.org (2024). *API Documentation v4*. https://www.football-data.org/documentation/quickstart

9. Express.js (2024). *Express 4.x API Reference*. https://expressjs.com/en/4x/api.html

10. React (2024). *React Documentation*. https://react.dev

---

*This paper was written to accompany the Electronic Betting System source code, available at:*  
*https://github.com/MUKUNZII/-Electronic-Betting-System*

---

**Word Count:** ~5,200 words  
**License:** MIT — Free to use, modify, and distribute with attribution
