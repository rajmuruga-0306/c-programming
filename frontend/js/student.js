const studentLinks = [
  { href: '#/student/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '#/student/rooms', icon: '🏠', label: 'Explore Rooms' },
  { href: '#/student/apply', icon: '📝', label: 'Apply for Room' },
  { href: '#/student/allotment', icon: '🔑', label: 'My Allotment' },
  { href: '#/student/bills', icon: '💰', label: 'Bills & Payments' },
  { href: '#/student/statement', icon: '📄', label: 'Statement' },
  { href: '#/student/profile', icon: '👤', label: 'My Profile' },
  { href: '#/student/notifications', icon: '📢', label: 'Notifications' }
];

// ─────────────────────────────────────────────
// 1. STUDENT DASHBOARD
// ─────────────────────────────────────────────
async function renderStudentDashboard() {
  const user = getUser();
  
  const content = `
    <div class="mb-4">
      <h2>Welcome back, ${escapeHtml(user.name)}! 👋</h2>
      <p class="text-secondary">Student ID: ${escapeHtml(user.student_id)} • ${escapeHtml(user.department)} • Year ${user.year}</p>
    </div>

    <div class="grid-4" id="student-stat-cards">
      <div class="card stat-card">
        <div class="stat-card-icon">📝</div>
        <div class="stat-card-info">
          <h3>Application</h3>
          <p id="dash-app-status" style="font-size:1.2rem">—</p>
        </div>
      </div>
      <div class="card stat-card" style="border-left-color: var(--success);">
        <div class="stat-card-icon">🔑</div>
        <div class="stat-card-info">
          <h3>Room</h3>
          <p id="dash-room-info" style="font-size:1.2rem">—</p>
        </div>
      </div>
      <div class="card stat-card" style="border-left-color: var(--info);">
        <div class="stat-card-icon">🏠</div>
        <div class="stat-card-info">
          <h3>Available Rooms</h3>
          <p id="dash-avail-rooms" style="font-size:1.2rem">—</p>
        </div>
      </div>
      <div class="card stat-card" style="border-left-color: hsl(270,70%,55%);">
        <div class="stat-card-icon">📢</div>
        <div class="stat-card-info">
          <h3>Notifications</h3>
          <p id="dash-notif-count" style="font-size:1.2rem">—</p>
        </div>
      </div>
    </div>
    
    <div id="dashboard-content" class="mt-4">
      <div class="spinner"></div>
    </div>

    <div class="card mt-4">
      <h3 class="mb-3">Quick Actions</h3>
      <div class="flex gap-2" style="flex-wrap: wrap">
        <a href="#/student/rooms" class="btn btn-outline">🏠 Explore Rooms</a>
        <a href="#/student/apply" class="btn btn-primary">📝 Apply for Room</a>
        <a href="#/student/allotment" class="btn btn-outline">🔑 Check Allotment</a>
        <a href="#/student/profile" class="btn btn-outline">👤 Edit Profile</a>
      </div>
    </div>
  `;
  
  document.getElementById('app').innerHTML = renderLayout(studentLinks, '#/student/dashboard', content);
  
  // Load dashboard data
  try {
    let appStatus = null;
    let allotment = null;
    
    try { appStatus = await apiGet(`/api/application/status/${user.id}`); } catch(e) {}
    try { allotment = await apiGet(`/api/allotment/${user.id}`); } catch(e) {}

    // Available rooms count
    try {
      const rooms = await apiGet('/api/rooms');
      const avail = rooms.filter(r => r.occupied_count < r.capacity).length;
      document.getElementById('dash-avail-rooms').textContent = avail;
    } catch(e) { document.getElementById('dash-avail-rooms').textContent = '—'; }

    // Notifications count
    const notifs = getStudentNotifications(user.id);
    const unread = notifs.filter(n => !n.read).length;
    document.getElementById('dash-notif-count').textContent = unread > 0 ? unread : '0';

    // Application status
    if (appStatus && !appStatus.error) {
      document.getElementById('dash-app-status').innerHTML = statusBadge(appStatus.status);
    } else {
      document.getElementById('dash-app-status').innerHTML = '<span class="text-secondary" style="font-size:0.9rem">Not Applied</span>';
    }

    // Room info
    if (allotment && !allotment.error) {
      document.getElementById('dash-room-info').innerHTML = `<span style="color:var(--success);font-size:1rem">${escapeHtml(allotment.room_number)}</span>`;
    } else {
      document.getElementById('dash-room-info').innerHTML = '<span class="text-secondary" style="font-size:0.9rem">Not Allotted</span>';
    }
    
    // Main content area
    let html = '';
    
    if (allotment && !allotment.error) {
      html += `
        <div class="card mb-4" style="border-left: 4px solid var(--success);">
          <div class="flex-between">
            <div>
              <h3>🎉 Room Allotted!</h3>
              <p class="mb-2">You have been assigned to <strong>${escapeHtml(allotment.block_name)} — Room ${escapeHtml(allotment.room_number)}</strong></p>
              <div class="grid-2">
                <div><strong>Floor:</strong> ${allotment.floor}</div>
                <div><strong>Type:</strong> ${roomTypeLabel(allotment.room_type)}</div>
              </div>
            </div>
            <a href="#/student/allotment" class="btn btn-outline">View Details →</a>
          </div>
        </div>
      `;
    } else if (appStatus && !appStatus.error) {
      const statusColor = appStatus.status === 'pending' ? 'var(--warning)' : 
                          appStatus.status === 'waitlisted' ? 'var(--info)' : 
                          appStatus.status === 'rejected' ? 'var(--danger)' : 'var(--success)';
      html += `
        <div class="card mb-4" style="border-left: 4px solid ${statusColor};">
          <h3>Application Status</h3>
          <p class="mb-2">Your room application is: ${statusBadge(appStatus.status)}</p>
          <div class="grid-2 mt-2">
            <div><strong>Preferred Block:</strong> ${escapeHtml(appStatus.preferred_block)}</div>
            <div><strong>Room Type:</strong> ${roomTypeLabel(appStatus.preferred_room_type)}</div>
          </div>
          <p class="text-secondary mt-2" style="font-size:0.85rem">Applied on: ${formatDate(appStatus.created_at)}</p>
        </div>
      `;
    } else {
      html += `
        <div class="card mb-4 text-center" style="padding: 2.5rem;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🏠</div>
          <h3>No Application Found</h3>
          <p class="text-secondary mb-3">You haven't applied for a hostel room yet.</p>
          <a href="#/student/apply" class="btn btn-primary">Apply Now 📝</a>
        </div>
      `;
    }

    // Recent notifications
    if (notifs.length > 0) {
      html += `<div class="card"><h3 class="mb-3">Recent Notifications 📢</h3>`;
      notifs.slice(0, 3).forEach(n => {
        html += `
          <div style="padding: 0.75rem; border-bottom: 1px solid var(--surface-border); display: flex; align-items: center; gap: 0.75rem;">
            <span style="font-size: 1.3rem">${n.icon}</span>
            <div style="flex:1">
              <p style="margin:0; font-size: 0.9rem;">${escapeHtml(n.message)}</p>
              <p style="margin:0; font-size: 0.75rem; color: var(--text-secondary)">${formatDateTime(n.timestamp)}</p>
            </div>
          </div>
        `;
      });
      if (notifs.length > 3) html += `<p class="mt-2" style="font-size:0.85rem"><a href="#/student/notifications">View all ${notifs.length} notifications →</a></p>`;
      html += `</div>`;
    }
    
    document.getElementById('dashboard-content').innerHTML = html;
  } catch (err) {
    document.getElementById('dashboard-content').innerHTML = `<p class="text-secondary text-center">Failed to load dashboard data.</p>`;
  }
}

// ─────────────────────────────────────────────
// 2. ROOM EXPLORER — Browse available rooms
// ─────────────────────────────────────────────
async function renderRoomExplorer() {
  const content = `
    <h2>Explore Available Rooms 🏠</h2>
    <p class="text-secondary mb-4">Browse all hostel rooms and their availability before applying.</p>

    <div class="card mb-4">
      <div class="flex gap-2" style="flex-wrap: wrap">
        <div class="form-group" style="margin-bottom:0; flex:1; min-width:140px">
          <select id="exp-block" class="input" onchange="loadExplorerRooms()">
            <option value="">All Blocks</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0; flex:1; min-width:140px">
          <select id="exp-type" class="input" onchange="loadExplorerRooms()">
            <option value="">All Types</option>
            <option value="single">Single</option>
            <option value="double">Double</option>
            <option value="triple">Triple</option>
            <option value="dorm">Dorm</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0; flex:1; min-width:140px">
          <select id="exp-ac" class="input" onchange="loadExplorerRooms()">
            <option value="">All A/C Types</option>
            <option value="ac">❄️ A/C Only</option>
            <option value="non_ac">🔥 Non-A/C Only</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0; flex:1; min-width:140px">
          <select id="exp-avail" class="input" onchange="loadExplorerRooms()">
            <option value="available">Available Only</option>
            <option value="">All Rooms</option>
          </select>
        </div>
      </div>
    </div>

    <div id="explorer-stats" class="grid-4 mb-4"></div>
    <div id="explorer-rooms"><div class="spinner"></div></div>
  `;

  document.getElementById('app').innerHTML = renderLayout(studentLinks, '#/student/rooms', content);

  // Populate block filter
  try {
    const blocks = await apiGet('/api/hostel-blocks');
    const select = document.getElementById('exp-block');
    blocks.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.id; opt.textContent = b.name;
      select.appendChild(opt);
    });
  } catch(e) {}

  loadExplorerRooms();
}

