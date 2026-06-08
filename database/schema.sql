-- ============================================================
-- Electronic Betting System - Complete MySQL Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS `betting_system`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `betting_system`;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `full_name`      VARCHAR(100)  NOT NULL,
  `username`       VARCHAR(50)   UNIQUE NOT NULL,
  `email`          VARCHAR(100)  UNIQUE NOT NULL,
  `phone`          VARCHAR(20)   DEFAULT NULL,
  `date_of_birth`  DATE          DEFAULT NULL,
  `country`        VARCHAR(60)   DEFAULT NULL,
  `password`       VARCHAR(255)  NOT NULL,
  `profile_photo`  VARCHAR(255)  DEFAULT NULL,
  `is_verified`    TINYINT(1)    DEFAULT 0,
  `is_active`      TINYINT(1)    DEFAULT 1,
  `referral_code`  VARCHAR(20)   UNIQUE,
  `referred_by`    INT           DEFAULT NULL,
  `role`           ENUM('user','admin') DEFAULT 'user',
  `created_at`     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`referred_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- ADMINS
-- ============================================================
CREATE TABLE IF NOT EXISTS `admins` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `full_name`  VARCHAR(100) NOT NULL,
  `username`   VARCHAR(50)  UNIQUE NOT NULL,
  `email`      VARCHAR(100) UNIQUE NOT NULL,
  `password`   VARCHAR(255) NOT NULL,
  `is_active`  TINYINT(1)   DEFAULT 1,
  `created_at` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- EMAIL VERIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS `email_verifications` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`    INT          NOT NULL,
  `token`      VARCHAR(255) NOT NULL,
  `expires_at` TIMESTAMP    NOT NULL,
  `created_at` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- PASSWORD RESETS
-- ============================================================
CREATE TABLE IF NOT EXISTS `password_resets` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `email`      VARCHAR(100) NOT NULL,
  `token`      VARCHAR(255) NOT NULL,
  `expires_at` TIMESTAMP    NOT NULL,
  `used`       TINYINT(1)   DEFAULT 0,
  `created_at` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- WALLETS
