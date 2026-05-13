import psycopg2
import psycopg2.pool
import psycopg2.extras
from werkzeug.security import generate_password_hash
from flask import g
from config import DATABASE_URL, DB_POOL_MIN, DB_POOL_MAX
from datetime import datetime, date

db_pool = None


def create_database():
    """Create the club_management database if it doesn't exist."""
    base_url = DATABASE_URL.rsplit('/', 1)[0] + '/postgres'
    conn = psycopg2.connect(base_url)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM pg_database WHERE datname = 'club_management'")
    if not cur.fetchone():
        cur.execute("CREATE DATABASE club_management")
        print("[DB] Database 'club_management' created.")
    else:
        print("[DB] Database 'club_management' already exists.")
    cur.close()
    conn.close()


def init_pool():
    global db_pool
    if db_pool is None:
        db_pool = psycopg2.pool.ThreadedConnectionPool(
            DB_POOL_MIN, DB_POOL_MAX, DATABASE_URL
        )


def get_db():
    if 'db' not in g:
        if db_pool is None:
            init_pool()
        g.db = db_pool.getconn()
    return g.db


def close_db(e=None):
    db = g.pop('db', None)
    if db is not None and db_pool is not None:
        db_pool.putconn(db)


def drop_all_tables(conn):
    """Drop all old tables to start fresh. Comment out after first run."""
    cur = conn.cursor()
    cur.execute("""
        DROP TABLE IF EXISTS submissions, admins, achievements, announcements,
        events, members, subclubs, users, clubs,
        genesis_members, numerano_members, bytesync_members, awscloudclub_members,
        faculty_coordinators
        CASCADE;
    """)
    # Drop old trigger function if exists
    cur.execute("DROP FUNCTION IF EXISTS update_club_member_count() CASCADE;")
    conn.commit()
    cur.close()
    print("[DB] All old tables dropped.")


