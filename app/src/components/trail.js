/**
 * app/src/components/trail.js
 * ──────────────────────────────────────────────────────────────
 * Tamper-Proof Audit Trail viewer.
 * All trail entries are immutable once written.
 * Depends on: db.js, helpers.js
 * ──────────────────────────────────────────────────────────────
 */

function renderTrail() {
  document.getElementById('main-content').innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title">Tamper-Proof Audit Trail</div>
        <span class="chip">🔒 All entries are immutable once written</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th><th>Audit</th><th>Action</th><th>Entity Ref</th>
              <th>Performed By</th><th>Roles</th><th>Details</th>
            </tr>
          </thead>
          <tbody>
            ${DB.trail.map(t => `<tr>
              <td class="text-sm">${t.timestamp ? new Date(t.timestamp).toLocaleString('en-PH') : '—'}</td>
              <td><span class="chip">${t.auditId}</span></td>
              <td><span class="chip">${t.action}</span></td>
              <td><strong>${t.entityRef}</strong></td>
              <td>${userName(t.performedBy)}</td>
              <td>${t.roles.map(r => `<span class="chip">${r.replace('role:', '')}</span>`).join(' ')}</td>
              <td class="text-sm text-muted">${Object.entries(t.details || {}).map(([k, v]) => `${k}: ${v}`).join(' | ')}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}
