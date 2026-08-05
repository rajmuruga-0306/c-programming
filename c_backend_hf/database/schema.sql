-- =============================================================
-- Hostel Room Allotment System — Database Schema & Seed Data
-- SQLite 3
-- =============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- -----------------------------------------------------------
-- 1. Students
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL,
    email           TEXT    UNIQUE NOT NULL,
    password_hash   TEXT    NOT NULL,
    student_id      TEXT    UNIQUE NOT NULL,
    department      TEXT,
    year            INTEGER,
    phone           TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------
-- 2. Admins
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    username        TEXT    UNIQUE NOT NULL,
    password_hash   TEXT    NOT NULL
);

-- -----------------------------------------------------------
-- 3. Hostel Blocks
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS hostel_blocks (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    block_name      TEXT    UNIQUE NOT NULL,
    total_floors    INTEGER NOT NULL
);

-- -----------------------------------------------------------
-- 4. Rooms
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS rooms (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    block_id        INTEGER NOT NULL REFERENCES hostel_blocks(id) ON DELETE CASCADE,
    room_number     TEXT    NOT NULL,
    floor           INTEGER NOT NULL,
    room_type       TEXT    CHECK(room_type IN ('single','double','triple','dorm')) NOT NULL,
    capacity        INTEGER NOT NULL,
    occupied_count  INTEGER DEFAULT 0,
    status          TEXT    DEFAULT 'available'
                           CHECK(status IN ('available','full','maintenance')),
    UNIQUE(block_id, room_number)
);

