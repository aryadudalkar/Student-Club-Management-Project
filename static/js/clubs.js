/* clubs.js — Fetch and render club cards with live data from DB */

// ── Bfcache fix: restore page on back navigation ──
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        document.body.classList.remove('page-exit');
        document.body.classList.add('page-enter');
    }
});

// ── Progress Bar ──
function createProgressBar() {
    const bar = document.createElement('div');
    bar.id = 'progress-bar';
    document.body.appendChild(bar);
}

function startProgress() {
    const bar = document.getElementById('progress-bar') || createProgressBar();
    if (!bar) return;
    bar.style.width = '70%';
    bar.style.opacity = '1';
    setTimeout(() => { bar.style.width = '100%'; }, 200);
    setTimeout(() => { bar.style.opacity = '0'; bar.style.width = '0%'; }, 600);
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

// ── Animated Counter ──
function animateCount(element, target) {
    const duration = 800;
    const start = 0;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (target - start) * eased);
        element.textContent = current;
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
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

// Club descriptions
const CLUB_DESCRIPTIONS = {
    'Genesis': 'Innovation and entrepreneurship club fostering creative thinking and startup culture.',
    'Numerano': 'Mathematics and analytics club exploring the beauty of numbers and data science.',
    'ByteSync': 'Computer science and programming club building the next generation of tech leaders.',
    'AWS Cloud Club': 'Cloud computing club helping students master AWS services and cloud architecture.'
};

// Loading skeleton
function showLoadingSkeleton(grid) {
    grid.innerHTML = Array(4).fill(0).map(() => `
        <div class="club-card" style="pointer-events:none;">
            <div class="club-card-avatar skeleton" style="width:72px;height:72px;"></div>
            <div class="club-card-header">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-text" style="width:85%"></div>
                <div class="skeleton skeleton-text" style="width:60%"></div>
            </div>
            <div class="club-card-progress skeleton" style="height:4px;margin-top:16px;"></div>
        </div>
    `).join('');
}

// Load clubs — always fetches live from DB
async function loadClubs() {
    const grid = document.getElementById('clubsGrid');
    showLoadingSkeleton(grid);
    
    try {
        const res = await fetch('/api/clubs');
        const data = await res.json();
        if (!data.success) { 
            showToast(data.message, 'error'); 
            return; 
        }

        // Update hero stats with animation
        const totalClubs = data.clubs.length;
        const totalMembers = data.clubs.reduce((sum, c) => sum + (c.member_count || 0), 0);
        
        const heroClubsEl = document.querySelector('#heroTotalClubs .hero-stat-value');
        const heroMembersEl = document.querySelector('#heroTotalMembers .hero-stat-value');
        if (heroClubsEl) animateCount(heroClubsEl, totalClubs);
        if (heroMembersEl) animateCount(heroMembersEl, totalMembers);

        grid.innerHTML = '';
        data.clubs.forEach((club, index) => {
            const desc = CLUB_DESCRIPTIONS[club.club_name] || '';
            const memberPercentage = totalMembers > 0 ? (club.member_count / totalMembers) * 100 : 25;
            const logoSrc = club.logo || '';
            
            const card = document.createElement('div');
            card.className = 'club-card';
            card.id = `club-card-${club.club_name.replace(/\s+/g, '-').toLowerCase()}`;
            card.innerHTML = `
                <div class="club-card-avatar">
                    ${logoSrc ? `<img src="${logoSrc}" alt="${club.club_name} logo">` : '🏢'}
                </div>
                <div class="club-card-header">
                    <h2 class="club-card-name">${club.club_name}</h2>
                    ${desc ? `<p class="club-card-desc">${desc}</p>` : ''}
                    <div class="club-card-meta">
                        <span class="club-card-members">👥 ${club.member_count} members</span>
                    </div>
                </div>
                <div class="club-card-progress">
                    <div class="club-card-progress-bar" style="width: 0%"></div>
                </div>
                <div class="club-card-arrow">View Club →</div>
            `;
            
            card.addEventListener('click', () => {
                navigateTo(`/user/club/${encodeURIComponent(club.club_name)}`);
            });
            
            grid.appendChild(card);
            
            // Animate progress bar
            setTimeout(() => {
                const bar = card.querySelector('.club-card-progress-bar');
                if (bar) bar.style.width = `${memberPercentage}%`;
            }, 100 + index * 100);
        });
    } catch(err) {
        grid.innerHTML = '<div class="empty-state"><span class="empty-state-icon">😕</span><p>Failed to load clubs. Please try again.</p></div>';
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
