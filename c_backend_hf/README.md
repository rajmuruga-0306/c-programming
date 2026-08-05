---
title: HostelHub C Backend Server
emoji: 🏠
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
short_description: C libmicrohttpd REST API backend server for HostelHub Room Allotment System
---

# HostelHub C Backend Server

High-performance embedded C web server built with `libmicrohttpd` and `SQLite3` for the HostelHub Room Allotment System.

## API Endpoints Exposed
- `POST /api/student/register`
- `POST /api/student/login`
- `POST /api/admin/login`
- `POST /api/application/submit`
- `GET /api/application/status/{student_id}`
- `GET /api/allotment/{student_id}`
- `GET /api/rooms`
- `POST /api/rooms/add`
- `PUT /api/rooms/update/{id}`
- `DELETE /api/rooms/delete/{id}`
- `GET /api/applications`
- `POST /api/allotment/auto-run`
- `POST /api/allotment/manual-assign`
- `GET /api/reports/occupancy`
- `GET /api/reports/vacant-rooms`
- `GET /api/admin/dashboard-stats`
