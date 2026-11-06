/**
 * app/src/auth/auth.js
 * ──────────────────────────────────────────────────────────────
 * Credential store, session management, and role guard.
 *
 * Two built-in accounts:
 *   admin / admin123  → role "admin"  (full read + write access)
 *   user  / user123   → role "user"   (read-only, no mutations)
 *
 * Additional accounts can be registered via the Register form
 * (all new registrations default to role "user").
 *
 * Session is persisted in sessionStorage so a page refresh
 * keeps the user logged in within the same browser tab.
 * ──────────────────────────────────────────────────────────────
 */

// ── Credential store (keyed by username) ──────────────────────
// In production this would be a hashed password list server-side.
const AUTH_STORE_KEY = 'ams_accounts';

function _loadAccounts() {
  try {
    const raw = localStorage.getItem(AUTH_STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

function _saveAccounts(accounts) {
  localStorage.setItem(AUTH_STORE_KEY, JSON.stringify(accounts));
}

function _getAccounts() {
  let accounts = _loadAccounts();
  if (!accounts) {
    // Seed built-in accounts on first run
    accounts = {
      admin: { username: 'admin', password: 'admin123', role: 'admin', fullName: 'System Administrator', email: 'admin@ams.local' },
      user:  { username: 'user',  password: 'user123',  role: 'admin', fullName: 'Tester Account',       email: 'user@ams.local'  },
    };
    _saveAccounts(accounts);
  }
  return accounts;
}

// ── Session ───────────────────────────────────────────────────
const SESSION_KEY = 'ams_session';

/** @returns {{ username, role, fullName, email } | null} */
function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

function _setSession(account) {
  const { username, role, fullName, email } = account;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ username, role, fullName, email }));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

// ── Role guard ────────────────────────────────────────────────
/**
 * Returns true if the current session user can perform write
 * operations (add / edit / delete / approve).
 * Admins can write; plain users are read-only.
 */
function canEdit() {
  const s = getSession();
  return s !== null && s.role === 'admin';
}

// ── Auth actions ──────────────────────────────────────────────
/**
 * Attempt login.
 * @param {string} username
 * @param {string} password
 * @returns {{ ok: boolean, error?: string }}
 */
function authLogin(username, password) {
  if (!username || !password) {
    return { ok: false, error: 'Please enter both username and password.' };
  }
  const accounts = _getAccounts();
  const account  = accounts[username.toLowerCase().trim()];
  if (!account || account.password !== password) {
    return { ok: false, error: 'Incorrect username or password.' };
  }
  _setSession(account);
  return { ok: true };
}

/**
 * Register a new account (always role "user").
 * @param {string} fullName
 * @param {string} email
 * @param {string} username
 * @param {string} password
 * @param {string} confirmPassword
 * @returns {{ ok: boolean, error?: string }}
 */
function authRegister(fullName, email, username, password, confirmPassword) {
  if (!fullName || !email || !username || !password || !confirmPassword) {
    return { ok: false, error: 'All fields are required.' };
  }
  if (password !== confirmPassword) {
    return { ok: false, error: 'Passwords do not match.' };
  }
  if (password.length < 6) {
    return { ok: false, error: 'Password must be at least 6 characters.' };
  }
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return { ok: false, error: 'Username must be 3–20 characters (letters, numbers, underscore).' };
  }
  const accounts = _getAccounts();
  const key = username.toLowerCase().trim();
  if (accounts[key]) {
    return { ok: false, error: 'Username already taken.' };
  }
  accounts[key] = { username: key, password, role: 'user', fullName, email };
  _saveAccounts(accounts);
  return { ok: true };
}

/**
 * Delete a registered account (admin-only, cannot delete built-ins).
 * @param {string} username
 * @returns {{ ok: boolean, error?: string }}
 */
function authDeleteAccount(username) {
  const builtIns = ['admin', 'user'];
  if (builtIns.includes(username.toLowerCase())) {
    return { ok: false, error: 'Cannot delete built-in accounts.' };
  }
  const accounts = _getAccounts();
  delete accounts[username.toLowerCase()];
  _saveAccounts(accounts);
  return { ok: true };
}

/** Return all registered accounts (for admin user management). */
function authGetAllAccounts() {
  const accounts = _getAccounts();
  return Object.values(accounts).map(a => ({
    username: a.username,
    fullName: a.fullName,
    email:    a.email,
    role:     a.role,
  }));
}
