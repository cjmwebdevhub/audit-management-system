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
  currentUser: {
    id: 'AUDR-001',
    name: 'Maria Santos',
    role: 'cae',
    initials: 'MS',
    dept: 'Internal Audit',
  },

  // ── Role definitions (10 roles per workflow spec) ──────────
  roles: [
    { id: 'cae',           label: 'Chief Audit Executive' },
    { id: 'manager',       label: 'Audit Manager' },
    { id: 'lead',          label: 'Audit-in-Charge' },
    { id: 'staff',         label: 'Staff Auditor' },
    { id: 'reviewer',      label: 'Independent Reviewer' },
    { id: 'committee',     label: 'Audit Committee Member' },
    { id: 'exec',          label: 'Executive Viewer' },
    { id: 'dept_head',     label: 'Department Head' },
    { id: 'owner',         label: 'Issue Owner (Auditee)' },
    { id: 'admin',         label: 'System Administrator' },
  ],

  // ── Collection: data/iam ───────────────────────────────────
  users: [
    { id: 'AUDR-001', fullName: 'Maria Santos',     email: 'msantos@company.com',   department: 'Internal Audit', assignedRoles: ['role:cae'],                  invitation: { status: 'Active' } },
    { id: 'AUDR-002', fullName: 'James Reyes',      email: 'jreyes@company.com',    department: 'Internal Audit', assignedRoles: ['role:auditor_in_charge'],     invitation: { status: 'Active' } },
    { id: 'AUDR-003', fullName: 'Ana Cruz',         email: 'acruz@company.com',     department: 'Internal Audit', assignedRoles: ['role:staff_auditor'],         invitation: { status: 'Active' } },
    { id: 'AUDR-004', fullName: 'Carlos Tan',       email: 'ctan@company.com',      department: 'Internal Audit', assignedRoles: ['role:independent_reviewer'],  invitation: { status: 'Active' } },
    { id: 'USR-001',  fullName: 'Robert Lim',       email: 'rlim@company.com',      department: 'Finance',        assignedRoles: ['role:dept_head'],             invitation: { status: 'Active' } },
    { id: 'USR-002',  fullName: 'Grace Ocampo',     email: 'gocampo@company.com',   department: 'IT',             assignedRoles: ['role:issue_owner'],           reportsTo: 'USR-001', invitation: { status: 'Active' } },
    { id: 'USR-003',  fullName: 'Mark Dela Cruz',   email: 'mdelacruz@company.com', department: 'Operations',     assignedRoles: ['role:issue_owner'],           reportsTo: 'USR-001', invitation: { status: 'Active' } },
    { id: 'SIG-001',  fullName: 'Board Audit Committee', email: 'bac@company.com',  department: 'Board',          assignedRoles: ['role:audit_committee'],       invitation: { status: 'Active' } },
  ],

  // ── Collection: auditables ─────────────────────────────────
  auditables: [
    { sk: 'ENT-001', entityName: 'Core Banking System',        category: 'system',     department: 'IT',         owner: 'USR-002', likelihood: 5, impact: 5, riskScore: 25, riskRating: 'Critical', auditFrequencyMonths: 6,  defaultSize: 'Complex', lastAuditDate: '2024-06-15', lastAuditId: 'AUD-2024-001', nextDueDate: '2024-12-15', dueStatus: 'Overdue',        version: 3 },
    { sk: 'ENT-002', entityName: 'Financial Reporting',        category: 'process',    department: 'Finance',    owner: 'USR-001', likelihood: 4, impact: 5, riskScore: 20, riskRating: 'Critical', auditFrequencyMonths: 6,  defaultSize: 'Complex', lastAuditDate: '2025-01-10', lastAuditId: 'AUD-2025-001', nextDueDate: '2025-07-10', dueStatus: 'Overdue',        version: 2 },
    { sk: 'ENT-003', entityName: 'Procurement & Vendor Mgmt', category: 'process',    department: 'Operations', owner: 'USR-003', likelihood: 3, impact: 4, riskScore: 12, riskRating: 'High',     auditFrequencyMonths: 12, defaultSize: 'Medium',  lastAuditDate: '2025-03-20', lastAuditId: 'AUD-2025-002', nextDueDate: '2026-03-20', dueStatus: 'Due <= 90 days', version: 2 },
    { sk: 'ENT-004', entityName: 'HR & Payroll',              category: 'department', department: 'HR',         owner: 'USR-001', likelihood: 2, impact: 4, riskScore: 8,  riskRating: 'Medium',   auditFrequencyMonths: 24, defaultSize: 'Medium',  lastAuditDate: null,         lastAuditId: null,           nextDueDate: null,         dueStatus: 'Never audited',  version: 1 },
    { sk: 'ENT-005', entityName: 'Branch Operations - Makati',category: 'location',   department: 'Operations', owner: 'USR-003', likelihood: 2, impact: 3, riskScore: 6,  riskRating: 'Medium',   auditFrequencyMonths: 24, defaultSize: 'Simple',  lastAuditDate: '2024-12-01', lastAuditId: 'AUD-2024-005', nextDueDate: '2026-12-01', dueStatus: 'Not due',        version: 1 },
    { sk: 'ENT-006', entityName: 'Cybersecurity Controls',    category: 'system',     department: 'IT',         owner: 'USR-002', likelihood: 5, impact: 4, riskScore: 20, riskRating: 'Critical', auditFrequencyMonths: 6,  defaultSize: 'Complex', lastAuditDate: '2025-04-01', lastAuditId: null,           nextDueDate: '2025-10-01', dueStatus: 'Overdue',        version: 1 },
  ],

  // ── Collection: audits ─────────────────────────────────────
  audits: [
    {
      sk: 'AUD-2026-001', entityId: 'ENT-001', auditType: 'IT',
      title: 'Core Banking System IT Audit 2026',
      status: 'In progress', size: 'Complex', budgetedHours: 400, targetWeeks: 6,
      startDate: '2026-09-01', endDate: '2026-10-15',
      objectives: 'Assess IT controls, cybersecurity posture, and system reliability of core banking operations.',
      scope: 'Core Banking System modules including transaction processing, user access, and data management.',
      team: {
        supervisor: { auditorId: 'AUDR-001', allocatedHours: 40 },
        lead:       { auditorId: 'AUDR-002', allocatedHours: 120 },
        staff:      [{ auditorId: 'AUDR-003', allocatedHours: 240 }],
      },
      contacts: ['USR-002'],
      readinessChecks: {
        objectives: true, scope: true, lead: true, independence: true, timeline: true,
        notificationLetter: true, docRequestList: true, teamConfirmed: true, managementBriefing: false,
      },
      report: { status: 'Draft', overallRating: null },
      version: 5,
    },
    {
      sk: 'AUD-2026-002', entityId: 'ENT-002', auditType: 'Financial',
      title: 'Financial Reporting Audit Q2 2026',
      status: 'Reporting', size: 'Complex', budgetedHours: 400, targetWeeks: 6,
      startDate: '2026-07-15', endDate: '2026-09-30',
      objectives: 'Evaluate accuracy, completeness, and compliance of financial reporting processes.',
      scope: 'General ledger, financial statements, period-close procedures.',
      team: {
        supervisor: { auditorId: 'AUDR-001', allocatedHours: 40 },
        lead:       { auditorId: 'AUDR-002', allocatedHours: 120 },
        staff:      [{ auditorId: 'AUDR-003', allocatedHours: 240 }],
      },
      contacts: ['USR-001'],
      readinessChecks: {
        objectives: true, scope: true, lead: true, independence: true, timeline: true,
        notificationLetter: true, docRequestList: true, teamConfirmed: true, managementBriefing: true,
      },
      report: {
        reportRef: 'IA-2026-002-RPT',
        status: 'For engagement lead approval',
        overallRating: 'Needs improvement',
        reportDate: '2026-10-28',
        executiveSummary: 'The audit identified two significant findings related to period-close controls and journal entry approvals.',
        includedFindingIds: ['AUD-2026-002#F-001', 'AUD-2026-002#F-002'],
      },
      version: 8,
    },
    {
      sk: 'AUD-2026-003', entityId: 'ENT-003', auditType: 'Operational',
      title: 'Procurement Controls Audit 2026',
      status: 'Planned', size: 'Medium', budgetedHours: 240, targetWeeks: 4,
      startDate: '2026-12-01', endDate: '2026-12-31',
      objectives: 'Review procurement processes and vendor management controls.',
      scope: 'Vendor onboarding, PO process, three-way matching, payment approvals.',
      team: {
        supervisor: { auditorId: 'AUDR-001', allocatedHours: 30 },
        lead:       { auditorId: 'AUDR-002', allocatedHours: 80 },
        staff:      [],
      },
      contacts: ['USR-003'],
      readinessChecks: {
        objectives: true, scope: false, lead: true, independence: false, timeline: false,
        notificationLetter: false, docRequestList: false, teamConfirmed: false, managementBriefing: false,
      },
      report: { status: 'Draft' },
      version: 1,
    },
  ],

  // ── Collection: notes (Working Notes & Findings) ───────────
  notes: [
    { sk: 'AUD-2026-001#WN-001', auditId: 'AUD-2026-001', ref: 'WN-001', type: 'NOTE',    title: 'User Access Review - System Admin Accounts', reviewStatus: 'For head review', independentReviewNeeded: false, isSharedWithAuditee: false, comments: [], version: 2 },
    { sk: 'AUD-2026-001#WN-002', auditId: 'AUD-2026-001', ref: 'WN-002', type: 'NOTE',    title: 'Patch Management Observation',               reviewStatus: 'Draft',          independentReviewNeeded: false, isSharedWithAuditee: false, comments: [], version: 1 },
    {
      sk: 'AUD-2026-001#F-001', auditId: 'AUD-2026-001', ref: 'F-001', type: 'FINDING',
      title: 'Excessive Privileged Access Accounts',
      reviewStatus: 'Cleared', independentReviewNeeded: true, isSharedWithAuditee: true,
      severity: 'High', category: 'Access Control',
      condition:      '38 dormant admin accounts identified in production system',
      criteria:       'IT Security Policy 3.2 - Access reviews shall be conducted quarterly',
      cause:          'Lack of automated deprovisioning upon role change or termination',
      effect:         'Unauthorized access risk to core banking data and functions',
      recommendation: 'Implement automated deprovisioning workflow integrated with HR system',
      actionOwner: 'USR-002', targetDate: '2026-12-31',
      comments: [{ commentId: 'C001', authorId: 'AUDR-002', authorRole: 'Lead', text: 'Confirmed with IT team - 38 accounts verified dormant for 90+ days.', visibility: 'Internal', createdAt: '2026-10-15T10:00:00Z' }],
      version: 4,
    },
    {
      sk: 'AUD-2026-002#F-001', auditId: 'AUD-2026-002', ref: 'F-001', type: 'FINDING',
      title: 'Inadequate Period-Close Controls',
      reviewStatus: 'Cleared', independentReviewNeeded: true, isSharedWithAuditee: true,
      severity: 'High', category: 'Financial Controls',
      condition:      'Journal entries over PHP 500K approved by same preparer',
      criteria:       'Segregation of duties policy',
      cause:          'System configuration does not enforce dual approval',
      effect:         'Risk of unauthorized financial adjustments',
      recommendation: 'Configure system to require approver different from preparer',
      actionOwner: 'USR-001', targetDate: '2026-11-30',
      comments: [], version: 3,
    },
    {
      sk: 'AUD-2026-002#F-002', auditId: 'AUD-2026-002', ref: 'F-002', type: 'FINDING',
      title: 'Incomplete Reconciliation Documentation',
      reviewStatus: 'Cleared', independentReviewNeeded: false, isSharedWithAuditee: true,
      severity: 'Medium', category: 'Documentation',
      condition:      '12 of 30 monthly reconciliations lacked supervisor sign-off',
      criteria:       'Reconciliation Policy 4.1',
      cause:          'Manual process without system enforcement',
      effect:         'Undetected reconciliation errors may persist',
      recommendation: 'Implement digital workflow for reconciliation approvals',
      actionOwner: 'USR-001', targetDate: '2026-11-30',
      comments: [], version: 2,
    },
  ],

  // ── Collection: docreqs ────────────────────────────────────
  docreqs: [
    { sk: 'AUD-2026-001__DRL-001', auditId: 'AUD-2026-001', requestId: 'DRL-001', title: 'User Access Report - All Systems',        description: 'Complete list of all active users with access rights per system as of audit date.',   dueDate: '2026-09-15', status: 'Accepted',  attachedFiles: ['evidence/AUD-2026-001/auditee/user-access-report.xlsx'],     version: 3 },
    { sk: 'AUD-2026-001__DRL-002', auditId: 'AUD-2026-001', requestId: 'DRL-002', title: 'IT Security Policy Documentation',        description: 'Current version of IT Security Policy and last review date.',                        dueDate: '2026-09-15', status: 'Submitted', attachedFiles: ['evidence/AUD-2026-001/auditee/it-security-policy-v4.pdf'],   version: 2 },
    { sk: 'AUD-2026-001__DRL-003', auditId: 'AUD-2026-001', requestId: 'DRL-003', title: 'Quarterly Access Review Records',         description: 'Evidence of access reviews performed in the past 12 months.',                       dueDate: '2026-09-20', status: 'Returned',  returnReason: 'Document provided is outdated. Please provide Q3 and Q4 2025 reviews.', attachedFiles: [], version: 2 },
    { sk: 'AUD-2026-002__DRL-001', auditId: 'AUD-2026-002', requestId: 'DRL-001', title: 'Journal Entry Listing - Q1 & Q2 2026',   description: 'Complete JE listing with approver details and amounts.',                            dueDate: '2026-08-01', status: 'Accepted',  attachedFiles: ['evidence/AUD-2026-002/auditee/je-listing-q1q2-2026.xlsx'],   version: 2 },
    { sk: 'AUD-2026-003__DRL-001', auditId: 'AUD-2026-003', requestId: 'DRL-001', title: 'Vendor Master List',                     description: 'Current vendor master list with onboarding dates and approval status.',               dueDate: '2026-12-10', status: 'Requested', attachedFiles: [], version: 1 },
  ],

  // ── Collection: issues ─────────────────────────────────────
  issues: [
    {
      sk: 'AUD-2026-001-F-001', auditId: 'AUD-2026-001', findingId: 'F-001',
      dept: 'IT', status: 'In progress',
      owner: 'USR-002', monitoringAuditor: 'AUDR-002', engagementLead: 'AUDR-002',
      severity: 'High', originalTargetDate: '2026-12-31', currentTargetDate: '2026-12-31',
      extensionCount: 0, percentComplete: 35,
      findingSnapshot: { condition: '38 dormant admin accounts identified', recommendation: 'Implement automated deprovisioning workflow' },
      closureFlow: { currentStep: 0, outcome: 'Pending' },
      closedAt: null, version: 2,
    },
    {
      sk: 'AUD-2026-002-F-001', auditId: 'AUD-2026-002', findingId: 'F-001',
      dept: 'Finance', status: 'For auditee head approval',
      owner: 'USR-001', monitoringAuditor: 'AUDR-002', engagementLead: 'AUDR-002',
      severity: 'High', originalTargetDate: '2026-11-30', currentTargetDate: '2026-11-30',
      extensionCount: 0, percentComplete: 100,
      findingSnapshot: { condition: 'Journal entries over PHP 500K approved by same preparer', recommendation: 'Configure system to require approver different from preparer' },
      closureFlow: {
        currentStep: 1,
        submissionSummary: 'System configuration updated and tested. Dual-approval now enforced for all JEs above threshold.',
        closureArtifactFileKeys: ['evidence/AUD-2026-002/closure/config-screenshot.png'],
        headApproval: null,
        outcome: 'Pending',
      },
      closedAt: null, version: 4,
    },
    {
      sk: 'AUD-2026-002-F-002', auditId: 'AUD-2026-002', findingId: 'F-002',
      dept: 'Finance', status: 'Open',
      owner: 'USR-001', monitoringAuditor: 'AUDR-002', engagementLead: 'AUDR-002',
      severity: 'Medium', originalTargetDate: '2026-11-30', currentTargetDate: '2026-11-30',
      extensionCount: 0, percentComplete: 0,
      findingSnapshot: { condition: '12 of 30 monthly reconciliations lacked supervisor sign-off', recommendation: 'Implement digital workflow for reconciliation approvals' },
      closureFlow: { currentStep: 0, outcome: 'Pending' },
      closedAt: null, version: 1,
    },
  ],

  // ── Collection: trail ──────────────────────────────────────
  trail: [
    { sk: '2026-10-28T14:30:00Z#a1b2c3', auditId: 'AUD-2026-002', action: 'StatusTransition', entityRef: 'IA-2026-002-RPT', performedBy: 'AUDR-002', roles: ['role:auditor_in_charge'], details: { from: 'Draft',                     to: 'For engagement lead approval' }, timestamp: '2026-10-28T14:30:00Z' },
    { sk: '2026-10-20T09:15:00Z#d4e5f6', auditId: 'AUD-2026-001', action: 'Review',           entityRef: 'F-001',           performedBy: 'AUDR-001', roles: ['role:cae'],                details: { from: 'For independent review', to: 'Cleared'                      }, timestamp: '2026-10-20T09:15:00Z' },
    { sk: '2026-10-15T11:00:00Z#g7h8i9', auditId: 'AUD-2026-001', action: 'Edit',             entityRef: 'F-001',           performedBy: 'AUDR-002', roles: ['role:auditor_in_charge'], details: { field: 'condition', prev: 'Draft finding', next: '38 dormant admin accounts' }, timestamp: '2026-10-15T11:00:00Z' },
    { sk: '2026-10-01T08:00:00Z#j0k1l2', auditId: '_iam',          action: 'Create',           entityRef: 'USR-002',         performedBy: 'AUDR-001', roles: ['role:cae'],                details: { action: 'User invited', email: 'gocampo@company.com'               }, timestamp: '2026-10-01T08:00:00Z' },
  ],
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

