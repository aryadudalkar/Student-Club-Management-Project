from flask import Flask, render_template, request, jsonify, session, redirect, g
from werkzeug.security import generate_password_hash, check_password_hash
from models import init_db, get_db, close_db
from config import SECRET_KEY, CLUB_SECRET_KEYS
from datetime import datetime
import psycopg2.extras

app = Flask(__name__)
app.secret_key = SECRET_KEY
app.teardown_appcontext(close_db)

with app.app_context():
    init_db()

# ── Mapping: club_name → table name ──
TABLE_MAP = {
    'Genesis': 'genesis_members',
    'Numerano': 'numerano_members',
    'ByteSync': 'bytesync_members',
    'AWS Cloud Club': 'awscloudclub_members'
}

CLUB_EMOJIS = {
    'Genesis': '🚀',
    'Numerano': '🔢',
    'ByteSync': '💻',
    'AWS Cloud Club': '☁️'
}

# ────────────────────────── Page Routes ──────────────────────────

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/user/clubs')
def user_clubs():
    if 'user_id' not in session or session.get('role') != 'user':
        return redirect('/')
    return render_template('clubs.html')

@app.route('/user/club/<club_name>')
def user_club_detail(club_name):
    if 'user_id' not in session or session.get('role') != 'user':
        return redirect('/')
    return render_template('club_detail.html', club_name=club_name)

@app.route('/admin/signup')
def admin_signup_page():
    return render_template('admin_signup.html')

@app.route('/admin/login')
def admin_login_page():
    return render_template('admin_login.html')

@app.route('/admin/dashboard')
def admin_dashboard():
    if not session.get('admin_authenticated'):
        return redirect('/admin/login')
    return render_template('admin_dashboard.html',
                           club_name=session.get('admin_club_name'))

@app.route('/logout')
def logout():
    session.clear()
    return redirect('/')

# ────────────────────────── User API Routes ──────────────────────────

@app.route('/api/signup', methods=['POST'])
def api_signup():
    data = request.get_json()
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    phone = data.get('phone', '').strip()
    password = data.get('password', '')

    if not username or not email or not password:
        return jsonify({'success': False, 'message': 'Username, email, and password are required.'}), 400

    db = get_db()
    cur = db.cursor()
    try:
        cur.execute("SELECT user_id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            return jsonify({'success': False, 'message': 'Email already registered.'}), 409

        pw_hash = generate_password_hash(password)
        cur.execute(
            "INSERT INTO users (username, email, phone, password_hash) VALUES (%s, %s, %s, %s) RETURNING user_id",
            (username, email, phone or None, pw_hash)
        )
        user_id = cur.fetchone()[0]
        db.commit()
        return jsonify({'success': True, 'message': 'Account created successfully!', 'user_id': user_id})
    except Exception as e:
        db.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cur.close()


@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json()
    email = data.get('email', '').strip()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'success': False, 'message': 'Email and password are required.'}), 400

    db = get_db()
    cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        if not user or not check_password_hash(user['password_hash'], password):
            return jsonify({'success': False, 'message': 'Invalid email or password.'}), 401

        session['user_id'] = user['user_id']
        session['user_name'] = user['username']
        session['role'] = 'user'
        return jsonify({'success': True, 'message': 'Login successful!',
                        'user_id': user['user_id'], 'user_name': user['username']})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cur.close()


# ────────────────────────── Admin API Routes ──────────────────────────