-- -----------------------------------------------------------
-- 5. Applications
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS applications (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id          INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    preferred_block     INTEGER REFERENCES hostel_blocks(id),
    preferred_room_type TEXT,
    floor_preference    INTEGER,
    roommate_preference TEXT,
    status              TEXT    DEFAULT 'pending'
                               CHECK(status IN ('pending','allotted','rejected','waitlisted')),
    applied_on          DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------
-- 6. Allotments
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS allotments (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id  INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    room_id         INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    student_id      INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    allotted_on     DATETIME DEFAULT CURRENT_TIMESTAMP,
    allotted_by     TEXT    DEFAULT 'system'
);

-- ===========================================================
--                       SEED DATA
-- ===========================================================

-- Admin account  (password: admin123)
-- SHA-256 of "admin123" = 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
INSERT OR IGNORE INTO admins (username, password_hash)
VALUES ('admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9');

-- Hostel Blocks
INSERT OR IGNORE INTO hostel_blocks (id, block_name, total_floors) VALUES (1, 'Block A', 5);
INSERT OR IGNORE INTO hostel_blocks (id, block_name, total_floors) VALUES (2, 'Block B', 4);
INSERT OR IGNORE INTO hostel_blocks (id, block_name, total_floors) VALUES (3, 'Block C', 3);

-- Rooms — Block A  (floors 1-5, 4 rooms each = 20 rooms)
INSERT OR IGNORE INTO rooms (block_id, room_number, floor, room_type, capacity) VALUES (1, 'A101', 1, 'single',   1);
INSERT OR IGNORE INTO rooms (block_id, room_number, floor, room_type, capacity) VALUES (1, 'A102', 1, 'double',   2);
INSERT OR IGNORE INTO rooms (block_id, room_number, floor, room_type, capacity) VALUES (1, 'A103', 1, 'double',   2);
INSERT OR IGNORE INTO rooms (block_id, room_number, floor, room_type, capacity) VALUES (1, 'A104', 1, 'triple',   3);
INSERT OR IGNORE INTO rooms (block_id, room_number, floor, room_type, capacity) VALUES (1, 'A201', 2, 'single',   1);
INSERT OR IGNORE INTO rooms (block_id, room_number, floor, room_type, capacity) VALUES (1, 'A202', 2, 'double',   2);
INSERT OR IGNORE INTO rooms (block_id, room_number, floor, room_type, capacity) VALUES (1, 'A203', 2, 'triple',   3);
INSERT OR IGNORE INTO rooms (block_id, room_number, floor, room_type, capacity) VALUES (1, 'A204', 2, 'dorm',     6);
INSERT OR IGNORE INTO rooms (block_id, room_number, floor, room_type, capacity) VALUES (1, 'A301', 3, 'single',   1);
INSERT OR IGNORE INTO rooms (block_id, room_number, floor, room_type, capacity) VALUES (1, 'A302', 3, 'double',   2);

-- Rooms — Block B
INSERT OR IGNORE INTO rooms (block_id, room_number, floor, room_type, capacity) VALUES (2, 'B101', 1, 'double',   2);
INSERT OR IGNORE INTO rooms (block_id, room_number, floor, room_type, capacity) VALUES (2, 'B102', 1, 'double',   2);
INSERT OR IGNORE INTO rooms (block_id, room_number, floor, room_type, capacity) VALUES (2, 'B103', 1, 'triple',   3);
INSERT OR IGNORE INTO rooms (block_id, room_number, floor, room_type, capacity) VALUES (2, 'B201', 2, 'single',   1);
INSERT OR IGNORE INTO rooms (block_id, room_number, floor, room_type, capacity) VALUES (2, 'B202', 2, 'double',   2);
INSERT OR IGNORE INTO rooms (block_id, room_number, floor, room_type, capacity) VALUES (2, 'B203', 2, 'dorm',     6);

-- Rooms — Block C
INSERT OR IGNORE INTO rooms (block_id, room_number, floor, room_type, capacity) VALUES (3, 'C101', 1, 'single',   1);
INSERT OR IGNORE INTO rooms (block_id, room_number, floor, room_type, capacity) VALUES (3, 'C102', 1, 'double',   2);
INSERT OR IGNORE INTO rooms (block_id, room_number, floor, room_type, capacity) VALUES (3, 'C103', 1, 'triple',   3);
INSERT OR IGNORE INTO rooms (block_id, room_number, floor, room_type, capacity) VALUES (3, 'C201', 2, 'double',   2);

-- Test students (password for all: pass123)
-- SHA-256 of "pass123" = 9b8769a4a742959a2d0298c36fb70623f2dfacda8436237df08d8dfd5b37374c
INSERT OR IGNORE INTO students (name, email, password_hash, student_id, department, year, phone)
VALUES ('Arjun Kumar',   'arjun@example.com',   '9b8769a4a742959a2d0298c36fb70623f2dfacda8436237df08d8dfd5b37374c', 'STU2024001', 'Computer Science', 3, '9876543210');
INSERT OR IGNORE INTO students (name, email, password_hash, student_id, department, year, phone)
VALUES ('Priya Sharma',  'priya@example.com',   '9b8769a4a742959a2d0298c36fb70623f2dfacda8436237df08d8dfd5b37374c', 'STU2024002', 'Electronics',      2, '9876543211');
INSERT OR IGNORE INTO students (name, email, password_hash, student_id, department, year, phone)
VALUES ('Rahul Verma',   'rahul@example.com',   '9b8769a4a742959a2d0298c36fb70623f2dfacda8436237df08d8dfd5b37374c', 'STU2024003', 'Mechanical',        4, '9876543212');
INSERT OR IGNORE INTO students (name, email, password_hash, student_id, department, year, phone)
VALUES ('Sneha Patel',   'sneha@example.com',   '9b8769a4a742959a2d0298c36fb70623f2dfacda8436237df08d8dfd5b37374c', 'STU2024004', 'Computer Science', 1, '9876543213');
INSERT OR IGNORE INTO students (name, email, password_hash, student_id, department, year, phone)
VALUES ('Vikram Singh',  'vikram@example.com',  '9b8769a4a742959a2d0298c36fb70623f2dfacda8436237df08d8dfd5b37374c', 'STU2024005', 'Civil',             3, '9876543214');

-- Sample applications
INSERT OR IGNORE INTO applications (student_id, preferred_block, preferred_room_type, floor_preference, roommate_preference, status)
VALUES (1, 1, 'double', 2, 'STU2024005', 'pending');
INSERT OR IGNORE INTO applications (student_id, preferred_block, preferred_room_type, floor_preference, roommate_preference, status)
VALUES (2, 2, 'single', 1, NULL, 'pending');
INSERT OR IGNORE INTO applications (student_id, preferred_block, preferred_room_type, floor_preference, roommate_preference, status)
VALUES (3, 1, 'triple', NULL, NULL, 'pending');
