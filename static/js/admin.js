/* admin.js — Admin dashboard CRUD with confirmation popups */

// ── Bfcache fix ──
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        document.body.classList.remove('page-exit');
        document.body.classList.add('page-enter');
    }
});

function startProgress() {
    const bar = document.getElementById('progress-bar');
    if (!bar) return;
    bar.style.width = '70%'; bar.style.opacity = '1';
    setTimeout(() => { bar.style.width = '100%'; }, 200);
    setTimeout(() => { bar.style.opacity = '0'; bar.style.width = '0%'; }, 600);
}

function navigateTo(url) {
    startProgress();
    document.body.classList.add('page-exit');
    setTimeout(() => { window.location.href = url; }, 240);
}

function showToast(msg, type = 'success') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast ${type}`; t.textContent = msg; c.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.add('removing'); setTimeout(() => t.remove(), 300); }, 3000);
}

function animateCount(el, target) {
    const dur = 600, st = performance.now();
    function up(t) {
        const p = Math.min((t - st) / dur, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(up);
    }
    requestAnimationFrame(up);
}

// ══════════════════ CONFIRMATION MODAL ══════════════════

function showConfirmModal(title, message, onConfirm) {
    // Remove existing modal if any
    const existing = document.getElementById('confirmModal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'confirmModal';
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
        <div class="confirm-dialog">
            <div class="confirm-icon">⚠️</div>
            <h3 class="confirm-title">${title}</h3>
            <p class="confirm-message">${message}</p>
            <div class="confirm-actions">
                <button class="btn btn-outline btn-sm" id="confirmCancel">Cancel</button>
                <button class="btn btn-primary btn-sm" id="confirmOk" style="background:var(--danger);box-shadow:0 4px 12px rgba(239,68,68,0.3);">Confirm</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('active'));

    document.getElementById('confirmCancel').addEventListener('click', () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 250);
    });

    document.getElementById('confirmOk').addEventListener('click', () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 250);
        onConfirm();
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 250);
        }
    });
}

// ══════════════════ INIT ══════════════════

document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('page-enter');
    loadSession();
    setupNavigation();
    loadMembers();
    loadStats();
});

async function loadSession() {
    try {
        const res = await fetch('/api/session');
        const data = await res.json();
        if (data.admin_club_name) {
            document.getElementById('dashClubName').textContent = `${data.admin_club_name} — Admin`;
            document.getElementById('sidebarClubName').textContent = data.admin_club_name.toUpperCase();
        }
        if (data.admin_name) {
            document.getElementById('adminGreeting').textContent = `Welcome, ${data.admin_name}`;
        }
    } catch(e) {}
}

function setupNavigation() {
    const tabBtns = document.querySelectorAll('.admin-tab');
    const sidebarLinks = document.querySelectorAll('.admin-nav-link');
    const panels = document.querySelectorAll('.admin-panel');

    const switchPanel = (panelName) => {
        tabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.panel === panelName));
        sidebarLinks.forEach(link => link.classList.toggle('active', link.dataset.panel === panelName));
        panels.forEach(panel => panel.classList.remove('active'));
        const target = document.getElementById(`panel-${panelName}`);
        if (target) target.classList.add('active');
        loadPanelData(panelName);
    };

    tabBtns.forEach(btn => btn.addEventListener('click', () => switchPanel(btn.dataset.panel)));
    sidebarLinks.forEach(link => link.addEventListener('click', () => switchPanel(link.dataset.panel)));
}

function loadPanelData(panel) {
    if (panel === 'members') loadMembers();
    else if (panel === 'events') loadEvents();
    else if (panel === 'admins') loadAdmins();
    else if (panel === 'achievements') loadAchievements();
    else if (panel === 'faculty') loadFaculty();
}

async function loadStats() {
    try {
        const [mRes, eRes, aRes] = await Promise.all([
            fetch(`/api/club/${encodeURIComponent(CLUB_NAME)}/members`),
            fetch(`/api/events?club_name=${encodeURIComponent(CLUB_NAME)}`),
            fetch('/api/admin/list')
        ]);
        const [mData, eData, aData] = await Promise.all([mRes.json(), eRes.json(), aRes.json()]);
        animateCount(document.getElementById('statMembers'), mData.members ? mData.members.length : 0);
        animateCount(document.getElementById('statEvents'), eData.events ? eData.events.length : 0);
        animateCount(document.getElementById('statAdmins'), aData.admins ? aData.admins.length : 0);
    } catch(e) {}
}

// ══════════════════ MEMBERS ══════════════════

const TEAM_TYPES = ['Design', 'Technical', 'Documentation', 'Media', 'Sponsorship & PR'];

async function loadMembers() {
    const list = document.getElementById('membersList');
    list.innerHTML = '<p style="padding:20px;text-align:center;color:var(--text-muted);">Loading...</p>';
    try {
        const res = await fetch(`/api/club/${encodeURIComponent(CLUB_NAME)}/members`);
        const data = await res.json();
        if (!data.success || !data.members || data.members.length === 0) {
            list.innerHTML = '<p style="padding:40px;text-align:center;color:var(--text-muted);">No members yet. Add one above.</p>';
            return;
        }
        list.innerHTML = data.members.map(m => {
            const teamOptions = TEAM_TYPES.map(t => `<option value="${t}" ${t === m.team_type ? 'selected' : ''}>${t}</option>`).join('');
            return `<div class="panel-item" id="member-${m.member_id}">
                <div class="panel-item-info">
                    <h4>${m.member_name} <span class="badge badge-member">${m.team_type}</span></h4>
                    <p>${m.email}${m.phone ? ' · ' + m.phone : ''}</p>
                </div>
                <div class="panel-item-actions">
                    <select class="team-select" id="teamSelect-${m.member_id}" title="Change team">
                        ${teamOptions}
                    </select>
                    <button class="btn-icon btn-icon-blue" onclick="updateMemberTeam(${m.member_id}, '${m.member_name}')" title="Update Team">✎</button>
                    <button class="btn-icon btn-icon-danger" onclick="removeMember(${m.member_id}, '${m.member_name}')" title="Remove">✕</button>
                </div>
            </div>`;
        }).join('');
    } catch(e) {
        list.innerHTML = '<p style="padding:40px;text-align:center;color:var(--text-muted);">Error loading members.</p>';
    }
}

document.getElementById('addMemberForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const member_name = document.getElementById('memberName').value.trim();
    const email = document.getElementById('memberEmail').value.trim();
    const phone = document.getElementById('memberPhone').value.trim();
    const team_type = document.getElementById('memberTeamType').value;
    if (!team_type) { showToast('Please select a team type.', 'error'); return; }
    try {
        const res = await fetch('/api/admin/member/add', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ member_name, email, phone, team_type, club_name: CLUB_NAME })
        });
        const data = await res.json();
        if (data.success) { showToast(data.message); document.getElementById('addMemberForm').reset(); loadMembers(); loadStats(); }
        else { showToast(data.message, 'error'); }
    } catch(err) { showToast('Connection error.', 'error'); }
});

function updateMemberTeam(memberId, memberName) {
    const select = document.getElementById(`teamSelect-${memberId}`);
    const newTeam = select.value;
    showConfirmModal(
        'Update Team',
        `Are you sure you want to change <strong>${memberName}</strong>'s team to <strong>${newTeam}</strong>?`,
        async () => {
            try {
                const res = await fetch('/api/admin/member/update-team', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ member_id: memberId, club_name: CLUB_NAME, new_team_type: newTeam })
                });
                const data = await res.json();
                if (data.success) { showToast(data.message); loadMembers(); }
                else { showToast(data.message, 'error'); }
            } catch(err) { showToast('Connection error.', 'error'); }
        }
    );
}

