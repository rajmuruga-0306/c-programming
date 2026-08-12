// ============================================================
// HostelHub — Complete In-Browser Backend (localStorage)
// Works offline from File Explorer — no server required!
// ============================================================

// ── Auth helpers ──
function getToken() { return localStorage.getItem('token') || ''; }
function setToken(token) { localStorage.setItem('token', token); }
function clearToken() { localStorage.removeItem('token'); }
function getUser() {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); }
  catch(e) { return null; }
}
function setUser(user) { localStorage.setItem('user', JSON.stringify(user)); }
function isAdmin() { return localStorage.getItem('role') === 'admin'; }
function setRole(role) { localStorage.setItem('role', role); }
function clearAuth() {
  clearToken();
  localStorage.removeItem('user');
  localStorage.removeItem('role');
}

// ── Database layer (localStorage) ──
const DB_KEYS = {
  students: 'hh_students',
  admins: 'hh_admins',
  blocks: 'hh_blocks',
  rooms: 'hh_rooms',
  applications: 'hh_applications',
  allotments: 'hh_allotments',
  bills: 'hh_bills',
  transactions: 'hh_transactions',
  initialized: 'hh_initialized'
};

function dbGet(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); }
  catch(e) { return []; }
}
function dbSet(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}
function nextId(arr) {
  return arr.length > 0 ? Math.max(...arr.map(a => a.id)) + 1 : 1;
}

