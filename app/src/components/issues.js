/**
 * app/src/components/issues.js
 * ──────────────────────────────────────────────────────────────
 * Stage 6 — Issues & 4-Tier Closure Workflow.
 * Functions: renderIssues, issuesTableRows, filterIssues,
 *            openIssueDetail, updateProgress, submitClosure,
 *            advanceClosure, returnClosure,
 *            openExtensionRequest, saveExtReq,
 *            openReassignRequest, saveReaReq, decideRequest
 * Depends on: db.js, helpers.js
 * ──────────────────────────────────────────────────────────────
 */

function renderIssues() {
  document.getElementById('topbar-actions').innerHTML = `
    <select id="iss-filter" onchange="filterIssues()" style="font-size:13px;padding:6px 10px;border-radius:6px;border:1px solid var(--border)">
      <option value="">All Statuses</option>
      <option>Open</option>
      <option>In progress</option>
      <option>For auditee head approval</option>
      <option>For auditor review</option>
      <option>For engagement lead approval</option>
      <option>Under independent review</option>
      <option>Closed</option>
    </select>`;

  const open = DB.issues.filter(i => i.status !== 'Closed').length;
  document.getElementById('badge-issues').textContent = open || '';

  document.getElementById('main-content').innerHTML = `
    <div class="alert alert-info">
      <span>ℹ️</span>
      <div><strong>Stage 6: Remediation — 4-Tier Closure</strong>: Owner Submit → Auditee Head Approve → Reviewing Auditor Endorse → Lead Approve → Closed. One-time contest path to Independent Review.</div>
    </div>
    <div class="card">
      <div class="card-header">
        <div class="card-title">Issues Tracker (${DB.issues.length} total)</div>
      </div>
      <div class="table-wrap" id="issues-table-wrap">${issuesTableRows(DB.issues)}</div>
    </div>`;
}

function issuesTableRows(list) {
  return `<table>
    <thead>
      <tr>
        <th>Issue Ref</th><th>Finding (Snapshot)</th><th>Dept</th><th>Severity</th>
        <th>Owner</th><th>Target Date</th><th>Progress</th><th>Status</th><th>Closure Step</th><th>Actions</th>
      </tr>
    </thead>
    <tbody>
      ${list.map(i => `<tr>
        <td><strong>${i.sk}</strong></td>
        <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${i.findingSnapshot.condition}</td>
        <td>${i.dept}</td>
        <td>${badge(i.severity)}</td>
        <td>${userName(i.owner)}</td>
        <td>${fmt(i.currentTargetDate)}</td>
        <td style="min-width:100px">
          <div class="progress-bar"><div class="progress-fill" style="width:${i.percentComplete}%"></div></div>
          <div class="text-sm text-muted">${i.percentComplete}%</div>
        </td>
        <td>${badge(i.status)}</td>
        <td>${i.closureFlow.currentStep > 0 ? `Step ${i.closureFlow.currentStep}/4` : '—'}</td>
        <td>
          <button class="btn btn-secondary btn-xs" onclick="openIssueDetail('${i.sk}')">Manage</button>
        </td>
      </tr>`).join('')}
    </tbody>
  </table>`;
}

function filterIssues() {
  const val  = document.getElementById('iss-filter').value;
  const list = val ? DB.issues.filter(i => i.status === val) : DB.issues;
  document.getElementById('issues-table-wrap').innerHTML = issuesTableRows(list);
}

