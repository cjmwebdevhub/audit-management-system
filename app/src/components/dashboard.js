/**
 * app/src/components/dashboard.js
 * ──────────────────────────────────────────────────────────────
 * Home / Dashboard — dark+orange BuildCore style
 * ──────────────────────────────────────────────────────────────
 */

function renderDashboard() {
  const session      = getSession();
  const firstName    = session ? session.fullName.split(' ')[0] : 'there';
  const isAdmin      = session && session.role === 'admin';

  const overdue      = DB.auditables.filter(a => a.dueStatus === 'Overdue').length;
  const openIssues   = DB.issues.filter(i => i.status !== 'Closed').length;
  const inProgress   = DB.audits.filter(a => a.status === 'In progress').length;
  const pendingDocs  = DB.docreqs.filter(d => d.status === 'Submitted').length;
  const totalAudits  = DB.audits.length;
  const closedAudits = DB.audits.filter(a => a.status === 'Closed').length;
  const completionPct = totalAudits ? Math.round((closedAudits / totalAudits) * 100) : 0;

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const recentTrail    = [...DB.trail].reverse().slice(0, 5);
  const criticalIssues = DB.issues.filter(i =>
    (i.severity === 'Critical' || i.severity === 'High') && i.status !== 'Closed'
  );

  // Icon helper — keeps template cleaner
  const icon = (paths, w = 18) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="${w}" height="${w}">${paths}</svg>`;

  const ICONS = {
    folder:  '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
    alert:   '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    info:    '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
    doc:     '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    globe:   '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    clip:    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
    table:   '<path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2h-4m-5 0h4"/>',
    docplus: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>',
    lock:    '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    clock:   '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    wave:    '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    grid:    '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  };

  document.getElementById('main-content').innerHTML = `

    <!-- ══ DARK HERO BANNER ══════════════════════════════════════ -->
    <div style="
      background: linear-gradient(135deg, #1a1a1a 0%, #222222 55%, #2a1a0a 100%);
      border-radius: 14px;
      padding: 32px 36px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      overflow: hidden;
      position: relative;
      border: 1px solid #333;
      box-shadow: 0 4px 24px rgba(0,0,0,0.25);
    ">
      <!-- orange glow blob left -->
      <div style="position:absolute;left:-60px;top:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(249,115,22,0.15) 0%,transparent 70%);pointer-events:none;"></div>
      <!-- orange glow blob right -->
      <div style="position:absolute;right:-40px;bottom:-40px;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(234,88,12,0.12) 0%,transparent 70%);pointer-events:none;"></div>

      <div style="position:relative;z-index:1;flex:1;">
        <!-- eyebrow -->
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
          <div style="width:32px;height:2px;background:var(--orange);border-radius:2px;"></div>
          <span style="font-size:10px;font-weight:700;color:var(--orange);text-transform:uppercase;letter-spacing:1.2px;">${greeting}</span>
        </div>
        <!-- name -->
        <div style="font-size:30px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;line-height:1.1;margin-bottom:12px;">
          ${escHtml(firstName)}
          <span style="color:var(--orange);">.</span>
        </div>
        <!-- tagline -->
        <div style="font-size:13px;color:rgba(255,255,255,0.55);max-width:520px;line-height:1.7;margin-bottom:20px;">
          Welcome to the <strong style="color:rgba(255,255,255,0.85);">Audit Management System</strong> — your central hub for
          planning, executing, and tracking internal audits end-to-end.
          ${isAdmin
            ? `<span style="display:inline-flex;align-items:center;gap:4px;background:rgba(249,115,22,0.2);color:#fb923c;padding:1px 10px;border-radius:20px;font-size:11px;font-weight:700;border:1px solid rgba(249,115,22,0.35);">Administrator</span>`
            : `<span style="display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);padding:1px 10px;border-radius:20px;font-size:11px;font-weight:700;border:1px solid rgba(255,255,255,0.15);">View-only access</span>`
          }
        </div>
        <!-- CTA buttons -->
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button onclick="navigate('engagements')" style="
            display:inline-flex;align-items:center;gap:6px;
            background:var(--orange);color:#fff;border:none;
            padding:9px 18px;border-radius:7px;font-size:13px;font-weight:700;
            cursor:pointer;box-shadow:0 3px 12px rgba(249,115,22,0.4);transition:all 0.15s;
          " onmouseover="this.style.background='#ea580c'" onmouseout="this.style.background='#f97316'">
            ${icon(ICONS.folder, 14)} View Engagements
          </button>
          <button onclick="navigate('issues')" style="
            display:inline-flex;align-items:center;gap:6px;
            background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.8);
            border:1px solid rgba(255,255,255,0.18);
            padding:9px 18px;border-radius:7px;font-size:13px;font-weight:600;
            cursor:pointer;transition:all 0.15s;
          " onmouseover="this.style.background='rgba(255,255,255,0.14)'" onmouseout="this.style.background='rgba(255,255,255,0.08)'">
            ${icon(ICONS.alert, 14)} Open Issues
            ${openIssues > 0 ? `<span style="background:var(--orange);color:#fff;border-radius:10px;font-size:10px;padding:0 6px;font-weight:700;">${openIssues}</span>` : ''}
          </button>
        </div>
      </div>

      <!-- logo watermark -->
      <div style="position:relative;z-index:1;flex-shrink:0;">
        <img src="src/assets/logo.jpeg" alt=""
          style="width:100px;height:100px;border-radius:16px;object-fit:cover;
                 opacity:0.9;box-shadow:0 6px 28px rgba(0,0,0,0.5),0 0 0 1px rgba(249,115,22,0.25);">
      </div>
    </div>

    <!-- ══ KPI CARDS ══════════════════════════════════════════════ -->
    <div class="grid-4 mb-4">

      <!-- Active Engagements -->
      <div class="stat-card" style="border-top:3px solid var(--orange);cursor:pointer;position:relative;overflow:hidden;" onclick="navigate('engagements')">
        <div style="position:absolute;top:-12px;right:-12px;width:60px;height:60px;border-radius:50%;background:rgba(249,115,22,0.06);pointer-events:none;"></div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <div class="stat-label">Active Engagements</div>
            <div class="stat-value" style="color:var(--orange);">${inProgress}</div>
            <div class="stat-sub">of ${totalAudits} total</div>
          </div>
          <div style="background:#fff7ed;border-radius:10px;padding:9px;color:var(--orange);">
            ${icon(ICONS.folder, 20)}
          </div>
        </div>
        <div style="margin-top:14px;">
          <div class="progress-bar"><div class="progress-fill" style="width:${totalAudits ? (inProgress/totalAudits)*100 : 0}%"></div></div>
          <div class="text-sm text-muted" style="margin-top:4px;">${completionPct}% complete overall</div>
        </div>
      </div>

      <!-- Overdue -->
      <div class="stat-card" style="border-top:3px solid #dc2626;cursor:pointer;" onclick="navigate('universe')">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <div class="stat-label">Overdue Entities</div>
            <div class="stat-value" style="color:#dc2626;">${overdue}</div>
            <div class="stat-sub">Immediate attention</div>
          </div>
          <div style="background:#fef2f2;border-radius:10px;padding:9px;color:#dc2626;">
            ${icon(ICONS.alert, 20)}
          </div>
        </div>
      </div>

      <!-- Open Issues -->
      <div class="stat-card" style="border-top:3px solid var(--warning);cursor:pointer;" onclick="navigate('issues')">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <div class="stat-label">Open Issues</div>
            <div class="stat-value" style="color:var(--warning);">${openIssues}</div>
            <div class="stat-sub">Awaiting remediation</div>
          </div>
          <div style="background:#fffbeb;border-radius:10px;padding:9px;color:var(--warning);">
            ${icon(ICONS.info, 20)}
          </div>
        </div>
      </div>

      <!-- Docs -->
      <div class="stat-card" style="border-top:3px solid var(--success);cursor:pointer;" onclick="navigate('docreqs')">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <div class="stat-label">Docs to Review</div>
            <div class="stat-value" style="color:var(--success);">${pendingDocs}</div>
            <div class="stat-sub">Submitted by auditees</div>
          </div>
          <div style="background:#f0fdf4;border-radius:10px;padding:9px;color:var(--success);">
            ${icon(ICONS.doc, 20)}
          </div>
        </div>
      </div>
    </div>

    <!-- ══ MODULE GRID ══════════════════════════════════════════════ -->
    <div style="margin-bottom:24px;">
      <div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:14px;display:flex;align-items:center;gap:8px;text-transform:uppercase;letter-spacing:0.5px;">
        ${icon(ICONS.grid, 15)}
        Modules
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px;">
        ${[
          { id:'universe',    label:'Audit Universe', paths: ICONS.globe    },
          { id:'plan',        label:'Annual Plan',    paths: ICONS.clip     },
          { id:'engagements', label:'Engagements',    paths: ICONS.folder   },
          { id:'fieldwork',   label:'Fieldwork',      paths: ICONS.table    },
          { id:'docreqs',     label:'Doc Requests',   paths: ICONS.docplus  },
          { id:'reporting',   label:'Reports',        paths: ICONS.doc      },
          { id:'issues',      label:'Issues',         paths: ICONS.alert    },
          { id:'trail',       label:'Audit Trail',    paths: ICONS.lock     },
        ].map(m => `
          <div onclick="navigate('${m.id}')" style="
            background:#fff;
            border:1px solid #e5e7eb;
            border-radius:12px;
            padding:18px 12px 14px;
            cursor:pointer;
            text-align:center;
            transition:all 0.15s;
            box-shadow:0 1px 4px rgba(0,0,0,0.06);
          "
          onmouseover="this.style.borderColor='var(--orange)';this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 16px rgba(249,115,22,0.15)'"
          onmouseout="this.style.borderColor='#e5e7eb';this.style.transform='';this.style.boxShadow='0 1px 4px rgba(0,0,0,0.06)'">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;background:#fff7ed;border-radius:10px;margin-bottom:10px;color:var(--orange);">
              ${icon(m.paths, 20)}
            </div>
            <div style="font-size:12px;font-weight:700;color:var(--text);">${m.label}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- ══ BOTTOM TWO COLUMNS ══════════════════════════════════════ -->
    <div class="grid-2">

      <!-- LEFT: Workflow + audits -->
      <div class="card">
        <div class="card-header" style="border-left:3px solid var(--orange);padding-left:17px;">
          <div class="card-title" style="display:flex;align-items:center;gap:6px;">
            <span style="color:var(--orange);">${icon(ICONS.wave, 14)}</span>
            Audit Workflow
          </div>
        </div>
        <div class="card-body">
          <div class="workflow-steps">
            <div class="wf-step"><div class="wf-step-circle done">1</div><div class="wf-step-label">Risk Assessment</div></div>
            <div class="wf-connector done"></div>
            <div class="wf-step"><div class="wf-step-circle done">2</div><div class="wf-step-label">Annual Plan</div></div>
            <div class="wf-connector done"></div>
            <div class="wf-step"><div class="wf-step-circle active">3</div><div class="wf-step-label">Engagement</div></div>
            <div class="wf-connector"></div>
            <div class="wf-step"><div class="wf-step-circle">4</div><div class="wf-step-label">Fieldwork</div></div>
            <div class="wf-connector"></div>
            <div class="wf-step"><div class="wf-step-circle">5</div><div class="wf-step-label">Reporting</div></div>
            <div class="wf-connector"></div>
            <div class="wf-step"><div class="wf-step-circle">6</div><div class="wf-step-label">Remediation</div></div>
          </div>
          <div style="margin-top:4px;">
            ${DB.audits.map(a => `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid #f3f4f6;">
                <div style="flex:1;min-width:0;margin-right:12px;">
                  <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(a.sk)} — ${escHtml(a.title.substring(0,38))}…</div>
                  <div class="text-sm text-muted">${fmt(a.startDate)} → ${fmt(a.endDate)}</div>
                </div>
                ${badge(a.status)}
              </div>`).join('')}
          </div>
        </div>
      </div>

      <!-- RIGHT: Activity + Critical issues -->
      <div style="display:flex;flex-direction:column;gap:20px;">

        <div class="card" style="flex:1;">
          <div class="card-header" style="border-left:3px solid var(--orange);padding-left:17px;">
            <div class="card-title" style="display:flex;align-items:center;gap:6px;">
              <span style="color:var(--orange);">${icon(ICONS.clock, 14)}</span>
              Recent Activity
            </div>
          </div>
          <div class="card-body" style="padding-top:12px;">
            <ul class="timeline">
              ${recentTrail.map(t => `
                <li class="timeline-item">
                  <div class="timeline-dot ${t.action==='StatusTransition'?'success':t.action==='Create'?'warning':''}"></div>
                  <div class="timeline-content">
                    <div class="timeline-title">${escHtml(t.action)} — ${escHtml(t.entityRef)}</div>
                    <div class="timeline-meta">${escHtml(userName(t.performedBy))} · ${fmt(t.timestamp)}</div>
                  </div>
                </li>`).join('')}
            </ul>
          </div>
        </div>

        ${criticalIssues.length > 0 ? `
        <div class="card">
          <div class="card-header" style="border-left:3px solid #dc2626;padding-left:17px;">
            <div class="card-title" style="color:#dc2626;display:flex;align-items:center;gap:6px;">
              ${icon(ICONS.alert, 14)} Critical / High Issues
            </div>
            <button class="btn btn-danger btn-sm" onclick="navigate('issues')">View All</button>
          </div>
          <div class="card-body" style="padding:0;">
            ${criticalIssues.slice(0,3).map(i => `
              <div style="display:flex;align-items:center;gap:12px;padding:12px 20px;border-bottom:1px solid #f3f4f6;">
                ${badge(i.severity)}
                <div style="flex:1;min-width:0;">
                  <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(i.findingSnapshot.condition.substring(0,48))}…</div>
                  <div class="text-sm text-muted">${escHtml(i.dept)} · Due ${fmt(i.currentTargetDate)}</div>
                </div>
                ${badge(i.status)}
              </div>`).join('')}
          </div>
        </div>` : `
        <div class="card">
          <div class="card-body" style="text-align:center;padding:28px;">
            <div style="width:44px;height:44px;border-radius:50%;background:#fff7ed;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;color:var(--orange);">
              ${icon('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>', 22)}
            </div>
            <div style="font-size:14px;font-weight:700;color:var(--success);margin-bottom:4px;">No Critical Issues</div>
            <div class="text-sm text-muted">All high-priority findings are resolved.</div>
          </div>
        </div>`}
      </div>
    </div>`;
}

/** Escape HTML to prevent XSS from data values */
function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}
