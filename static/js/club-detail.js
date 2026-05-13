/* club-detail.js — Scrolling club dashboard with all sections */

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
    const dur = 700, st = performance.now();
    function up(t) {
        const p = Math.min((t - st) / dur, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(up);
    }
    requestAnimationFrame(up);
}

// ── Club Data Maps ──
const CLUB_LOGOS = {
    'Genesis': '/static/images/clubs/genesis.png',
    'Numerano': '/static/images/clubs/numerano.jpeg',
    'ByteSync': '/static/images/clubs/bytesync.jpeg',
    'AWS Cloud Club': '/static/images/clubs/aws-cloud-club.png'
};

const CLUB_TAGLINES = {
    'Genesis': 'Where Ideas Take Flight',
    'Numerano': 'The Power of Numbers',
    'ByteSync': 'Code. Build. Innovate.',
    'AWS Cloud Club': 'Building on the Cloud'
};

const CLUB_ABOUT = {
    'Genesis': {
        mission: 'Genesis is the innovation and entrepreneurship club that empowers students to transform bold ideas into reality. We foster a culture of creative problem-solving, design thinking, and startup mentality.',
        vision: 'To become the leading student-run innovation hub that bridges the gap between academic learning and real-world entrepreneurial success.',
        whatWeDo: 'We organize hackathons, design sprints, startup bootcamps, and mentorship programs. Our members get hands-on experience with product development, UI/UX design, and pitch presentations.',
        founded: '2021',
        meetingDay: 'Every Saturday, 3:00 PM',
        location: 'Innovation Lab, Block C'
    },
    'Numerano': {
        mission: 'Numerano is the mathematics and analytics club dedicated to exploring the beauty and power of numbers. We make math accessible, exciting, and applicable to real-world problems.',
        vision: 'To cultivate a community of analytical thinkers who leverage mathematical concepts to drive innovation in data science, AI, and beyond.',
        whatWeDo: 'We host math olympiads, data analysis workshops, research paper discussions, and collaborative problem-solving sessions. Members explore topics from pure mathematics to applied statistics.',
        founded: '2020',
        meetingDay: 'Every Wednesday, 4:00 PM',
        location: 'Seminar Hall, Block A'
    },
    'ByteSync': {
        mission: 'ByteSync is the computer science and programming club building the next generation of tech leaders. We believe in learning by doing and open source contribution.',
        vision: 'To create a thriving ecosystem of developers who contribute to open source, build impactful projects, and push the boundaries of technology.',
        whatWeDo: 'We run code relays, open source contribution drives, web development bootcamps, and competitive programming contests. Our members build real projects and contribute to the developer community.',
        founded: '2022',
        meetingDay: 'Every Friday, 5:00 PM',
        location: 'Computer Lab 3, Block B'
    },
    'AWS Cloud Club': {
        mission: 'AWS Cloud Club helps students master cloud computing and AWS services. We provide hands-on experience with industry-standard cloud tools and architectures.',
        vision: 'To prepare students for cloud-first careers by providing practical experience with AWS services, certifications, and real-world cloud architecture design.',
        whatWeDo: 'We organize cloud quest challenges, AWS certification study groups, hands-on labs, and watch parties for AWS events like re:Invent. Members build and deploy real applications on AWS.',
        founded: '2023',
        meetingDay: 'Every Thursday, 4:30 PM',
        location: 'Tech Hub, Block D'
    }
};

const CLUB_CONTACT = {
    'Genesis': { email: 'genesis.club@college.edu', instagram: '@genesis_college', phone: '+91 98765 43210', website: 'genesis.college.edu' },
    'Numerano': { email: 'numerano.club@college.edu', instagram: '@numerano_official', phone: '+91 98765 43220', website: 'numerano.college.edu' },
    'ByteSync': { email: 'bytesync.club@college.edu', instagram: '@bytesync_dev', phone: '+91 98765 43230', website: 'bytesync.college.edu' },
    'AWS Cloud Club': { email: 'awscloud.club@college.edu', instagram: '@aws_cloud_college', phone: '+91 98765 43240', website: 'awscloud.college.edu' }
};

// ── Setup header ──
function setupHeader() {
    const logo = CLUB_LOGOS[CLUB_NAME];
    const navLogo = document.getElementById('navbarLogo');
    if (logo) navLogo.innerHTML = `<img src="${logo}" alt="${CLUB_NAME}">`;
    document.getElementById('navbarName').textContent = CLUB_NAME;

    const avatar = document.getElementById('clubAvatar');
    if (logo) avatar.innerHTML = `<img src="${logo}" alt="${CLUB_NAME} logo">`;
    document.getElementById('clubName').textContent = CLUB_NAME;
    document.getElementById('clubTagline').textContent = CLUB_TAGLINES[CLUB_NAME] || '';
    document.getElementById('aboutClubName').textContent = CLUB_NAME;

    const about = CLUB_ABOUT[CLUB_NAME];
    if (about) {
        document.getElementById('clubDescription').textContent = about.mission;
    }
}

