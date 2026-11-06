/**
 * app/src/components/plan.js
 * ──────────────────────────────────────────────────────────────
 * Stage 2 — Annual Audit Plan & Team Auto-Assignment.
 * Functions: renderPlan, openCreateAudit, updateBudget,
 *            saveNewAudit
 * Depends on: db.js, helpers.js
 * ──────────────────────────────────────────────────────────────
 */

function renderPlan() {
  document.getElementById('topbar-actions').innerHTML = canEdit()
    ? `<button class="btn btn-primary btn-sm" onclick="openCreateAudit()">+ Create Audit</button>`
    : '';

  const critHigh   = DB.auditables.filter(a => ['Critical', 'High'].includes(a.riskRating));
  const totalBudget = DB.audits.reduce((s, a) => s + a.budgetedHours, 0);
  const planStatus  = 'Approved by Audit Committee';

  document.getElementById('main-content').innerHTML = `
    <div class="alert alert-success">
      <span>✅</span>
      <div><strong>Stage 2: Annual Audit Planning</strong> — Annual Plan is <strong>${planStatus}</strong>. ${DB.audits.length} audits planned with ${totalBudget} total budgeted hours.</div>
    </div>

    <div class="grid-3 mb-4">
      <div class="stat-card">
        <div class="stat-label">Total Audits</div>
        <div class="stat-value" style="color:var(--primary)">${DB.audits.length}</div>
        <div class="stat-sub">In annual plan</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Budget</div>
        <div class="stat-value" style="color:var(--success)">${totalBudget}h</div>
        <div class="stat-sub">Allocated hours</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">High+ Risk Entities</div>
        <div class="stat-value" style="color:var(--danger)">${critHigh.length}</div>
        <div class="stat-sub">Prioritized for audit</div>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-header">
        <div class="card-title">Annual Audit Plan — FY 2026</div>
        ${canEdit() ? `<button class="btn btn-success btn-sm" onclick="toast('Annual Plan Memo generated and submitted to Audit Committee','success')">
          📄 Generate Plan Memo (AP)
        </button>` : ''}
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Audit Ref</th><th>Title</th><th>Type</th><th>Entity</th><th>Size</th>
              <th>Budget Hours</th><th>Duration</th><th>Start Date</th>
              <th>Supervisor</th><th>Lead</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${DB.audits.map(a => {
              const ent = DB.auditables.find(e => e.sk === a.entityId);
              return `<tr>
                <td><strong>${a.sk}</strong></td>
                <td>${a.title}</td>
                <td><span class="chip">${a.auditType}</span></td>
                <td>${ent ? ent.entityName : a.entityId}</td>
                <td>${badge(a.size)}</td>
                <td>${a.budgetedHours}h</td>
                <td>${a.targetWeeks}w</td>
                <td>${fmt(a.startDate)}</td>
                <td>${userName(a.team.supervisor.auditorId)}</td>
                <td>${userName(a.team.lead.auditorId)}</td>
                <td>${badge(a.status)}</td>
                <td>
                  <button class="btn btn-secondary btn-xs" onclick="viewAuditDetail('${a.sk}')">View</button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">Entities Recommended for Plan (Critical / High Risk)</div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Code</th><th>Entity</th><th>Risk Rating</th><th>Risk Score</th>
              <th>Frequency</th><th>Due Status</th><th>Recommended Size</th>
            </tr>
          </thead>
          <tbody>
            ${critHigh.map(e => `
              <tr>
                <td>${e.sk}</td>
                <td>${e.entityName}</td>
                <td>${badge(e.riskRating)}</td>
                <td><span class="${riskClass(e.riskRating)}">${e.riskScore}</span></td>
                <td>${e.auditFrequencyMonths}m</td>
                <td>${badge(e.dueStatus)}</td>
                <td>${e.defaultSize}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

function openCreateAudit() {
  modal('Create New Audit', `
    <div class="form-row">
      <div class="form-group">
        <label>Audit Title</label>
        <input type="text" id="new-title" placeholder="e.g. IT General Controls Audit 2026">
      </div>
      <div class="form-group">
        <label>Audit Type</label>
        <select id="new-type">
          <option>Operational</option><option>Financial</option><option>IT</option><option>Compliance</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Entity</label>
        <select id="new-entity">
          ${DB.auditables.map(e => `<option value="${e.sk}">${e.sk} — ${e.entityName}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Size</label>
        <select id="new-size" onchange="updateBudget()">
          <option>Simple</option><option>Medium</option><option selected>Complex</option><option>Epic</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Start Date</label><input type="date" id="new-start"></div>
      <div class="form-group"><label>End Date</label><input type="date" id="new-end"></div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Budgeted Hours</label>
        <input type="text" id="new-budget" value="400" readonly style="background:var(--bg)">
      </div>
      <div class="form-group">
        <label>Target Weeks</label>
        <input type="text" id="new-weeks" value="6" readonly style="background:var(--bg)">
      </div>
    </div>
    <div class="form-group">
      <label>Objectives</label>
      <textarea id="new-obj" placeholder="State the audit objectives..."></textarea>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveNewAudit()">Create Audit</button>`);
}

/** Update the budget/weeks read-only fields when size changes. */
function updateBudget() {
  const map = { Simple: [120, 3], Medium: [240, 4], Complex: [400, 6], Epic: [640, 8] };
  const s = document.getElementById('new-size').value;
  document.getElementById('new-budget').value = map[s][0];
  document.getElementById('new-weeks').value  = map[s][1];
}

function saveNewAudit() {
  const title = document.getElementById('new-title').value.trim();
  if (!title) { toast('Title is required', 'error'); return; }

  const yr   = new Date().getFullYear();
  const n    = DB.audits.length + 1;
  const sk   = `AUD-${yr}-${String(n).padStart(3, '0')}`;
  const map  = { Simple: [120, 3], Medium: [240, 4], Complex: [400, 6], Epic: [640, 8] };
  const size = document.getElementById('new-size').value;

  DB.audits.push({
    sk,
    entityId:     document.getElementById('new-entity').value,
    auditType:    document.getElementById('new-type').value,
    title,
    status:       'Planned',
    size,
    budgetedHours: map[size][0],
    targetWeeks:   map[size][1],
    startDate:    document.getElementById('new-start').value,
    endDate:      document.getElementById('new-end').value,
    objectives:   document.getElementById('new-obj').value,
    scope: '', criteria: [],
    team: {
      supervisor: { auditorId: 'AUDR-001', allocatedHours: 40 },
      lead:       { auditorId: 'AUDR-002', allocatedHours: 120 },
      staff:      [],
    },
    contacts: [],
    readinessChecks: {
      objectives: false, scope: false, lead: false, independence: false, timeline: false,
      notificationLetter: false, docRequestList: false, teamConfirmed: false, managementBriefing: false,
    },
    report: { status: 'Draft' },
    version: 1,
  });

  closeModal();
  toast(`Audit ${sk} created`, 'success');
  renderPlan();
}
