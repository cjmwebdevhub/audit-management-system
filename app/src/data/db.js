/**
 * app/src/data/db.js
 * ──────────────────────────────────────────────────────────────
 * In-memory data store (simulates DynamoDB collections).
 * In production this is replaced by api/src/lib/dynamodb.js
 * hitting the real amsdata DynamoDB table.
 *
 * Collections mirror the single-table design defined in the
 * Workflow document:
 *   auditables  — Audit Universe (ENT-###)
 *   audits      — Engagements    (AUD-YYYY-NNN)
 *   notes       — Working Notes & Findings
 *   docreqs     — Document Requests
 *   issues      — Remediation Tracking
 *   trail       — Tamper-Proof Audit Trail
 *   data/iam    — Users & Roles
 * ──────────────────────────────────────────────────────────────
 */

const DB = {
  // ── Active session user ────────────────────────────────────
  currentUser: null,

  // ── Role definitions ───────────────────────────────────────
  roles: [
    { id: 'cae',       label: 'Chief Audit Executive' },
    { id: 'manager',   label: 'Audit Manager' },
    { id: 'lead',      label: 'Audit-in-Charge' },
    { id: 'staff',     label: 'Staff Auditor' },
    { id: 'reviewer',  label: 'Independent Reviewer' },
    { id: 'committee', label: 'Audit Committee Member' },
    { id: 'exec',      label: 'Executive Viewer' },
    { id: 'dept_head', label: 'Department Head' },
    { id: 'owner',     label: 'Issue Owner (Auditee)' },
    { id: 'admin',     label: 'System Administrator' },
  ],

  // ── Empty collections — ready for testers to fill ─────────
  users:      [],
  auditables: [],
  audits:     [],
  notes:      [],
  docreqs:    [],
  issues:     [],
  trail:      [],
};

// ============================================================
// LOCALSTORAGE PERSISTENCE
// ============================================================
// All audit data is saved to localStorage on every mutation
// so it survives page refreshes and browser restarts.
//
// Key:   ams_data
// Reset: call DB.reset() from the browser console, or use
//        the "Reset to Sample Data" button in the sidebar.
// ============================================================

const DB_STORAGE_KEY = 'ams_data';

/** Persist the mutable collections to localStorage. */
function dbSave() {
  try {
    const payload = {
      auditables: DB.auditables,
      audits:     DB.audits,
      notes:      DB.notes,
      docreqs:    DB.docreqs,
      issues:     DB.issues,
      trail:      DB.trail,
      users:      DB.users,
    };
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('AMS: localStorage write failed', e);
  }
}

/** Reload collections from localStorage (called once on boot). */
function dbLoad() {
  try {
    const raw = localStorage.getItem(DB_STORAGE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    // Only restore collections that exist in the saved payload
    const keys = ['auditables','audits','notes','docreqs','issues','trail','users'];
    keys.forEach(k => { if (saved[k]) DB[k] = saved[k]; });
    return true;
  } catch (e) {
    console.warn('AMS: localStorage read failed — using seed data', e);
    return false;
  }
}

/** Wipe localStorage and reload the page to restore seed data. */
function dbReset() {
  if (!confirm('Reset ALL data to the original sample data? This cannot be undone.')) return;
  localStorage.removeItem(DB_STORAGE_KEY);
  location.reload();
}

