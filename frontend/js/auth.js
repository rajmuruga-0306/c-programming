function renderLoginPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="full-screen-center">
      <div class="card auth-card">
        <div style="text-align: center; margin-bottom: 1.5rem;">
          <span style="font-size: 0.75rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--primary); font-weight: 700; background: rgba(99, 102, 241, 0.15); padding: 4px 12px; border-radius: 20px; border: 1px solid rgba(99, 102, 241, 0.3); display: inline-block; margin-bottom: 0.5rem;">SIMATS ENGINEERING</span>
          <h2 style="margin: 0; font-size: 1.7rem;">HostelHub Portal 🏠</h2>
        </div>
        
        <div class="tabs">
          <div class="tab active" id="tab-student" onclick="switchLoginTab('student')">Student</div>
          <div class="tab" id="tab-admin" onclick="switchLoginTab('admin')">Admin</div>
        </div>

        <form id="login-form" onsubmit="handleLogin(event)">
          <div id="student-fields">
            <div class="form-group">
              <label>Email</label>
              <input type="email" id="email" class="input" required>
            </div>
          </div>
          <div id="admin-fields" class="hidden">
            <div class="form-group">
              <label>Username</label>
              <input type="text" id="username" class="input" placeholder="admin">
            </div>
            <p style="font-size: 0.8rem; color: var(--primary); background: rgba(99,102,241,0.1); padding: 6px 12px; border-radius: 6px; margin-bottom: 1rem;">
              🔑 <strong>Default Admin Credentials:</strong><br>
              Username: <code style="color:var(--text-primary)">admin</code> | Password: <code style="color:var(--text-primary)">admin123</code>
            </p>
          </div>
          
          <div class="form-group">
            <label>Password</label>
            <input type="password" id="password" class="input" required placeholder="••••••••">
          </div>
          
          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">Login 🔑</button>
        </form>
        
        <p class="text-center mt-3 text-secondary" style="font-size: 0.9rem;" id="register-link-container">
          Don't have an account? <a href="#/register">Register here</a>
        </p>
      </div>
    </div>
  `;
}

function switchLoginTab(role) {
  document.getElementById('tab-student').classList.remove('active');
  document.getElementById('tab-admin').classList.remove('active');
  document.getElementById('tab-' + role).classList.add('active');
  
  if (role === 'student') {
    document.getElementById('student-fields').classList.remove('hidden');
    document.getElementById('admin-fields').classList.add('hidden');
    document.getElementById('email').required = true;
    document.getElementById('username').required = false;
    document.getElementById('register-link-container').classList.remove('hidden');
  } else {
    document.getElementById('student-fields').classList.add('hidden');
    document.getElementById('admin-fields').classList.remove('hidden');
    document.getElementById('email').required = false;
    document.getElementById('username').required = true;
    document.getElementById('register-link-container').classList.add('hidden');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const isStudent = document.getElementById('tab-student').classList.contains('active');
  const password = document.getElementById('password').value.trim();
  
  try {
    if (isStudent) {
      const email = document.getElementById('email').value.trim();
      const res = await apiPost('/api/student/login', { email, password });
      setToken(res.token);
      setUser(res.user);
      setRole('student');
      window.location.hash = '#/student/dashboard';
    } else {
      const username = document.getElementById('username').value.trim();
      const res = await apiPost('/api/admin/login', { username, password });
      setToken(res.token);
      setUser(res.user);
      setRole('admin');
      window.location.hash = '#/admin/dashboard';
    }
    showToast('Logged in successfully', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderRegisterPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="full-screen-center" style="padding: 2rem 1rem;">
      <div class="card auth-card" style="max-width: 500px;">
        <h2 class="text-center mb-4">Student Registration 📝</h2>
        
        <form id="register-form" onsubmit="handleRegister(event)">
          <div class="grid-2">
            <div class="form-group">
              <label>Full Name</label>
              <input type="text" id="reg-name" class="input" required>
            </div>
            <div class="form-group">
              <label>Student ID</label>
              <input type="text" id="reg-id" class="input" required>
            </div>
          </div>
          
          <div class="form-group">
            <label>Email</label>
            <input type="email" id="reg-email" class="input" required>
          </div>
          
          <div class="grid-2">
            <div class="form-group">
              <label>Department</label>
              <select id="reg-dept" class="input" required>
                <option value="">Select Dept</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Electronics">Electronics</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Civil">Civil</option>
                <option value="Chemical">Chemical</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label>Year</label>
              <select id="reg-year" class="input" required>
                <option value="">Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label>Phone Number</label>
            <input type="tel" id="reg-phone" class="input" required>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label>Password</label>
              <input type="password" id="reg-pass" class="input" required minlength="6">
            </div>
            <div class="form-group">
              <label>Confirm Password</label>
              <input type="password" id="reg-pass2" class="input" required minlength="6">
            </div>
          </div>
          
          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">Register ✅</button>
        </form>
        
        <p class="text-center mt-3 text-secondary" style="font-size: 0.9rem;">
          Already have an account? <a href="#/login">Login here</a>
        </p>
      </div>
    </div>
  `;
}

async function handleRegister(e) {
  e.preventDefault();
  const pass1 = document.getElementById('reg-pass').value;
  const pass2 = document.getElementById('reg-pass2').value;
  
  if (pass1 !== pass2) {
    showToast('Passwords do not match', 'error');
    return;
  }
  
  const body = {
    name: document.getElementById('reg-name').value,
    email: document.getElementById('reg-email').value,
    password: pass1,
    student_id: document.getElementById('reg-id').value,
    department: document.getElementById('reg-dept').value,
    year: parseInt(document.getElementById('reg-year').value),
    phone: document.getElementById('reg-phone').value
  };
  
  try {
    await apiPost('/api/student/register', body);
    showToast('Registration successful! Please login.', 'success');
    window.location.hash = '#/login';
  } catch (err) {
    showToast(err.message, 'error');
  }
}
