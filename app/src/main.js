/**
 * app/src/main.js
 * ──────────────────────────────────────────────────────────────
 * Application entry point.
 * Checks auth session, shows/hides the login screen,
 * bootstraps the sidebar, and renders the initial page.
 *
 * Auth UI functions (authShowTab, authDoLogin, authDoRegister,
 * authLogout) live here so they are available globally as
 * onclick handlers defined in index.html.
 *
 * Depends on: auth.js (loaded first), db.js, helpers.js,
 *             navigation.js, all components.
 * ──────────────────────────────────────────────────────────────
 */

// ── Auth UI helpers ───────────────────────────────────────────

/** Switch between the Sign-In and Register panels. */
function authShowTab(tab) {
  ['login', 'register'].forEach(t => {
    document.getElementById('tab-' + t).classList.toggle('active', t === tab);
    document.getElementById('panel-' + t).classList.toggle('active', t === tab);
  });
  // Clear messages when switching tabs
  ['login-error', 'login-success', 'reg-error', 'reg-success'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('show'); el.textContent = ''; }
  });
}

function _showAuthMsg(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = (type === 'error' ? '⚠️ ' : '✅ ') + text;
  el.className = (type === 'error' ? 'auth-error' : 'auth-success') + ' show';
}

/** Handle the Sign In button click. */
function authDoLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  const result = authLogin(username, password);
  if (!result.ok) {
    _showAuthMsg('login-error', result.error, 'error');
    return;
  }
  // Clear password field for security
  document.getElementById('login-password').value = '';
  // Boot the app
  _bootApp();
}

/** Handle the Create Account button click. */
function authDoRegister() {
  const fullName  = document.getElementById('reg-name').value.trim();
  const email     = document.getElementById('reg-email').value.trim();
  const username  = document.getElementById('reg-username').value.trim();
  const password  = document.getElementById('reg-password').value;
  const confirm   = document.getElementById('reg-confirm').value;

  const result = authRegister(fullName, email, username, password, confirm);
  if (!result.ok) {
    _showAuthMsg('reg-error', result.error, 'error');
    return;
  }
  // Clear form
  ['reg-name','reg-email','reg-username','reg-password','reg-confirm'].forEach(id => {
    document.getElementById(id).value = '';
  });
  _showAuthMsg('reg-success', 'Account created! You can now sign in.', 'success');
  // Switch to login tab after short delay
  setTimeout(() => authShowTab('login'), 1400);
}

/** Sign out — clear session and show login screen. */
function authLogout() {
  clearSession();
  // Show auth screen, hide app
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  authShowTab('login');
  toast('Signed out successfully', 'info');
}

// ── Enter-key support ─────────────────────────────────────────
function _bindEnterKey() {
  document.getElementById('login-password').addEventListener('keydown', e => {
    if (e.key === 'Enter') authDoLogin();
  });
  document.getElementById('login-username').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('login-password').focus();
  });
  document.getElementById('reg-confirm').addEventListener('keydown', e => {
    if (e.key === 'Enter') authDoRegister();
  });
}

// ── App bootstrap ─────────────────────────────────────────────

/** Populate sidebar and topbar from the active session, then render. */
function _bootApp() {
  const session = getSession();
  if (!session) return; // safety guard

  // Hide auth screen, show app
  document.getElementById('auth-screen').classList.add('hidden');

  // Sidebar user chip
  const initials = session.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  document.getElementById('user-avatar').textContent = initials;
  document.getElementById('user-name').textContent   = session.fullName;
  document.getElementById('user-role').textContent   =
    session.role === 'admin' ? '⚡ Administrator' : '👁 Viewer';

  // Read-only banner (visible for non-admin)
  const banner = document.getElementById('readonly-banner');
  if (banner) banner.classList.toggle('show', session.role !== 'admin');

  // Hide Users & Roles nav from non-admins (admin-only section)
  const iamNav = document.getElementById('nav-iam');
  if (iamNav) iamNav.style.display = session.role === 'admin' ? '' : 'none';

  // Refresh sidebar notification badges
  document.getElementById('badge-issues').textContent  =
    DB.issues.filter(i => i.status !== 'Closed').length  || '';
  document.getElementById('badge-docreqs').textContent =
    DB.docreqs.filter(d => d.status === 'Submitted').length || '';

  // Render landing page
  navigate('dashboard');
}

// ── DOMContentLoaded ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  _bindEnterKey();

  // Load persisted data from localStorage (falls back to seed data silently)
  dbLoad();

  // If a valid session already exists (same browser tab), skip the login screen
  const session = getSession();
  if (session) {
    _bootApp();
  }
  // Otherwise the auth screen is already visible (default state in HTML)
});
