/**
 * app/src/components/reporting.js
 * ──────────────────────────────────────────────────────────────
 * Stage 5 — Reporting & Automated Finding Release.
 * Functions: renderReporting, openReport, saveReport,
 *            advanceReport, returnReport, autoGenerateIssues
 * Depends on: db.js, helpers.js
 * ──────────────────────────────────────────────────────────────
 */

function renderReporting() {
  document.getElementById('main-content').innerHTML = `
    <div class="alert alert-info">
      <span>ℹ️</span>
      <div><strong>Stage 5: Reporting</strong> — Assemble final report from cleared findings. Approval flow: Draft → Lead Review → CAE Approval → Final (PDF locked in S3).</div>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">Audit Reports</div></div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Audit Ref</th><th>Title</th><th>Report Ref</th>
              <th>Overall Rating</th><th>Report Status</th><th>Report Date</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${DB.audits
              .filter(a => a.status !== 'Cancelled' && a.status !== 'Planned')
              .map(a => {
                const r = a.report;
                return `<tr>
                  <td><strong>${a.sk}</strong></td>
                  <td>${a.title}</td>
                  <td>${r.reportRef || '<span class="text-muted">—</span>'}</td>
                  <td>${r.overallRating ? badge(r.overallRating) : '—'}</td>
                  <td>${badge(r.status)}</td>
                  <td>${fmt(r.reportDate)}</td>
                  <td>
                    <button class="btn btn-secondary btn-xs" onclick="openReport('${a.sk}')">Open Report</button>
                  </td>
                </tr>`;
              }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

function openReport(sk) {
  const a = DB.audits.find(x => x.sk === sk);
  const r = a.report;
  const cleared    = DB.notes.filter(n => n.auditId === sk && n.type === 'FINDING' && n.reviewStatus === 'Cleared');
  const statusFlow = ['Draft', 'For engagement lead approval', 'For CAE approval', 'Final - approved by CAE'];
  const curIdx     = statusFlow.indexOf(r.status);

  modal(`Report — ${r.reportRef || a.sk}`, `
    <div class="tab-bar">
      <button class="tab-btn active" onclick="switchTab(this,'rpt-summary')">Summary</button>
      <button class="tab-btn" onclick="switchTab(this,'rpt-findings')">Findings (${cleared.length})</button>
      <button class="tab-btn" onclick="switchTab(this,'rpt-approval')">Approval</button>
    </div>

    <div id="rpt-summary" class="tab-panel active">
      <div class="form-row mb-4">
        <div class="form-group">
          <label>Report Reference</label>
          <input type="text" value="${r.reportRef || ''}" id="rpt-ref" placeholder="IA-YYYY-NNN-RPT">
        </div>
        <div class="form-group">
          <label>Overall Rating</label>
          <select id="rpt-rating">
            <option ${r.overallRating === 'Satisfactory'      ? 'selected' : ''}>Satisfactory</option>
            <option ${r.overallRating === 'Needs improvement'  ? 'selected' : ''}>Needs improvement</option>
            <option ${r.overallRating === 'Unsatisfactory'     ? 'selected' : ''}>Unsatisfactory</option>
          </select>
        </div>
        <div class="form-group">
          <label>Report Date</label>
          <input type="date" id="rpt-date" value="${r.reportDate || ''}">
        </div>
      </div>
      <div class="form-group">
        <label>Executive Summary</label>
        <textarea id="rpt-exec" rows="4">${r.executiveSummary || ''}</textarea>
      </div>
    </div>

    <div id="rpt-findings" class="tab-panel">
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Ref</th><th>Title</th><th>Severity</th><th>Status</th></tr></thead>
            <tbody>
              ${cleared.length > 0
                ? cleared.map(f => `<tr>
                    <td>${f.ref}</td><td>${f.title}</td><td>${badge(f.severity)}</td><td>${badge(f.reviewStatus)}</td>
                  </tr>`).join('')
                : '<tr><td colspan="4" class="text-muted" style="text-align:center;padding:20px">No cleared findings yet</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div id="rpt-approval" class="tab-panel">
      <div class="workflow-steps mb-4">
        ${statusFlow.map((s, i) => `
          <div class="wf-step">
            <div class="wf-step-circle ${i < curIdx ? 'done' : i === curIdx ? 'active' : ''}">${i + 1}</div>
            <div class="wf-step-label">${s
              .replace('For engagement lead approval', 'Lead Review')
              .replace('For CAE approval', 'CAE Approval')
              .replace('Final - approved by CAE', 'Final')}</div>
          </div>
          ${i < statusFlow.length - 1 ? `<div class="wf-connector ${i < curIdx ? 'done' : ''}"></div>` : ''}`).join('')}
      </div>
      <div class="flex gap-2">
        ${curIdx < statusFlow.length - 1
          ? (canEdit()
              ? `<button class="btn btn-success" onclick="advanceReport('${sk}')">
                   Advance to: ${statusFlow[curIdx + 1]}
                 </button>`
              : '<span class="text-muted text-sm">Admin access required to advance</span>')
          : '<div class="alert alert-success" style="flex:1"><span>✅</span> Report is Final and Approved</div>'}
        ${canEdit() && curIdx > 0 && curIdx < statusFlow.length - 1
          ? `<button class="btn btn-danger" onclick="returnReport('${sk}')">Return with Comment</button>`
          : ''}
      </div>
    </div>`,

    `<button class="btn btn-secondary" onclick="closeModal()">Close</button>
     ${canEdit() ? `<button class="btn btn-primary" onclick="saveReport('${sk}')">Save Report</button>` : ''}`,
    'modal-lg');
}

function saveReport(sk) {
  const a = DB.audits.find(x => x.sk === sk);
  a.report.reportRef       = document.getElementById('rpt-ref').value;
  a.report.overallRating   = document.getElementById('rpt-rating').value;
  a.report.reportDate      = document.getElementById('rpt-date').value;
  a.report.executiveSummary = document.getElementById('rpt-exec').value;
  toast('Report saved', 'success');
}

function advanceReport(sk) {
  const a    = DB.audits.find(x => x.sk === sk);
  const flow = ['Draft', 'For engagement lead approval', 'For CAE approval', 'Final - approved by CAE'];
  const idx  = flow.indexOf(a.report.status);
  if (idx < flow.length - 1) {
    a.report.status = flow[idx + 1];
    if (a.report.status === 'Final - approved by CAE') {
      a.status = 'Closed';
      toast('Report approved by CAE! Issues auto-generated for all findings.', 'success');
      autoGenerateIssues(sk);
    } else {
      toast(`Report advanced to: ${a.report.status}`, 'success');
    }
  }
  closeModal();
  renderReporting();
}

function returnReport(sk) {
  const reason = prompt('Return comment (required):');
  if (!reason) return;
  toast('Report returned for revision', 'info');
  closeModal();
}

/**
 * Called automatically when the CAE approves a final report.
 * Converts every cleared Finding into an issue record.
 * @param {string} sk  — audit sk (e.g. 'AUD-2026-002')
 */
function autoGenerateIssues(sk) {
  const a        = DB.audits.find(x => x.sk === sk);
  const findings = DB.notes.filter(n => n.auditId === sk && n.type === 'FINDING' && n.reviewStatus === 'Cleared');

  findings.forEach(f => {
    const issueRef = `${sk}-${f.ref}`;
    if (!DB.issues.find(i => i.sk === issueRef)) {
      DB.issues.push({
        sk:        issueRef,
        auditId:   sk,
        findingId: f.ref,
        dept:      'IT',
        status:    'Open',
        owner:           f.actionOwner || 'USR-001',
        monitoringAuditor: a.team.lead.auditorId,
        engagementLead:    a.team.lead.auditorId,
        severity:          f.severity,
        originalTargetDate: f.targetDate,
        currentTargetDate:  f.targetDate,
        extensionCount:  0,
        percentComplete: 0,
        findingSnapshot: { condition: f.condition, recommendation: f.recommendation },
        closureFlow: { currentStep: 0, outcome: 'Pending' },
        closedAt: null,
        version: 1,
      });
    }
  });

  // Refresh sidebar badge
  document.getElementById('badge-issues').textContent =
    DB.issues.filter(i => i.status !== 'Closed').length;
}
