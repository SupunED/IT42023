-- ============================================================
-- BookNest E-Commerce Platform - MySQL Schema
-- Import target: phpMyAdmin (XAMPP / MariaDB / MySQL 5.7+)
-- Charset: utf8mb4  |  Engine: InnoDB
-- ============================================================
-- HOW TO IMPORT:
--   1. Open phpMyAdmin -> "Import" tab (or run this file directly).
--   2. This script CREATES the `booknest_db` database and all tables.
--   3. Make sure your backend .env has:
--        DB_NAME=booknest_db  DB_USER=root  DB_PASSWORD=  DB_HOST=localhost  DB_PORT=3306
--   4. Start the backend once; Sequelize sync() will keep it in sync
--      Run npm --prefix backend run seed explicitly to add catalogue data.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

CREATE DATABASE IF NOT EXISTS `booknest_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE `booknest_db`;

-- ------------------------------------------------------------
-- Table: Users
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `Users`;
CREATE TABLE `Users` (
  `userID`     CHAR(36)     NOT NULL,
  `googleID`   VARCHAR(255) DEFAULT NULL,
  `name`       VARCHAR(255) NOT NULL,
  `email`      VARCHAR(255) NOT NULL,
  `avatarUrl`  VARCHAR(255) DEFAULT NULL,
  `phone`      VARCHAR(255) DEFAULT NULL,
  `address`    TEXT         DEFAULT NULL,
  `role`       ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  `createdAt`  DATETIME     NOT NULL,
  `updatedAt`  DATETIME     NOT NULL,
  PRIMARY KEY (`userID`),
  UNIQUE KEY `uq_users_email`    (`email`),
  UNIQUE KEY `uq_users_googleID` (`googleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: Categories
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `Categories`;
CREATE TABLE `Categories` (
  `catID`       INT           NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(255)  NOT NULL,
  `slug`        VARCHAR(255)  NOT NULL,
  `description` TEXT          DEFAULT NULL,
  `icon`        VARCHAR(255)  DEFAULT NULL,
  `createdAt`   DATETIME      NOT NULL,
  `updatedAt`   DATETIME      NOT NULL,
  PRIMARY KEY (`catID`),
  UNIQUE KEY `uq_categories_name` (`name`),
  UNIQUE KEY `uq_categories_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: Books
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `Books`;
CREATE TABLE `Books` (
  `bookID`              CHAR(36)      NOT NULL,
  `title`               VARCHAR(255)  NOT NULL,
  `author`              VARCHAR(255)  NOT NULL,
  `isbn`                VARCHAR(255)  DEFAULT NULL,
  `categoryID`          INT           NOT NULL,
  `price`               DECIMAL(10,2) NOT NULL,
  `stock`               INT           NOT NULL DEFAULT 0,
  `lendableStock`       INT           NOT NULL DEFAULT 0,
  `lendingPricePerWeek` DECIMAL(10,2) DEFAULT 2.99,
  `coverPhotoUrl`       VARCHAR(255)  DEFAULT NULL,
  `description`         TEXT          DEFAULT NULL,
  `rating`             FLOAT         DEFAULT 5,
  `reviewCount`         INT           DEFAULT 0,
  `isAvailable`         TINYINT(1)    DEFAULT 1,
  `isFeatured`          TINYINT(1)    DEFAULT 0,
  `createdAt`           DATETIME      NOT NULL,
  `updatedAt`           DATETIME      NOT NULL,
  PRIMARY KEY (`bookID`),
  KEY `idx_books_categoryID` (`categoryID`),
  CONSTRAINT `fk_books_category`
    FOREIGN KEY (`categoryID`) REFERENCES `Categories` (`catID`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: Orders
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `Orders`;
CREATE TABLE `Orders` (
  `orderID`              VARCHAR(255)  NOT NULL,
  `userID`               CHAR(36)      DEFAULT NULL,
  `guestEmail`           VARCHAR(255)  DEFAULT NULL,
  `guestName`            VARCHAR(255)  DEFAULT NULL,
  `guestPhone`           VARCHAR(255)  DEFAULT NULL,
  `subtotal`             DECIMAL(10,2) NOT NULL,
  `shippingFee`          DECIMAL(10,2) DEFAULT 4.99,
  `total`                DECIMAL(10,2) NOT NULL,
  `paymentStatus`        ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
  `paymentMethod`        VARCHAR(255)  DEFAULT 'Credit Card (Stripe)',
  `paymentTransactionID` VARCHAR(255)  DEFAULT NULL,
  `deliveryAddress`      TEXT          NOT NULL,
  `status`               ENUM('Reviewing','Processing','Ready','In Progress','Delivered','Cancelled') NOT NULL DEFAULT 'Reviewing',
  `notes`                TEXT          DEFAULT NULL,
  `createdAt`            DATETIME      NOT NULL,
  `updatedAt`            DATETIME      NOT NULL,
  PRIMARY KEY (`orderID`),
  KEY `idx_orders_userID` (`userID`),
  CONSTRAINT `fk_orders_user`
    FOREIGN KEY (`userID`) REFERENCES `Users` (`userID`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: OrderItems
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `OrderItems`;
CREATE TABLE `OrderItems` (
  `itemID`     CHAR(36)      NOT NULL,
  `orderID`    VARCHAR(255)  NOT NULL,
  `bookID`     CHAR(36)      NOT NULL,
  `quantity`   INT           NOT NULL DEFAULT 1,
  `unitPrice`  DECIMAL(10,2) NOT NULL,
  `totalPrice` DECIMAL(10,2) NOT NULL,
  `createdAt`  DATETIME      NOT NULL,
  `updatedAt`  DATETIME      NOT NULL,
  PRIMARY KEY (`itemID`),
  KEY `idx_orderitems_orderID` (`orderID`),
  KEY `idx_orderitems_bookID`  (`bookID`),
  CONSTRAINT `fk_orderitems_order`
    FOREIGN KEY (`orderID`) REFERENCES `Orders` (`orderID`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_orderitems_book`
    FOREIGN KEY (`bookID`) REFERENCES `Books` (`bookID`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: Delivery
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `Delivery`;
CREATE TABLE `Delivery` (
  `deliveryID`            CHAR(36)     NOT NULL,
  `orderID`               VARCHAR(255) NOT NULL,
  `trackingNumber`        VARCHAR(255) DEFAULT NULL,
  `carrier`               VARCHAR(255) DEFAULT 'BookNest Express Courier',
  `status`                ENUM('Pending','Dispatched','In Transit','Out for Delivery','Delivered') NOT NULL DEFAULT 'Pending',
  `estimatedDeliveryDate` DATETIME     DEFAULT NULL,
  `deliveredAt`           DATETIME     DEFAULT NULL,
  `notes`                 TEXT         DEFAULT NULL,
  `createdAt`             DATETIME     NOT NULL,
  `updatedAt`             DATETIME     NOT NULL,
  PRIMARY KEY (`deliveryID`),
  UNIQUE KEY `uq_delivery_orderID` (`orderID`),
  CONSTRAINT `fk_delivery_order`
    FOREIGN KEY (`orderID`) REFERENCES `Orders` (`orderID`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: Cart
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `Cart`;
CREATE TABLE `Cart` (
  `cartID`    CHAR(36)  NOT NULL,
  `userID`    CHAR(36)  NOT NULL,
  `bookID`    CHAR(36)  NOT NULL,
  `quantity`  INT       NOT NULL DEFAULT 1,
  `createdAt` DATETIME  NOT NULL,
  `updatedAt` DATETIME  NOT NULL,
  PRIMARY KEY (`cartID`),
  KEY `idx_cart_userID` (`userID`),
  KEY `idx_cart_bookID` (`bookID`),
  CONSTRAINT `fk_cart_user`
    FOREIGN KEY (`userID`) REFERENCES `Users` (`userID`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cart_book`
    FOREIGN KEY (`bookID`) REFERENCES `Books` (`bookID`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: Lending
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `Lending`;
CREATE TABLE `Lending` (
  `lendID`       CHAR(36)      NOT NULL,
  `userID`       CHAR(36)      NOT NULL,
  `bookID`       CHAR(36)      NOT NULL,
  `requestDate`  DATETIME      DEFAULT NULL,
  `startDate`    DATETIME      DEFAULT NULL,
  `dueDate`      DATETIME      DEFAULT NULL,
  `returnDate`   DATETIME      DEFAULT NULL,
  `durationDays` INT           NOT NULL DEFAULT 14,
  `lendingFee`   DECIMAL(10,2) DEFAULT 0.00,
  `status`       ENUM('Pending','Approved','Active','Overdue','Returned','Rejected') NOT NULL DEFAULT 'Pending',
  `adminNotes`   TEXT          DEFAULT NULL,
  `createdAt`    DATETIME      NOT NULL,
  `updatedAt`    DATETIME      NOT NULL,
  PRIMARY KEY (`lendID`),
  KEY `idx_lending_userID` (`userID`),
  KEY `idx_lending_bookID` (`bookID`),
  CONSTRAINT `fk_lending_user`
    FOREIGN KEY (`userID`) REFERENCES `Users` (`userID`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_lending_book`
    FOREIGN KEY (`bookID`) REFERENCES `Books` (`bookID`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: Reviews
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `Reviews`;
CREATE TABLE `Reviews` (
  `reviewID`   CHAR(36)   NOT NULL,
  `userID`     CHAR(36)   NOT NULL,
  `bookID`     CHAR(36)   NOT NULL,
  `rating`     INT        NOT NULL,
  `comment`    TEXT       DEFAULT NULL,
  `isApproved` TINYINT(1) DEFAULT 1,
  `createdAt`  DATETIME   NOT NULL,
  `updatedAt`  DATETIME   NOT NULL,
  PRIMARY KEY (`reviewID`),
  KEY `idx_reviews_userID` (`userID`),
  KEY `idx_reviews_bookID` (`bookID`),
  CONSTRAINT `fk_reviews_user`
    FOREIGN KEY (`userID`) REFERENCES `Users` (`userID`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_reviews_book`
    FOREIGN KEY (`bookID`) REFERENCES `Books` (`bookID`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- End of schema. Startup creates the session table; catalogue seeding is explicit.
-- ============================================================
