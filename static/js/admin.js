/* admin.js — Admin dashboard CRUD operations */

// ── Progress Bar ──
function startProgress() {
    const bar = document.getElementById('progress-bar');
    bar.style.width = '70%';
    bar.style.opacity = '1';
    setTimeout(() => { bar.style.width = '100%'; }, 200);
    setTimeout(() => { bar.style.opacity = '0'; }, 600);
}

function navigateTo(url) {
    startProgress();
    document.body.classList.add('page-exit');
    setTimeout(() => { window.location.href = url; }, 240);
}

// ── Toast Notifications ──
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('page-enter');
    loadSession();
    setupNavigation();
    loadMembers();
    loadStats();
});

// ── Load session info ──
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

// ── Setup Navigation (both tabs and sidebar) ──
function setupNavigation() {
    const tabBtns = document.querySelectorAll('.admin-tab');
    const sidebarLinks = document.querySelectorAll('.admin-nav-link');
    const panels = document.querySelectorAll('.admin-panel');

    const switchPanel = (panelName) => {
        // Update all tabs and links
        tabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.panel === panelName));
        sidebarLinks.forEach(link => link.classList.toggle('active', link.dataset.panel === panelName));
        
        // Update panels
        panels.forEach(panel => panel.classList.remove('active'));
        document.getElementById(`panel-${panelName}`).classList.add('active');
        
        // Load data
        loadPanelData(panelName);
    };

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchPanel(btn.dataset.panel));
    });

    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => switchPanel(link.dataset.panel));
    });
}

function loadPanelData(panel) {
    if (panel === 'members') loadMembers();
    else if (panel === 'events') loadEvents();
    else if (panel === 'admins') loadAdmins();
}

// ── Load Stats ──
async function loadStats() {
    try {
        const membersRes = await fetch(`/api/club/${encodeURIComponent(CLUB_NAME)}/members`);
        const membersData = await membersRes.json();
        const memberCount = membersData.members ? membersData.members.length : 0;
        document.getElementById('statMembers').textContent = memberCount;

        const eventsRes = await fetch(`/api/events?club_name=${encodeURIComponent(CLUB_NAME)}`);
        const eventsData = await eventsRes.json();
        const eventCount = eventsData.events ? eventsData.events.length : 0;
        document.getElementById('statEvents').textContent = eventCount;

        const adminsRes = await fetch('/api/admin/list');
        const adminsData = await adminsRes.json();
        const adminCount = adminsData.admins ? adminsData.admins.length : 0;
        document.getElementById('statAdmins').textContent = adminCount;
    } catch(e) {}
}

// ════════════════════════════ MEMBERS ════════════════════════════

async function loadMembers() {
    const list = document.getElementById('membersList');
    list.innerHTML = '<p style="padding: 20px; text-align: center; color: var(--text-muted);">Loading...</p>';
    
    try {
        const res = await fetch(`/api/club/${encodeURIComponent(CLUB_NAME)}/members`);
        const data = await res.json();
        if (!data.success || !data.members || data.members.length === 0) {
            list.innerHTML = '<p style="padding: 40px; text-align: center; color: var(--text-muted);">No members yet. Add one using the form above.</p>';
            return;
        }
        
        list.innerHTML = data.members.map(m => `
            <div class="panel-item" id="member-${m.member_id}">
                <div class="panel-item-info">
                    <h4>${m.member_name} <span class="badge badge-member">${m.team_type}</span></h4>
                    <p>${m.email}${m.phone ? ' · ' + m.phone : ''}</p>
                </div>
                <div class="panel-item-actions">
                    <button class="btn-icon btn-icon-danger" onclick="removeMember(${m.member_id})" title="Remove">✕</button>
                </div>
            </div>
        `).join('');
    } catch(e) { 
        list.innerHTML = '<p style="padding: 40px; text-align: center; color: var(--text-muted);">Error loading members.</p>'; 
    }
}

