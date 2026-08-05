async function renderRoomManagement() {
  const content = `
    <div class="flex-between mb-4">
      <h2>Room Management 🏠</h2>
      <button class="btn btn-primary" onclick="openAddRoomModal()">Add Room ➕</button>
    </div>
    
    <div class="card mb-4">
      <div class="flex gap-2" style="flex-wrap: wrap;">
        <div class="form-group" style="margin-bottom:0; flex:1; min-width:140px">
          <select id="filter-block" class="input" onchange="loadRooms()">
            <option value="">All Blocks</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0; flex:1; min-width:140px">
          <select id="filter-type" class="input" onchange="loadRooms()">
            <option value="">All Types</option>
            <option value="single">Single</option>
            <option value="double">Double</option>
            <option value="triple">Triple</option>
            <option value="dorm">Dorm</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0; flex:1; min-width:140px">
          <select id="filter-ac" class="input" onchange="loadRooms()">
            <option value="">All A/C Types</option>
            <option value="ac">❄️ A/C Only</option>
            <option value="non_ac">🔥 Non-A/C Only</option>
          </select>
        </div>
      </div>
    </div>
    
    <div class="card table-responsive" id="rooms-table-container">
      <div class="spinner"></div>
    </div>
  `;
  document.getElementById('app').innerHTML = renderLayout(adminLinks, '#/admin/rooms', content);
  
  // Populate block filter
  try {
    const blocks = await apiGet('/api/hostel-blocks').catch(() => []);
    if(Array.isArray(blocks)) {
      const select = document.getElementById('filter-block');
      blocks.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b.id; opt.textContent = b.name;
        select.appendChild(opt);
      });
    }
  } catch(e) {}
  
  loadRooms();
}

async function loadRooms() {
  showLoading('rooms-table-container');
  try {
    const rooms = await apiGet('/api/rooms');
    const filterBlock = document.getElementById('filter-block').value;
    const filterType = document.getElementById('filter-type').value;
    const filterAc = document.getElementById('filter-ac').value;

    let filtered = rooms;
    if (filterBlock) filtered = filtered.filter(r => r.block_id == filterBlock);
    if (filterType) filtered = filtered.filter(r => r.room_type === filterType);
    if (filterAc) filtered = filtered.filter(r => (r.ac_type || 'ac') === filterAc);

    let html = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Room</th>
            <th>Block</th>
            <th>Floor</th>
            <th>Type</th>
            <th>A/C Feature</th>
            <th>Occupancy</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    if (filtered && filtered.length) {
      filtered.forEach(r => {
        let st = r.capacity > (r.occupied_count || 0) ? 'Available' : 'Full';
        if (r.status === 'maintenance') st = 'Maintenance';
        
        html += `
          <tr>
            <td><strong>${escapeHtml(r.room_number)}</strong></td>
            <td>${escapeHtml(r.block_name || r.block_id)}</td>
            <td>${r.floor}</td>
            <td>${roomTypeLabel(r.room_type)}</td>
            <td>${acBadge(r.ac_type || 'ac')}</td>
            <td>${r.occupied_count || 0} / ${r.capacity}</td>
            <td>${st === 'Available' ? '<span class="badge badge-allotted">Available</span>' : (st === 'Full' ? '<span class="badge badge-rejected">Full</span>' : '<span class="badge badge-warning">Maintenance</span>')}</td>
            <td>
              <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick='openEditRoomModal(${JSON.stringify(r).replace(/'/g, "&apos;")})'>✏️ Edit</button>
              <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; color: var(--danger)" onclick="deleteRoom(${r.id})">🗑️</button>
            </td>
          </tr>
        `;
      });
    } else {
      html += `<tr><td colspan="8" class="text-center text-secondary">No rooms found.</td></tr>`;
    }
    
    html += `</tbody></table>`;
    document.getElementById('rooms-table-container').innerHTML = html;
  } catch (err) {
    document.getElementById('rooms-table-container').innerHTML = `<p class="text-danger text-center">Failed to load rooms.</p>`;
  }
}

