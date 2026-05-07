/* club-detail.js — Club detail page with live data */

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
    setClubHeader();
    loadMembers();
    setupTabSwitching();
});

const CLUB_EMOJIS = {
    'Genesis': '🚀',
    'Numerano': '🔢',
    'ByteSync': '💻',
    'AWS Cloud Club': '☁️'
};

const TEAM_TYPE_COLORS = {
    'Design': 'team-type-design',
    'Technical': 'team-type-technical',
    'Media': 'team-type-media',
    'Documentation': 'team-type-documentation',
    'Sponsorship & PR': 'team-type-sponsorship'
};

const EVENT_TYPE_COLORS = {
    'Technical': 'event-type-technical',
    'Cultural': 'event-type-cultural'
};

// ── Set club header ──
function setClubHeader() {
    document.getElementById('clubEmoji').textContent = CLUB_EMOJIS[CLUB_NAME] || '🏢';
    document.getElementById('clubName').textContent = CLUB_NAME;
}

// ── Tab switching ──
function setupTabSwitching() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            const tabName = btn.dataset.tab;
            document.getElementById(`pane-${tabName}`).classList.add('active');
            
            if (tabName === 'members') loadMembers();
            else if (tabName === 'events') loadEvents();
        });
    });
}

// ── Load Members ──
async function loadMembers() {
    const pane = document.getElementById('pane-members');
    pane.innerHTML = '<p style="text-align:center; padding: 40px; color: var(--text-muted);">Loading members...</p>';
    
    try {
        const res = await fetch(`/api/club/${encodeURIComponent(CLUB_NAME)}/members`);
        const data = await res.json();
        
        if (!data.success) {
            pane.innerHTML = '<p style="text-align:center; padding: 40px; color: var(--text-muted);">Failed to load members.</p>';
            return;
        }

        const members = data.members;
        
        if (members.length === 0) {
            pane.innerHTML = '<p style="text-align:center; padding: 40px; color: var(--text-muted);">No members yet.</p>';
            document.getElementById('memberStat').textContent = '0 members';
            return;
        }

        // Update stat
        document.getElementById('memberStat').textContent = `${members.length} members`;

        // Build card grid
        let html = '<div class="members-card-grid">';
        members.forEach(member => {
            const initials = member.member_name.split(' ').map(n => n[0]).join('').toUpperCase();
            const teamClass = TEAM_TYPE_COLORS[member.team_type] || 'team-type-technical';
            html += `
                <div class="member-card">
                    <div class="member-card-avatar">${initials}</div>
                    <div class="member-card-name">${member.member_name}</div>
                    <div class="member-card-team"><span class="team-type-badge ${teamClass}">${member.team_type}</span></div>
                    <div class="member-card-email">${member.email || '-'}</div>
                    <div class="member-card-phone">${member.phone || '-'}</div>
                </div>
            `;
        });
        html += '</div>';
        pane.innerHTML = html;
    } catch(err) {
        pane.innerHTML = '<p style="text-align:center; padding: 40px; color: var(--text-muted);">Error loading members.</p>';
    }
}

// ── Load Events ──
async function loadEvents() {
    const pane = document.getElementById('pane-events');
    pane.innerHTML = '<p style="text-align:center; padding: 40px; color: var(--text-muted);">Loading events...</p>';
    
    try {
        const res = await fetch(`/api/events?club_name=${encodeURIComponent(CLUB_NAME)}`);
        const data = await res.json();
        
        if (!data.success) {
            pane.innerHTML = '<p style="text-align:center; padding: 40px; color: var(--text-muted);">Failed to load events.</p>';
            return;
        }

        const events = data.events;
        
        if (events.length === 0) {
            pane.innerHTML = '<p style="text-align:center; padding: 40px; color: var(--text-muted);">No events scheduled yet.</p>';
            document.getElementById('eventStat').textContent = '0 events';
            return;
        }

        // Update stat
        document.getElementById('eventStat').textContent = `${events.length} events`;

        // Build timeline
        let html = '<div class="events-timeline">';
        
        events.forEach(event => {
            const date = new Date(event.event_date);
            const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const typeClass = EVENT_TYPE_COLORS[event.event_type] || 'event-type-technical';
            
            html += `
                <div class="event-timeline-item">
                    <div class="event-card">
                        <div class="event-card-header">
                            <span class="event-date-badge">📅 ${formattedDate}</span>
                            <span class="event-type-badge ${typeClass}">${event.event_type}</span>
                        </div>
                        <h3>${event.event_name}</h3>
                        <p class="event-card-description">${event.description || 'No description'}</p>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        pane.innerHTML = html;
    } catch(err) {
        pane.innerHTML = '<p style="text-align:center; padding: 40px; color: var(--text-muted);">Error loading events.</p>';
    }
}

// Back button
document.getElementById('nav-back').addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo('/user/clubs');
});

// Logout button
document.getElementById('btn-logout').addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo('/logout');
});

// ── Load Members ──
async function loadMembers() {
    const pane = document.getElementById('pane-members');
    try {
        const res = await fetch(`/api/club/${encodeURIComponent(CLUB_NAME)}/members`);
        const data = await res.json();
        if (!data.success || !data.members.length) {
            pane.innerHTML = '<div class="empty-state">No members yet.</div>';
            return;
        }
        // Group by team_type
        const groups = {};
        data.members.forEach(m => {
            if (!groups[m.team_type]) groups[m.team_type] = [];
            groups[m.team_type].push(m);
        });

        let html = '';
        for (const [team, members] of Object.entries(groups)) {
            html += `<div class="member-group">
                <h3 class="group-title">${team}</h3>
                <div class="member-cards">`;
            members.forEach(m => {
                const joined = m.joined_at ? new Date(m.joined_at).toLocaleDateString('en-IN') : '';
                html += `<div class="member-card">
                    <div class="member-avatar">${m.member_name.charAt(0)}</div>
                    <div class="member-info">
                        <h4>${m.member_name}</h4>
                        <p>${m.email}</p>
                        ${m.phone ? `<p>📞 ${m.phone}</p>` : ''}
                        <small>Joined ${joined}</small>
                    </div>
                </div>`;
            });
            html += `</div></div>`;
        }
        pane.innerHTML = html;
    } catch(e) {
        pane.innerHTML = '<div class="empty-state">Error loading members.</div>';
    }
}

// ── Load Events ──
async function loadEvents() {
    const pane = document.getElementById('pane-events');
    try {
        const res = await fetch(`/api/events?club_name=${encodeURIComponent(CLUB_NAME)}`);
        const data = await res.json();
        if (!data.success || !data.events.length) {
            pane.innerHTML = '<div class="empty-state">No events yet.</div>';
            return;
        }
        pane.innerHTML = data.events.map(e => {
            const d = e.event_date ? new Date(e.event_date).toLocaleDateString('en-IN') : '';
            return `<div class="event-card">
                <div class="event-badge">${e.event_type}</div>
                <h3>${e.event_name}</h3>
                <p>📅 ${d}</p>
            </div>`;
        }).join('');
    } catch(e) {
        pane.innerHTML = '<div class="empty-state">Error loading events.</div>';
    }
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
    setClubHeader();
    loadMembers();
});
