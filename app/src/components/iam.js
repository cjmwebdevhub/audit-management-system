/**
 * app/src/components/iam.js
 * ──────────────────────────────────────────────────────────────
 * Identity & Access Management — Users, Roles & Invitations.
 * Functions: renderIAM, openInviteUser, saveInviteUser,
 *            activateUser, editUserRole, addRole
 * Depends on: db.js, helpers.js
 * ──────────────────────────────────────────────────────────────
 */

function renderIAM() {
  // Only admins can reach this page — non-admin nav item is hidden by main.js.
  // Guard here as a second line of defence.
  if (!canEdit()) {
    document.getElementById('topbar-actions').innerHTML = '';
    document.getElementById('main-content').innerHTML =
      `<div class="alert alert-warning"><span>⛔</span> Administrator access required to view this section.</div>`;
    return;
  }

  document.getElementById('topbar-actions').innerHTML =
    `<button class="btn btn-primary btn-sm" onclick="openInviteUser()">+ Invite User</button>`;

  document.getElementById('main-content').innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title">Users & Roles (${DB.users.length})</div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>User ID</th><th>Full Name</th><th>Email</th><th>Department</th>
              <th>Assigned Roles</th><th>Invitation Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${DB.users.map(u => `<tr>
              <td><strong>${u.id}</strong></td>
              <td>${u.fullName}</td>
              <td>${u.email}</td>
              <td>${u.department}</td>
              <td>${u.assignedRoles.map(r => `<span class="chip">${r.replace('role:', '')}</span>`).join(' ')}</td>
              <td>${badge(u.invitation.status)}</td>
              <td>
                ${u.invitation.status !== 'Active'
                  ? `<button class="btn btn-info btn-xs" onclick="activateUser('${u.id}')">Activate</button>`
                  : '<span class="text-muted text-sm">Active</span>'}
                <button class="btn btn-secondary btn-xs" onclick="editUserRole('${u.id}')">Roles</button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card mt-4">
      <div class="card-header"><div class="card-title">Role Definitions</div></div>
      <div class="card-body">
        <div class="grid-2">
          ${DB.roles.map(r => `
            <div style="padding:10px;border:1px solid var(--border);border-radius:6px">
              <strong style="font-size:13px">${r.label}</strong>
              <div class="text-sm text-muted">${r.id}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
}

function openInviteUser() {
  modal('Invite New User', `
    <div class="form-row">
      <div class="form-group">
        <label>Full Name</label>
        <input type="text" id="inv-name" placeholder="Juan dela Cruz">
      </div>
      <div class="form-group">
        <label>Email</label>
        <input type="email" id="inv-email" placeholder="user@company.com">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>User Type</label>
        <select id="inv-type">
          <option value="AUDR">Auditor (AUDR)</option>
          <option value="USR">Auditee (USR)</option>
          <option value="SIG">Signatory (SIG)</option>
        </select>
      </div>
      <div class="form-group">
        <label>Department</label>
        <input type="text" id="inv-dept" placeholder="e.g. Finance">
      </div>
    </div>
    <div class="form-group">
      <label>Assigned Role</label>
      <select id="inv-role">
        ${DB.roles.map(r => `<option value="role:${r.id}">${r.label}</option>`).join('')}
      </select>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveInviteUser()">Send Invitation</button>`);
}

function saveInviteUser() {
  const name  = document.getElementById('inv-name').value.trim();
  const email = document.getElementById('inv-email').value.trim();
  if (!name || !email) { toast('Name and email required', 'error'); return; }

  const prefix   = document.getElementById('inv-type').value;
  const existing = DB.users.filter(u => u.id.startsWith(prefix));
  const id       = `${prefix}-${String(existing.length + 1).padStart(3, '0')}`;

  DB.users.push({
    id, fullName: name, email,
    department:    document.getElementById('inv-dept').value,
    assignedRoles: [document.getElementById('inv-role').value],
    invitation: {
      status:    'Invited',
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    },
  });

  // Write to audit trail
  DB.trail.unshift({
    sk:          `${new Date().toISOString()}#${Math.random().toString(36).substr(2, 6)}`,
    auditId:     '_iam',
    action:      'Create',
    entityRef:   id,
    performedBy: DB.currentUser.id,
    roles:       [DB.currentUser.role],
    details:     { action: 'User invited', email },
    timestamp:   new Date().toISOString(),
  });

  closeModal();
  toast(`Invitation sent to ${email}`, 'success');
  renderIAM();
}

function activateUser(id) {
  const u = DB.users.find(x => x.id === id);
  u.invitation.status = 'Active';
  toast(`${u.fullName} activated`, 'success');
  renderIAM();
}

function editUserRole(id) {
  const u = DB.users.find(x => x.id === id);
  modal(`Edit Roles — ${u.fullName}`, `
    <div class="form-group">
      <label>Current Roles</label>
      <div>${u.assignedRoles.map(r => `<span class="chip">${r.replace('role:', '')}</span>`).join(' ')}</div>
    </div>
    <div class="form-group">
      <label>Add Role</label>
      <select id="new-role">
        ${DB.roles.map(r => `<option value="role:${r.id}">${r.label}</option>`).join('')}
      </select>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="addRole('${id}')">Add Role</button>`);
}

function addRole(id) {
  const u    = DB.users.find(x => x.id === id);
  const role = document.getElementById('new-role').value;
  if (!u.assignedRoles.includes(role)) u.assignedRoles.push(role);
  closeModal();
  toast('Role added', 'success');
  renderIAM();
}
