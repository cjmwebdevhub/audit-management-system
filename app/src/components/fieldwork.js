/**
 * app/src/components/fieldwork.js
 * ──────────────────────────────────────────────────────────────
 * Stage 4 — Fieldwork & Dual-Track Review.
 * Functions: renderFieldwork, renderFieldworkNotes, switchFWTab,
 *            advanceReview, viewFinding,
 *            openAddNote, toggleFindingFields, saveNote
 * Depends on: db.js, helpers.js
 * ──────────────────────────────────────────────────────────────
 */

function renderFieldwork() {
  const activeAudits = DB.audits.filter(a => ['In progress', 'Reporting'].includes(a.status));

  document.getElementById('topbar-actions').innerHTML = `
    <select id="fw-audit-sel" onchange="renderFieldworkNotes()" style="font-size:13px;padding:6px 10px;border-radius:6px;border:1px solid var(--border)">
      ${activeAudits.map(a => `<option value="${a.sk}">${a.sk}</option>`).join('')}
    </select>
    ${canEdit() ? `<button class="btn btn-primary btn-sm" onclick="openAddNote()">+ Add Note/Finding</button>` : ''}`;

  document.getElementById('main-content').innerHTML = `
    <div class="alert alert-info">
      <span>ℹ️</span>
      <div><strong>Stage 4: Fieldwork</strong> — Create working notes (WN) and findings (F). Each follows: Draft → For Head Review → For Independent Review → Cleared.</div>
    </div>
    <div id="fieldwork-notes-area"></div>`;

  // Defer by one tick so the select is in the DOM before we read it
  setTimeout(() => renderFieldworkNotes(), 10);
}

function renderFieldworkNotes() {
  const selEl = document.getElementById('fw-audit-sel');
  const sk    = selEl
    ? selEl.value
    : DB.audits.find(a => ['In progress', 'Reporting'].includes(a.status))?.sk;

  const area = document.getElementById('fieldwork-notes-area');
  if (!area) return;

  if (!sk) {
    area.innerHTML = '<div class="card"><div class="card-body text-muted">No active engagements.</div></div>';
    return;
  }

  const notesList = DB.notes.filter(n => n.auditId === sk);
  const wns       = notesList.filter(n => n.type === 'NOTE');
  const findings  = notesList.filter(n => n.type === 'FINDING');

  area.innerHTML = `
    <div class="tab-bar">
      <button class="tab-btn active" onclick="switchFWTab(this,'fw-findings')">Findings (${findings.length})</button>
      <button class="tab-btn" onclick="switchFWTab(this,'fw-notes')">Working Notes (${wns.length})</button>
    </div>

    <div id="fw-findings" class="tab-panel active">
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ref</th><th>Title</th><th>Severity</th><th>Category</th>
                <th>Review Status</th><th>Shared</th><th>Action Owner</th><th>Target Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${findings.map(f => `<tr>
                <td><strong>${f.ref}</strong></td>
                <td>${f.title}</td>
                <td>${badge(f.severity)}</td>
                <td><span class="chip">${f.category}</span></td>
                <td>${badge(f.reviewStatus)}</td>
                <td>${f.isSharedWithAuditee
                  ? '<span style="color:var(--success)">●</span> Shared'
                  : '<span style="color:var(--muted)">○</span> Internal'}</td>
                <td>${userName(f.actionOwner)}</td>
                <td>${fmt(f.targetDate)}</td>
                <td>
                  <button class="btn btn-secondary btn-xs" onclick="viewFinding('${f.sk}')">View</button>
                  ${canEdit() && f.reviewStatus === 'Draft'
                    ? `<button class="btn btn-info btn-xs" onclick="advanceReview('${f.sk}','For head review')">Submit</button>`
                    : ''}
                  ${canEdit() && f.reviewStatus === 'For head review'
                    ? `<button class="btn btn-success btn-xs" onclick="advanceReview('${f.sk}','${f.independentReviewNeeded ? 'For independent review' : 'Cleared'}')">Approve</button>`
                    : ''}
                  ${canEdit() && f.reviewStatus === 'For independent review'
                    ? `<button class="btn btn-success btn-xs" onclick="advanceReview('${f.sk}','Cleared')">Clear</button>`
                    : ''}
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div id="fw-notes" class="tab-panel">
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Ref</th><th>Title</th><th>Review Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              ${wns.map(n => `<tr>
                <td><strong>${n.ref}</strong></td>
                <td>${n.title}</td>
                <td>${badge(n.reviewStatus)}</td>
                <td>
                  ${canEdit() && n.reviewStatus === 'Draft'
                    ? `<button class="btn btn-info btn-xs" onclick="advanceReview('${n.sk}','For head review')">Submit for Review</button>`
                    : ''}
                  ${canEdit() && n.reviewStatus === 'For head review'
                    ? `<button class="btn btn-success btn-xs" onclick="advanceReview('${n.sk}','Cleared')">Approve</button>`
                    : ''}
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
}

/** Tab switcher scoped to the fieldwork page (outside a modal). */
function switchFWTab(btn, id) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function advanceReview(sk, newStatus) {
  const n = DB.notes.find(x => x.sk === sk);
  if (!n) return;
  n.reviewStatus = newStatus;
  n.version++;
  DB.trail.unshift({
    sk: `${new Date().toISOString()}#${Math.random().toString(36).substr(2, 6)}`,
    auditId: n.auditId,
    action: 'Review',
    entityRef: n.ref,
    performedBy: DB.currentUser.id,
    roles: ['role:cae'],
    details: { to: newStatus },
    timestamp: new Date().toISOString(),
  });
  toast(`${n.ref} → ${newStatus}`, 'success');
  renderFieldworkNotes();
}

