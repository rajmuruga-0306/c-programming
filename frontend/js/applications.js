async function renderApplicationManagement() {
  const content = `
    <div class="flex-between mb-4">
      <h2>Student Applications 📝</h2>
      <div class="flex gap-2">
        <button class="btn btn-outline" onclick="openManualAssignModal()">Manual Assign 🎯</button>
        <button class="btn btn-primary" onclick="runAutoAllotment()">Run Auto-Allotment ⚙️</button>
      </div>
    </div>
    
    <div class="card mb-4">
      <div class="flex gap-2">
        <div class="form-group" style="margin-bottom:0; flex:1">
          <select id="filter-status" class="input" onchange="loadApplications()">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="allotted">Allotted</option>
            <option value="rejected">Rejected</option>
            <option value="waitlisted">Waitlisted</option>
          </select>
        </div>
      </div>
    </div>
    
    <div class="card table-responsive" id="apps-table-container">
      <div class="spinner"></div>
    </div>
  `;
  document.getElementById('app').innerHTML = renderLayout(adminLinks, '#/admin/applications', content);
  loadApplications();
}

async function loadApplications() {
  showLoading('apps-table-container');
  try {
    const status = document.getElementById('filter-status').value;
    let url = '/api/applications';
    if (status) url += `?status=${status}`;
    
    const apps = await apiGet(url);
    
    let html = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>ID</th>
            <th>Dept</th>
            <th>Pref Block</th>
            <th>Pref Type</th>
            <th>A/C Pref</th>
            <th>Applied On</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    if (apps && apps.length) {
      apps.forEach(a => {
        html += `
          <tr>
            <td><strong>${escapeHtml(a.student_name)}</strong></td>
            <td>${escapeHtml(a.student_id)}</td>
            <td>${escapeHtml(a.department)}</td>
            <td>${escapeHtml(a.preferred_block)}</td>
            <td>${roomTypeLabel(a.preferred_room_type)}</td>
            <td>${acBadge(a.ac_preference || 'ac')}</td>
            <td>${formatDate(a.applied_on)}</td>
            <td>${statusBadge(a.status)}</td>
            <td>
              ${(a.status || 'pending').toLowerCase() === 'pending' ? `
                <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; color: var(--success)" onclick="updateAppStatus(${a.id}, 'allotted')" title="Approve">✓</button>
                <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; color: var(--danger)" onclick="updateAppStatus(${a.id}, 'rejected')" title="Reject">✗</button>
                <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; color: var(--info)" onclick="updateAppStatus(${a.id}, 'waitlisted')" title="Waitlist">⏳</button>
              ` : (a.status === 'waitlisted' ? `
                <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; color: var(--success)" onclick="updateAppStatus(${a.id}, 'allotted')" title="Approve">✓</button>
              ` : '—')}
            </td>
          </tr>
        `;
      });
    } else {
      html += `<tr><td colspan="9" class="text-center text-secondary">No applications found.</td></tr>`;
    }
    
    html += `</tbody></table>`;
    document.getElementById('apps-table-container').innerHTML = html;
  } catch (err) {
    document.getElementById('apps-table-container').innerHTML = `<p class="text-danger text-center">Failed to load applications.</p>`;
  }
}

async function updateAppStatus(id, status) {
  try {
    await apiPut(`/api/application/status-update/${id}`, { status });
    showToast(`Application marked as ${status}`, 'success');
    loadApplications();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function runAutoAllotment() {
  if (!confirm('Run auto-allotment? This assigns rooms to all pending applications based on preference matching and seniority.')) return;
  
  showToast('Starting auto-allotment...', 'info');
  try {
    const res = await apiPost('/api/allotment/auto-run', {});
    showToast(res.message || `Allotted ${res.allotted_count || 0} rooms!`, 'success', 5000);
    loadApplications();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function openManualAssignModal() {
  // Load students and rooms for manual assignment
  let roomsHtml = '<option value="">Select Room</option>';
  try {
    const rooms = await apiGet('/api/rooms');
    const available = rooms.filter(r => r.occupied_count < r.capacity && r.status === 'available');
    available.forEach(r => {
      roomsHtml += `<option value="${r.id}">${escapeHtml(r.room_number)} — ${escapeHtml(r.block_name)} (${r.occupied_count}/${r.capacity})</option>`;
    });
  } catch(e) {}

  // Get students with pending applications
  let studentsHtml = '<option value="">Select Student</option>';
  try {
    const apps = await apiGet('/api/applications?status=pending');
    apps.forEach(a => {
      studentsHtml += `<option value="${a.student_id}">${escapeHtml(a.student_name)} (${escapeHtml(a.student_id)})</option>`;
    });
  } catch(e) {}

  const formHtml = `
    <form id="manual-assign-form" onsubmit="submitManualAssign(event)">
      <div class="form-group">
        <label>Student (Pending Applications)</label>
        <select id="ma-student" class="input" required>${studentsHtml}</select>
      </div>
      <div class="form-group">
        <label>Room (Available)</label>
        <select id="ma-room" class="input" required>${roomsHtml}</select>
      </div>
    </form>
  `;
  const actions = `<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="document.getElementById('manual-assign-form').requestSubmit()">Assign Room</button>`;
  showModal('Manual Room Assignment 🎯', formHtml, actions);
}

async function submitManualAssign(e) {
  e.preventDefault();
  // Note: student_id from the select is actually the enrollment ID string (e.g., STU2024001).
  // We need the DB id. The apiPost handler in api.js uses it correctly.
  const studentIdStr = document.getElementById('ma-student').value;
  const roomId = document.getElementById('ma-room').value;
  
  // Find the DB student id from the student_id string
  const apps = await apiGet('/api/applications?status=pending');
  const app = apps.find(a => a.student_id === studentIdStr);
  if (!app) {
    showToast('Student not found', 'error');
    return;
  }

  // We need the student's database ID — look it up from localStorage
  const students = JSON.parse(localStorage.getItem('hh_students') || '[]');
  const stu = students.find(s => s.student_id === studentIdStr);
  if (!stu) {
    showToast('Student not found in database', 'error');
    return;
  }

  try {
    await apiPost('/api/allotment/manual-assign', { student_id: stu.id, room_id: parseInt(roomId) });
    showToast('Room assigned successfully!', 'success');
    closeModal();
    loadApplications();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
