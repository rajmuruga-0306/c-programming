const adminLinks = [
  { href: '#/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '#/admin/rooms', icon: '🏠', label: 'Manage Rooms' },
  { href: '#/admin/applications', icon: '📝', label: 'Applications' },
  { href: '#/admin/bills', icon: '💸', label: 'Manage Bills' },
  { href: '#/admin/reports', icon: '📈', label: 'Reports' }
];

async function renderAdminDashboard() {
  const content = `
    <h2>Admin Dashboard 📊</h2>
    <p class="text-secondary mb-4">Overview of hostel room allocation system.</p>
    
    <div id="admin-stats"><div class="spinner"></div></div>
    
    <div class="card mt-4">
      <h3 class="mb-3">Quick Actions</h3>
      <div class="flex gap-2" style="flex-wrap: wrap">
        <a href="#/admin/applications" class="btn btn-primary" onclick="setTimeout(()=>runAutoAllotment(),500)">Run Auto-Allotment ⚙️</a>
        <a href="#/admin/bills" class="btn btn-outline" onclick="setTimeout(()=>openIssueBillModal(),300)">Issue Bill 💸</a>
        <a href="#/admin/applications" class="btn btn-outline">View Applications</a>
        <a href="#/admin/rooms" class="btn btn-outline">Manage Rooms</a>
        <a href="#/admin/reports" class="btn btn-outline">View Reports 📈</a>
      </div>
    </div>
    
    <div class="card mt-4" id="recent-apps-container">
      <h3 class="mb-3">Recent Pending Applications</h3>
      <div class="spinner"></div>
    </div>
  `;
  
  document.getElementById('app').innerHTML = renderLayout(adminLinks, '#/admin/dashboard', content);
  
  try {
    const stats = await apiGet('/api/admin/dashboard-stats');
    
    const html = `
      <div class="grid-4">
        <div class="card stat-card">
          <div class="stat-card-icon">🏠</div>
          <div class="stat-card-info">
            <h3>Total Rooms</h3>
            <p>${stats.total_rooms || 0}</p>
          </div>
        </div>
        <div class="card stat-card" style="border-left-color: var(--success);">
          <div class="stat-card-icon">🔒</div>
          <div class="stat-card-info">
            <h3>Occupied</h3>
            <p>${stats.occupied_rooms || 0}</p>
          </div>
        </div>
        <div class="card stat-card" style="border-left-color: var(--info);">
          <div class="stat-card-icon">✅</div>
          <div class="stat-card-info">
            <h3>Vacant Rooms</h3>
            <p>${stats.vacant_rooms || 0}</p>
          </div>
        </div>
        <div class="card stat-card" style="border-left-color: var(--warning);">
          <div class="stat-card-icon">⏳</div>
          <div class="stat-card-info">
            <h3>Pending Apps</h3>
            <p>${stats.pending_applications || 0}</p>
          </div>
        </div>
      </div>
      <div class="grid-4" style="margin-top: 1rem;">
        <div class="card stat-card" style="border-left-color: hsl(270, 70%, 55%);">
          <div class="stat-card-icon">👥</div>
          <div class="stat-card-info">
            <h3>Total Students</h3>
            <p>${stats.total_students || 0}</p>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('admin-stats').innerHTML = html;
  } catch (err) {
    document.getElementById('admin-stats').innerHTML = `<p class="text-danger">Failed to load statistics.</p>`;
  }

  // Load recent pending applications
  try {
    const apps = await apiGet('/api/applications?status=pending');
    if (apps && apps.length > 0) {
      let html = `
        <table class="data-table">
          <thead><tr><th>Student</th><th>ID</th><th>Block Pref</th><th>Room Type</th><th>A/C Pref</th><th>Status</th></tr></thead>
          <tbody>
      `;
      apps.slice(0, 5).forEach(a => {
        html += `
          <tr>
            <td><strong>${escapeHtml(a.student_name)}</strong></td>
            <td>${escapeHtml(a.student_id)}</td>
            <td>${escapeHtml(a.preferred_block)}</td>
            <td>${roomTypeLabel(a.preferred_room_type)}</td>
            <td>${a.ac_preference === 'ac' ? '❄️ A/C' : a.ac_preference === 'non_ac' ? '🔥 Non-A/C' : 'Any'}</td>
            <td>${statusBadge(a.status)}</td>
          </tr>
        `;
      });
      html += `</tbody></table>`;
      if (apps.length > 5) html += `<p class="text-secondary mt-2" style="font-size: 0.85rem">...and ${apps.length - 5} more. <a href="#/admin/applications">View all →</a></p>`;
      document.getElementById('recent-apps-container').innerHTML = `<h3 class="mb-3">Recent Pending Applications</h3>` + html;
    } else {
      document.getElementById('recent-apps-container').innerHTML = `<h3 class="mb-3">Recent Pending Applications</h3><p class="text-secondary">No pending applications.</p>`;
    }
  } catch(e) {
    document.getElementById('recent-apps-container').innerHTML = `<h3 class="mb-3">Recent Pending Applications</h3><p class="text-secondary">Could not load.</p>`;
  }
}

// ─────────────────────────────────────────────
// ADMIN BILL MANAGEMENT & ISSUANCE PORTAL
// ─────────────────────────────────────────────
async function renderAdminBillsPage() {
  const content = `
    <div class="flex-between mb-4">
      <div>
        <h2>Hostel Fee & Bill Management 💸</h2>
        <p class="text-secondary">Issue new bills, allot hostel fees, and track payment statuses.</p>
      </div>
      <button class="btn btn-primary" onclick="openIssueBillModal()">Issue New Bill ➕💸</button>
    </div>

    <div id="admin-bill-stats" class="grid-4 mb-4"><div class="spinner"></div></div>

    <div class="card mb-4">
      <div class="flex gap-2" style="flex-wrap: wrap;">
        <div class="form-group" style="margin-bottom:0; flex:1; min-width:140px">
          <select id="ab-filter-status" class="input" onchange="loadAdminBills()">
            <option value="">All Bill Statuses</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0; flex:1; min-width:140px">
          <select id="ab-filter-type" class="input" onchange="loadAdminBills()">
            <option value="">All Fee Types</option>
            <option value="room_rent">Room Rent</option>
            <option value="mess_charges">Mess Charges</option>
            <option value="caution_deposit">Caution Deposit</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>
    </div>

    <div class="card table-responsive" id="admin-bills-container">
      <div class="spinner"></div>
    </div>
  `;

  document.getElementById('app').innerHTML = renderLayout(adminLinks, '#/admin/bills', content);
  loadAdminBills();
}

async function loadAdminBills() {
  showLoading('admin-bills-container');
  try {
    const allBills = JSON.parse(localStorage.getItem('hh_bills') || '[]');
    const students = JSON.parse(localStorage.getItem('hh_students') || '[]');
    
    const statusFilter = document.getElementById('ab-filter-status').value;
    const typeFilter = document.getElementById('ab-filter-type').value;

    const now = new Date();
    let bills = allBills.map(b => {
      const stu = students.find(s => s.id === b.student_id);
      let status = b.status;
      if (status === 'unpaid' && new Date(b.due_date) < now) status = 'overdue';
      return {
        ...b,
        student_name: stu ? stu.name : 'Unknown',
        student_code: stu ? stu.student_id : 'N/A',
        status: status
      };
    });

    // Calculate Summary Stats
    const totalBilled = bills.reduce((s, b) => s + b.amount, 0);
    const totalPaid = bills.filter(b => b.status === 'paid').reduce((s, b) => s + b.amount, 0);
    const totalPending = totalBilled - totalPaid;
    const countOverdue = bills.filter(b => b.status === 'overdue').length;

    document.getElementById('admin-bill-stats').innerHTML = `
      <div class="card stat-card">
        <div class="stat-card-icon">💰</div>
        <div class="stat-card-info"><h3>Total Billed</h3><p style="font-size:1.2rem">₹${totalBilled.toLocaleString('en-IN')}</p></div>
      </div>
      <div class="card stat-card" style="border-left-color: var(--success);">
        <div class="stat-card-icon">✅</div>
        <div class="stat-card-info"><h3>Collected</h3><p style="font-size:1.2rem">₹${totalPaid.toLocaleString('en-IN')}</p></div>
      </div>
      <div class="card stat-card" style="border-left-color: var(--warning);">
        <div class="stat-card-icon">⏳</div>
        <div class="stat-card-info"><h3>Pending</h3><p style="font-size:1.2rem">₹${totalPending.toLocaleString('en-IN')}</p></div>
      </div>
      <div class="card stat-card" style="border-left-color: var(--danger);">
        <div class="stat-card-icon">⚠️</div>
        <div class="stat-card-info"><h3>Overdue Bills</h3><p style="font-size:1.2rem">${countOverdue}</p></div>
      </div>
    `;

    if (statusFilter) bills = bills.filter(b => b.status === statusFilter);
    if (typeFilter) bills = bills.filter(b => b.bill_type === typeFilter);

    // Render Table
    let html = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Bill ID</th>
            <th>Student</th>
            <th>Description</th>
            <th>Type</th>
            <th>Amount (₹)</th>
            <th>Due Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
    `;

    if (bills && bills.length) {
      bills.forEach(b => {
        html += `
          <tr>
            <td>#${b.id}</td>
            <td>
              <strong>${escapeHtml(b.student_name)}</strong>
              <div style="font-size:0.75rem; color:var(--text-secondary)">${escapeHtml(b.student_code)}</div>
            </td>
            <td>${escapeHtml(b.description)}</td>
            <td>${billTypeLabel(b.bill_type)}</td>
            <td><strong>₹${b.amount.toLocaleString('en-IN')}</strong></td>
            <td>${formatDate(b.due_date)}</td>
            <td>${billStatusBadge(b.status)}</td>
            <td>
              <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; color: var(--danger)" onclick="deleteAdminBill(${b.id})" title="Cancel/Delete Bill">🗑️ Cancel</button>
            </td>
          </tr>
        `;
      });
    } else {
      html += `<tr><td colspan="8" class="text-center text-secondary">No bills found.</td></tr>`;
    }

    html += `</tbody></table>`;
    document.getElementById('admin-bills-container').innerHTML = html;
  } catch (err) {
    document.getElementById('admin-bills-container').innerHTML = `<p class="text-danger text-center">Failed to load bills list.</p>`;
  }
}

async function openIssueBillModal() {
  let studentsHtml = '<option value="">Select Student</option>';
  try {
    const students = JSON.parse(localStorage.getItem('hh_students') || '[]');
    students.forEach(s => {
      studentsHtml += `<option value="${s.id}">${escapeHtml(s.name)} (${escapeHtml(s.student_id)}) - Yr ${s.year}</option>`;
    });
  } catch(e) {}

  const defaultDueDate = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

  const formHtml = `
    <form id="issue-bill-form" onsubmit="submitIssueBill(event)">
      <div class="form-group">
        <label>Select Student *</label>
        <select id="ib-student" class="input" required>
          ${studentsHtml}
        </select>
      </div>

      <div class="grid-2">
        <div class="form-group">
          <label>Bill / Fee Category *</label>
          <select id="ib-type" class="input" required>
            <option value="room_rent">🏠 Room Rent</option>
            <option value="mess_charges">🍽️ Mess Charges</option>
            <option value="caution_deposit">🔒 Caution Deposit</option>
            <option value="maintenance">🔧 Maintenance Fee</option>
            <option value="electricity">⚡ Electricity Bill</option>
            <option value="laundry">👕 Laundry Charges</option>
            <option value="other">📋 Other / Miscellaneous</option>
          </select>
        </div>

        <div class="form-group">
          <label>Amount (₹) *</label>
          <input type="number" id="ib-amount" class="input" placeholder="e.g. 15000" min="100" step="50" required>
        </div>
      </div>

      <div class="form-group">
        <label>Bill Description *</label>
        <input type="text" id="ib-desc" class="input" placeholder="e.g. Odd Semester Room Rent 2026" required>
      </div>

      <div class="form-group">
        <label>Payment Due Date *</label>
        <input type="date" id="ib-due" class="input" value="${defaultDueDate}" required>
      </div>
    </form>
  `;

  const actions = `<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="document.getElementById('issue-bill-form').requestSubmit()">Issue & Allot Bill 💸</button>`;
  showModal('Issue New Hostel Bill 💸', formHtml, actions);
}

async function submitIssueBill(e) {
  e.preventDefault();
  const body = {
    student_id: parseInt(document.getElementById('ib-student').value),
    bill_type: document.getElementById('ib-type').value,
    amount: parseFloat(document.getElementById('ib-amount').value),
    description: document.getElementById('ib-desc').value,
    due_date: new Date(document.getElementById('ib-due').value).toISOString()
  };

  try {
    const res = await apiPost('/api/admin/issue-bill', body);
    showToast(res.message, 'success', 5000);
    closeModal();
    loadAdminBills();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteAdminBill(id) {
  if (!confirm('Are you sure you want to cancel/delete this bill?')) return;
  try {
    await apiDelete(`/api/admin/bills/delete/${id}`);
    showToast('Bill cancelled successfully', 'success');
    loadAdminBills();
  } catch(err) {
    showToast(err.message, 'error');
  }
}