function openIssueDetail(sk) {
  const i = DB.issues.find(x => x.sk === sk);
  if (!i) return;

  const closureSteps = [
    { num: 1, label: 'Auditee Head',      decision: i.closureFlow.headApproval },
    { num: 2, label: 'Reviewing Auditor', decision: i.closureFlow.auditorEndorsement },
    { num: 3, label: 'Engagement Lead',   decision: i.closureFlow.leadApproval },
    { num: 4, label: 'Independent Review',decision: i.closureFlow.independentReview },
  ];

  modal(`Issue — ${i.sk}`, `
    <div class="tab-bar">
      <button class="tab-btn active" onclick="switchTab(this,'iss-detail')">Details</button>
      <button class="tab-btn" onclick="switchTab(this,'iss-closure')">Closure (4-Tier)</button>
      <button class="tab-btn" onclick="switchTab(this,'iss-requests')">Requests</button>
    </div>

    <div id="iss-detail" class="tab-panel active">
      <div class="grid-2 mb-4">
        <div><label>Severity</label>${badge(i.severity)}</div>
        <div><label>Status</label>${badge(i.status)}</div>
        <div><label>Owner</label>${userName(i.owner)}</div>
        <div><label>Dept</label>${i.dept}</div>
        <div><label>Original Target</label>${fmt(i.originalTargetDate)}</div>
        <div><label>Current Target</label>${fmt(i.currentTargetDate)} ${i.extensionCount > 0 ? `<span class="badge badge-warning">+${i.extensionCount} ext.</span>` : ''}</div>
        <div><label>Monitoring Auditor</label>${userName(i.monitoringAuditor)}</div>
        <div><label>Engagement Lead</label>${userName(i.engagementLead)}</div>
      </div>
      <div class="divider"></div>
      <div class="form-group"><label>Finding Condition</label>
        <div style="background:var(--bg);padding:10px;border-radius:6px">${i.findingSnapshot.condition}</div>
      </div>
      <div class="form-group"><label>Recommendation</label>
        <div style="background:var(--bg);padding:10px;border-radius:6px">${i.findingSnapshot.recommendation}</div>
      </div>
      ${canEdit() ? `
      <div class="form-group">
        <label>Progress Update (%)</label>
        <input type="range" min="0" max="100" value="${i.percentComplete}" id="iss-progress"
          oninput="document.getElementById('iss-pct-val').textContent=this.value+'%'" style="width:100%">
        <span id="iss-pct-val">${i.percentComplete}%</span>
      </div>
      <button class="btn btn-primary btn-sm mt-4" onclick="updateProgress('${sk}')">Update Progress</button>
      ` : `<div class="alert alert-info mt-4"><span>👁</span> View-only — progress updates require admin access.</div>`}
    </div>

    <div id="iss-closure" class="tab-panel">
      <div class="workflow-steps mb-4">
        ${closureSteps.map((s, idx) => `
          <div class="wf-step">
            <div class="wf-step-circle ${s.num < i.closureFlow.currentStep ? 'done' : s.num === i.closureFlow.currentStep ? 'active' : ''}">${s.num}</div>
            <div class="wf-step-label">${s.label}</div>
          </div>
          ${idx < closureSteps.length - 1
            ? `<div class="wf-connector ${s.num < i.closureFlow.currentStep ? 'done' : ''}"></div>`
            : ''}`).join('')}
      </div>

      ${(i.status === 'Open' || i.status === 'In progress')
        ? (canEdit()
            ? `<div class="card"><div class="card-body">
                 <strong>Submit for Closure</strong>
                 <div class="form-group mt-4">
                   <label>Submission Summary</label>
                   <textarea id="closure-summary" placeholder="Describe remediation actions taken..."></textarea>
                 </div>
                 <div class="form-group">
                   <label>Closure Artifacts (min. 1 required)</label>
                   <div style="background:var(--bg);border:1px dashed var(--border);border-radius:6px;padding:16px;text-align:center;cursor:pointer"
                        onclick="toast('File upload via pre-signed S3 URL (simulated)','info')">
                     📎 Click to upload supporting evidence
                   </div>
                   <div class="text-sm text-muted mt-2">Simulated: file would be uploaded to S3 evidence bucket</div>
                 </div>
                 <button class="btn btn-primary mt-4" onclick="submitClosure('${sk}')">Submit Closure for Review</button>
               </div></div>`
            : `<div class="alert alert-info"><span>👁</span> Issue is open. Admin access required to submit closure.</div>`)
        : `<div>
             ${closureSteps.map(s => s.decision
               ? `<div style="border:1px solid var(--border);border-radius:6px;padding:12px;margin-bottom:8px">
                    <strong>Step ${s.num}: ${s.label}</strong>
                    <div class="mt-4">${badge(Object.values(s.decision)[0])}</div>
                    ${s.decision.comment ? `<div class="text-muted text-sm mt-4">Comment: ${s.decision.comment}</div>` : ''}
                  </div>`
               : '').join('')}
             ${canEdit() && i.closureFlow.currentStep > 0 && i.closureFlow.currentStep <= 3
               ? `<div class="flex gap-2 mt-4">
                    <button class="btn btn-success btn-sm" onclick="advanceClosure('${sk}')">Approve / Endorse (Step ${i.closureFlow.currentStep})</button>
                    <button class="btn btn-danger btn-sm" onclick="returnClosure('${sk}')">Return</button>
                  </div>`
               : ''}
             ${i.status === 'Closed' ? '<div class="alert alert-success"><span>✅</span> Issue Closed</div>' : ''}
           </div>`}
    </div>

    <div id="iss-requests" class="tab-panel">
      ${canEdit() ? `
      <div class="flex gap-2 mb-4" style="justify-content:flex-end">
        <button class="btn btn-warning btn-sm" onclick="openExtensionRequest('${sk}')">Request Extension</button>
        <button class="btn btn-info btn-sm" onclick="openReassignRequest('${sk}')">Request Reassignment</button>
      </div>` : ''}
      ${i.requests && i.requests.length > 0
        ? i.requests.map(r => `
            <div style="border:1px solid var(--border);border-radius:6px;padding:12px;margin-bottom:8px">
              <div class="flex gap-2" style="justify-content:space-between">
                <strong>${r.type}</strong>${badge(r.status)}
              </div>
              <div class="text-sm text-muted mt-4">Reason: ${r.reason}</div>
              ${r.type === 'EXTENSION' ? `<div class="text-sm text-muted">Proposed Date: ${fmt(r.proposedTargetDate)}</div>` : ''}
              ${canEdit() && r.status === 'Pending'
                ? `<div class="flex gap-2 mt-4">
                     <button class="btn btn-success btn-xs" onclick="decideRequest('${sk}','${r.requestId}','Approved')">Approve</button>
                     <button class="btn btn-danger btn-xs" onclick="decideRequest('${sk}','${r.requestId}','Rejected')">Reject</button>
                   </div>`
                : ''}
            </div>`).join('')
        : '<div class="text-muted text-sm">No requests submitted.</div>'}
    </div>`,

    `<button class="btn btn-secondary" onclick="closeModal()">Close</button>`,
    'modal-lg');
}

