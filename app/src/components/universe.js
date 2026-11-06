/**
 * app/src/components/universe.js
 * ──────────────────────────────────────────────────────────────
 * Stage 1 — Audit Universe & Risk Assessment.
 * Functions: renderUniverse, universeRows, filterUniverse,
 *            openAddEntity, calcRisk, saveEntity,
 *            editEntity, calcRiskEdit, updateEntity
 * Depends on: db.js, helpers.js
 * ──────────────────────────────────────────────────────────────
 */

function renderUniverse() {
  document.getElementById('topbar-actions').innerHTML = canEdit()
    ? `<button class="btn btn-primary btn-sm" onclick="openAddEntity()">+ Add Entity</button>`
    : '';

  document.getElementById('main-content').innerHTML = `
    <div class="alert alert-info">
      <span>ℹ️</span>
      <div><strong>Stage 1: Risk Assessment & Universe</strong> — Register auditable entities and rate Likelihood (1–5) × Impact (1–5) to derive Risk Score and audit frequency.</div>
    </div>
    <div class="card">
      <div class="card-header">
        <div class="card-title">Audit Universe (${DB.auditables.length} entities)</div>
        <div class="flex gap-2">
          <select id="filter-status" onchange="filterUniverse()" style="font-size:12px;padding:5px 8px;border-radius:5px;border:1px solid var(--border)">
            <option value="">All Statuses</option>
            <option>Overdue</option>
            <option>Due &lt;= 90 days</option>
            <option>Not due</option>
            <option>Never audited</option>
            <option>Scheduled</option>
          </select>
          <select id="filter-rating" onchange="filterUniverse()" style="font-size:12px;padding:5px 8px;border-radius:5px;border:1px solid var(--border)">
            <option value="">All Ratings</option>
            <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
          </select>
        </div>
      </div>
      <div class="table-wrap">
        <table id="universe-table">
          <thead>
            <tr>
              <th>Code</th><th>Entity</th><th>Category</th><th>Dept</th>
              <th>Likelihood</th><th>Impact</th><th>Risk Score</th><th>Rating</th>
              <th>Frequency</th><th>Last Audit</th><th>Next Due</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>${universeRows(DB.auditables)}</tbody>
        </table>
      </div>
    </div>`;
}

function universeRows(list) {
  return list.map(e => `
    <tr>
      <td><strong>${e.sk}</strong></td>
      <td>${e.entityName}</td>
      <td><span class="chip">${e.category}</span></td>
      <td>${e.department}</td>
      <td style="text-align:center">${e.likelihood}</td>
      <td style="text-align:center">${e.impact}</td>
      <td style="text-align:center;font-weight:700;font-size:15px" class="${riskClass(e.riskRating)}">${e.riskScore}</td>
      <td>${badge(e.riskRating)}</td>
      <td>${e.auditFrequencyMonths}m</td>
      <td>${fmt(e.lastAuditDate)}</td>
      <td>${fmt(e.nextDueDate)}</td>
      <td>${badge(e.dueStatus)}</td>
      <td>
        ${canEdit() ? `<button class="btn btn-secondary btn-xs" onclick="editEntity('${e.sk}')">Edit</button>` : '<span class="text-muted text-sm">—</span>'}
      </td>
    </tr>`).join('');
}

function filterUniverse() {
  const statusFilter = document.getElementById('filter-status').value;
  const ratingFilter = document.getElementById('filter-rating').value;
  let list = DB.auditables;
  if (statusFilter) list = list.filter(e => e.dueStatus === statusFilter);
  if (ratingFilter) list = list.filter(e => e.riskRating === ratingFilter);
  document.querySelector('#universe-table tbody').innerHTML = universeRows(list);
}