-- ============================================================
CREATE TABLE IF NOT EXISTS `wallets` (
  `id`               INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`          INT            UNIQUE NOT NULL,
  `balance`          DECIMAL(15,2)  DEFAULT 0.00,
  `total_deposited`  DECIMAL(15,2)  DEFAULT 0.00,
  `total_withdrawn`  DECIMAL(15,2)  DEFAULT 0.00,
  `total_winnings`   DECIMAL(15,2)  DEFAULT 0.00,
  `total_losses`     DECIMAL(15,2)  DEFAULT 0.00,
  `created_at`       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- DEPOSITS
-- ============================================================
CREATE TABLE IF NOT EXISTS `deposits` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`        INT           NOT NULL,
  `amount`         DECIMAL(15,2) NOT NULL,
  `payment_method` VARCHAR(50)   DEFAULT 'bank_transfer',
  `reference`      VARCHAR(100)  UNIQUE,
  `status`         ENUM('pending','approved','rejected') DEFAULT 'pending',
  `admin_note`     TEXT          DEFAULT NULL,
  `processed_by`   INT           DEFAULT NULL,
  `processed_at`   TIMESTAMP     NULL DEFAULT NULL,
  `created_at`     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`)      REFERENCES `users`(`id`)  ON DELETE CASCADE,
  FOREIGN KEY (`processed_by`) REFERENCES `admins`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- WITHDRAWALS
-- ============================================================
CREATE TABLE IF NOT EXISTS `withdrawals` (
  `id`              INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`         INT           NOT NULL,
  `amount`          DECIMAL(15,2) NOT NULL,
  `payment_method`  VARCHAR(50)   DEFAULT 'bank_transfer',
  `account_details` TEXT,
  `reference`       VARCHAR(100)  UNIQUE,
  `status`          ENUM('pending','approved','rejected') DEFAULT 'pending',
  `admin_note`      TEXT          DEFAULT NULL,
  `processed_by`    INT           DEFAULT NULL,
  `processed_at`    TIMESTAMP     NULL DEFAULT NULL,
  `created_at`      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`)      REFERENCES `users`(`id`)  ON DELETE CASCADE,
  FOREIGN KEY (`processed_by`) REFERENCES `admins`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS `transactions` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`        INT           NOT NULL,
  `type`           ENUM('deposit','withdrawal','bet_placed','bet_won','bet_lost','refund','bonus') NOT NULL,
  `amount`         DECIMAL(15,2) NOT NULL,
  `balance_before` DECIMAL(15,2) NOT NULL,
  `balance_after`  DECIMAL(15,2) NOT NULL,
  `reference`      VARCHAR(100)  DEFAULT NULL,
  `description`    TEXT          DEFAULT NULL,
  `status`         ENUM('pending','completed','failed') DEFAULT 'completed',
  `created_at`     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS `events` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `title`       VARCHAR(200) NOT NULL,
  `category`    ENUM('Football','Basketball','Tennis','Cricket','Baseball','Hockey','Boxing','MMA','Rugby','Golf','Other') NOT NULL,
  `team_a`      VARCHAR(100) DEFAULT NULL,
  `team_b`      VARCHAR(100) DEFAULT NULL,
  `odds_a`      DECIMAL(8,2) DEFAULT 1.50,
  `odds_b`      DECIMAL(8,2) DEFAULT 1.50,
  `odds_draw`   DECIMAL(8,2) DEFAULT NULL,
  `start_time`  TIMESTAMP    NOT NULL,
  `end_time`    TIMESTAMP    NOT NULL,
  `status`      ENUM('upcoming','live','closed','completed','cancelled') DEFAULT 'upcoming',
  `result`      ENUM('team_a','team_b','draw','cancelled') DEFAULT NULL,
  `description` TEXT         DEFAULT NULL,
  `created_by`  INT          DEFAULT NULL,
  `created_at`  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `admins`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- BETS
-- ============================================================
CREATE TABLE IF NOT EXISTS `bets` (
  `id`                 INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`            INT           NOT NULL,
  `event_id`           INT           NOT NULL,
  `bet_type`           ENUM('single','multiple') DEFAULT 'single',
  `selection`          VARCHAR(50)   NOT NULL,
  `odds`               DECIMAL(8,2)  NOT NULL,
  `stake`              DECIMAL(15,2) NOT NULL,
  `potential_winnings` DECIMAL(15,2) NOT NULL,
  `actual_winnings`    DECIMAL(15,2) DEFAULT 0.00,
  `status`             ENUM('pending','won','lost','cancelled') DEFAULT 'pending',
  `settled_at`         TIMESTAMP     NULL DEFAULT NULL,
  `created_at`         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`)  REFERENCES `users`(`id`)  ON DELETE CASCADE,
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS `notifications` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`    INT          NOT NULL,
  `title`      VARCHAR(200) NOT NULL,
  `message`    TEXT         NOT NULL,
  `type`       ENUM('deposit','withdrawal','bet','event','system','bonus') DEFAULT 'system',
  `is_read`    TINYINT(1)   DEFAULT 0,
  `created_at` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- PROMO CODES
-- ============================================================
CREATE TABLE IF NOT EXISTS `promo_codes` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `code`           VARCHAR(50)   UNIQUE NOT NULL,
  `discount_type`  ENUM('percentage','fixed') DEFAULT 'fixed',
  `discount_value` DECIMAL(10,2) NOT NULL,
  `min_deposit`    DECIMAL(10,2) DEFAULT 0.00,
  `max_uses`       INT           DEFAULT NULL,
  `used_count`     INT           DEFAULT 0,
  `expires_at`     TIMESTAMP     NULL DEFAULT NULL,
  `is_active`      TINYINT(1)    DEFAULT 1,
  `created_by`     INT           DEFAULT NULL,
  `created_at`     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `admins`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- PROMO CODE USAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS `promo_code_usages` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `promo_code_id`  INT           NOT NULL,
  `user_id`        INT           NOT NULL,
  `deposit_id`     INT           DEFAULT NULL,
  `bonus_amount`   DECIMAL(10,2) NOT NULL,
  `used_at`        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`promo_code_id`) REFERENCES `promo_codes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`)       REFERENCES `users`(`id`)       ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_users_email        ON `users`(`email`);
CREATE INDEX idx_users_username     ON `users`(`username`);
CREATE INDEX idx_users_referral     ON `users`(`referral_code`);
CREATE INDEX idx_bets_user_id       ON `bets`(`user_id`);
CREATE INDEX idx_bets_event_id      ON `bets`(`event_id`);
CREATE INDEX idx_bets_status        ON `bets`(`status`);
CREATE INDEX idx_events_status      ON `events`(`status`);
CREATE INDEX idx_events_category    ON `events`(`category`);
CREATE INDEX idx_events_start_time  ON `events`(`start_time`);
CREATE INDEX idx_transactions_user  ON `transactions`(`user_id`);
CREATE INDEX idx_notifications_user ON `notifications`(`user_id`);
CREATE INDEX idx_deposits_user      ON `deposits`(`user_id`);
CREATE INDEX idx_deposits_status    ON `deposits`(`status`);
CREATE INDEX idx_withdrawals_user   ON `withdrawals`(`user_id`);
CREATE INDEX idx_withdrawals_status ON `withdrawals`(`status`);

-- ============================================================
-- DEFAULT ADMIN ACCOUNT
-- Password: Admin@123  (bcrypt hash below)
-- ============================================================
INSERT IGNORE INTO `admins` (`full_name`, `username`, `email`, `password`)
VALUES (
  'Super Admin',
  'admin',
  'admin@bettingsystem.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i'
);

-- ============================================================
-- SAMPLE EVENTS (optional seed data)
-- ============================================================
INSERT IGNORE INTO `events`
  (`title`, `category`, `team_a`, `team_b`, `odds_a`, `odds_b`, `odds_draw`, `start_time`, `end_time`, `status`)
VALUES
  ('Premier League: Man United vs Arsenal',   'Football',   'Manchester United', 'Arsenal',          2.10, 3.20, 3.40, DATE_ADD(NOW(), INTERVAL 2 DAY),  DATE_ADD(NOW(), INTERVAL 2 DAY  + INTERVAL 2 HOUR), 'upcoming'),
  ('NBA Finals: Lakers vs Celtics',           'Basketball', 'LA Lakers',         'Boston Celtics',   1.85, 1.95, NULL, DATE_ADD(NOW(), INTERVAL 1 DAY),  DATE_ADD(NOW(), INTERVAL 1 DAY  + INTERVAL 3 HOUR), 'upcoming'),
  ('Wimbledon: Djokovic vs Alcaraz',          'Tennis',     'Novak Djokovic',    'Carlos Alcaraz',   1.70, 2.10, NULL, DATE_ADD(NOW(), INTERVAL 3 DAY),  DATE_ADD(NOW(), INTERVAL 3 DAY  + INTERVAL 4 HOUR), 'upcoming'),
  ('IPL: Mumbai Indians vs Chennai Super Kings','Cricket',  'Mumbai Indians',    'Chennai Super Kings',1.90,1.90,NULL, DATE_ADD(NOW(), INTERVAL 4 DAY),  DATE_ADD(NOW(), INTERVAL 4 DAY  + INTERVAL 4 HOUR), 'upcoming'),
  ('UFC 300: Jones vs Miocic',                'MMA',        'Jon Jones',         'Stipe Miocic',     1.55, 2.40, NULL, DATE_ADD(NOW(), INTERVAL 5 DAY),  DATE_ADD(NOW(), INTERVAL 5 DAY  + INTERVAL 1 HOUR), 'upcoming'),
  ('Champions League: Real Madrid vs Bayern', 'Football',   'Real Madrid',       'Bayern Munich',    2.00, 3.50, 3.20, DATE_ADD(NOW(), INTERVAL 6 DAY),  DATE_ADD(NOW(), INTERVAL 6 DAY  + INTERVAL 2 HOUR), 'upcoming');