async function loadExplorerRooms() {
  showLoading('explorer-rooms');
  try {
    const allRooms = await apiGet('/api/rooms');
    const blockFilter = document.getElementById('exp-block').value;
    const typeFilter = document.getElementById('exp-type').value;
    const acFilter = document.getElementById('exp-ac') ? document.getElementById('exp-ac').value : '';
    const availFilter = document.getElementById('exp-avail').value;

    let rooms = allRooms;
    if (blockFilter) rooms = rooms.filter(r => r.block_id == blockFilter);
    if (typeFilter) rooms = rooms.filter(r => r.room_type === typeFilter);
    if (acFilter) rooms = rooms.filter(r => (r.ac_type || 'ac') === acFilter);
    if (availFilter === 'available') rooms = rooms.filter(r => r.occupied_count < r.capacity && r.status === 'available');

    // Stats
    const totalShown = rooms.length;
    const availCount = rooms.filter(r => r.occupied_count < r.capacity).length;
    const totalSpots = rooms.reduce((s, r) => s + Math.max(0, r.capacity - r.occupied_count), 0);

    document.getElementById('explorer-stats').innerHTML = `
      <div class="card stat-card">
        <div class="stat-card-icon">🏠</div>
        <div class="stat-card-info"><h3>Rooms Shown</h3><p>${totalShown}</p></div>
      </div>
      <div class="card stat-card" style="border-left-color:var(--success)">
        <div class="stat-card-icon">✅</div>
        <div class="stat-card-info"><h3>Available</h3><p>${availCount}</p></div>
      </div>
      <div class="card stat-card" style="border-left-color:var(--info)">
        <div class="stat-card-icon">🛏️</div>
        <div class="stat-card-info"><h3>Open Spots</h3><p>${totalSpots}</p></div>
      </div>
    `;

    if (rooms.length === 0) {
      document.getElementById('explorer-rooms').innerHTML = `
        <div class="card text-center" style="padding:2rem">
          <p class="text-secondary">No rooms match your filters.</p>
        </div>`;
      return;
    }

    // Group by block
    const blocks = {};
    rooms.forEach(r => {
      const bname = r.block_name || 'Block ' + r.block_id;
      if (!blocks[bname]) blocks[bname] = [];
      blocks[bname].push(r);
    });

    let html = '';
    for (const [blockName, blockRooms] of Object.entries(blocks)) {
      html += `<div class="card mb-4"><h3 class="mb-3">${escapeHtml(blockName)}</h3>`;
      html += `<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem;">`;
      
      blockRooms.forEach(r => {
        const isFull = r.occupied_count >= r.capacity;
        const spotColor = isFull ? 'var(--danger)' : r.occupied_count > 0 ? 'var(--warning)' : 'var(--success)';
        const spots = r.capacity - r.occupied_count;
        
        html += `
          <div style="
            background: rgba(255,255,255,0.03);
            border: 1px solid ${isFull ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'};
            border-radius: var(--radius-sm);
            padding: 1rem;
            transition: var(--transition);
            ${isFull ? 'opacity: 0.5;' : ''}
          " ${!isFull ? 'onmouseover="this.style.transform=\'translateY(-2px)\';this.style.borderColor=\'rgba(99,102,241,0.3)\'" onmouseout="this.style.transform=\'none\';this.style.borderColor=\'rgba(255,255,255,0.08)\'"' : ''}>
            <div class="flex-between" style="margin-bottom: 0.5rem">
              <strong style="font-size: 1.1rem">${escapeHtml(r.room_number)}</strong>
              ${acBadge(r.ac_type || 'ac')}
            </div>
            <div style="font-size: 0.85rem; color: var(--text-secondary)">
              <div>Floor ${r.floor} • ${roomTypeLabel(r.room_type)}</div>
              <div class="flex-between mt-1 mb-1">
                <span style="font-size: 0.75rem; padding: 2px 8px; border-radius: 12px; background: ${spotColor}20; color: ${spotColor}">${isFull ? 'Full' : spots + ' spot' + (spots > 1 ? 's' : '') + ' left'}</span>
                <span style="font-size:0.75rem">${r.occupied_count}/${r.capacity}</span>
              </div>
              <div>
                <div class="progress-bg" style="height:6px"><div class="progress-fill" style="width:${(r.occupied_count/r.capacity)*100}%; background: ${spotColor}"></div></div>
              </div>
            </div>
          </div>
        `;
      });
      html += `</div></div>`;
    }

    document.getElementById('explorer-rooms').innerHTML = html;
  } catch(err) {
    document.getElementById('explorer-rooms').innerHTML = `<p class="text-danger text-center">Failed to load rooms.</p>`;
  }
}

