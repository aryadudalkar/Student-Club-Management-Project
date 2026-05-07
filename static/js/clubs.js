/* clubs.js — Fetch and render club cards with live data from DB */

// ── Progress Bar ──
function createProgressBar() {
    const bar = document.createElement('div');
    bar.id = 'progress-bar';
    bar.style.cssText = 'position:fixed;top:0;left:0;height:3px;width:0%;background:linear-gradient(90deg,var(--blue),var(--pink));border-radius:0 3px 3px 0;z-index:10000;transition:width 0.3s var(--ease);pointer-events:none;';
    document.body.appendChild(bar);
}

function startProgress() {
    const bar = document.getElementById('progress-bar') || createProgressBar();
    bar.style.width = '70%';
    bar.style.opacity = '1';
    setTimeout(() => { bar.style.width = '100%'; }, 200);
    setTimeout(() => { bar.style.opacity = '0'; }, 600);
}

// ── Navigation with Transitions ──
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
    if (!document.getElementById('progress-bar')) {
        createProgressBar();
    }
    
    // Set greeting
    fetch('/api/session')
        .then(r => r.json())
        .then(d => {
            if (d.user_name) {
                document.getElementById('userGreeting').textContent = `Hello, ${d.user_name}`;
            }
        })
        .catch(() => {});
    
    loadClubs();
});

// Club descriptions (static since removed from DB)
const CLUB_DESCRIPTIONS = {
    'Genesis': 'Innovation and entrepreneurship club fostering creative thinking and startup culture.',
    'Numerano': 'Mathematics and analytics club exploring the beauty of numbers and data science.',
    'ByteSync': 'Computer science and programming club building the next generation of tech leaders.',
    'AWS Cloud Club': 'Cloud computing club helping students master AWS services and cloud architecture.'
};

// Load clubs — always fetches live from DB
async function loadClubs() {
    const grid = document.getElementById('clubsGrid');
    try {
        const res = await fetch('/api/clubs');
        const data = await res.json();
        if (!data.success) { 
            showToast(data.message, 'error'); 
            return; 
        }

        grid.innerHTML = '';
        data.clubs.forEach((club, index) => {
            const desc = CLUB_DESCRIPTIONS[club.club_name] || '';
            const totalMembers = data.clubs.reduce((sum, c) => sum + (c.member_count || 0), 0);
            const memberPercentage = totalMembers > 0 ? (club.member_count / totalMembers) * 100 : 25;
            
            const card = document.createElement('div');
            card.className = 'club-card';
            card.id = `club-card-${club.club_name.replace(/\s+/g, '-').toLowerCase()}`;
            card.innerHTML = `
                <div class="club-card-avatar">${club.emoji}</div>
                <div class="club-card-header">
                    <h2 class="club-card-name">${club.club_name}</h2>
                    <div class="club-card-meta">
                        <span class="club-card-members">${club.member_count} members</span>
                    </div>
                </div>
                <div class="club-card-progress">
                    <div class="club-card-progress-bar" style="width: ${memberPercentage}%"></div>
                </div>
            `;
            
            card.addEventListener('click', () => {
                navigateTo(`/user/club/${encodeURIComponent(club.club_name)}`);
            });
            
            grid.appendChild(card);
        });
    } catch(err) {
        showToast('Failed to load clubs.', 'error');
    }
}

// Logout button
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('/logout');
        });
    }
});