function viewFinding(sk) {
  const f = DB.notes.find(x => x.sk === sk);
  if (!f || f.type !== 'FINDING') return;

  modal(`Finding — ${f.ref}: ${f.title}`, `
    <div class="grid-2 mb-4">
      <div><label>Severity</label>${badge(f.severity)}</div>
      <div><label>Review Status</label>${badge(f.reviewStatus)}</div>
      <div><label>Category</label><span class="chip">${f.category}</span></div>
      <div><label>Action Owner</label>${userName(f.actionOwner)}</div>
      <div><label>Target Date</label>${fmt(f.targetDate)}</div>
      <div><label>Shared with Auditee</label>${f.isSharedWithAuditee ? 'Yes' : 'No'}</div>
    </div>
    <div class="divider"></div>
    <div class="form-group"><label>Condition</label><div style="background:var(--bg);padding:10px;border-radius:6px;font-size:13px">${f.condition || '—'}</div></div>
    <div class="form-group"><label>Criteria</label><div style="background:var(--bg);padding:10px;border-radius:6px;font-size:13px">${f.criteria || '—'}</div></div>
    <div class="form-group"><label>Cause</label><div style="background:var(--bg);padding:10px;border-radius:6px;font-size:13px">${f.cause || '—'}</div></div>
    <div class="form-group"><label>Effect</label><div style="background:var(--bg);padding:10px;border-radius:6px;font-size:13px">${f.effect || '—'}</div></div>
    <div class="form-group"><label>Recommendation</label><div style="background:var(--bg);padding:10px;border-radius:6px;font-size:13px">${f.recommendation || '—'}</div></div>
    ${f.comments.length > 0
      ? `<div class="divider"></div><label>Comments</label>${f.comments.map(c => `
          <div style="background:var(--bg);padding:10px;border-radius:6px;margin-bottom:8px;font-size:13px">
            <strong>${userName(c.authorId)}</strong>
            <span class="text-muted text-sm">${c.visibility} · ${fmt(c.createdAt)}</span>
            <p style="margin-top:4px">${c.text}</p>
          </div>`).join('')}`
      : ''}`,
    `<button class="btn btn-secondary" onclick="closeModal()">Close</button>`);
}