@app.route('/api/admin/signup', methods=['POST'])
def api_admin_signup():
    data = request.get_json()
    admin_name = data.get('admin_name', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    club_name = data.get('club_name', '').strip()
    secret_key = data.get('secret_key', '').strip()

    if not admin_name or not email or not password or not club_name:
        return jsonify({'success': False, 'message': 'All fields are required.'}), 400

    if club_name not in TABLE_MAP:
        return jsonify({'success': False, 'message': 'Invalid club name.'}), 400

    if CLUB_SECRET_KEYS.get(club_name) != secret_key:
        return jsonify({'success': False, 'message': 'Invalid secret key for this club'}), 403

    db = get_db()
    cur = db.cursor()
    try:
        cur.execute("SELECT admin_id FROM admins WHERE email = %s", (email,))
        if cur.fetchone():
            return jsonify({'success': False, 'message': 'Email already registered as admin.'}), 409

        pw_hash = generate_password_hash(password)
        cur.execute(
            "INSERT INTO admins (admin_name, email, password_hash, club_name) VALUES (%s, %s, %s, %s) RETURNING admin_id",
            (admin_name, email, pw_hash, club_name)
        )
        admin_id = cur.fetchone()[0]
        db.commit()
        return jsonify({'success': True, 'message': 'Admin account created!', 'admin_id': admin_id})
    except Exception as e:
        db.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cur.close()


@app.route('/api/admin/login', methods=['POST'])
def api_admin_login():
    data = request.get_json()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    club_name = data.get('club_name', '').strip()
    secret_key = data.get('secret_key', '').strip()

    if not email or not password:
        return jsonify({'success': False, 'message': 'Email and password are required.'}), 400

    if club_name and CLUB_SECRET_KEYS.get(club_name) != secret_key:
        return jsonify({'success': False, 'message': 'Invalid secret key for this club'}), 403

    db = get_db()
    cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute("SELECT * FROM admins WHERE email = %s", (email,))
        admin = cur.fetchone()
        if not admin or not check_password_hash(admin['password_hash'], password):
            return jsonify({'success': False, 'message': 'Invalid email or password.'}), 401

        session['admin_authenticated'] = True
        session['admin_id'] = admin['admin_id']
        session['admin_name'] = admin['admin_name']
        session['admin_club_name'] = admin['club_name']
        session['role'] = 'admin'
        return jsonify({'success': True, 'message': 'Admin login successful!',
                        'admin_name': admin['admin_name'], 'club_name': admin['club_name']})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cur.close()


# ────────────────────────── Data API Routes ──────────────────────────

@app.route('/api/clubs', methods=['GET'])
def api_clubs():
    db = get_db()
    cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute('SELECT club_id, club_name, member_count FROM clubs ORDER BY club_id')
        clubs = cur.fetchall()
        # Add emojis for frontend
        for c in clubs:
            c['emoji'] = CLUB_EMOJIS.get(c['club_name'], '🏢')
        return jsonify({'success': True, 'clubs': clubs})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cur.close()


@app.route('/api/club/<club_name>/members', methods=['GET'])
def api_club_members(club_name):
    if club_name not in TABLE_MAP:
        return jsonify({'success': False, 'message': 'Invalid club name.'}), 404

    table = TABLE_MAP[club_name]
    db = get_db()
    cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute(f'SELECT * FROM {table} ORDER BY team_type, member_name')
        members = cur.fetchall()
        for m in members:
            if m.get('joined_at'):
                m['joined_at'] = m['joined_at'].isoformat()
        return jsonify({'success': True, 'members': members, 'club_name': club_name})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cur.close()


@app.route('/api/events', methods=['GET'])
def api_events():
    db = get_db()
    cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        club_name = request.args.get('club_name')
        if club_name:
            cur.execute('SELECT * FROM events WHERE club_name = %s ORDER BY event_date DESC', (club_name,))
        else:
            cur.execute('SELECT * FROM events ORDER BY event_date DESC')
        events = cur.fetchall()
        for e in events:
            if e.get('event_date'):
                e['event_date'] = e['event_date'].isoformat()
            if e.get('created_at'):
                e['created_at'] = e['created_at'].isoformat()
        return jsonify({'success': True, 'events': events})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cur.close()


@app.route('/api/admin/list', methods=['GET'])
def api_admin_list():
    db = get_db()
    cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute('SELECT admin_id, admin_name, email, club_name, created_at FROM admins ORDER BY created_at DESC')
        admins = cur.fetchall()
        for a in admins:
            if a.get('created_at'):
                a['created_at'] = a['created_at'].isoformat()
        return jsonify({'success': True, 'admins': admins})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cur.close()


# ────────────────────────── Admin CRUD Routes ──────────────────────────

@app.route('/api/admin/member/add', methods=['POST'])
def api_admin_add_member():
    if not session.get('admin_authenticated'):
        return jsonify({'success': False, 'message': 'Not authorized.'}), 403

    data = request.get_json()
    member_name = data.get('member_name', '').strip()
    team_type = data.get('team_type', '').strip()
    email = data.get('email', '').strip()
    phone = data.get('phone', '').strip()
    club_name = data.get('club_name', '').strip()

    if not member_name or not team_type or not email or not club_name:
        return jsonify({'success': False, 'message': 'Name, team type, email, and club are required.'}), 400

    if club_name not in TABLE_MAP:
        return jsonify({'success': False, 'message': 'Invalid club name.'}), 400

    table = TABLE_MAP[club_name]
    db = get_db()
    cur = db.cursor()
    try:
        cur.execute(f"SELECT member_id FROM {table} WHERE email = %s", (email,))
        if cur.fetchone():
            return jsonify({'success': False, 'message': 'Email already registered in this club.'}), 409

        cur.execute(f"""
            INSERT INTO {table} (member_name, team_type, email, phone)
            VALUES (%s, %s, %s, %s)
        """, (member_name, team_type, email, phone or None))
        db.commit()
        return jsonify({'success': True, 'message': f'{member_name} added to {club_name}!'})
    except Exception as e:
        db.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cur.close()


@app.route('/api/admin/member/remove', methods=['POST'])
def api_admin_remove_member():
    if not session.get('admin_authenticated'):
        return jsonify({'success': False, 'message': 'Not authorized.'}), 403

    data = request.get_json()
    member_id = data.get('member_id')
    club_name = data.get('club_name', '').strip()

    if not member_id or not club_name:
        return jsonify({'success': False, 'message': 'Member ID and club name are required.'}), 400

    if club_name not in TABLE_MAP:
        return jsonify({'success': False, 'message': 'Invalid club name.'}), 400

    table = TABLE_MAP[club_name]
    db = get_db()
    cur = db.cursor()
    try:
        cur.execute(f"DELETE FROM {table} WHERE member_id = %s", (member_id,))
        if cur.rowcount == 0:
            return jsonify({'success': False, 'message': 'Member not found.'}), 404
        db.commit()
        return jsonify({'success': True, 'message': 'Member removed.'})
    except Exception as e:
        db.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cur.close()


@app.route('/api/admin/event/add', methods=['POST'])
def api_admin_add_event():
    if not session.get('admin_authenticated'):
        return jsonify({'success': False, 'message': 'Not authorized.'}), 403

    data = request.get_json()
    event_name = data.get('event_name', '').strip()
    event_date = data.get('event_date')
    event_type = data.get('event_type', '').strip()
    club_name = data.get('club_name', '').strip()

    if not event_name or not event_date or not event_type or not club_name:
        return jsonify({'success': False, 'message': 'All event fields are required.'}), 400

    db = get_db()
    cur = db.cursor()
    try:
        cur.execute(
            "INSERT INTO events (event_name, event_date, event_type, club_name) VALUES (%s, %s, %s, %s)",
            (event_name, event_date, event_type, club_name)
        )
        db.commit()
        return jsonify({'success': True, 'message': 'Event added!'})
    except Exception as e:
        db.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cur.close()


@app.route('/api/session', methods=['GET'])
def api_session():
    """Return current session info for the frontend."""
    return jsonify({
        'success': True,
        'user_id': session.get('user_id'),
        'user_name': session.get('user_name'),
        'role': session.get('role'),
        'admin_id': session.get('admin_id'),
        'admin_club_name': session.get('admin_club_name'),
        'admin_name': session.get('admin_name'),
    })


@app.route('/api/users/count', methods=['GET'])
def api_user_count():
    """Return total user count for dashboards."""
    db = get_db()
    cur = db.cursor()
    try:
        cur.execute("SELECT COUNT(*) FROM users")
        count = cur.fetchone()[0]
        return jsonify({'success': True, 'count': count})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cur.close()


if __name__ == '__main__':
    app.run(debug=True, port=5000)