function openAddRoomModal() {
  const formHtml = `
    <form id="add-room-form" onsubmit="submitAddRoom(event)">
      <div class="grid-2">
        <div class="form-group"><label>Block ID</label><input type="number" id="ar-block" class="input" required min="1" max="3" placeholder="1, 2, or 3"></div>
        <div class="form-group"><label>Room Number</label><input type="text" id="ar-num" class="input" required placeholder="e.g. A401"></div>
      </div>
      <div class="grid-2">
        <div class="form-group"><label>Floor</label><input type="number" id="ar-floor" class="input" required min="1"></div>
        <div class="form-group">
          <label>Room Type</label>
          <select id="ar-type" class="input" required>
            <option value="single">Single</option>
            <option value="double">Double</option>
            <option value="triple">Triple</option>
            <option value="dorm">Dorm</option>
          </select>
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label>A/C Category</label>
          <select id="ar-ac" class="input" required>
            <option value="ac">❄️ Air Conditioned (A/C)</option>
            <option value="non_ac">🔥 Non-A/C (Standard)</option>
          </select>
        </div>
        <div class="form-group"><label>Capacity</label><input type="number" id="ar-cap" class="input" required min="1"></div>
      </div>
    </form>
  `;
  const actions = `<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="document.getElementById('add-room-form').requestSubmit()">Save Room</button>`;
  showModal('Add New Room', formHtml, actions);
}

async function submitAddRoom(e) {
  e.preventDefault();
  const body = {
    block_id: document.getElementById('ar-block').value,
    room_number: document.getElementById('ar-num').value,
    floor: parseInt(document.getElementById('ar-floor').value),
    room_type: document.getElementById('ar-type').value,
    ac_type: document.getElementById('ar-ac').value,
    capacity: parseInt(document.getElementById('ar-cap').value)
  };
  try {
    await apiPost('/api/rooms/add', body);
    showToast('Room added successfully', 'success');
    closeModal();
    loadRooms();
  } catch(err) {
    showToast(err.message, 'error');
  }
}

function openEditRoomModal(r) {
  const formHtml = `
    <form id="edit-room-form" onsubmit="submitEditRoom(event, ${r.id})">
      <div class="grid-2">
        <div class="form-group"><label>Room Number</label><input type="text" id="er-num" class="input" value="${escapeHtml(r.room_number)}" required></div>
        <div class="form-group"><label>Floor</label><input type="number" id="er-floor" class="input" value="${r.floor}" required min="1"></div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label>Room Type</label>
          <select id="er-type" class="input" required>
            <option value="single" ${r.room_type==='single'?'selected':''}>Single</option>
            <option value="double" ${r.room_type==='double'?'selected':''}>Double</option>
            <option value="triple" ${r.room_type==='triple'?'selected':''}>Triple</option>
            <option value="dorm" ${r.room_type==='dorm'?'selected':''}>Dorm</option>
          </select>
        </div>
        <div class="form-group">
          <label>A/C Category</label>
          <select id="er-ac" class="input" required>
            <option value="ac" ${(r.ac_type||'ac')==='ac'?'selected':''}>❄️ Air Conditioned (A/C)</option>
            <option value="non_ac" ${(r.ac_type||'ac')==='non_ac'?'selected':''}>🔥 Non-A/C (Standard)</option>
          </select>
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group"><label>Capacity</label><input type="number" id="er-cap" class="input" value="${r.capacity}" required min="1"></div>
        <div class="form-group">
          <label>Status</label>
          <select id="er-status" class="input">
            <option value="available" ${r.status==='available'?'selected':''}>Available</option>
            <option value="maintenance" ${r.status==='maintenance'?'selected':''}>Maintenance</option>
            <option value="full" ${r.status==='full'?'selected':''}>Full</option>
          </select>
        </div>
      </div>
    </form>
  `;
  const actions = `<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="document.getElementById('edit-room-form').requestSubmit()">Update Room</button>`;
  showModal('Edit Room — ' + r.room_number, formHtml, actions);
}

async function submitEditRoom(e, roomId) {
  e.preventDefault();
  const body = {
    room_number: document.getElementById('er-num').value,
    floor: parseInt(document.getElementById('er-floor').value),
    room_type: document.getElementById('er-type').value,
    ac_type: document.getElementById('er-ac').value,
    capacity: parseInt(document.getElementById('er-cap').value),
    status: document.getElementById('er-status').value
  };
  try {
    await apiPut(`/api/rooms/update/${roomId}`, body);
    showToast('Room updated successfully', 'success');
    closeModal();
    loadRooms();
  } catch(err) {
    showToast(err.message, 'error');
  }
}

async function deleteRoom(id) {
  if (!confirm('Are you sure you want to delete this room?')) return;
  try {
    await apiDelete(`/api/rooms/delete/${id}`);
    showToast('Room deleted', 'success');
    loadRooms();
  } catch(err) {
    showToast(err.message, 'error');
  }
}