// ── Smooth scroll nav highlighting ──
function setupScrollSpy() {
    const links = document.querySelectorAll('.club-nav-link');
    const sections = document.querySelectorAll('.club-section, .club-hero');

    // Click handling
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.getElementById(link.dataset.section);
            if (target) {
                const offset = 72;
                const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });

    // Scroll spy
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                links.forEach(l => l.classList.toggle('active', l.dataset.section === id));
            }
        });
    }, { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 });

    sections.forEach(s => { if (s.id) observer.observe(s); });
}

// ── Scroll reveal ──
function setupReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ── About Section ──
function renderAbout() {
    const about = CLUB_ABOUT[CLUB_NAME];
    if (!about) return;
    const container = document.getElementById('aboutContent');
    container.innerHTML = `
        <div class="about-card reveal">
            <div class="about-card-icon">🎯</div>
            <h3>Our Mission</h3>
            <p>${about.mission}</p>
        </div>
        <div class="about-card reveal reveal-delay-1">
            <div class="about-card-icon">🔭</div>
            <h3>Our Vision</h3>
            <p>${about.vision}</p>
        </div>
        <div class="about-card reveal reveal-delay-2">
            <div class="about-card-icon">⚡</div>
            <h3>What We Do</h3>
            <p>${about.whatWeDo}</p>
        </div>
        <div class="about-info-row reveal reveal-delay-3">
            <div class="about-info-chip"><span class="about-info-label">Founded</span><span class="about-info-value">${about.founded}</span></div>
            <div class="about-info-chip"><span class="about-info-label">Meetings</span><span class="about-info-value">${about.meetingDay}</span></div>
            <div class="about-info-chip"><span class="about-info-label">Location</span><span class="about-info-value">${about.location}</span></div>
        </div>
    `;
}

// ── Events ──
async function loadEvents() {
    const container = document.getElementById('eventsContent');
    try {
        const res = await fetch(`/api/events?club_name=${encodeURIComponent(CLUB_NAME)}`);
        const data = await res.json();
        if (!data.success || !data.events || data.events.length === 0) {
            container.innerHTML = '<div class="empty-state"><span class="empty-state-icon">📅</span><p>No events recorded yet.</p></div>';
            return;
        }
        animateCount(document.getElementById('heroEvents'), data.events.length);
        let html = '';
        data.events.forEach((e, i) => {
            const d = e.event_date ? new Date(e.event_date).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' }) : '';
            html += `<div class="event-timeline-item reveal" style="transition-delay:${i * 0.08}s">
                <div class="event-card">
                    <div class="event-card-header">
                        <span class="event-date-badge">${d}</span>
                        <span class="event-type-badge event-type-${e.event_type.toLowerCase()}">${e.event_type}</span>
                    </div>
                    <h3>${e.event_name}</h3>
                </div>
            </div>`;
        });
        container.innerHTML = html;
        setupReveal();
    } catch(err) {
        container.innerHTML = '<div class="empty-state"><span class="empty-state-icon">⚠️</span><p>Error loading events.</p></div>';
    }
}

