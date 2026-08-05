function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  
  // Trigger animation
  requestAnimationFrame(() => toast.classList.add('show'));
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function showModal(title, contentHTML, actions = '') {
  const overlay = document.getElementById('modal-overlay');
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>${escapeHtml(title)}</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        ${contentHTML}
      </div>
      <div class="modal-actions">
        ${actions}
      </div>
    </div>
  `;
  overlay.classList.add('active');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
}

function formatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function exportToCSV(data, filename) {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const csvContent = "data:text/csv;charset=utf-8," 
    + headers.join(",") + "\n"
    + data.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(",")).join("\n");
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function showLoading(containerId) {
  const container = document.getElementById(containerId);
  if (container) container.innerHTML = '<div class="spinner"></div>';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function statusBadge(status) {
  const s = status ? status.toLowerCase() : 'unknown';
  let className = 'badge';
  if (s === 'allotted' || s === 'approved') className += ' badge-allotted';
  else if (s === 'pending') className += ' badge-pending';
  else if (s === 'rejected') className += ' badge-rejected';
  else if (s === 'waitlisted') className += ' badge-waitlisted';
  return `<span class="${className}">${escapeHtml(status)}</span>`;
}

function roomTypeLabel(type) {
  const t = (type || '').toLowerCase();
  if (t === 'single') return 'Single 🛏️';
  if (t === 'double') return 'Double 🛏️🛏️';
  if (t === 'triple') return 'Triple 🛏️🛏️🛏️';
  if (t === 'dorm') return 'Dorm 🛏️+';
  return escapeHtml(type);
}

function acBadge(acType) {
  const isAc = (acType || '').toLowerCase() === 'ac';
  if (isAc) {
    return `<span class="badge" style="background: rgba(6, 182, 212, 0.15); color: hsl(190, 90%, 60%); border: 1px solid rgba(6, 182, 212, 0.3);">❄️ A/C</span>`;
  } else {
    return `<span class="badge" style="background: rgba(245, 158, 11, 0.15); color: hsl(38, 95%, 60%); border: 1px solid rgba(245, 158, 11, 0.3);">🔥 Non-A/C</span>`;
  }
}

function renderLayout(sidebarLinks, activeLink, mainContentHTML) {
  const user = getUser();
  const name = user ? user.name || user.username : 'User';
  
  let linksHTML = sidebarLinks.map(link => 
    `<a href="${link.href}" class="${link.href === activeLink ? 'active' : ''}">${link.icon} ${link.label}</a>`
  ).join('');

  return `
    <div class="app-layout">
      <nav class="sidebar" id="sidebar">
        <div class="sidebar-logo">🏠 HostelHub</div>
        <div class="sidebar-nav">
          ${linksHTML}
        </div>
        <div class="sidebar-user">
          <div style="font-size: 2rem">👤</div>
          <div>
            <div style="font-weight: 600; font-size: 0.9rem">${escapeHtml(name)}</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary)"><a href="#" onclick="logout(); return false;">Logout</a></div>
          </div>
        </div>
      </nav>
      <main class="main-content">
        <header class="flex-between mb-4">
          <button class="menu-toggle" onclick="document.getElementById('sidebar').classList.toggle('open')">☰</button>
        </header>
        ${mainContentHTML}
      </main>
    </div>
  `;
}
