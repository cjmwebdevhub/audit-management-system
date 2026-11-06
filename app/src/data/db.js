/**
 * app/src/data/db.js
 * ──────────────────────────────────────────────────────────────
 * In-memory data store backed by Supabase.
 * Every mutation is synced to Supabase so data is shared across
 * all browsers and devices in real time.
 *
 * Collections:
 *   auditables  — Audit Universe  (ENT-###)
 *   audits      — Engagements     (AUD-YYYY-NNN)
 *   notes       — Working Notes & Findings
 *   docreqs     — Document Requests
 *   issues      — Remediation Tracking
 *   trail       — Audit Trail
 *   users       — IAM / Users & Roles
 * ──────────────────────────────────────────────────────────────
 */

// ── Supabase config ───────────────────────────────────────────
const SUPA_URL = 'https://lhypdkxdflgegfusezjg.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoeXBka3hkZmxnZWdmdXNlempnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5MzI2MTEsImV4cCI6MjEwOTUwODYxMX0.WzNlaNHQV7E0SkoBsyFzTV4dms-OcKNH8moMNmVDtBk';

const SUPA_HEADERS = {
  'apikey':        SUPA_KEY,
  'Authorization': 'Bearer ' + SUPA_KEY,
  'Content-Type':  'application/json',
  'Prefer':        'resolution=merge-duplicates',
};

// Table name map
const SUPA_TABLES = {
  auditables: 'ams_auditables',
  audits:     'ams_audits',
  notes:      'ams_notes',
  docreqs:    'ams_docreqs',
  issues:     'ams_issues',
  trail:      'ams_trail',
  users:      'ams_users',
};

// ── In-memory store ───────────────────────────────────────────
const DB = {
  currentUser: null,

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

  users:      [],
  auditables: [],
  audits:     [],
  notes:      [],
  docreqs:    [],
  issues:     [],
  trail:      [],
};

// ── Supabase helpers ──────────────────────────────────────────

/** Fetch all rows from a table and return as plain JS objects. */
async function _supaFetch(collection) {
  const table = SUPA_TABLES[collection];
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}?select=sk,data&order=sk`, {
    headers: SUPA_HEADERS,
  });
  if (!res.ok) throw new Error(`Supabase fetch ${table}: ${res.status}`);
  const rows = await res.json();
  // Each row is { sk, data } — unwrap data and inject sk
  return rows.map(r => ({ ...r.data, sk: r.sk }));
}

/** Upsert a single item (insert or update by sk). */
async function _supaUpsert(collection, item) {
  const table = SUPA_TABLES[collection];
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}`, {
    method:  'POST',
    headers: SUPA_HEADERS,
    body:    JSON.stringify({ sk: item.sk, data: item }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase upsert ${table}: ${res.status} — ${err}`);
  }
}

/** Delete a single item by sk. */
async function _supaDelete(collection, sk) {
  const table = SUPA_TABLES[collection];
  const res = await fetch(
    `${SUPA_URL}/rest/v1/${table}?sk=eq.${encodeURIComponent(sk)}`,
    { method: 'DELETE', headers: SUPA_HEADERS }
  );
  if (!res.ok) throw new Error(`Supabase delete ${table}: ${res.status}`);
}

// ── Public API ────────────────────────────────────────────────

/**
 * Load all collections from Supabase into the in-memory DB.
 * Called once on app boot. Returns a Promise.
 */
async function dbLoad() {
  try {
    const collections = Object.keys(SUPA_TABLES);
    const results = await Promise.all(collections.map(c => _supaFetch(c)));
    collections.forEach((c, i) => { DB[c] = results[i]; });
    return true;
  } catch (e) {
    console.error('AMS: Supabase load failed', e);
    toast('Could not load data from server. Check your connection.', 'error');
    return false;
  }
}

/**
 * Save (upsert) every item in a collection that was touched.
 * Components call dbSave() after any mutation — we diff against
 * Supabase by upserting the entire in-memory collection.
 * This is simple and correct for a demo-scale app.
 */
async function dbSave() {
  try {
    const collections = Object.keys(SUPA_TABLES);
    for (const c of collections) {
      for (const item of DB[c]) {
        await _supaUpsert(c, item);
      }
    }
  } catch (e) {
    console.error('AMS: Supabase save failed', e);
    toast('Save failed — check your connection.', 'error');
  }
}

/**
 * Save a single item immediately (faster than full dbSave).
 * Use this after adding or editing one record.
 */
async function dbSaveItem(collection, item) {
  try {
    await _supaUpsert(collection, item);
  } catch (e) {
    console.error('AMS: Supabase saveItem failed', e);
    toast('Save failed — check your connection.', 'error');
  }
}

/**
 * Delete a single item from Supabase and remove from in-memory DB.
 */
async function dbDeleteItem(collection, sk) {
  try {
    DB[collection] = DB[collection].filter(i => i.sk !== sk);
    await _supaDelete(collection, sk);
  } catch (e) {
    console.error('AMS: Supabase delete failed', e);
    toast('Delete failed — check your connection.', 'error');
  }
}

/**
 * Wipe all data from Supabase and reload.
 */
async function dbReset() {
  if (!confirm('Reset ALL data? This will permanently delete everything from the server.')) return;
  try {
    const collections = Object.keys(SUPA_TABLES);
    for (const c of collections) {
      const table = SUPA_TABLES[c];
      await fetch(`${SUPA_URL}/rest/v1/${table}?sk=neq.`, {
        method: 'DELETE', headers: SUPA_HEADERS,
      });
      DB[c] = [];
    }
    toast('All data cleared.', 'info');
    navigate('dashboard');
  } catch (e) {
    console.error('AMS: Supabase reset failed', e);
    toast('Reset failed — check your connection.', 'error');
  }
}