// ── Seed data (runs once on first visit) ──
function seedDatabase() {
  // Always ensure default admin account exists
  let admins = dbGet(DB_KEYS.admins);
  if (!admins || !Array.isArray(admins) || admins.length === 0) {
    dbSet(DB_KEYS.admins, [
      { id: 1, username: 'admin', password: 'admin123' }
    ]);
  }

  if (localStorage.getItem(DB_KEYS.initialized)) return;

  // Hostel blocks
  dbSet(DB_KEYS.blocks, [
    { id: 1, block_name: 'Block A', total_floors: 5 },
    { id: 2, block_name: 'Block B', total_floors: 4 },
    { id: 3, block_name: 'Block C', total_floors: 3 }
  ]);

  // Rooms
  dbSet(DB_KEYS.rooms, [
    { id: 1,  block_id: 1, room_number: 'A101', floor: 1, room_type: 'single', ac_type: 'ac',     capacity: 1, occupied_count: 0, status: 'available' },
    { id: 2,  block_id: 1, room_number: 'A102', floor: 1, room_type: 'double', ac_type: 'ac',     capacity: 2, occupied_count: 0, status: 'available' },
    { id: 3,  block_id: 1, room_number: 'A103', floor: 1, room_type: 'double', ac_type: 'non_ac', capacity: 2, occupied_count: 0, status: 'available' },
    { id: 4,  block_id: 1, room_number: 'A104', floor: 1, room_type: 'triple', ac_type: 'non_ac', capacity: 3, occupied_count: 0, status: 'available' },
    { id: 5,  block_id: 1, room_number: 'A201', floor: 2, room_type: 'single', ac_type: 'ac',     capacity: 1, occupied_count: 0, status: 'available' },
    { id: 6,  block_id: 1, room_number: 'A202', floor: 2, room_type: 'double', ac_type: 'non_ac', capacity: 2, occupied_count: 0, status: 'available' },
    { id: 7,  block_id: 1, room_number: 'A203', floor: 2, room_type: 'triple', ac_type: 'ac',     capacity: 3, occupied_count: 0, status: 'available' },
    { id: 8,  block_id: 1, room_number: 'A204', floor: 2, room_type: 'dorm',   ac_type: 'non_ac', capacity: 6, occupied_count: 0, status: 'available' },
    { id: 9,  block_id: 1, room_number: 'A301', floor: 3, room_type: 'single', ac_type: 'ac',     capacity: 1, occupied_count: 0, status: 'available' },
    { id: 10, block_id: 1, room_number: 'A302', floor: 3, room_type: 'double', ac_type: 'non_ac', capacity: 2, occupied_count: 0, status: 'available' },
    { id: 11, block_id: 2, room_number: 'B101', floor: 1, room_type: 'double', ac_type: 'ac',     capacity: 2, occupied_count: 0, status: 'available' },
    { id: 12, block_id: 2, room_number: 'B102', floor: 1, room_type: 'double', ac_type: 'non_ac', capacity: 2, occupied_count: 0, status: 'available' },
    { id: 13, block_id: 2, room_number: 'B103', floor: 1, room_type: 'triple', ac_type: 'ac',     capacity: 3, occupied_count: 0, status: 'available' },
    { id: 14, block_id: 2, room_number: 'B201', floor: 2, room_type: 'single', ac_type: 'non_ac', capacity: 1, occupied_count: 0, status: 'available' },
    { id: 15, block_id: 2, room_number: 'B202', floor: 2, room_type: 'double', ac_type: 'ac',     capacity: 2, occupied_count: 0, status: 'available' },
    { id: 16, block_id: 2, room_number: 'B203', floor: 2, room_type: 'dorm',   ac_type: 'non_ac', capacity: 6, occupied_count: 0, status: 'available' },
    { id: 17, block_id: 3, room_number: 'C101', floor: 1, room_type: 'single', ac_type: 'ac',     capacity: 1, occupied_count: 0, status: 'available' },
    { id: 18, block_id: 3, room_number: 'C102', floor: 1, room_type: 'double', ac_type: 'non_ac', capacity: 2, occupied_count: 0, status: 'available' },
    { id: 19, block_id: 3, room_number: 'C103', floor: 1, room_type: 'triple', ac_type: 'ac',     capacity: 3, occupied_count: 0, status: 'available' },
    { id: 20, block_id: 3, room_number: 'C201', floor: 2, room_type: 'double', ac_type: 'non_ac', capacity: 2, occupied_count: 0, status: 'available' }
  ]);

  // Test students
  dbSet(DB_KEYS.students, [
    { id: 1, name: 'Arjun Kumar',  email: 'arjun@example.com',  password: 'pass123', student_id: 'STU2024001', department: 'Computer Science', year: 3, phone: '9876543210', created_at: new Date().toISOString() },
    { id: 2, name: 'Priya Sharma', email: 'priya@example.com',  password: 'pass123', student_id: 'STU2024002', department: 'Electronics',      year: 2, phone: '9876543211', created_at: new Date().toISOString() },
    { id: 3, name: 'Rahul Verma',  email: 'rahul@example.com',  password: 'pass123', student_id: 'STU2024003', department: 'Mechanical',        year: 4, phone: '9876543212', created_at: new Date().toISOString() },
    { id: 4, name: 'Sneha Patel',  email: 'sneha@example.com',  password: 'pass123', student_id: 'STU2024004', department: 'Computer Science',  year: 1, phone: '9876543213', created_at: new Date().toISOString() },
    { id: 5, name: 'Vikram Singh', email: 'vikram@example.com', password: 'pass123', student_id: 'STU2024005', department: 'Civil',             year: 3, phone: '9876543214', created_at: new Date().toISOString() }
  ]);

  // Sample pending applications
  dbSet(DB_KEYS.applications, [
    { id: 1, student_id: 1, preferred_block: 1, preferred_room_type: 'double', ac_preference: 'ac',     floor_preference: 2, roommate_preference: 'STU2024005', status: 'pending', applied_on: new Date().toISOString() },
    { id: 2, student_id: 2, preferred_block: 2, preferred_room_type: 'single', ac_preference: 'non_ac', floor_preference: 1, roommate_preference: '',            status: 'pending', applied_on: new Date().toISOString() },
    { id: 3, student_id: 3, preferred_block: 1, preferred_room_type: 'triple', ac_preference: 'ac',     floor_preference: 0, roommate_preference: '',            status: 'pending', applied_on: new Date().toISOString() }
  ]);

  dbSet(DB_KEYS.allotments, []);

  // Bills for test students (semester fees)
  const now = new Date();
  const dueDate1 = new Date(now.getFullYear(), now.getMonth() + 1, 15).toISOString();
  const dueDate2 = new Date(now.getFullYear(), now.getMonth() + 2, 1).toISOString();
  const pastDate = new Date(now.getFullYear(), now.getMonth() - 1, 10).toISOString();
  const paidDate = new Date(now.getFullYear(), now.getMonth() - 1, 5).toISOString();

  dbSet(DB_KEYS.bills, [
    { id: 1, student_id: 1, bill_type: 'room_rent',        description: 'Hostel Room Rent — Semester 1',   amount: 25000, due_date: dueDate1, status: 'unpaid', paid_on: null, created_at: pastDate },
    { id: 2, student_id: 1, bill_type: 'mess_charges',     description: 'Mess Charges — August 2026',      amount: 4500,  due_date: dueDate1, status: 'unpaid', paid_on: null, created_at: pastDate },
    { id: 3, student_id: 1, bill_type: 'caution_deposit',  description: 'Refundable Caution Deposit',      amount: 5000,  due_date: dueDate2, status: 'unpaid', paid_on: null, created_at: pastDate },
    { id: 4, student_id: 1, bill_type: 'maintenance',      description: 'Hostel Maintenance Fee',           amount: 2000,  due_date: pastDate, status: 'paid',   paid_on: paidDate, created_at: pastDate },
    { id: 5, student_id: 2, bill_type: 'room_rent',        description: 'Hostel Room Rent — Semester 1',   amount: 25000, due_date: dueDate1, status: 'unpaid', paid_on: null, created_at: pastDate },
    { id: 6, student_id: 2, bill_type: 'mess_charges',     description: 'Mess Charges — August 2026',      amount: 4500,  due_date: dueDate1, status: 'unpaid', paid_on: null, created_at: pastDate },
    { id: 7, student_id: 3, bill_type: 'room_rent',        description: 'Hostel Room Rent — Semester 1',   amount: 25000, due_date: dueDate1, status: 'paid',   paid_on: paidDate, created_at: pastDate },
    { id: 8, student_id: 3, bill_type: 'mess_charges',     description: 'Mess Charges — August 2026',      amount: 4500,  due_date: dueDate1, status: 'unpaid', paid_on: null, created_at: pastDate },
    { id: 9, student_id: 4, bill_type: 'room_rent',        description: 'Hostel Room Rent — Semester 1',   amount: 25000, due_date: dueDate1, status: 'unpaid', paid_on: null, created_at: pastDate },
    { id: 10, student_id: 5, bill_type: 'room_rent',       description: 'Hostel Room Rent — Semester 1',   amount: 25000, due_date: dueDate1, status: 'unpaid', paid_on: null, created_at: pastDate }
  ]);

  // Transactions / ledger entries for test students
  dbSet(DB_KEYS.transactions, [
    { id: 1, student_id: 1, type: 'charge',  description: 'Hostel Maintenance Fee charged',       amount: 2000,  date: pastDate,  balance_after: 2000 },
    { id: 2, student_id: 1, type: 'payment', description: 'Online Payment — Maintenance Fee',     amount: 2000,  date: paidDate,  balance_after: 0 },
    { id: 3, student_id: 1, type: 'charge',  description: 'Hostel Room Rent — Semester 1',        amount: 25000, date: pastDate,  balance_after: 25000 },
    { id: 4, student_id: 1, type: 'charge',  description: 'Mess Charges — August 2026',           amount: 4500,  date: pastDate,  balance_after: 29500 },
    { id: 5, student_id: 1, type: 'charge',  description: 'Refundable Caution Deposit',           amount: 5000,  date: pastDate,  balance_after: 34500 },
    { id: 6, student_id: 3, type: 'charge',  description: 'Hostel Room Rent — Semester 1',        amount: 25000, date: pastDate,  balance_after: 25000 },
    { id: 7, student_id: 3, type: 'payment', description: 'Online Payment — Room Rent',           amount: 25000, date: paidDate,  balance_after: 0 },
    { id: 8, student_id: 3, type: 'charge',  description: 'Mess Charges — August 2026',           amount: 4500,  date: pastDate,  balance_after: 4500 }
  ]);

  localStorage.setItem(DB_KEYS.initialized, '1');
  console.log('✅ HostelHub database seeded with demo data');
}