function removeMember(memberId, memberName) {
    showConfirmModal(
        'Remove Member',
        `Are you sure you want to remove <strong>${memberName}</strong> from ${CLUB_NAME}? This action cannot be undone.`,
        async () => {
            try {
                const res = await fetch('/api/admin/member/remove', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ member_id: memberId, club_name: CLUB_NAME })
                });
                const data = await res.json();
                if (data.success) { showToast(data.message); const el = document.getElementById(`member-${memberId}`); if (el) el.remove(); loadStats(); }
                else { showToast(data.message, 'error'); }
            } catch(err) { showToast('Connection error.', 'error'); }
        }
    );
}

// ══════════════════ EVENTS ══════════════════

async function loadEvents() {
    const list = document.getElementById('eventsList');
    list.innerHTML = '<p style="padding:20px;text-align:center;color:var(--text-muted);">Loading...</p>';
    try {
        const res = await fetch(`/api/events?club_name=${encodeURIComponent(CLUB_NAME)}`);
        const data = await res.json();
        if (!data.success || !data.events || data.events.length === 0) {
            list.innerHTML = '<p style="padding:40px;text-align:center;color:var(--text-muted);">No events yet.</p>';
            return;
        }
        list.innerHTML = data.events.map(e => {
            const d = e.event_date ? new Date(e.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
            return `<div class="panel-item">
                <div class="panel-item-info">
                    <h4>${e.event_name} <span class="badge badge-member">${e.event_type}</span></h4>
                    <p>📅 ${d}</p>
                </div>
                <div class="panel-item-actions">
                    <button class="btn-icon btn-icon-danger" onclick="removeEvent(${e.event_id}, '${e.event_name.replace(/'/g, "\\'")}')" title="Remove">✕</button>
                </div>
            </div>`;
        }).join('');
    } catch(e) {
        list.innerHTML = '<p style="padding:40px;text-align:center;color:var(--text-muted);">Error loading events.</p>';
    }
}

document.getElementById('addEventForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const event_name = document.getElementById('eventName').value.trim();
    const event_date = document.getElementById('eventDate').value;
    const event_type = document.getElementById('eventType').value;
    if (!event_type) { showToast('Select event type.', 'error'); return; }
    try {
        const res = await fetch('/api/admin/event/add', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_name, event_date, event_type, club_name: CLUB_NAME })
        });
        const data = await res.json();
        if (data.success) { showToast(data.message); document.getElementById('addEventForm').reset(); loadEvents(); loadStats(); }
        else { showToast(data.message, 'error'); }
    } catch(err) { showToast('Connection error.', 'error'); }
});

