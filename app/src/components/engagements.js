/**
 * app/src/components/engagements.js
 * ──────────────────────────────────────────────────────────────
 * Stage 3 — Engagement Readiness & Cockpit.
 * Functions: renderEngagements, openCockpit, toggleCheck,
 *            startEngagement, viewAuditDetail, switchFWTab
 * Depends on: db.js, helpers.js
 * ──────────────────────────────────────────────────────────────
 */

function renderEngagements() {
  document.getElementById('main-content').innerHTML = `
    <div class="alert alert-info">
      <span>ℹ️</span>
      <div><strong>Stage 3: Engagement Readiness</strong> — Each audit must pass 9 readiness checks before fieldwork begins. Issue Notification Letters (NL) and Document Request Lists (DRL) from here.</div>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">All Engagements</div></div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Ref</th><th>Title</th><th>Type</th><th>Size</th><th>Lead</th>
              <th>Start</th><th>End</th><th>Readiness</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            ${DB.audits.map(a => {
              const checks = Object.values(a.readinessChecks);
              const done   = checks.filter(Boolean).length;
              const pct    = Math.round(done / checks.length * 100);
              return `<tr>
                <td><strong>${a.sk}</strong></td>
                <td>${a.title}</td>
                <td><span class="chip">${a.auditType}</span></td>
                <td>${a.size}</td>
                <td>${userName(a.team.lead.auditorId)}</td>
                <td>${fmt(a.startDate)}</td>
                <td>${fmt(a.endDate)}</td>
                <td style="min-width:100px">
                  <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
                  <div class="text-sm text-muted">${done}/9 checks</div>
                </td>
                <td>${badge(a.status)}</td>
                <td><button class="btn btn-primary btn-xs" onclick="openCockpit('${a.sk}')">Open Cockpit</button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

function openCockpit(sk) {
  const a = DB.audits.find(x => x.sk === sk);
  if (!a) return;

  const checkDefs = [
    { key: 'objectives',         label: 'Objectives & criteria defined' },
    { key: 'scope',              label: 'Scope clearly documented' },
    { key: 'lead',               label: 'Audit-in-Charge assigned' },
    { key: 'independence',       label: 'Independence confirmed (no conflicts)' },
    { key: 'timeline',           label: 'Engagement timeline approved' },
    { key: 'notificationLetter', label: 'Notification Letter (NL) issued' },
    { key: 'docRequestList',     label: 'Document Request List (DRL) sent' },
    { key: 'teamConfirmed',      label: 'Full team roster confirmed' },
    { key: 'managementBriefing', label: 'Management briefing conducted' },
  ];

  const checksHtml = checkDefs.map(c => `
    <div class="check-item">
      <input type="checkbox" ${a.readinessChecks[c.key] ? 'checked' : ''} id="rc-${c.key}"
        ${canEdit() ? `onchange="toggleCheck('${sk}','${c.key}')"` : 'disabled'}>
      <label class="check-label" for="rc-${c.key}">${c.label}</label>
      ${a.readinessChecks[c.key] ? '<span style="color:var(--success);font-size:16px">✓</span>' : ''}
    </div>`).join('');

  const done  = Object.values(a.readinessChecks).filter(Boolean).length;
  const ready = done === 9;

  modal(`Engagement Cockpit — ${a.sk}`, `
    <div class="tab-bar">
      <button class="tab-btn active" onclick="switchTab(this,'cockpit-readiness')">Readiness</button>
      <button class="tab-btn" onclick="switchTab(this,'cockpit-team')">Team</button>
      <button class="tab-btn" onclick="switchTab(this,'cockpit-letters')">Letters & DRL</button>
    </div>

    <div id="cockpit-readiness" class="tab-panel active">
      <div class="flex gap-2 mb-4" style="justify-content:space-between;align-items:center">
        <strong>${done}/9 Readiness Checks Completed</strong>
        ${ready
          ? '<span class="badge badge-approved">✓ Ready for Fieldwork</span>'
          : '<span class="badge badge-pending">Not ready yet</span>'}
      </div>
      <div class="progress-bar mb-4" style="height:8px">
        <div class="progress-fill" style="width:${Math.round(done / 9 * 100)}%"></div>
      </div>
      ${checksHtml}
      ${ready && a.status === 'Planned' && canEdit()
        ? `<div class="mt-4"><button class="btn btn-success" onclick="startEngagement('${sk}')">🚀 Start Engagement</button></div>`
        : ''}
    </div>

    <div id="cockpit-team" class="tab-panel">
      <div style="display:grid;gap:12px">
        <div class="card"><div class="card-body">
          <div class="flex gap-3 mb-2"><strong>Supervisor:</strong> ${userName(a.team.supervisor.auditorId)}</div>
          <div class="flex gap-3 mb-2"><strong>Lead (AIC):</strong> ${userName(a.team.lead.auditorId)}</div>
          <div><strong>Staff:</strong> ${a.team.staff.length > 0 ? a.team.staff.map(s => userName(s.auditorId)).join(', ') : 'None assigned'}</div>
          <div class="mt-4"><strong>Auditee Contacts:</strong> ${a.contacts.map(c => userName(c)).join(', ') || 'None'}</div>
        </div></div>
      </div>
    </div>

    <div id="cockpit-letters" class="tab-panel">
      <div style="display:grid;gap:8px">
        ${['Notification Letter (NL)', 'Terms of Audit (TA)', 'Team Letter (TL)', 'Document Request List (DRL)'].map(l => `
          <div class="flex gap-2" style="justify-content:space-between;align-items:center;padding:10px;border:1px solid var(--border);border-radius:6px">
            <span>📄 ${l}</span>
            ${canEdit()
              ? `<button class="btn btn-secondary btn-sm" onclick="toast('${l} generated and sent to auditee','success')">Generate & Send</button>`
              : '<span class="text-muted text-sm">View only</span>'}
          </div>`).join('')}
      </div>
    </div>`,

    `<button class="btn btn-secondary" onclick="closeModal()">Close</button>
     ${a.status === 'Planned' && ready && canEdit() ? `<button class="btn btn-success" onclick="startEngagement('${sk}');closeModal()">🚀 Start Fieldwork</button>` : ''}`,
    'modal-lg');
}

function toggleCheck(sk, key) {
  const a = DB.audits.find(x => x.sk === sk);
  a.readinessChecks[key] = !a.readinessChecks[key];
  toast(`Check "${key}" ${a.readinessChecks[key] ? 'completed' : 'unchecked'}`, 'info');
}

function startEngagement(sk) {
  const a = DB.audits.find(x => x.sk === sk);
  a.status = 'In progress';
  toast(`${sk} moved to In Progress`, 'success');
  renderEngagements();
}

/** Alias used by the plan view's "View" button. */
function viewAuditDetail(sk) {
  openCockpit(sk);
}