// ─────────────────────────────────────────────
// 3. APPLY FOR ROOM (Preference Form)
// ─────────────────────────────────────────────
async function renderPreferenceForm() {
  const content = `
    <h2>Apply for Hostel Room 📝</h2>
    <p class="text-secondary mb-4">Submit your preferences for room allotment. The system matches you based on availability and seniority.</p>
    <div id="apply-content"><div class="spinner"></div></div>
  `;
  document.getElementById('app').innerHTML = renderLayout(studentLinks, '#/student/apply', content);
  
  try {
    const user = getUser();
    let appStatus = null;
    try { appStatus = await apiGet(`/api/application/status/${user.id}`); } catch(e) {}
    
    if (appStatus && !appStatus.error) {
      const statusColor = appStatus.status === 'pending' ? 'var(--warning)' :
                          appStatus.status === 'allotted' ? 'var(--success)' :
                          appStatus.status === 'rejected' ? 'var(--danger)' : 'var(--info)';
      document.getElementById('apply-content').innerHTML = `
        <div class="card" style="border-left: 4px solid ${statusColor};">
          <h3>Application Already Submitted</h3>
          <p class="mb-3">Your room application is currently: ${statusBadge(appStatus.status)}</p>
          <div class="grid-2 mt-2">
            <div><strong>Preferred Block:</strong> ${escapeHtml(appStatus.preferred_block)}</div>
            <div><strong>Room Type:</strong> ${roomTypeLabel(appStatus.preferred_room_type)}</div>
          </div>
          <p class="text-secondary mt-3" style="font-size:0.85rem">Submitted: ${formatDate(appStatus.created_at)}</p>
          <div class="flex gap-2 mt-3">
            <a href="#/student/dashboard" class="btn btn-primary">Back to Dashboard</a>
            <a href="#/student/allotment" class="btn btn-outline">Check Allotment</a>
          </div>
        </div>
      `;
      return;
    }
    
    // Load blocks for the form
    const blocksRes = await apiGet('/api/hostel-blocks').catch(() => []);
    let blocksHtml = '<option value="">Select Preferred Block</option>';
    if (Array.isArray(blocksRes)) {
      blocksHtml += blocksRes.map(b => `<option value="${b.id}">${escapeHtml(b.name)} (${b.total_floors} floors)</option>`).join('');
    }

    // Load available room counts per type
    let roomStats = '';
    try {
      const rooms = await apiGet('/api/rooms');
      const avail = rooms.filter(r => r.occupied_count < r.capacity);
      const singles = avail.filter(r => r.room_type === 'single').length;
      const doubles = avail.filter(r => r.room_type === 'double').length;
      const triples = avail.filter(r => r.room_type === 'triple').length;
      const dorms = avail.filter(r => r.room_type === 'dorm').length;
      roomStats = `
        <div class="card mb-4" style="background: rgba(99,102,241,0.06); border-color: rgba(99,102,241,0.15);">
          <h4 style="margin-bottom: 0.75rem; font-size: 0.95rem;">🏠 Currently Available Rooms</h4>
          <div class="flex gap-2" style="flex-wrap:wrap">
            <span style="padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; background: rgba(255,255,255,0.06);">Single: <strong>${singles}</strong></span>
            <span style="padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; background: rgba(255,255,255,0.06);">Double: <strong>${doubles}</strong></span>
            <span style="padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; background: rgba(255,255,255,0.06);">Triple: <strong>${triples}</strong></span>
            <span style="padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; background: rgba(255,255,255,0.06);">Dorm: <strong>${dorms}</strong></span>
          </div>
        </div>
      `;
    } catch(e) {}
    
    document.getElementById('apply-content').innerHTML = `
      ${roomStats}
      <div class="card">
        <form id="apply-form" onsubmit="submitApplication(event)">
          <div class="grid-2">
            <div class="form-group">
              <label>Preferred Block *</label>
              <select id="pref-block" class="input" required>
                ${blocksHtml}
              </select>
            </div>
            <div class="form-group">
              <label>Preferred Room Type *</label>
              <select id="pref-type" class="input" required>
                <option value="">Select Room Type</option>
                <option value="single">🛏️ Single (1 person)</option>
                <option value="double">🛏️🛏️ Double (2 persons)</option>
                <option value="triple">🛏️🛏️🛏️ Triple (3 persons)</option>
                <option value="dorm">🛏️+ Dorm (6 persons)</option>
              </select>
            </div>
          </div>
          
          <div class="grid-2">
            <div class="form-group">
              <label>A/C Preference *</label>
              <select id="pref-ac" class="input" required>
                <option value="ac">❄️ Air Conditioned (A/C)</option>
                <option value="non_ac">🔥 Non-A/C (Standard)</option>
                <option value="no_preference">⚡ No Preference</option>
              </select>
            </div>
            <div class="form-group">
              <label>Floor Preference</label>
              <select id="pref-floor" class="input">
                <option value="0">No Preference</option>
                <option value="1">1st Floor (Ground)</option>
                <option value="2">2nd Floor</option>
                <option value="3">3rd Floor</option>
                <option value="4">4th Floor</option>
                <option value="5">5th Floor</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Roommate Preference (Student ID)</label>
            <input type="text" id="pref-roommate" class="input" placeholder="e.g. STU2024005">
            <small style="color: var(--text-secondary); font-size: 0.75rem;">Leave blank if no preference</small>
          </div>

          <div class="form-group">
            <label>Special Requirements (Optional)</label>
            <textarea id="pref-notes" class="input" rows="3" placeholder="Any medical conditions, accessibility needs, or special requests..." style="resize: vertical; font-family: var(--font-body);"></textarea>
          </div>
          
          <div style="border-top: 1px solid var(--surface-border); padding-top: 1.5rem; margin-top: 1rem;">
            <div class="flex gap-2" style="align-items: center; margin-bottom: 1rem;">
              <input type="checkbox" id="pref-agree" required style="width:18px; height:18px; cursor:pointer">
              <label for="pref-agree" style="margin:0; font-size:0.9rem; cursor:pointer">I understand that room allotment is subject to availability and admin approval</label>
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%">Submit Application ✅</button>
          </div>
        </form>
      </div>
    `;
  } catch (err) {
    document.getElementById('apply-content').innerHTML = `<p class="text-secondary">Error loading form.</p>`;
  }
}

