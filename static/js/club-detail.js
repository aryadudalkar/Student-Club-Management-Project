/* club-detail.js — Club detail page with live data */

// ── Progress Bar ──
function startProgress() {
    const bar = document.getElementById('progress-bar');
    if (!bar) return;
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

const CLUB_EMOJIS = {
    'Genesis': '🚀',
    'Numerano': '🔢',
    'ByteSync': '💻',
    'AWS Cloud Club': '☁️'
};

const CLUB_DESCRIPTIONS = {
    'Genesis': 'Innovation and entrepreneurship club fostering creative thinking and startup culture.',
    'Numerano': 'Mathematics and analytics club exploring the beauty of numbers and data science.',
    'ByteSync': 'Computer science and programming club building the next generation of tech leaders.',
    'AWS Cloud Club': 'Cloud computing club helping students master AWS services and cloud architecture.'
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
    const descEl = document.getElementById('clubDescription');
    if (descEl && CLUB_DESCRIPTIONS[CLUB_NAME]) {
        descEl.textContent = CLUB_DESCRIPTIONS[CLUB_NAME];
    }
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

// ── Load Members (grouped by team type) ──
async function loadMembers() {
    const pane = document.getElementById('pane-members');
    pane.innerHTML = '<div class="tab-panel-loading"><div class="clubs-loading-spinner"></div><p>Loading members...</p></div>';
    
    try {
        const res = await fetch(`/api/club/${encodeURIComponent(CLUB_NAME)}/members`);
        const data = await res.json();
        
        if (!data.success || !data.members || data.members.length === 0) {
            pane.innerHTML = '<div class="empty-state"><span class="empty-state-icon">👥</span><p>No members yet.</p></div>';
            document.getElementById('memberStat').textContent = '0 members';
            return;
        }

        // Update stat
        document.getElementById('memberStat').textContent = `${data.members.length} members`;

        // Group by team_type
        const groups = {};
        data.members.forEach(m => {
            const team = m.team_type || 'General';
            if (!groups[team]) groups[team] = [];
            groups[team].push(m);
        });

        let html = '';
        for (const [team, members] of Object.entries(groups)) {
            html += `<div class="member-group">
                <h3 class="group-title">${team}</h3>
                <div class="member-cards">`;
            members.forEach(m => {
                const initial = m.member_name ? m.member_name.charAt(0).toUpperCase() : '?';
                const joined = m.joined_at ? new Date(m.joined_at).toLocaleDateString('en-IN') : '';
                html += `<div class="member-card">
                    <div class="member-avatar">${initial}</div>
                    <div class="member-info">
                        <h4>${m.member_name}</h4>
                        <p>${m.email || ''}</p>
                        ${m.phone ? `<p>📞 ${m.phone}</p>` : ''}
                        ${joined ? `<small>Joined ${joined}</small>` : ''}
                    </div>
                </div>`;
            });
            html += `</div></div>`;
        }
        pane.innerHTML = html;
    } catch(e) {
        pane.innerHTML = '<div class="empty-state"><span class="empty-state-icon">⚠️</span><p>Error loading members.</p></div>';
    }
}

// ── Load Events ──
async function loadEvents() {
    const pane = document.getElementById('pane-events');
    pane.innerHTML = '<div class="tab-panel-loading"><div class="clubs-loading-spinner"></div><p>Loading events...</p></div>';
    
    try {
        const res = await fetch(`/api/events?club_name=${encodeURIComponent(CLUB_NAME)}`);
        const data = await res.json();
        
        if (!data.success || !data.events || data.events.length === 0) {
            pane.innerHTML = '<div class="empty-state"><span class="empty-state-icon">📅</span><p>No events scheduled yet.</p></div>';
            document.getElementById('eventStat').textContent = '0 events';
            return;
        }

        // Update stat
        document.getElementById('eventStat').textContent = `${data.events.length} events`;

        let html = '';
        data.events.forEach(event => {
            const d = event.event_date ? new Date(event.event_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
            const typeClass = EVENT_TYPE_COLORS[event.event_type] || 'event-type-technical';
            html += `<div class="event-card">
                <div class="event-card-header">
                    <span class="event-date-badge">📅 ${d}</span>
                    <span class="event-type-badge ${typeClass}">${event.event_type}</span>
                </div>
                <h3>${event.event_name}</h3>
                ${event.description ? `<p class="event-card-description">${event.description}</p>` : ''}
            </div>`;
        });
        pane.innerHTML = html;
    } catch(e) {
        pane.innerHTML = '<div class="empty-state"><span class="empty-state-icon">⚠️</span><p>Error loading events.</p></div>';
    }
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('page-enter');
    setClubHeader();
    setupTabSwitching();
    loadMembers();
});

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
