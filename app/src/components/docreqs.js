/**
 * app/src/components/docreqs.js
 * ──────────────────────────────────────────────────────────────
 * Document Requests (Auditee Submissions / DRL).
 * Functions: renderDocReqs, updateDocReq, returnDocReq,
 *            openAddDocReq, saveDocReq
 * Depends on: db.js, helpers.js
 * ──────────────────────────────────────────────────────────────
 */

function renderDocReqs() {
  document.getElementById('topbar-actions').innerHTML = canEdit()
    ? `<button class="btn btn-primary btn-sm" onclick="openAddDocReq()">+ New Request</button>`
    : '';

  document.getElementById('main-content').innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title">Document Requests (All Audits)</div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Request ID</th><th>Audit</th><th>Title</th><th>Description</th>
              <th>Due Date</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${DB.docreqs.map(d => `<tr>
              <td><strong>${d.requestId}</strong></td>
              <td>${d.auditId}</td>
              <td>${d.title}</td>
              <td class="text-muted text-sm">${d.description.substring(0, 60)}...</td>
              <td>${fmt(d.dueDate)}</td>
              <td>${badge(d.status)}</td>
              <td>
                ${canEdit() && d.status === 'Submitted'
                  ? `<button class="btn btn-success btn-xs" onclick="updateDocReq('${d.sk}','Accepted')">Accept</button>
                     <button class="btn btn-warning btn-xs" onclick="returnDocReq('${d.sk}')">Return</button>`
                  : ''}
                ${d.status === 'Accepted'
                  ? '<span class="text-muted text-sm">Completed</span>'
                  : ''}
                ${canEdit() && d.status === 'Requested'
                  ? `<button class="btn btn-info btn-xs" onclick="updateDocReq('${d.sk}','Submitted')">Mark Submitted</button>`
                  : ''}
                ${d.status === 'Returned'
                  ? `<div class="text-sm" style="color:var(--danger)">${d.returnReason}</div>`
                  : ''}
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;

  // Refresh sidebar badge
  const submitted = DB.docreqs.filter(d => d.status === 'Submitted').length;
  document.getElementById('badge-docreqs').textContent = submitted || '';
}

function updateDocReq(sk, newStatus) {
  const d = DB.docreqs.find(x => x.sk === sk);
  d.status = newStatus;
  d.version++;
  toast(`Document request ${newStatus.toLowerCase()}`, 'success');
  renderDocReqs();
}

function returnDocReq(sk) {
  const d = DB.docreqs.find(x => x.sk === sk);
  const reason = prompt('Return reason (required):');
  if (!reason) return;
  d.status = 'Returned';
  d.returnReason = reason;
  d.version++;
  toast('Document request returned to auditee', 'info');
  renderDocReqs();
}

function openAddDocReq() {
  modal('New Document Request', `
    <div class="form-group">
      <label>Audit</label>
      <select id="dr-audit">
        ${DB.audits.map(a => `<option value="${a.sk}">${a.sk} — ${a.title}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>Title</label>
      <input type="text" id="dr-title" placeholder="e.g. Vendor Contracts List">
    </div>
    <div class="form-group">
      <label>Description</label>
      <textarea id="dr-desc" placeholder="Describe what documents are needed..."></textarea>
    </div>
    <div class="form-group">
      <label>Due Date</label>
      <input type="date" id="dr-due">
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveDocReq()">Send Request</button>`);
}

function saveDocReq() {
  const auditId = document.getElementById('dr-audit').value;
  const title   = document.getElementById('dr-title').value.trim();
  if (!title) { toast('Title required', 'error'); return; }

  const existing = DB.docreqs.filter(d => d.auditId === auditId);
  const n        = existing.length + 1;
  const reqId    = `DRL-${String(n).padStart(3, '0')}`;

  DB.docreqs.push({
    sk:          `${auditId}__${reqId}`,
    auditId,
    requestId:   reqId,
    title,
    description: document.getElementById('dr-desc').value,
    dueDate:     document.getElementById('dr-due').value,
    status:      'Requested',
    attachedFiles: [],
    version: 1,
  });
  closeModal();
  toast(`${reqId} sent to auditee`, 'success');
  renderDocReqs();
}
