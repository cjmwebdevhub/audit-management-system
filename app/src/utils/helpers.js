/**
 * app/src/utils/helpers.js
 * ──────────────────────────────────────────────────────────────
 * Shared UI primitives used across all component modules.
 * Depends on: db.js (for DB.users lookup in userName())
 * ──────────────────────────────────────────────────────────────
 */

/**
 * Show a temporary toast notification.
 * @param {string} msg
 * @param {'info'|'success'|'error'} type
 */
function toast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icons = { info: 'ℹ️', success: '✅', error: '❌' };
  el.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/**
 * Return a coloured badge HTML string for a given status/rating.
 * @param {string} status
 * @returns {string} HTML
 */
function badge(status) {
  const map = {
    'Critical':  'badge-critical',
    'High':      'badge-high',
    'Medium':    'badge-medium',
    'Low':       'badge-low',
    'Planned':   'badge-planned',
    'Scheduled': 'badge-scheduled',
    'In progress':                    'badge-in-progress',
    'Reporting':                      'badge-reporting',
    'Closed':                         'badge-closed',
    'Deferred':                       'badge-deferred',
    'Cancelled':                      'badge-cancelled',
    'Draft':                          'badge-draft',
    'Open':                           'badge-open',
    'Approved':                       'badge-approved',
    'Pending':                        'badge-pending',
    'Overdue':                        'badge-overdue',
    'Due <= 90 days':                 'badge-due-soon',
    'Not due':                        'badge-not-due',
    'Never audited':                  'badge-never',
    'Accepted':                       'badge-approved',
    'Requested':                      'badge-pending',
    'Returned':                       'badge-overdue',
    'Submitted':                      'badge-in-progress',
    'Active':                         'badge-approved',
    'Invited':                        'badge-in-progress',
    'Expired':                        'badge-overdue',
    'Not invited':                    'badge-never',
    'Cleared':                        'badge-approved',
    'For head review':                'badge-in-progress',
    'For independent review':         'badge-warning',
    'For auditee head approval':      'badge-warning',
    'For auditor review':             'badge-in-progress',
    'For engagement lead approval':   'badge-in-progress',
    'Satisfactory':                   'badge-approved',
    'Needs improvement':              'badge-warning',
    'Unsatisfactory':                 'badge-overdue',
  };
  const cls = map[status] || 'badge-default';
  return `<span class="badge ${cls}">${status}</span>`;
}

/**
 * Resolve a user ID to a full name.
 * @param {string} id
 * @returns {string}
 */
function userName(id) {
  const user = DB.users.find(u => u.id === id);
  return user ? user.fullName : id;
}

/**
 * Return the CSS risk-level class for a risk rating string.
 * @param {string} rating
 * @returns {string}
 */
function riskClass(rating) {
  return { Critical: 'risk-critical', High: 'risk-high', Medium: 'risk-medium', Low: 'risk-low' }[rating] || '';
}

/**
 * Format an ISO-8601 date string to a localised short date.
 * Returns '—' for falsy input.
 * @param {string|null} dateStr
 * @returns {string}
 */
function fmt(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Render a modal overlay with title, body HTML and optional footer.
 * @param {string} title
 * @param {string} bodyHtml
 * @param {string} [footerHtml]
 * @param {string} [sizeCls]  — e.g. 'modal-lg'
 */
function modal(title, bodyHtml, footerHtml = '', sizeCls = '') {
  document.getElementById('modal-root').innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
      <div class="modal ${sizeCls}">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close" onclick="closeModal()">✕</button>
        </div>
        <div class="modal-body">${bodyHtml}</div>
        ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
      </div>
    </div>`;
}

/** Remove the active modal from the DOM and persist any mutations. */
function closeModal() {
  document.getElementById('modal-root').innerHTML = '';
  dbSave();
}

/**
 * Switch active tab within a tab-bar / tab-panel group.
 * Works for both modal-body containers and page-level tab-bars.
 * @param {HTMLElement} btn   — the clicked .tab-btn
 * @param {string}      panelId — id of the .tab-panel to activate
 */
function switchTab(btn, panelId) {
  btn.closest('.tab-bar').querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const container = btn.closest('.modal-body') || document;
  container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(panelId);
  if (target) target.classList.add('active');
}