// ── Achievements ──
async function loadAchievements() {
    const container = document.getElementById('achievementsContent');
    try {
        const res = await fetch(`/api/club/${encodeURIComponent(CLUB_NAME)}/achievements`);
        const data = await res.json();
        if (!data.success || !data.achievements || data.achievements.length === 0) {
            container.innerHTML = '<div class="empty-state"><span class="empty-state-icon">🏆</span><p>No achievements yet.</p></div>';
            return;
        }
        animateCount(document.getElementById('heroAchievements'), data.achievements.length);
        let html = '';
        data.achievements.forEach((a, i) => {
            const d = a.achievement_date ? new Date(a.achievement_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
            html += `<div class="achievement-card reveal" style="transition-delay:${i * 0.08}s">
                <div class="achievement-icon">🏆</div>
                <div class="achievement-info">
                    <h4>${a.title}</h4>
                    ${a.description ? `<p>${a.description}</p>` : ''}
                    ${d ? `<span class="achievement-date">📅 ${d}</span>` : ''}
                </div>
            </div>`;
        });
        container.innerHTML = html;
        setupReveal();
    } catch(err) {
        container.innerHTML = '<div class="empty-state"><span class="empty-state-icon">⚠️</span><p>Error loading achievements.</p></div>';
    }
}

// ── Members ──
async function loadMembers() {
    const container = document.getElementById('membersContent');
    try {
        const res = await fetch(`/api/club/${encodeURIComponent(CLUB_NAME)}/members`);
        const data = await res.json();
        if (!data.success || !data.members || data.members.length === 0) {
            container.innerHTML = '<div class="empty-state"><span class="empty-state-icon">👥</span><p>No members yet.</p></div>';
            return;
        }
        animateCount(document.getElementById('heroMembers'), data.members.length);
        const groups = {};
        data.members.forEach(m => {
            const team = m.team_type || 'General';
            if (!groups[team]) groups[team] = [];
            groups[team].push(m);
        });
        let html = '';
        let delay = 0;
        for (const [team, members] of Object.entries(groups)) {
            html += `<div class="member-group"><h3 class="group-title">${team}</h3><div class="member-cards">`;
            members.forEach(m => {
                const initial = m.member_name ? m.member_name.charAt(0).toUpperCase() : '?';
                html += `<div class="member-card reveal" style="transition-delay:${delay * 0.06}s">
                    <div class="member-avatar">${initial}</div>
                    <div class="member-info">
                        <h4>${m.member_name}</h4>
                        <p>${m.email || ''}</p>
                        ${m.phone ? `<p class="member-phone">📞 ${m.phone}</p>` : ''}
                    </div>
                </div>`;
                delay++;
            });
            html += '</div></div>';
        }
        container.innerHTML = html;
        setupReveal();
    } catch(err) {
        container.innerHTML = '<div class="empty-state"><span class="empty-state-icon">⚠️</span><p>Error loading members.</p></div>';
    }
}

// ── Faculty ──
async function loadFaculty() {
    const container = document.getElementById('facultyContent');
    try {
        const res = await fetch(`/api/club/${encodeURIComponent(CLUB_NAME)}/faculty`);
        const data = await res.json();
        if (!data.success || !data.faculty || data.faculty.length === 0) {
            container.innerHTML = '<div class="empty-state"><span class="empty-state-icon">🎓</span><p>No faculty coordinators assigned yet.</p></div>';
            return;
        }
        let html = '';
        data.faculty.forEach((f, i) => {
            const initial = f.coordinator_name ? f.coordinator_name.charAt(0).toUpperCase() : '?';
            html += `<div class="faculty-card reveal" style="transition-delay:${i * 0.1}s">
                <div class="faculty-avatar">${initial}</div>
                <div class="faculty-info">
                    <h4>${f.coordinator_name}</h4>
                    ${f.designation ? `<p class="faculty-designation">${f.designation}</p>` : ''}
                    ${f.email ? `<p>✉️ ${f.email}</p>` : ''}
                    ${f.phone ? `<p>📞 ${f.phone}</p>` : ''}
                </div>
            </div>`;
        });
        container.innerHTML = html;
        setupReveal();
    } catch(err) {
        container.innerHTML = '<div class="empty-state"><span class="empty-state-icon">⚠️</span><p>Error loading faculty.</p></div>';
    }
}

// ── Contact ──
function renderContact() {
    const contact = CLUB_CONTACT[CLUB_NAME];
    if (!contact) return;
    const container = document.getElementById('contactContent');
    container.innerHTML = `
        <div class="contact-card reveal">
            <div class="contact-icon">✉️</div>
            <h4>Email</h4>
            <p>${contact.email}</p>
        </div>
        <div class="contact-card reveal reveal-delay-1">
            <div class="contact-icon">📸</div>
            <h4>Instagram</h4>
            <p>${contact.instagram}</p>
        </div>
        <div class="contact-card reveal reveal-delay-2">
            <div class="contact-icon">📞</div>
            <h4>Phone</h4>
            <p>${contact.phone}</p>
        </div>
        <div class="contact-card reveal reveal-delay-3">
            <div class="contact-icon">🌐</div>
            <h4>Website</h4>
            <p>${contact.website}</p>
        </div>
    `;
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('page-enter');
    setupHeader();
    setupScrollSpy();
    renderAbout();
    renderContact();
    setupReveal();
    loadEvents();
    loadAchievements();
    loadMembers();
    loadFaculty();
});

document.getElementById('nav-back').addEventListener('click', (e) => {
    e.preventDefault(); navigateTo('/user/clubs');
});
document.getElementById('btn-logout').addEventListener('click', (e) => {
    e.preventDefault(); navigateTo('/logout');
});
