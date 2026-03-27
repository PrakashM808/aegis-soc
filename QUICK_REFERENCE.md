# AEGIS-SOC Local Development - Quick Reference

## ⚡ 5-Minute Quick Start

### macOS
```bash
brew install node postgresql redis git
brew services start postgresql redis
git clone https://github.com/aegis-soc/platform.git
cd platform
npm install
cp .env.example .env
psql -U postgres -c "CREATE DATABASE aegis_soc;"
psql -U postgres -c "CREATE USER aegis_admin WITH PASSWORD 'dev_password_123';"
npm run dev
# Open http://localhost:3000/health
```

### Linux (Ubuntu)
```bash
sudo apt update
sudo apt install -y nodejs npm postgresql postgresql-contrib redis-server
sudo systemctl start postgresql redis-server
git clone https://github.com/aegis-soc/platform.git
cd platform
npm install
cp .env.example .env
sudo -u postgres psql -c "CREATE DATABASE aegis_soc;"
sudo -u postgres psql -c "CREATE USER aegis_admin WITH PASSWORD 'dev_password_123';"
npm run dev
# Open http://localhost:3000/health
```

---

## 🔍 Verification Checklist

```bash
✓ node --version              # v16+
✓ npm --version               # v8+
✓ psql --version              # 12+
✓ redis-cli --version         # 6+
✓ psql -U aegis_admin -d aegis_soc -c "SELECT 1;"  # Database works
✓ redis-cli ping              # Returns PONG
✓ curl http://localhost:3000/health  # Returns JSON
```

---

## 📁 Key Files Location

```
~/aegis-soc/
├── server.js                 ← API entry point
├── .env                      ← Configuration
├── package.json              ← Dependencies
├── database_schema.sql       ← Database schema
├── routes/                   ← API endpoints
│   ├── auth.js
│   ├── incidents.js
│   └── threats.js
└── models/
    └── index.js              ← Database models
```

---

## 🌐 API Quick Test

```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  | jq -r '.data.tokens.accessToken')

# List incidents
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/incidents

# Create incident
curl -X POST http://localhost:3000/api/v1/incidents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","type":"malware","severity":"high"}'
```

---

## 🗄️ Database Quick Commands

```bash
# Connect
psql -U aegis_admin -d aegis_soc

# List tables
\dt

# Count incidents
SELECT COUNT(*) FROM incidents;

# View users
SELECT id, email, role FROM users;

# Exit
\q
```

---

## 🔧 Troubleshooting

| Issue | Fix |
|-------|-----|
| PostgreSQL not running | `brew services start postgresql` |
| Redis not running | `brew services start redis` |
| Port 3000 in use | `lsof -i :3000` → `kill -9 PID` |
| npm install fails | `npm cache clean --force && npm install` |
| Database missing | `psql -U aegis_admin -d aegis_soc -f database_schema.sql` |

---

## 📊 Monitoring Commands

```bash
# API logs
npm run dev          # Running in terminal

# Database connections
psql -U aegis_admin -d aegis_soc -c "SELECT * FROM pg_stat_activity;"

# Redis info
redis-cli info

# System resources
top                  # macOS/Linux

# Port usage
lsof -i :3000
```

---

## 📱 Frontend Files

```
Open in Browser:
- aegis-soc-website.html          ← Landing page
- aegis-admin-dashboard.html      ← Admin dashboard
```

---

## 🚀 Development Workflow

```bash
# Terminal 1: API Server
cd ~/aegis-soc
npm run dev

# Terminal 2: Database monitoring
watch -n 1 'psql -U aegis_admin -d aegis_soc -c "SELECT COUNT(*) FROM incidents;"'

# Terminal 3: Redis monitoring
redis-cli monitor

# Terminal 4: Manual testing/curl commands
curl http://localhost:3000/health
```

---

## 🔑 Default Credentials

```
Database:
  User: aegis_admin
  Password: dev_password_123
  Host: localhost
  Port: 5432
  Database: aegis_soc

Redis:
  Host: localhost
  Port: 6379
  No password

API:
  Port: 3000
  Base URL: http://localhost:3000
  API Base: http://localhost:3000/api/v1
```

---

## 📚 Documentation Files

```
LOCAL_DEVELOPMENT_GUIDE.md    ← Detailed setup guide
API_README.md                  ← API documentation
DATABASE_SCHEMA_DOCUMENTATION.md ← Database docs
ER_DIAGRAM.md                  ← Schema visualization
DEPLOYMENT_GUIDE.md            ← For production
```

---

## ⏹️ Stopping Services

```bash
# Stop API (Ctrl+C in running terminal)
Ctrl+C

# Stop PostgreSQL
brew services stop postgresql        # macOS
sudo systemctl stop postgresql       # Linux

# Stop Redis
brew services stop redis             # macOS
sudo systemctl stop redis-server     # Linux
```

---

## 🔄 Restart Everything

```bash
# Kill all services
pkill -f "node server"
brew services stop postgresql        # macOS
brew services stop redis             # macOS
pkill postgres                       # Or: sudo systemctl stop postgresql (Linux)
pkill redis-server                   # Or: sudo systemctl stop redis-server (Linux)

# Restart
brew services start postgresql       # macOS
brew services start redis            # macOS
sudo systemctl start postgresql      # Linux
sudo systemctl start redis-server    # Linux
cd ~/aegis-soc && npm run dev
```

---

## 💾 Backup & Restore

```bash
# Backup database
pg_dump -U aegis_admin aegis_soc > backup_$(date +%Y%m%d).sql

# Restore database
psql -U aegis_admin aegis_soc < backup_20240101.sql

# Check backup
psql -U aegis_admin aegis_soc -c "SELECT COUNT(*) FROM incidents;"
```

---

## 🎯 Success Indicators

✅ `npm run dev` shows no errors  
✅ `curl http://localhost:3000/health` returns JSON  
✅ `psql -U aegis_admin -d aegis_soc -c "SELECT 1;"` works  
✅ `redis-cli ping` returns PONG  
✅ Can login to `/api/v1/auth/login`  
✅ Can access `/api/v1/incidents` with token  

---

## 🆘 Get Help

1. Check **LOCAL_DEVELOPMENT_GUIDE.md** (Troubleshooting section)
2. Review **API_README.md** for endpoint details
3. Check database schema: `psql -U aegis_admin -d aegis_soc -c "\dt"`
4. View logs in running npm terminal
5. Check PostgreSQL logs: `/usr/local/var/log/postgres.log` (macOS)

---

**Setup Time: ~15 minutes | Ready to develop!** 🚀