function removeEvent(eventId, eventName) {
    showConfirmModal(
        'Remove Event',
        `Are you sure you want to remove <strong>${eventName}</strong>? This action cannot be undone.`,
        async () => {
            try {
                const res = await fetch('/api/admin/event/remove', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ event_id: eventId })
                });
                const data = await res.json();
                if (data.success) { showToast(data.message); loadEvents(); loadStats(); }
                else { showToast(data.message, 'error'); }
            } catch(err) { showToast('Connection error.', 'error'); }
        }
    );
}

// ══════════════════ ACHIEVEMENTS ══════════════════

async function loadAchievements() {
    const list = document.getElementById('achievementsList');
    if (!list) return;
    list.innerHTML = '<p style="padding:20px;text-align:center;color:var(--text-muted);">Loading...</p>';
    try {
        const res = await fetch(`/api/club/${encodeURIComponent(CLUB_NAME)}/achievements`);
        const data = await res.json();
        if (!data.success || !data.achievements || data.achievements.length === 0) {
            list.innerHTML = '<p style="padding:40px;text-align:center;color:var(--text-muted);">No achievements yet.</p>';
            return;
        }
        list.innerHTML = data.achievements.map(a => {
            const d = a.achievement_date ? new Date(a.achievement_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
            return `<div class="panel-item">
                <div class="panel-item-info">
                    <h4>🏆 ${a.title}</h4>
                    <p>${a.description || ''}${d ? ' · ' + d : ''}</p>
                </div>
                <div class="panel-item-actions">
                    <button class="btn-icon btn-icon-danger" onclick="removeAchievement(${a.achievement_id}, '${a.title.replace(/'/g, "\\'")}')" title="Remove">✕</button>
                </div>
            </div>`;
        }).join('');
    } catch(e) {
        list.innerHTML = '<p style="padding:40px;text-align:center;color:var(--text-muted);">Error loading.</p>';
    }
}

document.getElementById('addAchievementForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('achievementTitle').value.trim();
    const description = document.getElementById('achievementDesc').value.trim();
    const achievement_date = document.getElementById('achievementDate').value;
    if (!title) { showToast('Title is required.', 'error'); return; }
    try {
        const res = await fetch('/api/admin/achievement/add', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, achievement_date, club_name: CLUB_NAME })
        });
        const data = await res.json();
        if (data.success) { showToast(data.message); document.getElementById('addAchievementForm').reset(); loadAchievements(); }
        else { showToast(data.message, 'error'); }
    } catch(err) { showToast('Connection error.', 'error'); }
});

