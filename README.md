# 🏠 HostelHub — Hostel Room Allotment System

A full-stack web application for managing hostel room allocations, built with a **C backend** and a modern **HTML/CSS/JavaScript** frontend.

---

## 📋 Features

### Student Portal
- **Registration & Login** — secure account creation with SHA-256 password hashing
- **Room Preference Form** — choose hostel block, room type (single/double/triple/dorm), floor, and roommate
- **Allotment Status** — real-time status tracking (Pending / Allotted / Rejected / Waitlisted)
- **Room Details** — view assigned room, block, floor, and roommate information
- **Confirmation** — printable allotment confirmation page

### Admin (Warden) Portal
- **Dashboard** — live stats: total rooms, occupied, vacant, pending applications, occupancy charts
- **Room Management** — full CRUD for hostel blocks and rooms
- **Application Review** — filter, approve, reject, or waitlist student applications
- **Auto-Allotment Engine** — one-click allocation based on seniority + first-come-first-served + preference matching
- **Manual Override** — directly assign any student to any available room
- **Reports** — occupancy and vacancy reports with CSV export

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | C with [libmicrohttpd](https://www.gnu.org/software/libmicrohttpd/) (HTTP server) |
| **Database** | [SQLite 3](https://www.sqlite.org/) (embedded, file-based) |
| **JSON** | Embedded minimal cJSON library (included in source) |
| **Frontend** | Vanilla HTML5, CSS3, JavaScript (SPA) |
| **Auth** | SHA-256 password hashing, Bearer token sessions |

---

## 📁 Project Structure

```
C Program/
├── backend/
│   ├── src/
│   │   ├── main.c              # Server entry point
│   │   ├── routes.c/h          # URL routing & static file serving
│   │   ├── db.c/h              # SQLite database layer
│   │   ├── auth.c/h            # Authentication & token management
│   │   ├── sha256.c/h          # SHA-256 hash implementation
│   │   ├── config.c/h          # Config file parser
│   │   ├── json_utils.c/h      # JSON response helpers
│   │   ├── handlers_student.c/h # Student API handlers
│   │   ├── handlers_admin.c/h  # Admin API handlers
│   │   └── allotment.c/h       # Allotment engine (auto + manual)
│   ├── lib/
│   │   ├── cJSON.c             # Minimal JSON parser/builder
│   │   └── cJSON.h
│   ├── Makefile
│   └── config.ini              # Server configuration
├── frontend/
│   ├── index.html              # SPA shell
│   ├── css/style.css           # Full design system
│   └── js/
│       ├── app.js              # SPA router
│       ├── api.js              # API client
│       ├── auth.js             # Login/Register pages
│       ├── student.js          # Student dashboard
│       ├── admin.js            # Admin dashboard
│       ├── rooms.js            # Room management
│       ├── applications.js     # Application management
│       ├── reports.js          # Reports & CSV export
│       └── utils.js            # Shared utilities
├── database/
│   ├── schema.sql              # DDL + seed data
│   └── hostel.db               # (auto-created on first run)
└── README.md                   # This file
```

---

## 🚀 Prerequisites

### Option A: MSYS2 + MinGW (Recommended for Windows)

1. **Install MSYS2** — download from [https://www.msys2.org/](https://www.msys2.org/) and run the installer.

2. **Open "MSYS2 MinGW 64-bit"** terminal (NOT the MSYS2 MSYS terminal).

3. **Update the package database:**
   ```bash
   pacman -Syu
   ```
   If it asks to close the terminal, close and reopen, then run `pacman -Syu` again.

4. **Install the compiler and libraries:**
   ```bash
   pacman -S mingw-w64-x86_64-gcc make
   pacman -S mingw-w64-x86_64-libmicrohttpd
   pacman -S mingw-w64-x86_64-sqlite3
   ```

5. **Add MinGW to your Windows PATH** (if not already):
   ```
   C:\msys64\mingw64\bin
   ```

### Option B: Linux / macOS

```bash
# Debian/Ubuntu
sudo apt install gcc make libmicrohttpd-dev libsqlite3-dev

# macOS (Homebrew)
brew install gcc libmicrohttpd sqlite
```

---

## 🔨 Build & Run

### 1. Compile the backend

```bash
cd backend
make
```

This produces `hostel_server.exe` (Windows) or `hostel_server` (Linux/macOS).

### 2. Start the server

```bash
make run
# or directly:
./hostel_server
```

The server starts on **http://localhost:8080** (configurable in `config.ini`).

### 3. Open the application

Open your browser and navigate to:

```
http://localhost:8080
```

The C backend serves both the REST API and the frontend static files.

---

## 🧪 Test Credentials

### Admin
| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin123` |

### Test Students
| Name | Email | Password | Student ID |
|------|-------|----------|-----------|
| Arjun Kumar | arjun@example.com | pass123 | STU2024001 |
| Priya Sharma | priya@example.com | pass123 | STU2024002 |
| Rahul Verma | rahul@example.com | pass123 | STU2024003 |
| Sneha Patel | sneha@example.com | pass123 | STU2024004 |
| Vikram Singh | vikram@example.com | pass123 | STU2024005 |

---

## 🔌 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/student/register` | Register new student |
| POST | `/api/student/login` | Student login → token |
| POST | `/api/admin/login` | Admin login → token |

### Student Endpoints (require Bearer token)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/application/submit` | Submit room preference |
| GET | `/api/application/status/{id}` | View application status |
| GET | `/api/allotment/{id}` | View allotment details |

### Admin Endpoints (require admin Bearer token)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rooms` | List all rooms |
| POST | `/api/rooms/add` | Add new room |
| PUT | `/api/rooms/update/{id}` | Update room |
| DELETE | `/api/rooms/delete/{id}` | Delete room |
| GET | `/api/applications` | List all applications |
| PUT | `/api/application/status-update/{id}` | Update application status |
| POST | `/api/allotment/auto-run` | Run auto-allotment |
| POST | `/api/allotment/manual-assign` | Manual room assignment |
| GET | `/api/reports/occupancy` | Occupancy report |
| GET | `/api/reports/vacant-rooms` | Vacant rooms report |
| GET | `/api/admin/dashboard-stats` | Dashboard statistics |

### Request/Response Format
All API endpoints accept and return **JSON**. Include the auth token in the header:
```
Authorization: Bearer <your-token-here>
Content-Type: application/json
```

---

## ⚙️ Configuration

Edit `backend/config.ini` to change settings:

```ini
# HTTP server port
port=8080

# SQLite database path (relative to backend/ directory)
db_path=../database/hostel.db

# Frontend files path (relative to backend/ directory)
frontend_path=../frontend

# Schema file for auto-initialization
schema_path=../database/schema.sql
```

---

## 📝 Notes

- **First run** automatically creates the database and loads seed data from `schema.sql`.
- **Passwords** are hashed with SHA-256 before storage — never stored in plaintext.
- **Thread safety**: SQLite writes are serialized using mutex locks.
- **CORS** is enabled for local development (all origins allowed).
- The auto-allotment engine prioritizes by **year** (seniority) then **application date** (FCFS).

---

## 📜 License

This project is for educational purposes.
