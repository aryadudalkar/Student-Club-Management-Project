/* auth.js — Login / Signup logic with page transitions */

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

// Initialize page enter animation
document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('page-enter');
    if (!document.getElementById('progress-bar')) {
        createProgressBar();
    }
});

// ── Role Toggle (User / Admin) ──
const roleToggle = document.getElementById('roleToggle');
const roleBtns = roleToggle.querySelectorAll('.role-btn');
const userContainer = document.getElementById('userAuthContainer');
const adminContainer = document.getElementById('adminAuthContainer');

roleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        roleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const role = btn.dataset.role;
        if (role === 'user') {
            roleToggle.classList.remove('admin-mode');
            userContainer.classList.add('active');
            adminContainer.classList.remove('active');
        } else {
            roleToggle.classList.add('admin-mode');
            adminContainer.classList.add('active');
            userContainer.classList.remove('active');
        }
    });
});

// ── Form Toggle (Login / Signup) ──
const toggleBtns = document.querySelectorAll('.toggle-btn');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        toggleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (btn.dataset.form === 'login') {
            loginForm.classList.add('active');
            signupForm.classList.remove('active');
        } else {
            signupForm.classList.add('active');
            loginForm.classList.remove('active');
        }
    });
});

// ── Login ──
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        showToast('Please fill in all fields.', 'error');
        return;
    }

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Login successful! Redirecting...', 'success');
            setTimeout(() => navigateTo('/user/clubs'), 600);
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast('Connection error. Please try again.', 'error');
    }
});

// ── Signup ──
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const phone = document.getElementById('signup-phone').value.trim();
    const password = document.getElementById('signup-password').value;

    if (!username || !email || !password) {
        showToast('Please fill in all required fields.', 'error');
        return;
    }

    try {
        const res = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, phone, password })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Account created! Please log in.', 'success');
            // Switch to login form
            setTimeout(() => {
                toggleBtns[0].click();
                document.getElementById('login-email').value = email;
                document.getElementById('login-email').focus();
            }, 600);
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast('Connection error. Please try again.', 'error');
    }
});