function removeAchievement(id, title) {
    showConfirmModal(
        'Remove Achievement',
        `Are you sure you want to remove <strong>${title}</strong>?`,
        async () => {
            try {
                const res = await fetch('/api/admin/achievement/remove', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ achievement_id: id })
                });
                const data = await res.json();
                if (data.success) { showToast(data.message); loadAchievements(); }
                else { showToast(data.message, 'error'); }
            } catch(err) { showToast('Connection error.', 'error'); }
        }
    );
}

// ══════════════════ FACULTY ══════════════════

async function loadFaculty() {
    const list = document.getElementById('facultyList');
    if (!list) return;
    list.innerHTML = '<p style="padding:20px;text-align:center;color:var(--text-muted);">Loading...</p>';
    try {
        const res = await fetch(`/api/club/${encodeURIComponent(CLUB_NAME)}/faculty`);
        const data = await res.json();
        if (!data.success || !data.faculty || data.faculty.length === 0) {
            list.innerHTML = '<p style="padding:40px;text-align:center;color:var(--text-muted);">No faculty coordinators yet.</p>';
            return;
        }
        list.innerHTML = data.faculty.map(f => `
            <div class="panel-item">
                <div class="panel-item-info">
                    <h4>🎓 ${f.coordinator_name} ${f.designation ? `<span class="badge badge-purple">${f.designation}</span>` : ''}</h4>
                    <p>${f.email || ''}${f.phone ? ' · ' + f.phone : ''}</p>
                </div>
                <div class="panel-item-actions">
                    <button class="btn-icon btn-icon-danger" onclick="removeFaculty(${f.coordinator_id}, '${f.coordinator_name.replace(/'/g, "\\'")}')" title="Remove">✕</button>
                </div>
            </div>
        `).join('');
    } catch(e) {
        list.innerHTML = '<p style="padding:40px;text-align:center;color:var(--text-muted);">Error loading.</p>';
    }
}

document.getElementById('addFacultyForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const coordinator_name = document.getElementById('facultyName').value.trim();
    const designation = document.getElementById('facultyDesignation').value.trim();
    const email = document.getElementById('facultyEmail').value.trim();
    const phone = document.getElementById('facultyPhone').value.trim();
    if (!coordinator_name) { showToast('Name is required.', 'error'); return; }
    try {
        const res = await fetch('/api/admin/faculty/add', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ coordinator_name, designation, email, phone, club_name: CLUB_NAME })
        });
        const data = await res.json();
        if (data.success) { showToast(data.message); document.getElementById('addFacultyForm').reset(); loadFaculty(); }
        else { showToast(data.message, 'error'); }
    } catch(err) { showToast('Connection error.', 'error'); }
});

function removeFaculty(id, name) {
    showConfirmModal(
        'Remove Faculty',
        `Are you sure you want to remove <strong>${name}</strong>?`,
        async () => {
            try {
                const res = await fetch('/api/admin/faculty/remove', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ coordinator_id: id })
                });
                const data = await res.json();
                if (data.success) { showToast(data.message); loadFaculty(); }
                else { showToast(data.message, 'error'); }
            } catch(err) { showToast('Connection error.', 'error'); }
        }
    );
}

// ══════════════════ ADMINS ══════════════════

async function loadAdmins() {
    const list = document.getElementById('adminsList');
    list.innerHTML = '<p style="padding:20px;text-align:center;color:var(--text-muted);">Loading...</p>';
    try {
        const res = await fetch('/api/admin/list');
        const data = await res.json();
        if (!data.success || !data.admins || data.admins.length === 0) {
            list.innerHTML = '<p style="padding:40px;text-align:center;color:var(--text-muted);">No admins yet.</p>';
            return;
        }
        list.innerHTML = data.admins.map(a => {
            const d = a.created_at ? new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
            return `<div class="panel-item">
                <div class="panel-item-info">
                    <h4>${a.admin_name} <span class="badge badge-member">${a.club_name}</span></h4>
                    <p>${a.email} · Joined ${d}</p>
                </div>
            </div>`;
        }).join('');
    } catch(e) {
        list.innerHTML = '<p style="padding:40px;text-align:center;color:var(--text-muted);">Error loading admins.</p>';
    }
}

document.getElementById('btn-logout')?.addEventListener('click', (e) => {
    e.preventDefault(); navigateTo('/logout');
});