// Initialize DB on load
seedDatabase();

// ── API simulation layer ──
// All functions mimic the real REST API responses

function generateToken() {
  return 'tok_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function getBlockName(blockId) {
  const blocks = dbGet(DB_KEYS.blocks);
  const b = blocks.find(bl => bl.id == blockId);
  return b ? b.block_name : ('Block ' + blockId);
}

// ── API functions (replace fetch-based ones) ──

async function apiGet(url) {
  await new Promise(r => setTimeout(r, 100 + Math.random() * 200)); // simulate network delay

  // GET /api/hostel-blocks
  if (url === '/api/hostel-blocks') {
    const blocks = dbGet(DB_KEYS.blocks);
    return blocks.map(b => ({ id: b.id, name: b.block_name, total_floors: b.total_floors }));
  }

  // GET /api/rooms
  if (url === '/api/rooms') {
    const rooms = dbGet(DB_KEYS.rooms);
    return rooms.map(r => ({
      ...r,
      block_name: getBlockName(r.block_id)
    }));
  }

  // GET /api/application/status/{id}
  const appStatusMatch = url.match(/^\/api\/application\/status\/(\d+)$/);
  if (appStatusMatch) {
    const studentDbId = parseInt(appStatusMatch[1]);
    const apps = dbGet(DB_KEYS.applications);
    const app = apps.find(a => a.student_id === studentDbId);
    if (!app) throw new Error('No application found');
    return {
      ...app,
      preferred_block: getBlockName(app.preferred_block),
      created_at: app.applied_on
    };
  }

  // GET /api/allotment/{id}
  const allotMatch = url.match(/^\/api\/allotment\/(\d+)$/);
  if (allotMatch) {
    const studentDbId = parseInt(allotMatch[1]);
    const allotments = dbGet(DB_KEYS.allotments);
    const allot = allotments.find(a => a.student_id === studentDbId);
    if (!allot) throw new Error('No allotment found');
    const rooms = dbGet(DB_KEYS.rooms);
    const room = rooms.find(r => r.id === allot.room_id);
    return {
      ...allot,
      block_name: room ? getBlockName(room.block_id) : 'Unknown',
      room_number: room ? room.room_number : 'Unknown',
      floor: room ? room.floor : 0,
      room_type: room ? room.room_type : 'unknown',
      ac_type: room ? (room.ac_type || 'ac') : 'ac',
      allotted_at: allot.allotted_on
    };
  }

  // GET /api/applications (admin — with optional ?status= filter)
  if (url.startsWith('/api/applications')) {
    const params = new URLSearchParams(url.split('?')[1] || '');
    const statusFilter = params.get('status');
    const apps = dbGet(DB_KEYS.applications);
    const students = dbGet(DB_KEYS.students);

    let filtered = apps;
    if (statusFilter) filtered = filtered.filter(a => a.status === statusFilter);

    return filtered.map(a => {
      const stu = students.find(s => s.id === a.student_id);
      return {
        id: a.id,
        student_name: stu ? stu.name : 'Unknown',
        student_id: stu ? stu.student_id : 'N/A',
        department: stu ? stu.department : 'N/A',
        year: stu ? stu.year : 0,
        preferred_block: getBlockName(a.preferred_block),
        preferred_room_type: a.preferred_room_type,
        ac_preference: a.ac_preference || 'no_preference',
        floor_preference: a.floor_preference,
        status: a.status,
        applied_on: a.applied_on
      };
    });
  }

  // GET /api/admin/dashboard-stats
  if (url === '/api/admin/dashboard-stats') {
    const rooms = dbGet(DB_KEYS.rooms);
    const apps = dbGet(DB_KEYS.applications);
    const students = dbGet(DB_KEYS.students);
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(r => r.occupied_count > 0).length;
    const vacantRooms = rooms.filter(r => r.occupied_count < r.capacity).length;
    const pendingApps = apps.filter(a => a.status === 'pending').length;
    return {
      total_rooms: totalRooms,
      occupied_rooms: occupiedRooms,
      vacant_rooms: vacantRooms,
      pending_applications: pendingApps,
      total_students: students.length
    };
  }

  // GET /api/reports/occupancy
  if (url === '/api/reports/occupancy') {
    const rooms = dbGet(DB_KEYS.rooms);
    const blocks = dbGet(DB_KEYS.blocks);
    return blocks.map(b => {
      const blockRooms = rooms.filter(r => r.block_id === b.id);
      const totalCap = blockRooms.reduce((s, r) => s + r.capacity, 0);
      const totalOcc = blockRooms.reduce((s, r) => s + r.occupied_count, 0);
      return {
        block_name: b.block_name,
        total_rooms: blockRooms.length,
        total_capacity: totalCap,
        occupied: totalOcc,
        vacant: totalCap - totalOcc
      };
    });
  }

  // GET /api/reports/vacant-rooms
  if (url === '/api/reports/vacant-rooms') {
    const rooms = dbGet(DB_KEYS.rooms);
    return rooms
      .filter(r => r.occupied_count < r.capacity)
      .map(r => ({
        ...r,
        block_name: getBlockName(r.block_id),
        vacant_spots: r.capacity - r.occupied_count
      }));
  }

  // GET /api/bills/{student_id}
  const billsMatch = url.match(/^\/api\/bills\/(\d+)$/);
  if (billsMatch) {
    const studentDbId = parseInt(billsMatch[1]);
    const bills = dbGet(DB_KEYS.bills);
    const studentBills = bills.filter(b => b.student_id === studentDbId);
    // Check overdue
    const now = new Date();
    studentBills.forEach(b => {
      if (b.status === 'unpaid' && new Date(b.due_date) < now) b.status = 'overdue';
    });
    return studentBills;
  }

  // GET /api/transactions/{student_id}
  const txMatch = url.match(/^\/api\/transactions\/(\d+)$/);
  if (txMatch) {
    const studentDbId = parseInt(txMatch[1]);
    const txns = dbGet(DB_KEYS.transactions);
    return txns.filter(t => t.student_id === studentDbId).sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  // GET /api/bills/summary/{student_id}
  const billSumMatch = url.match(/^\/api\/bills\/summary\/(\d+)$/);
  if (billSumMatch) {
    const studentDbId = parseInt(billSumMatch[1]);
    const bills = dbGet(DB_KEYS.bills);
    const studentBills = bills.filter(b => b.student_id === studentDbId);
    const now = new Date();
    const totalCharged = studentBills.reduce((s, b) => s + b.amount, 0);
    const totalPaid = studentBills.filter(b => b.status === 'paid').reduce((s, b) => s + b.amount, 0);
    const outstanding = totalCharged - totalPaid;
    const overdue = studentBills.filter(b => b.status !== 'paid' && new Date(b.due_date) < now).reduce((s, b) => s + b.amount, 0);
    return { total_charged: totalCharged, total_paid: totalPaid, outstanding: outstanding, overdue: overdue };
  }

  throw new Error('API endpoint not found: ' + url);
}

async function apiPost(url, body) {
  await new Promise(r => setTimeout(r, 150 + Math.random() * 200));

  // POST /api/student/register
  if (url === '/api/student/register') {
    const students = dbGet(DB_KEYS.students);
    if (!body.name || !body.email || !body.password || !body.student_id) {
      throw new Error('All fields are required');
    }
    if (students.find(s => s.email === body.email)) {
      throw new Error('Email already registered');
    }
    if (students.find(s => s.student_id === body.student_id)) {
      throw new Error('Student ID already exists');
    }
    const newStudent = {
      id: nextId(students),
      name: body.name,
      email: body.email,
      password: body.password,
      student_id: body.student_id,
      department: body.department || '',
      year: body.year || 1,
      phone: body.phone || '',
      created_at: new Date().toISOString()
    };
    students.push(newStudent);
    dbSet(DB_KEYS.students, students);
    return { message: 'Registration successful', id: newStudent.id };
  }

  // POST /api/student/login
  if (url === '/api/student/login') {
    const students = dbGet(DB_KEYS.students);
    const emailInput = (body.email || '').trim().toLowerCase();
    const passInput = (body.password || '').trim();
    const stu = students.find(s => s.email.toLowerCase() === emailInput && s.password === passInput);
    if (!stu) throw new Error('Invalid student email or password');
    const token = generateToken();
    return {
      token: token,
      user: { id: stu.id, name: stu.name, email: stu.email, student_id: stu.student_id, department: stu.department, year: stu.year }
    };
  }

  // POST /api/admin/login
  if (url === '/api/admin/login') {
    let admins = dbGet(DB_KEYS.admins);
    if (!admins || admins.length === 0) {
      admins = [{ id: 1, username: 'admin', password: 'admin123' }];
      dbSet(DB_KEYS.admins, admins);
    }
    const userInput = (body.username || '').trim().toLowerCase();
    const passInput = (body.password || '').trim();
    const adm = admins.find(a => (a.username.toLowerCase() === userInput || (a.email && a.email.toLowerCase() === userInput)) && a.password === passInput);
    if (!adm) throw new Error('Invalid admin username or password. Default is admin / admin123');
    const token = generateToken();
    return {
      token: token,
      user: { id: adm.id, name: adm.username, username: adm.username }
    };
  }

  // POST /api/application/submit
  if (url === '/api/application/submit') {
    const user = getUser();
    if (!user) throw new Error('Not authenticated');
    const apps = dbGet(DB_KEYS.applications);
    const existingApp = apps.find(a => a.student_id === user.id && a.status === 'pending');
    if (existingApp) throw new Error('You already have a pending application');
    const newApp = {
      id: nextId(apps),
      student_id: user.id,
      preferred_block: parseInt(body.preferred_block) || body.preferred_block,
      preferred_room_type: body.preferred_room_type,
      ac_preference: body.ac_preference || 'no_preference',
      floor_preference: body.floor_preference || 0,
      roommate_preference: body.roommate_preference || '',
      status: 'pending',
      applied_on: new Date().toISOString()
    };
    apps.push(newApp);
    dbSet(DB_KEYS.applications, apps);
    return { message: 'Application submitted successfully' };
  }

  // POST /api/rooms/add (admin)
  if (url === '/api/rooms/add') {
    const rooms = dbGet(DB_KEYS.rooms);
    const newRoom = {
      id: nextId(rooms),
      block_id: parseInt(body.block_id),
      room_number: body.room_number,
      floor: parseInt(body.floor),
      room_type: body.room_type,
      ac_type: body.ac_type || 'ac',
      capacity: parseInt(body.capacity),
      occupied_count: 0,
      status: 'available'
    };
    rooms.push(newRoom);
    dbSet(DB_KEYS.rooms, rooms);
    return { message: 'Room added successfully', id: newRoom.id };
  }

  // POST /api/allotment/auto-run (admin)
  if (url === '/api/allotment/auto-run') {
    const apps = dbGet(DB_KEYS.applications);
    const rooms = dbGet(DB_KEYS.rooms);
    const allotments = dbGet(DB_KEYS.allotments);

    const pendingApps = apps
      .filter(a => a.status === 'pending')
      .sort((a, b) => {
        // Sort by year DESC (seniority), then applied_on ASC (FCFS)
        const students = dbGet(DB_KEYS.students);
        const sa = students.find(s => s.id === a.student_id);
        const sb = students.find(s => s.id === b.student_id);
        const ya = sa ? sa.year : 0;
        const yb = sb ? sb.year : 0;
        if (yb !== ya) return yb - ya;
        return new Date(a.applied_on) - new Date(b.applied_on);
      });

    let allottedCount = 0;
    let waitlistedCount = 0;

    pendingApps.forEach(app => {
      // 1. Try exact match (block + type + AC preference + floor)
      let room = rooms.find(r =>
        r.block_id == app.preferred_block &&
        r.room_type === app.preferred_room_type &&
        (app.ac_preference === 'no_preference' || !app.ac_preference || r.ac_type === app.ac_preference) &&
        (app.floor_preference === 0 || r.floor == app.floor_preference) &&
        r.occupied_count < r.capacity &&
        r.status === 'available'
      );

      // 2. Try block + type + AC preference
      if (!room) {
        room = rooms.find(r =>
          r.block_id == app.preferred_block &&
          r.room_type === app.preferred_room_type &&
          (app.ac_preference === 'no_preference' || !app.ac_preference || r.ac_type === app.ac_preference) &&
          r.occupied_count < r.capacity &&
          r.status === 'available'
        );
      }

      // 3. Try block + type
      if (!room) {
        room = rooms.find(r =>
          r.block_id == app.preferred_block &&
          r.room_type === app.preferred_room_type &&
          r.occupied_count < r.capacity &&
          r.status === 'available'
        );
      }

      // 4. Try any block, preferred type + AC
      if (!room) {
        room = rooms.find(r =>
          r.room_type === app.preferred_room_type &&
          (app.ac_preference === 'no_preference' || !app.ac_preference || r.ac_type === app.ac_preference) &&
          r.occupied_count < r.capacity &&
          r.status === 'available'
        );
      }

      // 5. Try any available room
      if (!room) {
        room = rooms.find(r =>
          r.occupied_count < r.capacity &&
          r.status === 'available'
        );
      }

      if (room) {
        // Allot room
        room.occupied_count++;
        if (room.occupied_count >= room.capacity) room.status = 'full';
        app.status = 'allotted';

        allotments.push({
          id: nextId(allotments),
          application_id: app.id,
          room_id: room.id,
          student_id: app.student_id,
          allotted_on: new Date().toISOString(),
          allotted_by: 'auto'
        });
        allottedCount++;
      } else {
        app.status = 'waitlisted';
        waitlistedCount++;
      }
    });

    dbSet(DB_KEYS.rooms, rooms);
    dbSet(DB_KEYS.applications, apps);
    dbSet(DB_KEYS.allotments, allotments);

    return {
      message: `Auto-allotment complete: ${allottedCount} allotted, ${waitlistedCount} waitlisted`,
      allotted_count: allottedCount,
      waitlisted_count: waitlistedCount,
      total_processed: allottedCount + waitlistedCount
    };
  }

  // POST /api/allotment/manual-assign (admin)
  if (url === '/api/allotment/manual-assign') {
    const rooms = dbGet(DB_KEYS.rooms);
    const apps = dbGet(DB_KEYS.applications);
    const allotments = dbGet(DB_KEYS.allotments);
    const room = rooms.find(r => r.id == body.room_id);
    if (!room) throw new Error('Room not found');
    if (room.occupied_count >= room.capacity) throw new Error('Room is full');

    const pendingApp = apps.find(a => a.student_id == body.student_id && a.status === 'pending');
    if (!pendingApp) throw new Error('No pending application for this student');

    room.occupied_count++;
    if (room.occupied_count >= room.capacity) room.status = 'full';
    pendingApp.status = 'allotted';

    allotments.push({
      id: nextId(allotments),
      application_id: pendingApp.id,
      room_id: room.id,
      student_id: parseInt(body.student_id),
      allotted_on: new Date().toISOString(),
      allotted_by: 'manual'
    });

    dbSet(DB_KEYS.rooms, rooms);
    dbSet(DB_KEYS.applications, apps);
    dbSet(DB_KEYS.allotments, allotments);
    return { message: 'Room assigned successfully' };
  }

  // POST /api/bills/pay
  if (url === '/api/bills/pay') {
    const bills = dbGet(DB_KEYS.bills);
    const bill = bills.find(b => b.id == body.bill_id);
    if (!bill) throw new Error('Bill not found');
    if (bill.status === 'paid') throw new Error('Bill already paid');

    bill.status = 'paid';
    bill.paid_on = new Date().toISOString();
    dbSet(DB_KEYS.bills, bills);

    // Add transaction
    const txns = dbGet(DB_KEYS.transactions);
    const studentTxns = txns.filter(t => t.student_id === bill.student_id);
    const lastBalance = studentTxns.length > 0 ? studentTxns[studentTxns.length - 1].balance_after : 0;
    txns.push({
      id: nextId(txns),
      student_id: bill.student_id,
      type: 'payment',
      description: 'Online Payment — ' + bill.description,
      amount: bill.amount,
      date: new Date().toISOString(),
      balance_after: Math.max(0, lastBalance - bill.amount)
    });
    dbSet(DB_KEYS.transactions, txns);

  // POST /api/admin/issue-bill (admin)
  if (url === '/api/admin/issue-bill') {
    const students = dbGet(DB_KEYS.students);
    const student = students.find(s => s.id == body.student_id || s.student_id === body.student_id);
    if (!student) throw new Error('Student not found');
    if (!body.amount || parseFloat(body.amount) <= 0) throw new Error('Valid bill amount is required');
    if (!body.description) throw new Error('Bill description is required');

    const bills = dbGet(DB_KEYS.bills);
    const newBill = {
      id: nextId(bills),
      student_id: student.id,
      bill_type: body.bill_type || 'other',
      description: body.description,
      amount: parseFloat(body.amount),
      due_date: body.due_date || new Date(Date.now() + 15 * 86400000).toISOString(),
      status: 'unpaid',
      paid_on: null,
      created_at: new Date().toISOString()
    };
    bills.push(newBill);
    dbSet(DB_KEYS.bills, bills);

    // Add transaction entry in student ledger
    const txns = dbGet(DB_KEYS.transactions);
    const studentTxns = txns.filter(t => t.student_id === student.id);
    const lastBalance = studentTxns.length > 0 ? studentTxns[studentTxns.length - 1].balance_after : 0;
    txns.push({
      id: nextId(txns),
      student_id: student.id,
      type: 'charge',
      description: body.description,
      amount: parseFloat(body.amount),
      date: new Date().toISOString(),
      balance_after: lastBalance + parseFloat(body.amount)
    });
    dbSet(DB_KEYS.transactions, txns);

    // Add student notification
    addStudentNotification(student.id, '📢', `New bill issued: ${body.description} - ₹${parseFloat(body.amount).toLocaleString('en-IN')}`);

    return { message: `Bill issued successfully to ${student.name}`, bill_id: newBill.id };
  }

  throw new Error('API endpoint not found: ' + url);
}

async function apiPut(url, body) {
  await new Promise(r => setTimeout(r, 100 + Math.random() * 150));

  // PUT /api/application/status-update/{id}
  const statusMatch = url.match(/^\/api\/application\/status-update\/(\d+)$/);
  if (statusMatch) {
    const appId = parseInt(statusMatch[1]);
    const apps = dbGet(DB_KEYS.applications);
    const app = apps.find(a => a.id === appId);
    if (!app) throw new Error('Application not found');
    app.status = body.status;
    dbSet(DB_KEYS.applications, apps);
    return { message: 'Status updated to ' + body.status };
  }

  // PUT /api/rooms/update/{id}
  const roomMatch = url.match(/^\/api\/rooms\/update\/(\d+)$/);
  if (roomMatch) {
    const roomId = parseInt(roomMatch[1]);
    const rooms = dbGet(DB_KEYS.rooms);
    const room = rooms.find(r => r.id === roomId);
    if (!room) throw new Error('Room not found');
    if (body.room_number !== undefined) room.room_number = body.room_number;
    if (body.floor !== undefined) room.floor = parseInt(body.floor);
    if (body.room_type !== undefined) room.room_type = body.room_type;
    if (body.ac_type !== undefined) room.ac_type = body.ac_type;
    if (body.capacity !== undefined) room.capacity = parseInt(body.capacity);
    if (body.status !== undefined) room.status = body.status;
    dbSet(DB_KEYS.rooms, rooms);
    return { message: 'Room updated successfully' };
  }

  throw new Error('API endpoint not found: ' + url);
}

async function apiDelete(url) {
  await new Promise(r => setTimeout(r, 100));

  // DELETE /api/rooms/delete/{id}
  const roomMatch = url.match(/^\/api\/rooms\/delete\/(\d+)$/);
  if (roomMatch) {
    const roomId = parseInt(roomMatch[1]);
    let rooms = dbGet(DB_KEYS.rooms);
    const allotments = dbGet(DB_KEYS.allotments);
    const activeAllotments = allotments.filter(a => a.room_id === roomId);
    if (activeAllotments.length > 0) throw new Error('Cannot delete room with active allotments');
    rooms = rooms.filter(r => r.id !== roomId);
    dbSet(DB_KEYS.rooms, rooms);
    return { message: 'Room deleted successfully' };
  }

  // DELETE /api/admin/bills/delete/{id} (admin)
  const delBillMatch = url.match(/^\/api\/admin\/bills\/delete\/(\d+)$/);
  if (delBillMatch) {
    const billId = parseInt(delBillMatch[1]);
    let bills = dbGet(DB_KEYS.bills);
    bills = bills.filter(b => b.id !== billId);
    dbSet(DB_KEYS.bills, bills);
    return { message: 'Bill cancelled/deleted successfully' };
  }

  throw new Error('API endpoint not found: ' + url);
}

function addStudentNotification(studentId, icon, message) {
  try {
    const all = JSON.parse(localStorage.getItem('hh_notifications') || '[]');
    all.push({
      id: Date.now(),
      student_id: studentId,
      icon: icon,
      message: message,
      timestamp: new Date().toISOString(),
      read: false
    });
    localStorage.setItem('hh_notifications', JSON.stringify(all));
  } catch(e) {}
}

window.apiGet = apiGet;
window.apiPost = apiPost;
window.apiPut = apiPut;
window.apiDelete = apiDelete;
window.getToken = getToken;
window.setToken = setToken;
window.clearToken = clearToken;
window.getUser = getUser;
window.setUser = setUser;
window.isAdmin = isAdmin;
window.setRole = setRole;
window.clearAuth = clearAuth;
window.addStudentNotification = addStudentNotification;

console.log('🏠 HostelHub running in standalone mode (no server needed)');
