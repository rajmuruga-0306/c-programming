const routes = {
  '#/login': renderLoginPage,
  '#/register': renderRegisterPage,
  '#/student/dashboard': renderStudentDashboard,
  '#/student/rooms': renderRoomExplorer,
  '#/student/apply': renderPreferenceForm,
  '#/student/allotment': renderStudentAllotment,
  '#/student/profile': renderStudentProfile,
  '#/student/notifications': renderNotificationsPage,
  '#/student/bills': renderBillsPage,
  '#/student/statement': renderStatementPage,
  '#/admin/dashboard': renderAdminDashboard,
  '#/admin/rooms': renderRoomManagement,
  '#/admin/applications': renderApplicationManagement,
  '#/admin/bills': renderAdminBillsPage,
  '#/admin/reports': renderReportsPage,
};

function router() {
  const hash = window.location.hash || '#/login';
  
  // Auth guards
  if (hash !== '#/login' && hash !== '#/register' && !getToken()) {
    window.location.hash = '#/login';
    return;
  }
  
  // Role guards
  if (hash.startsWith('#/admin') && !isAdmin() && getToken()) {
    window.location.hash = '#/student/dashboard';
    return;
  }
  if (hash.startsWith('#/student') && isAdmin() && getToken()) {
    window.location.hash = '#/admin/dashboard';
    return;
  }
  
  const renderFn = routes[hash];
  if (renderFn) {
    const app = document.getElementById('app');
    // Clear content before animation
    app.innerHTML = '';
    // Re-trigger animation
    app.classList.remove('page-enter');
    void app.offsetWidth; // trigger reflow
    app.classList.add('page-enter');
    
    renderFn();
  } else {
    window.location.hash = '#/login';
  }
}

function logout() {
  clearAuth();
  window.location.hash = '#/login';
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);