async function submitApplication(e) {
  e.preventDefault();
  const body = {
    preferred_block: document.getElementById('pref-block').value,
    preferred_room_type: document.getElementById('pref-type').value,
    ac_preference: document.getElementById('pref-ac').value,
    floor_preference: parseInt(document.getElementById('pref-floor').value),
    roommate_preference: document.getElementById('pref-roommate').value
  };
  
  try {
    await apiPost('/api/application/submit', body);
    
    // Add notification
    const user = getUser();
    addStudentNotification(user.id, '📝', 'Your room application has been submitted successfully!');
    
    showToast('Application submitted successfully!', 'success');
    window.location.hash = '#/student/dashboard';
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ─────────────────────────────────────────────
// 4. MY ALLOTMENT — View room allotment details
// ─────────────────────────────────────────────
async function renderStudentAllotment() {
  const content = `
    <h2>My Allotment 🔑</h2>
    <p class="text-secondary mb-4">Your hostel room assignment details.</p>
    <div id="allotment-content"><div class="spinner"></div></div>
  `;
  document.getElementById('app').innerHTML = renderLayout(studentLinks, '#/student/allotment', content);
  
  try {
    const user = getUser();
    let allotment = null;
    let appStatus = null;
    
    try { allotment = await apiGet(`/api/allotment/${user.id}`); } catch(e) {}
    try { appStatus = await apiGet(`/api/application/status/${user.id}`); } catch(e) {}
    
    if (allotment && !allotment.error) {
      document.getElementById('allotment-content').innerHTML = `
        <div class="card" id="print-area" style="border: 1px solid rgba(16,185,129,0.2);">
          <div class="flex-between mb-4" style="border-bottom: 1px solid var(--surface-border); padding-bottom: 1rem;">
            <div>
              <h3 style="margin-bottom:0.25rem">Hostel Allotment Letter</h3>
              <p class="text-secondary" style="font-size:0.85rem; margin:0">Official room assignment confirmation</p>
            </div>
            ${statusBadge('Allotted')}
          </div>
          
          <div class="grid-2 mb-4">
            <div class="card" style="background: rgba(255,255,255,0.03);">
              <p class="text-secondary mb-2" style="font-size:0.8rem; text-transform:uppercase; letter-spacing:0.05em">👤 Student Details</p>
              <p style="margin:0.25rem 0"><strong>Name:</strong> ${escapeHtml(user.name)}</p>
              <p style="margin:0.25rem 0"><strong>ID:</strong> ${escapeHtml(user.student_id)}</p>
              <p style="margin:0.25rem 0"><strong>Department:</strong> ${escapeHtml(user.department)}</p>
              <p style="margin:0.25rem 0"><strong>Year:</strong> ${user.year}</p>
              <p style="margin:0.25rem 0"><strong>Email:</strong> ${escapeHtml(user.email)}</p>
            </div>
            <div class="card" style="background: rgba(16,185,129,0.05); border-color: rgba(16,185,129,0.15);">
              <p class="text-secondary mb-2" style="font-size:0.8rem; text-transform:uppercase; letter-spacing:0.05em">🏠 Room Details</p>
              <p style="margin:0.25rem 0"><strong>Block:</strong> ${escapeHtml(allotment.block_name)}</p>
              <p style="margin:0.25rem 0"><strong>Room Number:</strong> <span style="font-size:1.2rem; font-weight:700; color:var(--success)">${escapeHtml(allotment.room_number)}</span></p>
              <p style="margin:0.25rem 0"><strong>Floor:</strong> ${allotment.floor}</p>
              <p style="margin:0.25rem 0"><strong>Type:</strong> ${roomTypeLabel(allotment.room_type)}</p>
              <p style="margin:0.25rem 0"><strong>A/C Category:</strong> ${acBadge(allotment.ac_type || 'ac')}</p>
              <p style="margin:0.25rem 0"><strong>Allotted By:</strong> ${escapeHtml(allotment.allotted_by || 'System')}</p>
            </div>
          </div>
          
          <div style="border-top: 1px solid var(--surface-border); padding-top: 1rem;">
            <p class="text-secondary" style="font-size: 0.8rem;">Allotted on: ${formatDateTime(allotment.allotted_at || new Date().toISOString())}</p>
          </div>
        </div>
        
        <div class="flex gap-2 mt-3">
          <button class="btn btn-outline" onclick="window.print()">🖨️ Print Letter</button>
          <a href="#/student/dashboard" class="btn btn-outline">← Dashboard</a>
        </div>
      `;
    } else if (appStatus && !appStatus.error) {
      const statusColor = appStatus.status === 'pending' ? 'var(--warning)' :
                          appStatus.status === 'waitlisted' ? 'var(--info)' : 'var(--danger)';
      document.getElementById('allotment-content').innerHTML = `
        <div class="card text-center" style="padding: 2.5rem; border-left: 4px solid ${statusColor};">
          <div style="font-size: 3rem; margin-bottom: 1rem;">${appStatus.status === 'pending' ? '⏳' : appStatus.status === 'waitlisted' ? '📋' : '❌'}</div>
          <h3>Room Not Yet Allotted</h3>
          <p class="text-secondary mb-3">Your application status is: ${statusBadge(appStatus.status)}</p>
          <p class="text-secondary" style="font-size:0.9rem">
            ${appStatus.status === 'pending' ? 'Your application is being processed. You will be notified when a room is assigned.' :
              appStatus.status === 'waitlisted' ? 'You are on the waitlist. Rooms will be assigned as they become available.' :
              'Your application was rejected. Please contact the hostel office for more details.'}
          </p>
        </div>
      `;
    } else {
      document.getElementById('allotment-content').innerHTML = `
        <div class="card text-center" style="padding: 2.5rem;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">📝</div>
          <h3>No Application Found</h3>
          <p class="text-secondary mb-3">You need to apply for a room first.</p>
          <a href="#/student/apply" class="btn btn-primary">Apply for Room 📝</a>
        </div>
      `;
    }
  } catch (err) {
    document.getElementById('allotment-content').innerHTML = `
      <div class="card text-center">
        <p class="text-secondary">You do not have any active room allotments.</p>
      </div>
    `;
  }
}

// ─────────────────────────────────────────────
// 5. MY PROFILE — View & edit student profile
// ─────────────────────────────────────────────
function renderStudentProfile() {
  const user = getUser();
  
  const content = `
    <h2>My Profile 👤</h2>
    <p class="text-secondary mb-4">View and update your personal information.</p>

    <div class="grid-2">
      <div class="card">
        <div style="text-align:center; margin-bottom: 1.5rem;">
          <div style="width:80px; height:80px; border-radius:50%; background: linear-gradient(135deg, var(--primary), hsl(270,70%,55%)); display:flex; align-items:center; justify-content:center; margin: 0 auto 1rem; font-size: 2rem;">
            ${(user.name || 'U').charAt(0).toUpperCase()}
          </div>
          <h3 style="margin-bottom:0.25rem">${escapeHtml(user.name)}</h3>
          <p class="text-secondary" style="font-size:0.9rem">${escapeHtml(user.student_id)}</p>
        </div>
        
        <div style="border-top: 1px solid var(--surface-border); padding-top: 1rem;">
          <div style="padding: 0.5rem 0; display:flex; justify-content:space-between">
            <span class="text-secondary">Email</span>
            <span>${escapeHtml(user.email)}</span>
          </div>
          <div style="padding: 0.5rem 0; display:flex; justify-content:space-between; border-top:1px solid var(--surface-border)">
            <span class="text-secondary">Department</span>
            <span>${escapeHtml(user.department)}</span>
          </div>
          <div style="padding: 0.5rem 0; display:flex; justify-content:space-between; border-top:1px solid var(--surface-border)">
            <span class="text-secondary">Year</span>
            <span>Year ${user.year}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="mb-3">Edit Profile</h3>
        <form onsubmit="saveStudentProfile(event)">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" id="prof-name" class="input" value="${escapeHtml(user.name)}" required>
          </div>
          <div class="form-group">
            <label>Phone Number</label>
            <input type="tel" id="prof-phone" class="input" value="${escapeHtml(user.phone || '')}" placeholder="Enter phone number">
          </div>
          <div class="form-group">
            <label>Department</label>
            <select id="prof-dept" class="input">
              <option value="Computer Science" ${user.department==='Computer Science'?'selected':''}>Computer Science</option>
              <option value="Electronics" ${user.department==='Electronics'?'selected':''}>Electronics</option>
              <option value="Mechanical" ${user.department==='Mechanical'?'selected':''}>Mechanical</option>
              <option value="Civil" ${user.department==='Civil'?'selected':''}>Civil</option>
              <option value="Chemical" ${user.department==='Chemical'?'selected':''}>Chemical</option>
              <option value="Other" ${user.department==='Other'?'selected':''}>Other</option>
            </select>
          </div>
          <div class="form-group">
            <label>Year</label>
            <select id="prof-year" class="input">
              <option value="1" ${user.year==1?'selected':''}>1st Year</option>
              <option value="2" ${user.year==2?'selected':''}>2nd Year</option>
              <option value="3" ${user.year==3?'selected':''}>3rd Year</option>
              <option value="4" ${user.year==4?'selected':''}>4th Year</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%">Save Changes ✅</button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('app').innerHTML = renderLayout(studentLinks, '#/student/profile', content);
}

function saveStudentProfile(e) {
  e.preventDefault();
  const user = getUser();
  const updatedName = document.getElementById('prof-name').value;
  const updatedPhone = document.getElementById('prof-phone').value;
  const updatedDept = document.getElementById('prof-dept').value;
  const updatedYear = parseInt(document.getElementById('prof-year').value);

  // Update in localStorage students db
  const students = JSON.parse(localStorage.getItem('hh_students') || '[]');
  const stu = students.find(s => s.id === user.id);
  if (stu) {
    stu.name = updatedName;
    stu.phone = updatedPhone;
    stu.department = updatedDept;
    stu.year = updatedYear;
    localStorage.setItem('hh_students', JSON.stringify(students));
  }

  // Update session user
  user.name = updatedName;
  user.phone = updatedPhone;
  user.department = updatedDept;
  user.year = updatedYear;
  setUser(user);

  addStudentNotification(user.id, '👤', 'Profile updated successfully.');
  showToast('Profile updated!', 'success');
  renderStudentProfile();
}

// ─────────────────────────────────────────────
// 6. NOTIFICATIONS
// ─────────────────────────────────────────────
function getStudentNotifications(studentId) {
  try {
    const all = JSON.parse(localStorage.getItem('hh_notifications') || '[]');
    return all.filter(n => n.student_id === studentId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch(e) { return []; }
}

function addStudentNotification(studentId, icon, message) {
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
}

function renderNotificationsPage() {
  const user = getUser();
  const notifs = getStudentNotifications(user.id);

  // Auto-generate some notifications based on application state
  if (notifs.length === 0) {
    addStudentNotification(user.id, '👋', 'Welcome to HostelHub! Start by applying for a room.');
    return renderNotificationsPage();
  }

  // Mark all as read
  const all = JSON.parse(localStorage.getItem('hh_notifications') || '[]');
  all.forEach(n => { if (n.student_id === user.id) n.read = true; });
  localStorage.setItem('hh_notifications', JSON.stringify(all));

  let notifsHtml = '';
  if (notifs.length > 0) {
    notifs.forEach(n => {
      notifsHtml += `
        <div style="padding: 1rem; border-bottom: 1px solid var(--surface-border); display: flex; align-items: flex-start; gap: 1rem; transition: var(--transition);" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
          <span style="font-size: 1.5rem; line-height:1">${n.icon}</span>
          <div style="flex:1">
            <p style="margin:0; font-size: 0.95rem;">${escapeHtml(n.message)}</p>
            <p style="margin:0.25rem 0 0; font-size: 0.75rem; color: var(--text-secondary)">${formatDateTime(n.timestamp)}</p>
          </div>
        </div>
      `;
    });
  } else {
    notifsHtml = '<p class="text-secondary text-center" style="padding:2rem">No notifications yet.</p>';
  }

  const content = `
    <div class="flex-between mb-4">
      <div>
        <h2>Notifications 📢</h2>
        <p class="text-secondary">Your activity feed and status updates.</p>
      </div>
      <button class="btn btn-outline" onclick="clearStudentNotifications()" style="font-size:0.85rem">Clear All 🗑️</button>
    </div>
    <div class="card">
      ${notifsHtml}
    </div>
  `;

  document.getElementById('app').innerHTML = renderLayout(studentLinks, '#/student/notifications', content);
}

function clearStudentNotifications() {
  const user = getUser();
  const all = JSON.parse(localStorage.getItem('hh_notifications') || '[]');
  const filtered = all.filter(n => n.student_id !== user.id);
  localStorage.setItem('hh_notifications', JSON.stringify(filtered));
  showToast('Notifications cleared', 'info');
  renderNotificationsPage();
}

// ─────────────────────────────────────────────
// 7. BILLS & PAYMENTS
// ─────────────────────────────────────────────
function billTypeIcon(type) {
  const icons = { room_rent: '🏠', mess_charges: '🍽️', caution_deposit: '🔒', maintenance: '🔧', electricity: '⚡', laundry: '👕', library: '📚' };
  return icons[type] || '📋';
}

function billTypeLabel(type) {
  const labels = { room_rent: 'Room Rent', mess_charges: 'Mess Charges', caution_deposit: 'Caution Deposit', maintenance: 'Maintenance', electricity: 'Electricity', laundry: 'Laundry', library: 'Library Fine' };
  return labels[type] || type;
}

function formatCurrency(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN');
}

function billStatusBadge(status) {
  if (status === 'paid') return '<span class="badge badge-allotted">Paid ✓</span>';
  if (status === 'overdue') return '<span class="badge badge-rejected">Overdue ⚠</span>';
  return '<span class="badge badge-pending">Unpaid</span>';
}

async function renderBillsPage() {
  const user = getUser();

  const content = `
    <h2>Bills & Payments 💰</h2>
    <p class="text-secondary mb-4">View and pay your hostel dues online.</p>

    <div id="bills-summary" class="grid-4 mb-4"><div class="spinner"></div></div>

    <div class="card mb-4">
      <div class="flex gap-2" style="flex-wrap:wrap">
        <div class="form-group" style="margin-bottom:0; flex:1; min-width:140px">
          <select id="bill-filter" class="input" onchange="loadBills()">
            <option value="">All Bills</option>
            <option value="unpaid">Unpaid</option>
            <option value="overdue">Overdue</option>
            <option value="paid">Paid</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0; flex:1; min-width:140px">
          <select id="bill-type-filter" class="input" onchange="loadBills()">
            <option value="">All Types</option>
            <option value="room_rent">Room Rent</option>
            <option value="mess_charges">Mess Charges</option>
            <option value="caution_deposit">Caution Deposit</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>
    </div>

    <div id="bills-list"><div class="spinner"></div></div>
  `;

  document.getElementById('app').innerHTML = renderLayout(studentLinks, '#/student/bills', content);
  loadBillsSummary();
  loadBills();
}

async function loadBillsSummary() {
  const user = getUser();
  try {
    const summary = await apiGet(`/api/bills/summary/${user.id}`);
    document.getElementById('bills-summary').innerHTML = `
      <div class="card stat-card">
        <div class="stat-card-icon">💳</div>
        <div class="stat-card-info">
          <h3>Total Charged</h3>
          <p style="font-size:1.2rem">${formatCurrency(summary.total_charged)}</p>
        </div>
      </div>
      <div class="card stat-card" style="border-left-color: var(--success);">
        <div class="stat-card-icon">✅</div>
        <div class="stat-card-info">
          <h3>Total Paid</h3>
          <p style="font-size:1.2rem">${formatCurrency(summary.total_paid)}</p>
        </div>
      </div>
      <div class="card stat-card" style="border-left-color: var(--warning);">
        <div class="stat-card-icon">⏳</div>
        <div class="stat-card-info">
          <h3>Outstanding</h3>
          <p style="font-size:1.2rem">${formatCurrency(summary.outstanding)}</p>
        </div>
      </div>
      <div class="card stat-card" style="border-left-color: var(--danger);">
        <div class="stat-card-icon">⚠️</div>
        <div class="stat-card-info">
          <h3>Overdue</h3>
          <p style="font-size:1.2rem">${formatCurrency(summary.overdue)}</p>
        </div>
      </div>
    `;
  } catch(e) {
    document.getElementById('bills-summary').innerHTML = '';
  }
}

async function loadBills() {
  showLoading('bills-list');
  const user = getUser();
  try {
    let bills = await apiGet(`/api/bills/${user.id}`);

    const statusFilter = document.getElementById('bill-filter').value;
    const typeFilter = document.getElementById('bill-type-filter').value;
    if (statusFilter) bills = bills.filter(b => b.status === statusFilter);
    if (typeFilter) bills = bills.filter(b => b.bill_type === typeFilter);

    if (!bills || bills.length === 0) {
      document.getElementById('bills-list').innerHTML = `
        <div class="card text-center" style="padding:2rem">
          <div style="font-size:2.5rem; margin-bottom:0.5rem">🎉</div>
          <p class="text-secondary">No bills found. You're all clear!</p>
        </div>`;
      return;
    }

    let html = '';
    bills.forEach(b => {
      const isOverdue = b.status === 'overdue';
      const isPaid = b.status === 'paid';
      const borderColor = isPaid ? 'rgba(16,185,129,0.2)' : isOverdue ? 'rgba(239,68,68,0.25)' : 'var(--surface-border)';

      html += `
        <div class="card mb-3" style="border-left: 4px solid ${isPaid ? 'var(--success)' : isOverdue ? 'var(--danger)' : 'var(--warning)'}; ${isOverdue ? 'background: rgba(239,68,68,0.03);' : ''}">
          <div class="flex-between" style="flex-wrap:wrap; gap:1rem">
            <div style="display:flex; align-items:flex-start; gap:1rem; flex:1">
              <div style="font-size:2rem; line-height:1">${billTypeIcon(b.bill_type)}</div>
              <div>
                <h4 style="margin:0 0 0.25rem">${escapeHtml(b.description)}</h4>
                <p class="text-secondary" style="margin:0; font-size:0.85rem">
                  ${billTypeLabel(b.bill_type)} • Due: ${formatDate(b.due_date)}
                  ${isPaid ? ' • Paid: ' + formatDate(b.paid_on) : ''}
                </p>
              </div>
            </div>
            <div style="text-align:right; display:flex; align-items:center; gap:1rem">
              <div>
                <p style="margin:0; font-size:1.4rem; font-weight:700; font-family:var(--font-heading); color: ${isPaid ? 'var(--text-secondary)' : 'var(--text-primary)'}">${formatCurrency(b.amount)}</p>
                ${billStatusBadge(b.status)}
              </div>
              ${!isPaid ? `<button class="btn btn-primary" style="white-space:nowrap" onclick="openPayBillModal(${b.id}, '${escapeHtml(b.description)}', ${b.amount})">Pay Now 💳</button>` : ''}
            </div>
          </div>
        </div>
      `;
    });

    document.getElementById('bills-list').innerHTML = html;
  } catch(err) {
    document.getElementById('bills-list').innerHTML = `<p class="text-danger text-center">Failed to load bills.</p>`;
  }
}

function openPayBillModal(billId, description, amount) {
  const formHtml = `
    <div style="text-align:center; padding: 1rem 0;">
      <div style="font-size:3rem; margin-bottom:1rem">💳</div>
      <h3 style="margin-bottom:0.5rem">Confirm Payment</h3>
      <p class="text-secondary" style="margin-bottom:1.5rem">${escapeHtml(description)}</p>
      <div style="background: rgba(99,102,241,0.08); border-radius: var(--radius-sm); padding: 1.5rem; margin-bottom: 1.5rem;">
        <p class="text-secondary" style="margin:0 0 0.25rem; font-size:0.85rem">Amount to Pay</p>
        <p style="margin:0; font-size:2.5rem; font-weight:800; font-family:var(--font-heading); color: var(--primary)">${formatCurrency(amount)}</p>
      </div>
      <div style="text-align:left; background: rgba(255,255,255,0.03); border-radius: var(--radius-sm); padding: 1rem; font-size:0.85rem;">
        <p style="margin:0 0 0.5rem"><strong>Payment Method</strong></p>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap">
          <label style="flex:1; padding:0.75rem; border:1px solid var(--surface-border); border-radius:var(--radius-sm); cursor:pointer; text-align:center; min-width:100px" onclick="this.querySelector('input').checked=true; document.querySelectorAll('.pay-method-opt').forEach(e=>e.style.borderColor='var(--surface-border)'); this.style.borderColor='var(--primary)'" class="pay-method-opt">
            <input type="radio" name="pay-method" value="upi" checked style="display:none"> 📱 UPI
          </label>
          <label style="flex:1; padding:0.75rem; border:1px solid var(--surface-border); border-radius:var(--radius-sm); cursor:pointer; text-align:center; min-width:100px" onclick="this.querySelector('input').checked=true; document.querySelectorAll('.pay-method-opt').forEach(e=>e.style.borderColor='var(--surface-border)'); this.style.borderColor='var(--primary)'" class="pay-method-opt">
            <input type="radio" name="pay-method" value="card" style="display:none"> 💳 Card
          </label>
          <label style="flex:1; padding:0.75rem; border:1px solid var(--surface-border); border-radius:var(--radius-sm); cursor:pointer; text-align:center; min-width:100px" onclick="this.querySelector('input').checked=true; document.querySelectorAll('.pay-method-opt').forEach(e=>e.style.borderColor='var(--surface-border)'); this.style.borderColor='var(--primary)'" class="pay-method-opt">
            <input type="radio" name="pay-method" value="netbanking" style="display:none"> 🏦 Net Banking
          </label>
        </div>
      </div>
    </div>
  `;
  const actions = `<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="payBill(${billId})">Confirm & Pay ${formatCurrency(amount)}</button>`;
  showModal('Make Payment', formHtml, actions);
}

async function payBill(billId) {
  try {
    const res = await apiPost('/api/bills/pay', { bill_id: billId });
    closeModal();
    showToast(res.message, 'success', 5000);

    const user = getUser();
    addStudentNotification(user.id, '✅', res.message);

    loadBillsSummary();
    loadBills();
  } catch(err) {
    showToast(err.message, 'error');
  }
}

// ─────────────────────────────────────────────
// 8. FINANCIAL STATEMENT
// ─────────────────────────────────────────────
async function renderStatementPage() {
  const user = getUser();

  const content = `
    <div class="flex-between mb-4">
      <div>
        <h2>Financial Statement 📄</h2>
        <p class="text-secondary">Complete transaction history and balance ledger.</p>
      </div>
      <button class="btn btn-outline" id="export-stmt-btn" onclick="exportStatement()" disabled>Export CSV ⬇️</button>
    </div>

    <div id="stmt-summary" class="grid-4 mb-4"><div class="spinner"></div></div>

    <div class="card mb-4" id="stmt-container">
      <div class="spinner"></div>
    </div>
  `;

  document.getElementById('app').innerHTML = renderLayout(studentLinks, '#/student/statement', content);

  // Load summary
  try {
    const summary = await apiGet(`/api/bills/summary/${user.id}`);
    document.getElementById('stmt-summary').innerHTML = `
      <div class="card stat-card">
        <div class="stat-card-icon">💰</div>
        <div class="stat-card-info">
          <h3>Total Charges</h3>
          <p style="font-size:1.1rem">${formatCurrency(summary.total_charged)}</p>
        </div>
      </div>
      <div class="card stat-card" style="border-left-color: var(--success);">
        <div class="stat-card-icon">✅</div>
        <div class="stat-card-info">
          <h3>Total Payments</h3>
          <p style="font-size:1.1rem">${formatCurrency(summary.total_paid)}</p>
        </div>
      </div>
      <div class="card stat-card" style="border-left-color: ${summary.outstanding > 0 ? 'var(--warning)' : 'var(--success)'};">
        <div class="stat-card-icon">${summary.outstanding > 0 ? '⏳' : '🎉'}</div>
        <div class="stat-card-info">
          <h3>Balance Due</h3>
          <p style="font-size:1.1rem">${formatCurrency(summary.outstanding)}</p>
        </div>
      </div>
      <div class="card stat-card" style="border-left-color: hsl(270,70%,55%);">
        <div class="stat-card-icon">📊</div>
        <div class="stat-card-info">
          <h3>Paid %</h3>
          <p style="font-size:1.1rem">${summary.total_charged > 0 ? Math.round((summary.total_paid / summary.total_charged) * 100) : 0}%</p>
        </div>
      </div>
    `;
  } catch(e) {
    document.getElementById('stmt-summary').innerHTML = '';
  }

  // Load transactions
  try {
    const txns = await apiGet(`/api/transactions/${user.id}`);

    if (!txns || txns.length === 0) {
      document.getElementById('stmt-container').innerHTML = `
        <div class="text-center" style="padding:2rem">
          <p class="text-secondary">No transactions yet.</p>
        </div>`;
      return;
    }

    // Enable export
    document.getElementById('export-stmt-btn').disabled = false;

    let html = `
      <div class="flex-between mb-3">
        <h3>Transaction Ledger</h3>
        <p class="text-secondary" style="font-size:0.85rem">${txns.length} transaction${txns.length > 1 ? 's' : ''}</p>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Description</th>
              <th>Type</th>
              <th style="text-align:right">Debit (₹)</th>
              <th style="text-align:right">Credit (₹)</th>
              <th style="text-align:right">Balance (₹)</th>
            </tr>
          </thead>
          <tbody>
    `;

    // Show in chronological order for statement
    const sorted = [...txns].sort((a, b) => new Date(a.date) - new Date(b.date));

    sorted.forEach((t, i) => {
      const isPayment = t.type === 'payment';
      html += `
        <tr>
          <td>${i + 1}</td>
          <td>${formatDate(t.date)}</td>
          <td>${escapeHtml(t.description)}</td>
          <td>${isPayment ? '<span class="badge badge-allotted">Payment</span>' : '<span class="badge badge-pending">Charge</span>'}</td>
          <td style="text-align:right; color: ${!isPayment ? 'var(--danger)' : 'var(--text-secondary)'}">${!isPayment ? formatCurrency(t.amount) : '—'}</td>
          <td style="text-align:right; color: ${isPayment ? 'var(--success)' : 'var(--text-secondary)'}">${isPayment ? formatCurrency(t.amount) : '—'}</td>
          <td style="text-align:right; font-weight:600">${formatCurrency(t.balance_after)}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
          <tfoot>
            <tr style="border-top: 2px solid var(--surface-border); font-weight: 700;">
              <td colspan="4" style="text-align:right">Totals:</td>
              <td style="text-align:right; color: var(--danger)">${formatCurrency(sorted.filter(t => t.type === 'charge').reduce((s, t) => s + t.amount, 0))}</td>
              <td style="text-align:right; color: var(--success)">${formatCurrency(sorted.filter(t => t.type === 'payment').reduce((s, t) => s + t.amount, 0))}</td>
              <td style="text-align:right">${sorted.length > 0 ? formatCurrency(sorted[sorted.length - 1].balance_after) : '₹0'}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;

    // Payment timeline
    html += `
      <h3 class="mt-4 mb-3">Payment Timeline</h3>
      <div style="position:relative; padding-left: 2rem;">
        <div style="position:absolute; left:0.6rem; top:0; bottom:0; width:2px; background: var(--surface-border);"></div>
    `;

    sorted.forEach(t => {
      const isPayment = t.type === 'payment';
      html += `
        <div style="position:relative; margin-bottom:1.5rem; padding-left:1rem;">
          <div style="position:absolute; left:-1.65rem; top:0.15rem; width:14px; height:14px; border-radius:50%; background: ${isPayment ? 'var(--success)' : 'var(--warning)'}; border: 2px solid var(--bg-color);"></div>
          <div style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:0.15rem">${formatDate(t.date)}</div>
          <div style="font-size:0.9rem">${escapeHtml(t.description)}</div>
          <div style="font-size:0.85rem; font-weight:600; color: ${isPayment ? 'var(--success)' : 'var(--danger)'}">
            ${isPayment ? '− ' : '+ '}${formatCurrency(t.amount)}
          </div>
        </div>
      `;
    });

    html += `</div>`;

    document.getElementById('stmt-container').innerHTML = html;
  } catch(err) {
    document.getElementById('stmt-container').innerHTML = `<p class="text-danger text-center">Failed to load transactions.</p>`;
  }
}

function exportStatement() {
  const user = getUser();
  const txns = JSON.parse(localStorage.getItem('hh_transactions') || '[]')
    .filter(t => t.student_id === user.id)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const csvData = txns.map((t, i) => ({
    'No': i + 1,
    'Date': t.date.split('T')[0],
    'Description': t.description,
    'Type': t.type,
    'Debit': t.type === 'charge' ? t.amount : '',
    'Credit': t.type === 'payment' ? t.amount : '',
    'Balance': t.balance_after
  }));

  exportToCSV(csvData, `HostelHub_Statement_${user.student_id}.csv`);
  showToast('Statement exported successfully!', 'success');
}
