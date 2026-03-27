# 🚀 AEGIS-SOC Local Deployment - Step by Step

## Phase 1: Prerequisites Installation (10 minutes)

### Step 1️⃣ Install Node.js

**macOS:**
```bash
brew install node
```

**Linux (Ubuntu):**
```bash
sudo apt update
sudo apt install nodejs npm
```

**Windows (WSL2):**
```bash
wsl --install -d Ubuntu-22.04
# Inside WSL2:
sudo apt install nodejs npm
```

✅ **Verify:**
```bash
node --version  # Should be v16 or higher
npm --version   # Should be v8 or higher
```

---

### Step 2️⃣ Install PostgreSQL

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu):**
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows (WSL2):**
```bash
sudo apt install postgresql postgresql-contrib
sudo service postgresql start
```

✅ **Verify:**
```bash
psql --version
# Should show PostgreSQL version
```

---

### Step 3️⃣ Install Redis

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux (Ubuntu):**
```bash
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**Windows (WSL2):**
```bash
sudo apt install redis-server
sudo service redis-server start
```

✅ **Verify:**
```bash
redis-cli ping
# Should return: PONG
```

---

### Step 4️⃣ Install Git (If Needed)

**macOS:**
```bash
brew install git
```

**Linux:**
```bash
sudo apt install git
```

✅ **Verify:**
```bash
git --version
```

---

## Phase 2: Project Setup (5 minutes)

### Step 5️⃣ Download/Clone Project

**Option A: Clone from GitHub**
```bash
git clone https://github.com/aegis-soc/platform.git
cd platform
```

**Option B: Copy Downloaded Files**
```bash
mkdir ~/aegis-soc
cd ~/aegis-soc
# Copy all files you downloaded here
```

---

### Step 6️⃣ Install Dependencies

```bash
npm install
```

⏳ **Wait:** This takes 2-3 minutes

✅ **Should complete without errors**

---

## Phase 3: Database Setup (5 minutes)

### Step 7️⃣ Create Database User

```bash
# Connect to PostgreSQL
psql -U postgres

# Inside psql, run:
CREATE DATABASE aegis_soc ENCODING 'UTF8' LC_COLLATE 'en_US.UTF-8' LC_CTYPE 'en_US.UTF-8';

CREATE USER aegis_admin WITH PASSWORD 'dev_password_123';

ALTER ROLE aegis_admin CREATEDB;

GRANT ALL PRIVILEGES ON DATABASE aegis_soc TO aegis_admin;

# Exit
\q
```

✅ **Verify:**
```bash
psql -U aegis_admin -d aegis_soc -c "SELECT 1;"
# Should return: 1
```

---

### Step 8️⃣ Create Database Extensions

```bash
psql -U aegis_admin -d aegis_soc
```

Inside psql:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

\q
```

---

### Step 9️⃣ Load Database Schema

From your project directory:

```bash
psql -U aegis_admin -d aegis_soc -f database_schema.sql
```

⏳ **Wait:** 1-2 minutes

✅ **Verify:**
```bash
psql -U aegis_admin -d aegis_soc -c "\dt"
# Should show 30 tables
```

---

## Phase 4: Configuration (2 minutes)

### Step 🔟 Create Environment File

```bash
cp .env.example .env
```

Open `.env` in editor and update values:

```env
# Server
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aegis_soc
DB_USER=aegis_admin
DB_PASSWORD=dev_password_123

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=change_this_to_random_string
JWT_EXPIRE=24h
REFRESH_TOKEN_SECRET=another_random_string
REFRESH_TOKEN_EXPIRE=7d

# Logging
LOG_LEVEL=debug
LOG_FORMAT=combined
```

✅ **Save file**

---

## Phase 5: Start Application (2 minutes)

### Step 1️⃣1️⃣ Start the API Server

```bash
npm run dev
```

✅ **You should see:**
```
╔════════════════════════════════════════════════════════╗
║        AEGIS-SOC API - Enterprise Security Platform    ║
║                                                        ║
║  🚀 Server running on port 3000                        ║
║  🌍 Environment: development                           ║
║  📊 API: http://localhost:3000/api/v1                  ║
║  📡 WebSocket: ws://localhost:3000                     ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
```

---

## Phase 6: Verification (5 minutes)

### Step 1️⃣2️⃣ Test API Health

**In a new terminal:**

```bash
curl http://localhost:3000/health
```

✅ **Should return:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 2.34,
  "version": "1.0.0"
}
```

---

### Step 1️⃣3️⃣ Test User Registration

```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "username": "admin",
    "password": "TestPassword123",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

✅ **Should return:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "role": "analyst"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token"
    }
  }
}
```

---

### Step 1️⃣4️⃣ Save Your Token

```bash
# Login to get token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "TestPassword123"
  }' | jq .data.tokens.accessToken