def init_db():
    """Create all tables, triggers, and seed data on first run."""
    create_database()
    init_pool()
    conn = db_pool.getconn()
    try:
        # ── PART 1: Drop old tables (uncomment to reset schema) ──
        # drop_all_tables(conn)

        cur = conn.cursor()

        # ── PART 2: Create new tables ──

        # Table 1: admins
        cur.execute('''
            CREATE TABLE IF NOT EXISTS admins (
                admin_id      SERIAL PRIMARY KEY,
                admin_name    VARCHAR(100) NOT NULL,
                email         VARCHAR(150) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                club_name     VARCHAR(100) NOT NULL,
                created_at    TIMESTAMP DEFAULT NOW()
            )
        ''')

        # Table 2: users
        cur.execute('''
            CREATE TABLE IF NOT EXISTS users (
                user_id       SERIAL PRIMARY KEY,
                username      VARCHAR(100) NOT NULL,
                email         VARCHAR(150) UNIQUE NOT NULL,
                phone         VARCHAR(15),
                password_hash VARCHAR(255) NOT NULL,
                created_at    TIMESTAMP DEFAULT NOW()
            )
        ''')

        # Table 3: clubs
        cur.execute('''
            CREATE TABLE IF NOT EXISTS clubs (
                club_id       SERIAL PRIMARY KEY,
                club_name     VARCHAR(100) UNIQUE NOT NULL,
                member_count  INT DEFAULT 0
            )
        ''')

        # Tables 4-7: Four subclub member tables
        cur.execute('''
            CREATE TABLE IF NOT EXISTS genesis_members (
                member_id    SERIAL PRIMARY KEY,
                member_name  VARCHAR(100) NOT NULL,
                team_type    VARCHAR(50) NOT NULL,
                email        VARCHAR(150) UNIQUE NOT NULL,
                phone        VARCHAR(15),
                joined_at    TIMESTAMP DEFAULT NOW()
            )
        ''')

        cur.execute('''
            CREATE TABLE IF NOT EXISTS numerano_members (
                member_id    SERIAL PRIMARY KEY,
                member_name  VARCHAR(100) NOT NULL,
                team_type    VARCHAR(50) NOT NULL,
                email        VARCHAR(150) UNIQUE NOT NULL,
                phone        VARCHAR(15),
                joined_at    TIMESTAMP DEFAULT NOW()
            )
        ''')

        cur.execute('''
            CREATE TABLE IF NOT EXISTS bytesync_members (
                member_id    SERIAL PRIMARY KEY,
                member_name  VARCHAR(100) NOT NULL,
                team_type    VARCHAR(50) NOT NULL,
                email        VARCHAR(150) UNIQUE NOT NULL,
                phone        VARCHAR(15),
                joined_at    TIMESTAMP DEFAULT NOW()
            )
        ''')

        cur.execute('''
            CREATE TABLE IF NOT EXISTS awscloudclub_members (
                member_id    SERIAL PRIMARY KEY,
                member_name  VARCHAR(100) NOT NULL,
                team_type    VARCHAR(50) NOT NULL,
                email        VARCHAR(150) UNIQUE NOT NULL,
                phone        VARCHAR(15),
                joined_at    TIMESTAMP DEFAULT NOW()
            )
        ''')

        # Table 8: events
        cur.execute('''
            CREATE TABLE IF NOT EXISTS events (
                event_id     SERIAL PRIMARY KEY,
                event_name   VARCHAR(200) NOT NULL,
                event_date   DATE NOT NULL,
                event_type   VARCHAR(50) NOT NULL,
                club_name    VARCHAR(100) NOT NULL,
                created_at   TIMESTAMP DEFAULT NOW()
            )
        ''')

        # Table 9: achievements
        cur.execute('''
            CREATE TABLE IF NOT EXISTS achievements (
                achievement_id  SERIAL PRIMARY KEY,
                title           VARCHAR(200) NOT NULL,
                description     TEXT,
                achievement_date DATE,
                club_name       VARCHAR(100) NOT NULL,
                created_at      TIMESTAMP DEFAULT NOW()
            )
        ''')

        # Table 10: faculty_coordinators
        cur.execute('''
            CREATE TABLE IF NOT EXISTS faculty_coordinators (
                coordinator_id   SERIAL PRIMARY KEY,
                coordinator_name VARCHAR(150) NOT NULL,
                designation      VARCHAR(100),
                email            VARCHAR(150),
                phone            VARCHAR(15),
                club_name        VARCHAR(100) NOT NULL,
                created_at       TIMESTAMP DEFAULT NOW()
            )
        ''')

        conn.commit()

        # ── PART 3: PostgreSQL Triggers ──
        cur.execute('''
            CREATE OR REPLACE FUNCTION update_club_member_count()
            RETURNS TRIGGER AS $$
            DECLARE
                v_club_name VARCHAR;
            BEGIN
                v_club_name := TG_ARGV[0];
                UPDATE clubs
                SET member_count = (
                    SELECT COUNT(*) FROM (
                        SELECT member_id FROM genesis_members
                        WHERE v_club_name = 'Genesis'
                        UNION ALL
                        SELECT member_id FROM numerano_members
                        WHERE v_club_name = 'Numerano'
                        UNION ALL
                        SELECT member_id FROM bytesync_members
                        WHERE v_club_name = 'ByteSync'
                        UNION ALL
                        SELECT member_id FROM awscloudclub_members
                        WHERE v_club_name = 'AWS Cloud Club'
                    ) AS sub
                )
                WHERE club_name = v_club_name;
                RETURN NULL;
            END;
            $$ LANGUAGE plpgsql;
        ''')

        # Drop existing triggers first (idempotent)
        cur.execute("DROP TRIGGER IF EXISTS trg_genesis_count ON genesis_members;")
        cur.execute("DROP TRIGGER IF EXISTS trg_numerano_count ON numerano_members;")
        cur.execute("DROP TRIGGER IF EXISTS trg_bytesync_count ON bytesync_members;")
        cur.execute("DROP TRIGGER IF EXISTS trg_aws_count ON awscloudclub_members;")

        cur.execute('''
            CREATE TRIGGER trg_genesis_count
            AFTER INSERT OR DELETE ON genesis_members
            FOR EACH STATEMENT EXECUTE FUNCTION update_club_member_count('Genesis');
        ''')

        cur.execute('''
            CREATE TRIGGER trg_numerano_count
            AFTER INSERT OR DELETE ON numerano_members
            FOR EACH STATEMENT EXECUTE FUNCTION update_club_member_count('Numerano');
        ''')

        cur.execute('''
            CREATE TRIGGER trg_bytesync_count
            AFTER INSERT OR DELETE ON bytesync_members
            FOR EACH STATEMENT EXECUTE FUNCTION update_club_member_count('ByteSync');
        ''')

        cur.execute('''
            CREATE TRIGGER trg_aws_count
            AFTER INSERT OR DELETE ON awscloudclub_members
            FOR EACH STATEMENT EXECUTE FUNCTION update_club_member_count('AWS Cloud Club');
        ''')

        conn.commit()

        # ── Seed if empty ──
        cur.execute("SELECT COUNT(*) FROM clubs")
        if cur.fetchone()[0] == 0:
            seed_data(cur, conn)

        cur.close()
        print("[DB] All tables and triggers ready.")
    finally:
        db_pool.putconn(conn)