document.getElementById('addMemberForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const member_name = document.getElementById('memberName').value.trim();
    const email = document.getElementById('memberEmail').value.trim();
    const phone = document.getElementById('memberPhone').value.trim();
    const team_type = document.getElementById('memberTeamType').value;

    if (!team_type) { 
        showToast('Please select a team type.', 'error'); 
        return; 
    }

    try {
        const res = await fetch('/api/admin/member/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ member_name, email, phone, team_type, club_name: CLUB_NAME })
        });
        const data = await res.json();
        if (data.success) {
            showToast(data.message, 'success');
            document.getElementById('addMemberForm').reset();
            loadMembers();
            loadStats();
        } else {
            showToast(data.message, 'error');
        }
    } catch(err) { 
        showToast('Connection error.', 'error'); 
    }
});

async function removeMember(memberId) {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
        const res = await fetch('/api/admin/member/remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ member_id: memberId, club_name: CLUB_NAME })
        });
        const data = await res.json();
        if (data.success) {
            showToast(data.message, 'success');
            const el = document.getElementById(`member-${memberId}`);
            if (el) el.remove();
            loadStats();
        } else {
            showToast(data.message, 'error');
        }
    } catch(err) { 
        showToast('Connection error.', 'error'); 
    }
}

// ════════════════════════════ EVENTS ════════════════════════════

async function loadEvents() {
    const list = document.getElementById('eventsList');
    list.innerHTML = '<p style="padding: 20px; text-align: center; color: var(--text-muted);">Loading...</p>';
    
    try {
        const res = await fetch(`/api/events?club_name=${encodeURIComponent(CLUB_NAME)}`);
        const data = await res.json();
        if (!data.success || !data.events || data.events.length === 0) {
            list.innerHTML = '<p style="padding: 40px; text-align: center; color: var(--text-muted);">No events scheduled yet. Create one using the form above.</p>';
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
                    <button class="btn-icon btn-icon-danger" onclick="removeEvent(${e.event_id})" title="Remove">✕</button>
                </div>
            </div>`;
        }).join('');
    } catch(e) { 
        list.innerHTML = '<p style="padding: 40px; text-align: center; color: var(--text-muted);">Error loading events.</p>'; 
    }
}

document.getElementById('addEventForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const event_name = document.getElementById('eventName').value.trim();
    const event_date = document.getElementById('eventDate').value;
    const event_type = document.getElementById('eventType').value;

    if (!event_type) { 
        showToast('Please select an event type.', 'error'); 
        return; 
    }

    try {
        const res = await fetch('/api/admin/event/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_name, event_date, event_type, club_name: CLUB_NAME })
        });
        const data = await res.json();
        if (data.success) {
            showToast(data.message, 'success');
            document.getElementById('addEventForm').reset();
            loadEvents();
            loadStats();
        } else {
            showToast(data.message, 'error');
        }
    } catch(err) { 
        showToast('Connection error.', 'error'); 
    }
});

async function removeEvent(eventId) {
    if (!confirm('Are you sure you want to remove this event?')) return;
    try {
        const res = await fetch('/api/admin/event/remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_id: eventId })
        });
        const data = await res.json();
        if (data.success) {
            showToast(data.message, 'success');
            loadEvents();
            loadStats();
        } else {
            showToast(data.message, 'error');
        }
    } catch(err) { 
        showToast('Connection error.', 'error'); 
    }
}

// ════════════════════════════ ADMINS ════════════════════════════

async function loadAdmins() {
    const list = document.getElementById('adminsList');
    list.innerHTML = '<p style="padding: 20px; text-align: center; color: var(--text-muted);">Loading...</p>';
    
    try {
        const res = await fetch('/api/admin/list');
        const data = await res.json();
        if (!data.success || !data.admins || data.admins.length === 0) {
            list.innerHTML = '<p style="padding: 40px; text-align: center; color: var(--text-muted);">No admins registered yet.</p>';
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
        list.innerHTML = '<p style="padding: 40px; text-align: center; color: var(--text-muted);">Error loading admins.</p>'; 
    }
}

// ── Logout ──
document.getElementById('btn-logout')?.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo('/logout');
});