# Copy the token (without quotes)
# Save it: TOKEN="your_token_here"
```

---

### Step 1️⃣5️⃣ Test Protected Endpoint

```bash
# Replace with your token
TOKEN="your_access_token_here"

curl -X GET http://localhost:3000/api/v1/incidents \
  -H "Authorization: Bearer $TOKEN"
```

✅ **Should return:**
```json
{
  "success": true,
  "data": {
    "incidents": [],
    "pagination": {
      "total": 0,
      "page": 1,
      "limit": 20,
      "pages": 0
    }
  }
}
```

---

## Phase 7: Access Applications

### Step 1️⃣6️⃣ Open Admin Dashboard

```bash
# Drag and drop these files into your browser
# or open with:
open aegis-admin-dashboard.html        # macOS
xdg-open aegis-admin-dashboard.html    # Linux
start aegis-admin-dashboard.html       # Windows
```

✅ **You should see the dashboard with:**
- Real-time threat monitoring
- Incident management interface
- Security metrics
- Charts and analytics

---

### Step 1️⃣7️⃣ Open Landing Website

```bash
open aegis-soc-website.html            # macOS
xdg-open aegis-soc-website.html        # Linux
start aegis-soc-website.html           # Windows
```

✅ **You should see:**
- Professional landing page
- Feature overview
- Security pillars section
- Call-to-action buttons

---

## 🎉 Deployment Complete!

You now have **AEGIS-SOC running locally** with:

✅ API server on http://localhost:3000  
✅ PostgreSQL database running  
✅ Redis cache running  
✅ Admin dashboard working  
✅ Landing website available  
✅ Authentication system functional  

---

## 📊 What's Running

```
Terminal 1: npm run dev
  ↓
  Node.js API Server (port 3000)
  ↓
  PostgreSQL Database (localhost:5432)
  ↓
  Redis Cache (localhost:6379)

Browsers:
  ↓
  http://localhost:3000/health
  http://localhost:3000/api/v1/incidents
  aegis-admin-dashboard.html
  aegis-soc-website.html
```

---

## 🧪 Try These Next

### Create an Incident
```bash
TOKEN="your_token"

curl -X POST http://localhost:3000/api/v1/incidents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Suspicious Login Activity",
    "type": "intrusion",
    "severity": "high",
    "description": "Multiple failed login attempts detected",
    "affectedAssets": ["user-workstation-01"]
  }'
```

### Create a Threat
```bash
curl -X POST http://localhost:3000/api/v1/threats \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Emotet Banking Malware",
    "threatType": "malware",
    "severity": "critical",
    "confidence": 95,
    "source": "email-gateway",
    "sourceIp": "192.168.1.50"
  }'
```

### List Your Data
```bash
curl -X GET http://localhost:3000/api/v1/incidents \
  -H "Authorization: Bearer $TOKEN"

curl -X GET http://localhost:3000/api/v1/threats \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🛑 Stop Everything

```bash
# Stop API (in running terminal)
Ctrl+C

# Stop PostgreSQL
brew services stop postgresql      # macOS
sudo systemctl stop postgresql     # Linux

# Stop Redis  
brew services stop redis           # macOS
sudo systemctl stop redis-server   # Linux
```

---

## 🚀 Next Steps

1. **Read Documentation:**
   - API_README.md - API endpoints
   - DATABASE_SCHEMA_DOCUMENTATION.md - Database structure
   - ER_DIAGRAM.md - Data relationships

2. **Customize:**
   - Modify routes in routes/
   - Update models in models/
   - Add custom fields

3. **Deploy to Production:**
   - Follow DEPLOYMENT_GUIDE.md
   - Choose AWS, Azure, or GCP
   - Configure SSL/TLS
   - Setup monitoring

4. **Integrate:**
   - Connect to your SIEM
   - Add threat intelligence feeds
   - Create playbooks
   - Enable notifications

---

## ✅ Checklist

- [ ] Node.js installed and verified
- [ ] PostgreSQL installed and running
- [ ] Redis installed and running
- [ ] Project files downloaded/cloned
- [ ] npm install completed
- [ ] Database created and schema loaded
- [ ] .env file created and configured
- [ ] API server running (npm run dev)
- [ ] API health check passes
- [ ] User registration works
- [ ] User login works
- [ ] Protected endpoints accessible
- [ ] Admin dashboard opens
- [ ] Landing website opens

---

**🎊 AEGIS-SOC is now live on your machine! 🎊**

Start by testing the API endpoints and exploring the admin dashboard.

For help, see **QUICK_REFERENCE.md** or **LOCAL_DEVELOPMENT_GUIDE.md**