function updateProgress(sk) {
  const i = DB.issues.find(x => x.sk === sk);
  i.percentComplete = parseInt(document.getElementById('iss-progress').value);
  if (i.percentComplete > 0 && i.status === 'Open') i.status = 'In progress';
  i.version++;
  toast('Progress updated', 'success');
  closeModal();
  renderIssues();
}

function submitClosure(sk) {
  const summary = document.getElementById('closure-summary').value.trim();
  if (!summary) { toast('Submission summary required', 'error'); return; }
  const i = DB.issues.find(x => x.sk === sk);
  i.closureFlow.submissionSummary       = summary;
  i.closureFlow.closureArtifactFileKeys = ['evidence/simulated/closure-artifact.pdf'];
  i.closureFlow.currentStep             = 1;
  i.status                              = 'For auditee head approval';
  i.percentComplete                     = 100;
  i.version++;
  toast('Closure submitted — awaiting Auditee Head approval', 'success');
  closeModal();
  renderIssues();
}

function advanceClosure(sk) {
  const i  = DB.issues.find(x => x.sk === sk);
  const cf = i.closureFlow;
  if (cf.currentStep === 1) {
    cf.headApproval = { decision: 'Approved', comment: 'Verified and approved.', decidedBy: DB.currentUser.id, date: new Date().toISOString() };
    cf.currentStep = 2;
    i.status = 'For auditor review';
  } else if (cf.currentStep === 2) {
    cf.auditorEndorsement = { decision: 'Endorsed', comment: 'Evidence validated.', decidedBy: DB.currentUser.id, date: new Date().toISOString() };
    cf.currentStep = 3;
    i.status = 'For engagement lead approval';
  } else if (cf.currentStep === 3) {
    cf.leadApproval = { decision: 'Approved', comment: 'Issue closed.', decidedBy: DB.currentUser.id, date: new Date().toISOString() };
    cf.currentStep  = 4;
    i.status        = 'Closed';
    i.closedAt      = new Date().toISOString();
    i.closedBy      = DB.currentUser.id;
    cf.outcome      = 'Approved';
  }
  i.version++;
  toast(`Closure step advanced — status: ${i.status}`, 'success');
  closeModal();
  renderIssues();
}