def seed_data(cur, conn):
    """Insert seed data into all tables."""
    print("[DB] Seeding data...")

    # ── Clubs ──
    cur.execute("""
        INSERT INTO clubs (club_name, member_count) VALUES
            ('Genesis',        0),
            ('Numerano',       0),
            ('ByteSync',       0),
            ('AWS Cloud Club', 0)
    """)

    # ── Genesis Members ──
    cur.execute("""
        INSERT INTO genesis_members (member_name, team_type, email, phone) VALUES
            ('Aanya Sharma',   'Design',    'aanya.genesis@college.edu',   '9876543210'),
            ('Rohan Mehta',    'Design',    'rohan.genesis@college.edu',   '9876543211'),
            ('Priya Nair',     'Technical', 'priya.genesis@college.edu',   '9876543212'),
            ('Arjun Kapoor',   'Technical', 'arjun.genesis@college.edu',   '9876543213'),
            ('Sneha Iyer',     'Media',     'sneha.genesis@college.edu',   '9876543214')
    """)

    # ── Numerano Members ──
    cur.execute("""
        INSERT INTO numerano_members (member_name, team_type, email, phone) VALUES
            ('Dev Patel',      'Technical',     'dev.numerano@college.edu',    '9876543220'),
            ('Kavya Reddy',    'Documentation', 'kavya.numerano@college.edu',  '9876543221'),
            ('Aditya Rao',     'Technical',     'aditya.numerano@college.edu', '9876543222'),
            ('Meera Joshi',    'Media',         'meera.numerano@college.edu',  '9876543223'),
            ('Vikas Singh',    'Design',        'vikas.numerano@college.edu',  '9876543224')
    """)

    # ── ByteSync Members ──
    cur.execute("""
        INSERT INTO bytesync_members (member_name, team_type, email, phone) VALUES
            ('Tanvi Shah',     'Technical',        'tanvi.bytesync@college.edu',  '9876543230'),
            ('Karan Verma',    'Technical',        'karan.bytesync@college.edu',  '9876543231'),
            ('Ishaan Gupta',   'Media',            'ishaan.bytesync@college.edu', '9876543232'),
            ('Riya Desai',     'Design',           'riya.bytesync@college.edu',   '9876543233'),
            ('Neel Jain',      'Sponsorship & PR', 'neel.bytesync@college.edu',   '9876543234')
    """)

    # ── AWS Cloud Club Members ──
    cur.execute("""
        INSERT INTO awscloudclub_members (member_name, team_type, email, phone) VALUES
            ('Pooja Menon',    'Technical',        'pooja.aws@college.edu',       '9876543240'),
            ('Rahul Tiwari',   'Documentation',    'rahul.aws@college.edu',       '9876543241'),
            ('Ananya Bose',    'Media',            'ananya.aws@college.edu',      '9876543242'),
            ('Siddharth Nair', 'Technical',        'siddharth.aws@college.edu',   '9876543243'),
            ('Divya Kumar',    'Sponsorship & PR', 'divya.aws@college.edu',       '9876543244')
    """)

    # ── Events ──
    cur.execute("""
        INSERT INTO events (event_name, event_date, event_type, club_name) VALUES
            ('Idea Ignite Hackathon',          '2025-03-15', 'Technical', 'Genesis'),
            ('Annual Design Showcase',         '2025-04-10', 'Cultural',  'Genesis'),
            ('Math Olympiad Internal Round',   '2025-02-20', 'Technical', 'Numerano'),
            ('Pi Day Celebration',             '2025-03-14', 'Cultural',  'Numerano'),
            ('Code Relay 2025',                '2025-03-10', 'Technical', 'ByteSync'),
            ('Open Source Contribution Drive', '2025-04-18', 'Technical', 'ByteSync'),
            ('Cloud Quest Challenge',          '2025-03-05', 'Technical', 'AWS Cloud Club'),
            ('AWS Re:Invent Watch Party',      '2025-04-22', 'Cultural',  'AWS Cloud Club')
    """)

    # ── Achievements ──
    cur.execute("""
        INSERT INTO achievements (title, description, achievement_date, club_name) VALUES
            ('1st Place — National Hackathon',       'Won first place at HackIndia 2025 among 500+ teams.',           '2025-03-20', 'Genesis'),
            ('Best Design Award — TechFest',         'Recognized for outstanding UI/UX design at college TechFest.',  '2025-04-12', 'Genesis'),
            ('State-level Math Olympiad Winners',    'Team secured gold in the Maharashtra State Math Olympiad.',     '2025-02-25', 'Numerano'),
            ('Published Research Paper',             'Published a paper on applied statistics in IEEE conference.',    '2025-04-01', 'Numerano'),
            ('Open Source Contribution — 500+ PRs',  'Club members contributed 500+ pull requests to open source.',   '2025-04-20', 'ByteSync'),
            ('Hackathon Runner-Up — CodeStorm',      'Secured 2nd place at CodeStorm inter-college hackathon.',       '2025-03-12', 'ByteSync'),
            ('AWS Community Builder Recognition',    'Three members recognized as AWS Community Builders.',           '2025-03-10', 'AWS Cloud Club'),
            ('Cloud Architecture Challenge Winner',  'Won the regional AWS Cloud Architecture Challenge 2025.',       '2025-04-25', 'AWS Cloud Club')
    """)

    # ── Faculty Coordinators ──
    cur.execute("""
        INSERT INTO faculty_coordinators (coordinator_name, designation, email, phone, club_name) VALUES
            ('Dr. Anita Deshmukh',  'Associate Professor, CS',    'anita.deshmukh@college.edu',  '9876500001', 'Genesis'),
            ('Prof. Rajesh Kumar',  'Assistant Professor, IT',    'rajesh.kumar@college.edu',    '9876500002', 'Genesis'),
            ('Dr. Suman Patil',     'HOD, Mathematics',           'suman.patil@college.edu',     '9876500003', 'Numerano'),
            ('Prof. Meena Sharma',  'Assistant Professor, Stats', 'meena.sharma@college.edu',    '9876500004', 'Numerano'),
            ('Dr. Vikram Joshi',    'Associate Professor, CS',    'vikram.joshi@college.edu',    '9876500005', 'ByteSync'),
            ('Prof. Neha Gupta',    'Assistant Professor, CS',    'neha.gupta@college.edu',      '9876500006', 'ByteSync'),
            ('Dr. Pradeep Nair',    'Professor, Cloud Computing', 'pradeep.nair@college.edu',    '9876500007', 'AWS Cloud Club'),
            ('Prof. Kavita Rao',    'Assistant Professor, IT',    'kavita.rao@college.edu',      '9876500008', 'AWS Cloud Club')
    """)

    conn.commit()
    print("[DB] Seed data inserted successfully.")