function openAddEntity() {
  modal('Add Auditable Entity', `
    <div class="form-row">
      <div class="form-group">
        <label>Entity Name</label>
        <input type="text" id="ent-name" placeholder="e.g. Treasury Operations">
      </div>
      <div class="form-group">
        <label>Category</label>
        <select id="ent-cat">
          <option>process</option><option>department</option><option>location</option>
          <option>system</option><option>vendor</option><option>project</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Department</label>
        <input type="text" id="ent-dept" placeholder="e.g. Treasury">
      </div>
      <div class="form-group">
        <label>Owner (Auditee)</label>
        <select id="ent-owner">
          ${DB.users.filter(u => u.assignedRoles.some(r => r.includes('owner') || r.includes('dept_head'))).map(u => `<option value="${u.id}">${u.fullName}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Likelihood (1–5)</label>
        <input type="number" id="ent-lik" min="1" max="5" value="3" oninput="calcRisk()">
      </div>
      <div class="form-group">
        <label>Impact (1–5)</label>
        <input type="number" id="ent-imp" min="1" max="5" value="3" oninput="calcRisk()">
      </div>
      <div class="form-group">
        <label>Risk Score</label>
        <input type="text" id="ent-score" value="9" readonly style="background:var(--bg);font-weight:700">
      </div>
      <div class="form-group">
        <label>Risk Rating</label>
        <input type="text" id="ent-rating" value="Medium" readonly style="background:var(--bg);font-weight:700">
      </div>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveEntity()">Save Entity</button>`);
}

function calcRisk() {
  const l = parseInt(document.getElementById('ent-lik').value) || 1;
  const i = parseInt(document.getElementById('ent-imp').value) || 1;
  const score = l * i;
  const rating = score >= 20 ? 'Critical' : score >= 10 ? 'High' : score >= 5 ? 'Medium' : 'Low';
  document.getElementById('ent-score').value = score;
  document.getElementById('ent-rating').value = rating;
}

function saveEntity() {
  const name = document.getElementById('ent-name').value.trim();
  if (!name) { toast('Entity name is required', 'error'); return; }
  const l = parseInt(document.getElementById('ent-lik').value);
  const i = parseInt(document.getElementById('ent-imp').value);
  const score = l * i;
  const rating = score >= 20 ? 'Critical' : score >= 10 ? 'High' : score >= 5 ? 'Medium' : 'Low';
  const freqMap = { Critical: 6, High: 12, Medium: 24, Low: 36 };
  const n = DB.auditables.length + 1;
  DB.auditables.push({
    sk: `ENT-${String(n).padStart(3, '0')}`,
    entityName: name,
    category:   document.getElementById('ent-cat').value,
    department: document.getElementById('ent-dept').value,
    owner:      document.getElementById('ent-owner').value,
    likelihood: l, impact: i, riskScore: score, riskRating: rating,
    auditFrequencyMonths: freqMap[rating],
    defaultSize: score >= 15 ? 'Complex' : score >= 8 ? 'Medium' : 'Simple',
    lastAuditDate: null, lastAuditId: null, nextDueDate: null,
    dueStatus: 'Never audited', version: 1,
  });
  closeModal();
  toast('Entity added to audit universe', 'success');
  renderUniverse();
}

function editEntity(sk) {
  const e = DB.auditables.find(x => x.sk === sk);
  if (!e) return;
  modal(`Edit Entity — ${e.sk}`, `
    <div class="form-row">
      <div class="form-group">
        <label>Likelihood (1–5)</label>
        <input type="number" id="edit-lik" min="1" max="5" value="${e.likelihood}" oninput="calcRiskEdit()">
      </div>
      <div class="form-group">
        <label>Impact (1–5)</label>
        <input type="number" id="edit-imp" min="1" max="5" value="${e.impact}" oninput="calcRiskEdit()">
      </div>
      <div class="form-group">
        <label>Risk Score</label>
        <input id="edit-score" value="${e.riskScore}" readonly style="background:var(--bg);font-weight:700">
      </div>
      <div class="form-group">
        <label>Risk Rating</label>
        <input id="edit-rating" value="${e.riskRating}" readonly style="background:var(--bg);font-weight:700">
      </div>
    </div>
    <div class="form-group">
      <label>Notes</label>
      <textarea id="edit-notes" placeholder="Optional notes">${e.notes || ''}</textarea>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="updateEntity('${sk}')">Save Changes</button>`);
}

function calcRiskEdit() {
  const l = parseInt(document.getElementById('edit-lik').value) || 1;
  const i = parseInt(document.getElementById('edit-imp').value) || 1;
  const score = l * i;
  const rating = score >= 20 ? 'Critical' : score >= 10 ? 'High' : score >= 5 ? 'Medium' : 'Low';
  document.getElementById('edit-score').value = score;
  document.getElementById('edit-rating').value = rating;
}

function updateEntity(sk) {
  const e = DB.auditables.find(x => x.sk === sk);
  const l = parseInt(document.getElementById('edit-lik').value);
  const i = parseInt(document.getElementById('edit-imp').value);
  e.likelihood = l;
  e.impact     = i;
  e.riskScore  = l * i;
  e.riskRating = e.riskScore >= 20 ? 'Critical' : e.riskScore >= 10 ? 'High' : e.riskScore >= 5 ? 'Medium' : 'Low';
  e.notes      = document.getElementById('edit-notes').value;
  e.version++;
  closeModal();
  toast('Entity updated', 'success');
  renderUniverse();
}