function returnClosure(sk) {
  const reason = prompt('Return comment (required):');
  if (!reason) return;
  const i = DB.issues.find(x => x.sk === sk);
  i.status = 'In progress';
  i.closureFlow.currentStep = 0;
  i.version++;
  toast('Closure returned to owner', 'info');
  closeModal();
  renderIssues();
}

function openExtensionRequest(sk) {
  closeModal();
  setTimeout(() => modal(`Extension Request — ${sk}`, `
    <div class="form-group">
      <label>Proposed New Target Date</label>
      <input type="date" id="ext-date">
    </div>
    <div class="form-group">
      <label>Reason</label>
      <textarea id="ext-reason" placeholder="Explain why extension is needed..."></textarea>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
     <button class="btn btn-warning" onclick="saveExtReq('${sk}')">Submit Extension Request</button>`), 50);
}

function saveExtReq(sk) {
  const reason = document.getElementById('ext-reason').value.trim();
  if (!reason) { toast('Reason required', 'error'); return; }
  const i = DB.issues.find(x => x.sk === sk);
  if (!i.requests) i.requests = [];
  i.requests.push({
    requestId:          'REQ-' + Date.now(),
    type:               'EXTENSION',
    proposedTargetDate: document.getElementById('ext-date').value,
    reason,
    status: 'Pending',
  });
  closeModal();
  toast('Extension request submitted for approval', 'success');
  renderIssues();
}

function openReassignRequest(sk) {
  closeModal();
  setTimeout(() => modal(`Reassignment Request — ${sk}`, `
    <div class="form-group">
      <label>Proposed New Owner</label>
      <select id="rea-owner">
        ${DB.users.filter(u => u.id.startsWith('USR')).map(u => `<option value="${u.id}">${u.fullName} (${u.department})</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>Reason</label>
      <textarea id="rea-reason" placeholder="Explain why reassignment is needed..."></textarea>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
     <button class="btn btn-info" onclick="saveReaReq('${sk}')">Submit Reassignment Request</button>`), 50);
}

function saveReaReq(sk) {
  const reason = document.getElementById('rea-reason').value.trim();
  if (!reason) { toast('Reason required', 'error'); return; }
  const i = DB.issues.find(x => x.sk === sk);
  if (!i.requests) i.requests = [];
  i.requests.push({
    requestId:     'REQ-' + Date.now(),
    type:          'REASSIGNMENT',
    proposedOwner: document.getElementById('rea-owner').value,
    reason,
    status: 'Pending',
  });
  closeModal();
  toast('Reassignment request submitted for approval', 'success');
  renderIssues();
}

function decideRequest(sk, reqId, decision) {
  const i   = DB.issues.find(x => x.sk === sk);
  const req = i.requests.find(r => r.requestId === reqId);
  req.status     = decision;
  req.decidedBy  = DB.currentUser.id;
  req.decidedAt  = new Date().toISOString();
  if (decision === 'Approved' && req.type === 'EXTENSION') {
    i.currentTargetDate = req.proposedTargetDate;
    i.extensionCount++;
  }
  if (decision === 'Approved' && req.type === 'REASSIGNMENT') {
    i.owner = req.proposedOwner;
  }
  toast(`Request ${decision.toLowerCase()}`, decision === 'Approved' ? 'success' : 'info');
  closeModal();
  renderIssues();
}