function openAddNote() {
  const selEl  = document.getElementById('fw-audit-sel');
  const auditId = selEl ? selEl.value : '';

  modal('Add Working Note / Finding', `
    <div class="form-row">
      <div class="form-group">
        <label>Type</label>
        <select id="note-type" onchange="toggleFindingFields()">
          <option value="NOTE">Working Note</option>
          <option value="FINDING">Finding</option>
        </select>
      </div>
      <div class="form-group">
        <label>Title</label>
        <input type="text" id="note-title" placeholder="Brief descriptive title">
      </div>
    </div>

    <div id="finding-fields" class="hidden">
      <div class="form-row">
        <div class="form-group">
          <label>Severity</label>
          <select id="note-sev">
            <option>Critical</option><option>High</option><option selected>Medium</option><option>Low</option>
          </select>
        </div>
        <div class="form-group">
          <label>Category</label>
          <input type="text" id="note-cat" placeholder="e.g. Access Control">
        </div>
      </div>
      <div class="form-group"><label>Condition</label><textarea id="note-condition" placeholder="What was observed?"></textarea></div>
      <div class="form-group"><label>Criteria</label><textarea id="note-criteria" placeholder="What should have been?"></textarea></div>
      <div class="form-group"><label>Cause</label><textarea id="note-cause" placeholder="Root cause..."></textarea></div>
      <div class="form-group"><label>Effect</label><textarea id="note-effect" placeholder="Business impact..."></textarea></div>
      <div class="form-group"><label>Recommendation</label><textarea id="note-rec" placeholder="Recommended action..."></textarea></div>
      <div class="form-row">
        <div class="form-group">
          <label>Action Owner</label>
          <select id="note-owner">
            ${DB.users.filter(u => ['USR', 'SIG'].some(p => u.id.startsWith(p))).map(u => `<option value="${u.id}">${u.fullName}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Target Date</label>
          <input type="date" id="note-target">
        </div>
      </div>
    </div>

    <div class="form-group">
      <label>Independent Review Required</label>
      <select id="note-indep">
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveNote('${auditId}')">Save</button>`);
}

function toggleFindingFields() {
  const type = document.getElementById('note-type').value;
  document.getElementById('finding-fields').classList.toggle('hidden', type !== 'FINDING');
}

function saveNote(auditId) {
  const title = document.getElementById('note-title').value.trim();
  if (!title) { toast('Title required', 'error'); return; }

  const type         = document.getElementById('note-type').value;
  const existingRefs = DB.notes.filter(n => n.auditId === auditId && n.type === type);
  const ref          = type === 'NOTE'
    ? `WN-${String(existingRefs.length + 1).padStart(3, '0')}`
    : `F-${String(existingRefs.length + 1).padStart(3, '0')}`;

  const note = {
    sk: `${auditId}#${ref}`, auditId, ref, type, title,
    reviewStatus: 'Draft',
    independentReviewNeeded: document.getElementById('note-indep').value === 'true',
    isSharedWithAuditee: false,
    comments: [],
    version: 1,
  };

  if (type === 'FINDING') {
    Object.assign(note, {
      severity:       document.getElementById('note-sev').value,
      category:       document.getElementById('note-cat').value,
      condition:      document.getElementById('note-condition').value,
      criteria:       document.getElementById('note-criteria').value,
      cause:          document.getElementById('note-cause').value,
      effect:         document.getElementById('note-effect').value,
      recommendation: document.getElementById('note-rec').value,
      actionOwner:    document.getElementById('note-owner').value,
      targetDate:     document.getElementById('note-target').value,
    });
  }

  DB.notes.push(note);
  closeModal();
  toast(`${ref} created in Draft`, 'success');
  renderFieldworkNotes();
}
