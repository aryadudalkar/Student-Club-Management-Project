# Club Management System (DBMS_AAT)

A full-stack web application for managing multiple student clubs with member tracking, admin dashboards, and event management. Built with Flask and PostgreSQL.

---

## 📋 Table of Contents
- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [How the Project Works](#how-the-project-works)
- [Setup & Installation](#setup--installation)
- [How to Run](#how-to-run)
- [API Endpoints](#api-endpoints)
- [Key Components](#key-components)

---

## 🎯 Project Overview

This is a **Club Management System** designed to manage multiple student clubs and their members. It provides:
- **User authentication** for club members
- **Admin panels** for club administrators
- **Member tracking** for four different clubs
- **Event management** capabilities
- **Real-time member count** updates using PostgreSQL triggers

### Supported Clubs
1. 🚀 **Genesis**
2. 🔢 **Numerano**
3. 💻 **ByteSync**
4. ☁️ **AWS Cloud Club**

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│         Frontend (HTML/CSS/JS)              │
│  - User Interface (Clubs, Details)          │
│  - Admin Dashboard                          │
│  - Authentication Pages                     │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│      Flask Backend (app.py)                 │
│  - Route Management                         │
│  - Session Handling                         │
│  - API Endpoints                            │
│  - Authentication Logic                     │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│   PostgreSQL Database (models.py)           │
│  - Users Table                              │
│  - Admins Table                             │
│  - Club Member Tables (x4)                  │
│  - Events Table                             │
│  - Triggers for Auto-Updates                │
└─────────────────────────────────────────────┘
```

---

## ✨ Features

### User Features
- **Registration & Login**: Secure account creation with password hashing
- **Browse Clubs**: View all available clubs with member information
- **Club Details**: See club members, events, and information
- **Session Management**: Secure session handling with role-based access

### Admin Features
- **Admin Registration**: Create admin accounts with club-specific secret keys
- **Admin Dashboard**: Manage club members and events
- **Member Management**: Add, view, and manage club members
- **Event Management**: Create and manage club events
- **Real-time Statistics**: View member counts and club statistics

### Security
- Password hashing using Werkzeug security
- Secret key validation for admin registration
- Session-based authentication
- Role-based access control (User vs Admin)

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | HTML5, CSS3, JavaScript |
| **Backend** | Flask (Python) |
| **Database** | PostgreSQL |
| **Authentication** | Werkzeug Security |
| **Session Management** | Flask Sessions |
| **Connection Pool** | psycopg2 ThreadedConnectionPool |

### Dependencies
- `flask` - Web framework
- `psycopg2-binary` - PostgreSQL database adapter
- `python-dotenv` - Environment variable management
- `werkzeug` - Security utilities

---

## 📁 Project Structure

```
DBMS_AAT/
├── app.py                     # Main Flask application
├── config.py                  # Configuration & environment variables
├── models.py                  # Database models & schema
├── requirements.txt           # Python dependencies
├── README.md                  # This file
├── static/                    # Static assets
│   ├── css/
│   │   ├── main.css          # Global styles
│   │   ├── admin.css         # Admin dashboard styles
│   │   ├── auth.css          # Authentication page styles
│   │   ├── clubs.css         # Clubs page styles
│   │   └── club-detail.css   # Club detail page styles
│   └── js/
│       ├── admin.js          # Admin dashboard functionality
│       ├── auth.js           # Authentication logic
│       ├── clubs.js          # Clubs page functionality
│       └── club-detail.js    # Club detail page functionality
└── templates/                # HTML templates
    ├── index.html            # Home page
    ├── admin_signup.html     # Admin registration page
    ├── admin_login.html      # Admin login page
    ├── admin_dashboard.html  # Admin control panel
    ├── clubs.html            # User clubs list page
    └── club_detail.html      # Individual club detail page
```

---

## 🗄️ Database Schema

### Tables

#### 1. **users** - Regular user accounts
```sql
user_id (PRIMARY KEY)
username
email (UNIQUE)
phone
password_hash
created_at
```

#### 2. **admins** - Club administrator accounts
```sql
admin_id (PRIMARY KEY)
admin_name
email (UNIQUE)
password_hash
club_name
created_at
```

#### 3. **clubs** - Club information
```sql
club_id (PRIMARY KEY)
club_name (UNIQUE)
member_count (Auto-updated by trigger)
```

#### 4-7. **[club]_members** - Member tables (one per club)
```sql
member_id (PRIMARY KEY)
member_name
team_type (e.g., "Development", "Design", "Marketing")
email (UNIQUE)
phone
joined_at
```

Club-specific tables:
- `genesis_members`
- `numerano_members`
- `bytesync_members`
- `awscloudclub_members`

#### 8. **events** - Club events
```sql
event_id (PRIMARY KEY)
event_name
event_date
event_type (e.g., "Workshop", "Meeting", "Competition")
club_name
created_at
```

### Database Triggers

**Trigger: `update_club_member_count()`**
- **Purpose**: Automatically updates the member count in the `clubs` table whenever a member is added/removed
- **Triggered by**: INSERT/UPDATE/DELETE on any `[club]_members` table
- **Function**: Counts total members across all club tables and updates the corresponding club record

---

## 🔄 How the Project Works

### 1. **Application Startup** (`app.py`)
```
1. Flask app initializes with SECRET_KEY from config
2. Database connection pool created (min=1, max=20 connections)
3. init_db() called to ensure database & schema exist
4. All tables and triggers created if they don't exist
5. App ready to accept requests
```

### 2. **User Journey**

#### Registration Flow
```
User fills signup form → /api/signup POST request
→ Validate input (username, email, password)
→ Check if email already exists
→ Hash password using werkzeug
→ Insert into users table
→ Return success message → User can login
```

#### Login Flow
```
User fills login form → /api/login POST request
→ Validate input (email, password)
→ Query users table
→ Compare password hash
→ Create session (user_id, user_name, role='user')
→ Redirect to /user/clubs page
```

#### Browse Clubs
```
GET /user/clubs
→ Check session authentication
→ Render clubs.html
→ JavaScript fetches club data from API
→ Display club list with member counts
```

#### View Club Details
```
GET /user/club/<club_name>
→ Check session authentication
→ Render club_detail.html
→ JavaScript fetches members from specific table
→ Display members grouped by team_type
```

### 3. **Admin Journey**

#### Admin Registration Flow
```
Admin fills registration form → /api/admin/signup POST request
→ Validate all fields (admin_name, email, password, club_name, secret_key)
→ Validate secret_key against CLUB_SECRET_KEYS config
→ Hash password
→ Insert into admins table
→ Return success → Admin can login
```

#### Admin Login Flow
```
Admin fills login form → /api/admin/login POST request
→ Validate credentials
→ Create session (admin_authenticated=True, admin_club_name, admin_id)
→ Redirect to /admin/dashboard
```

#### Admin Dashboard
```
GET /admin/dashboard
→ Check admin authentication session
→ Render admin_dashboard.html with club_name
→ Admin can:
  - Add new members (INSERT into club's member table)
  - View all members (SELECT from club's member table)
  - Edit member details (UPDATE club's member table)
  - Delete members (DELETE from club's member table)
  - Create events (INSERT into events table)
  - View statistics (Query member_count from clubs table)
```

### 4. **Database Trigger in Action**

```
Example: Admin adds a new member to Genesis

POST /api/admin/add-member → INSERT into genesis_members
↓
PostgreSQL Trigger activates
↓
Function: update_club_member_count()
↓
Counts total Genesis members
↓
Updates clubs.member_count where club_name='Genesis'
↓
Genesis club now shows updated member count on front-end
```

### 5. **Session Management**

**Session Variables:**
```
User Session:
{
  'user_id': <int>,
  'user_name': <string>,
  'role': 'user'
}

Admin Session:
{
  'admin_authenticated': True,
  'admin_club_name': <string>,
  'admin_id': <int>
}
```

**Session Lifecycle:**
- Created on successful login
- Checked on protected routes
- Cleared on logout (`/logout`)
- Auto-cleaned by Flask teardown

---

## 🚀 Setup & Installation

### Prerequisites
- Python 3.8+
- PostgreSQL 12+
- pip (Python package manager)

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Configure Environment Variables
Create a `.env` file in the project root:
```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/club_management
SECRET_KEY=your-secret-key-here
```

**Or use defaults in `config.py`:**
- Database: `postgresql://postgres:20feb2006@localhost:5432/club_management`
- Secret Key: `fallback-secret-key-change-me`

### Step 3: Ensure PostgreSQL is Running
```bash
# On Windows
net start postgresql-x64-VERSION

# On macOS
brew services start postgresql

# On Linux
sudo systemctl start postgresql
```

### Step 4: Database Initialization
The database and all tables are created automatically on first run via `init_db()` in `models.py`.

---

## ▶️ How to Run

### Start the Flask Application
```bash
python app.py
```

**Output:**
```
 * Running on http://127.0.0.1:5000 (Press CTRL+C to quit)
```

### Access the Application
- **Home Page**: http://localhost:5000/
- **User Login**: Click "Login" on home page
- **Admin Login**: http://localhost:5000/admin/login
- **Admin Signup**: http://localhost:5000/admin/signup

### Admin Secret Keys (for registration)
```
Genesis:        GEN-2025-XKQT
Numerano:       NUM-2025-PLMW
ByteSync:       BYT-2025-ZRFN
AWS Cloud Club: AWS-2025-HVDC
```

---

## 📡 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/signup` | User registration |
| `POST` | `/api/login` | User login |
| `POST` | `/api/admin/signup` | Admin registration |
| `POST` | `/api/admin/login` | Admin login |
| `GET` | `/logout` | Logout (clears session) |

### Page Routes

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/` | Home page |
| `GET` | `/user/clubs` | User clubs list (requires login) |
| `GET` | `/user/club/<club_name>` | Club details page (requires login) |
| `GET` | `/admin/signup` | Admin signup page |
| `GET` | `/admin/login` | Admin login page |
| `GET` | `/admin/dashboard` | Admin dashboard (requires admin login) |

### Admin API Endpoints (partial list from code)
Endpoints for managing members, events, and club data exist but full list depends on `app.py` completion.

---

## 🔑 Key Components

### `app.py` - Main Application
**Responsibilities:**
- Flask app initialization
- Route definitions (pages and APIs)
- Session management
- Authentication logic
- Database queries

**Key Variables:**
```python
TABLE_MAP = {'Genesis': 'genesis_members', ...}
CLUB_EMOJIS = {'Genesis': '🚀', ...}
```

### `config.py` - Configuration
**Contains:**
- Database connection URL
- Secret key for sessions
- Club secret keys for admin registration
- Database connection pool settings

### `models.py` - Database Layer
**Responsibilities:**
- Database initialization
- Table creation
- Schema definition
- Trigger functions
- Connection pool management

### Frontend (HTML/CSS/JS)
**Key Files:**
- `auth.js` - Handles user and admin login/signup
- `clubs.js` - Fetches and displays club list
- `club-detail.js` - Displays club member details
- `admin.js` - Admin dashboard operations

---

## 🔐 Security Features

1. **Password Security**: All passwords hashed with werkzeug
2. **Session Protection**: Secret key used to sign sessions
3. **Admin Verification**: Secret keys required for admin registration
4. **Email Uniqueness**: Enforced at database level
5. **Role-Based Access**: Different permissions for users vs admins
6. **Input Validation**: Form data validated before processing

---

## 📊 Database Connection Pooling

The application uses **ThreadedConnectionPool** for efficient database connection management:
- **Minimum Connections**: 1
- **Maximum Connections**: 20
- Connections reused across requests
- Automatic cleanup on request end via `teardown_appcontext`

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Database connection error** | Ensure PostgreSQL is running; check `DATABASE_URL` in `.env` |
| **Module not found** | Run `pip install -r requirements.txt` |
| **Port 5000 already in use** | Change port in `app.py` or stop the other process |
| **Secret key validation failed** | Use correct secret key from the list above |
| **Session errors** | Clear browser cookies and try again |

---

## 📝 Notes

- The application auto-creates the database on first run
- Triggers automatically maintain member counts
- Each club has isolated member data
- PostgreSQL required (SQLite not supported)
- Session data stored server-side; cookies are signed

---

## 👨‍💻 Developer Info

**Author**: DBMS_AAT Project Team  
**Version**: 1.0  
**Last Updated**: May 2026  
**License**: Educational Use

For questions or issues, refer to the code comments in `app.py` and `models.py`.

---

**Enjoy managing your student clubs! 🎓**  
