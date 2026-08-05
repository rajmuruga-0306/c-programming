async function renderReportsPage() {
  const content = `
    <h2>Reports & Analytics 📈</h2>
    <p class="text-secondary mb-4">View occupancy data and available rooms.</p>
    
    <div class="tabs mb-4">
      <div class="tab active" id="tab-occupancy" onclick="switchReportTab('occupancy')">Occupancy Report</div>
      <div class="tab" id="tab-vacant" onclick="switchReportTab('vacant')">Vacant Rooms</div>
    </div>
    
    <div class="card table-responsive" id="report-container">
      <div class="spinner"></div>
    </div>
  `;
  document.getElementById('app').innerHTML = renderLayout(adminLinks, '#/admin/reports', content);
  loadOccupancyReport();
}

function switchReportTab(tab) {
  document.getElementById('tab-occupancy').classList.remove('active');
  document.getElementById('tab-vacant').classList.remove('active');
  document.getElementById(`tab-${tab}`).classList.add('active');
  
  if (tab === 'occupancy') loadOccupancyReport();
  else loadVacantReport();
}

async function loadOccupancyReport() {
  showLoading('report-container');
  try {
    const data = await apiGet('/api/reports/occupancy');
    let html = `
      <div class="flex-between mb-3">
        <h3>Block Occupancy</h3>
        <button class="btn btn-outline" onclick='exportToCSV(${JSON.stringify(data).replace(/'/g, "&apos;")}, "occupancy_report.csv")'>Export CSV ⬇️</button>
      </div>
      <table class="data-table">
        <thead>
          <tr><th>Block</th><th>Total Rooms</th><th>Total Capacity</th><th>Occupied</th><th>Vacant</th><th>Occupancy %</th></tr>
        </thead>
        <tbody>
    `;
    data.forEach(d => {
      const pct = d.total_capacity > 0 ? Math.round((d.occupied / d.total_capacity) * 100) : 0;
      html += `
        <tr>
          <td><strong>${escapeHtml(d.block_name)}</strong></td>
          <td>${d.total_rooms}</td>
          <td>${d.total_capacity}</td>
          <td>${d.occupied}</td>
          <td>${d.vacant}</td>
          <td>
            <div class="flex gap-2" style="align-items:center">
              <span>${pct}%</span>
              <div class="progress-bg" style="width: 100px"><div class="progress-fill" style="width: ${pct}%"></div></div>
            </div>
          </td>
        </tr>
      `;
    });
    html += `</tbody></table>`;
    document.getElementById('report-container').innerHTML = html;
  } catch (err) {
    document.getElementById('report-container').innerHTML = `<p class="text-danger">Failed to load report.</p>`;
  }
}

async function loadVacantReport() {
  showLoading('report-container');
  try {
    const data = await apiGet('/api/reports/vacant-rooms');
    let html = `
      <div class="flex-between mb-3">
        <h3>Available Rooms</h3>
        <button class="btn btn-outline" onclick='exportToCSV(${JSON.stringify(data).replace(/'/g, "&apos;")}, "vacant_rooms.csv")'>Export CSV ⬇️</button>
      </div>
      <table class="data-table">
        <thead>
          <tr><th>Room</th><th>Block</th><th>Floor</th><th>Type</th><th>Available Spots</th></tr>
        </thead>
        <tbody>
    `;
    data.forEach(r => {
      html += `
        <tr>
          <td><strong>${escapeHtml(r.room_number)}</strong></td>
          <td>${escapeHtml(r.block_name)}</td>
          <td>${r.floor}</td>
          <td>${roomTypeLabel(r.room_type)}</td>
          <td><strong>${r.vacant_spots}</strong> / ${r.capacity}</td>
        </tr>
      `;
    });
    html += `</tbody></table>`;
    document.getElementById('report-container').innerHTML = html;
  } catch (err) {
    document.getElementById('report-container').innerHTML = `<p class="text-danger">Failed to load report.</p>`;
  }
}
