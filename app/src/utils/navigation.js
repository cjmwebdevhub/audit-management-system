/**
 * app/src/utils/navigation.js
 * ──────────────────────────────────────────────────────────────
 * SPA client-side router.
 * Depends on: helpers.js, all component render functions.
 * ──────────────────────────────────────────────────────────────
 */

let currentPage = 'dashboard';

/**
 * Navigate to a named page, highlight the sidebar item and
 * invoke the matching render function.
 * @param {string} page
 */
function navigate(page) {
  currentPage = page;

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navEl = document.getElementById(`nav-${page}`);
  if (navEl) navEl.classList.add('active');

  const titles = {
    dashboard:   'Dashboard',
    universe:    'Audit Universe',
    plan:        'Annual Audit Plan',
    engagements: 'Engagements',
    fieldwork:   'Fieldwork & Notes',
    docreqs:     'Document Requests',
    reporting:   'Reports',
    issues:      'Issues & Remediation',
    iam:         'Users & Roles',
    trail:       'Audit Trail',
  };
  document.getElementById('page-title').textContent = titles[page] || page;

  // Clear topbar actions before each render so stale buttons are removed
  document.getElementById('topbar-actions').innerHTML = '';

  const renderers = {
    dashboard:   renderDashboard,
    universe:    renderUniverse,
    plan:        renderPlan,
    engagements: renderEngagements,
    fieldwork:   renderFieldwork,
    docreqs:     renderDocReqs,
    reporting:   renderReporting,
    issues:      renderIssues,
    iam:         renderIAM,
    trail:       renderTrail,
  };

  if (renderers[page]) {
    renderers[page]();
    // Auto-save after every render in case the component mutated DB
    dbSave();
  }
}
