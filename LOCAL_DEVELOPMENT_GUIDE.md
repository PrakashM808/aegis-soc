# AEGIS-SOC Local Development Setup Guide

## 🚀 Quick Start (5 minutes)

### macOS (Fastest)
```bash
# Install dependencies with Homebrew
brew install node postgresql redis git

# Clone/download AEGIS-SOC
git clone https://github.com/aegis-soc/platform.git
cd platform

# Run setup script
chmod +x LOCAL_SETUP.sh
./LOCAL_SETUP.sh

# Done! Server running on http://localhost:3000
```

### Linux (Ubuntu/Debian)
```bash
# Install dependencies
sudo apt update
sudo apt install -y nodejs npm postgresql postgresql-contrib redis-server git

# Start services
sudo systemctl start postgresql
sudo systemctl start redis-server

# Clone/download AEGIS-SOC
git clone https://github.com/aegis-soc/platform.git
cd platform

# Run setup script
chmod +x LOCAL_SETUP.sh
./LOCAL_SETUP.sh

# Done! Server running on http://localhost:3000
```

### Windows (WSL2)
```bash
# Enable WSL2 and install Ubuntu
wsl --install -d Ubuntu-22.04

# Inside WSL2:
sudo apt update
sudo apt install -y nodejs npm postgresql postgresql-contrib redis-server git

# Start services
sudo service postgresql start
sudo service redis-server start

# Then follow Linux instructions
```

---

## 📋 System Requirements

### Minimum Hardware
- **CPU:** 2 cores
- **RAM:** 4 GB
- **Disk:** 10 GB
- **Network:** Localhost only

### Software Requirements

| Component | Version | Status |
|-----------|---------|--------|
| Node.js | 16+ | Required |
| npm | 8+ | Required |
| PostgreSQL | 12+ | Required |
| Redis | 6+ | Required |
| Git | 2.0+ | Required |

---

## 📝 Step-by-Step Manual Setup

### Step 1: Install Prerequisites

#### macOS
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required tools
brew install node postgresql redis git

# Start services
brew services start postgresql
brew services start redis
```

#### Linux (Ubuntu/Debian)
```bash
# Update package manager
sudo apt update
sudo apt upgrade -y

# Install required tools
sudo apt install -y \
  nodejs npm postgresql postgresql-contrib redis-server git \
  build-essential python3 curl wget

# Start services
sudo systemctl start postgresql
sudo systemctl start redis-server

# Enable auto-start
sudo systemctl enable postgresql
sudo systemctl enable redis-server
```

#### Windows (WSL2 Terminal)
```bash
# Inside WSL2 Ubuntu terminal
sudo apt update
sudo apt install -y nodejs npm postgresql postgresql-contrib redis-server git

# Start PostgreSQL
sudo service postgresql start

# Start Redis
sudo service redis-server start
```

### Step 2: Verify Installation

```bash
# Check Node.js
node --version  # Should be v16.0.0 or higher

# Check npm
npm --version   # Should be 8.0.0 or higher

# Check PostgreSQL
psql --version

# Check Redis
redis-cli --version

# Check Git
git --version
```

### Step 3: Clone/Download Project

```bash
# Clone from GitHub (if available)
git clone https://github.com/aegis-soc/platform.git
cd platform

# OR manually copy files you downloaded to a folder
mkdir ~/aegis-soc
cd ~/aegis-soc
# Copy all files here
```

### Step 4: Setup PostgreSQL Database

```bash
# Connect to PostgreSQL as admin
sudo -u postgres psql

# Inside psql prompt, run:
CREATE DATABASE aegis_soc 
  ENCODING 'UTF8' 
  LC_COLLATE 'en_US.UTF-8' 
  LC_CTYPE 'en_US.UTF-8';

CREATE USER aegis_admin WITH PASSWORD 'dev_password_123';

ALTER ROLE aegis_admin CREATEDB;

GRANT ALL PRIVILEGES ON DATABASE aegis_soc TO aegis_admin;

# Exit psql
\q
```

### Step 5: Create Extensions

```bash
# Connect to aegis_soc database
psql -U aegis_admin -d aegis_soc

# Create required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

# Exit
\q
```

### Step 6: Load Database Schema

```bash
# From project directory
psql -U aegis_admin -d aegis_soc -f database_schema.sql

# Verify (should show 30 tables)
psql -U aegis_admin -d aegis_soc -c "\dt"
```

### Step 7: Setup Node.js Application

```bash
# Install dependencies
npm install

# Verify installation
npm list  # Should show all packages installed

# Create .env file
cp .env.example .env

# Edit .env with proper values
nano .env
```

### Step 8: Environment Configuration

Edit `.env` file with these values:

```env
# Server
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# Database (use values from Step 4)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aegis_soc
DB_USER=aegis_admin
DB_PASSWORD=dev_password_123

# Redis (local default)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT (generate new secrets)
JWT_SECRET=your_super_secret_key_here_change_in_prod
JWT_EXPIRE=24h
REFRESH_TOKEN_SECRET=your_refresh_secret_here
REFRESH_TOKEN_EXPIRE=7d

# Logging
LOG_LEVEL=debug
LOG_FORMAT=combined

# Features
ENABLE_THREAT_HUNTING=true
ENABLE_PLAYBOOK_AUTOMATION=true

# Optional: Threat Intelligence APIs
VIRUSTOTAL_API_KEY=optional_for_dev
ABUSEIPDB_API_KEY=optional_for_dev
```

### Step 9: Start Development Server

```bash
# Start the API server
npm run dev

# You should see:
# ╔════════════════════════════════════════════════════════╗
# ║        AEGIS-SOC API - Enterprise Security Platform    ║
# ║                                                        ║
# ║  🚀 Server running on port 3000                        ║
# ║  🌍 Environment: development                           ║
# ║  📊 API: http://localhost:3000/api/v1                  ║
# ║  📡 WebSocket: ws://localhost:3000                     ║
# ║                                                        ║
# ╚════════════════════════════════════════════════════════╝
```

---

## 🧪 Testing the Installation

### Test API Health

```bash
# In a new terminal
curl http://localhost:3000/health

# Response should be:
# {"status":"healthy","timestamp":"2024-01-01T12:00:00.000Z","uptime":0.123,"version":"1.0.0"}
```

### Test Database Connection

```bash
psql -U aegis_admin -d aegis_soc -c "SELECT COUNT(*) as tables FROM information_schema.tables WHERE table_schema='public';"

# Should show: 30 tables
```

### Test Redis Connection

```bash
redis-cli ping

# Response should be: PONG
```

### Test User Registration

```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@aegis-soc.com",
    "username": "admin",
    "password": "SecurePass123",
    "firstName": "Security",
    "lastName": "Admin"
  }'

# Response should include accessToken and refreshToken
```

### Test Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@aegis-soc.com",
    "password": "SecurePass123"
  }'

# Response should include tokens
```

### Test with Token

```bash
# Replace TOKEN with the accessToken from login
TOKEN="your_access_token_here"

curl -X GET http://localhost:3000/api/v1/incidents \
  -H "Authorization: Bearer $TOKEN"

# Should return incidents list (empty initially)
```

---

## 🌐 Accessing the Application

### API Endpoints (Backend)
```
Health Check:    GET http://localhost:3000/health
API Base:        http://localhost:3000/api/v1
WebSocket:       ws://localhost:3000
```

### Frontend Applications (Static HTML)
```
Landing Page:    Open aegis-soc-website.html in browser
Admin Dashboard: Open aegis-admin-dashboard.html in browser
```

### API Examples

#### Create Organization (Admin Only)
```bash
curl -X POST http://localhost:3000/api/v1/organizations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Organization",
    "slug": "my-org"
  }'
```

#### Create Incident
```bash
curl -X POST http://localhost:3000/api/v1/incidents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Suspicious Login Detected",
    "description": "Unusual login from unknown IP",
    "type": "intrusion",
    "severity": "high",
    "affectedAssets": ["user-server-01"]
  }'
```

#### List Incidents
```bash
curl -X GET "http://localhost:3000/api/v1/incidents?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

#### Create Threat
```bash
curl -X POST http://localhost:3000/api/v1/threats \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Emotet Malware Campaign",
    "threatType": "malware",
    "severity": "critical",
    "confidence": 95,
    "sourceIp": "192.168.1.100"
  }'
```

---

## 🛠️ Development Workflow

### Start Development
```bash
cd ~/aegis-soc
npm run dev
```

### Make Code Changes
```bash
# Edit files in your favorite editor
nano routes/incidents.js
# Changes automatically reload with nodemon
```

### View Logs
```bash
# Logs appear in the terminal running npm run dev
# For detailed logs, set LOG_LEVEL=debug in .env
```

### Run Database Queries
```bash
# Connect to database
psql -U aegis_admin -d aegis_soc

# Query incidents
SELECT id, title, severity, status FROM incidents;

# Exit
\q
```

### Create Database Backup
```bash
pg_dump -U aegis_admin aegis_soc > ~/aegis_backup_$(date +%Y%m%d).sql
```

### Restore from Backup
```bash
psql -U aegis_admin aegis_soc < ~/aegis_backup_20240101.sql
```

---

## 🐛 Troubleshooting

### PostgreSQL Connection Failed

**Error:** `psql: could not connect to server`

**Solution:**
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Check status
psql --version
```

### Redis Connection Failed

**Error:** `Error: connect ECONNREFUSED 127.0.0.1:6379`

**Solution:**
```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis-server

# Test
redis-cli ping  # Should respond with PONG
```

### Port Already in Use

**Error:** `listen EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Database Table Not Found

**Error:** `relation "incidents" does not exist`

**Solution:**
```bash
# Reload schema
psql -U aegis_admin -d aegis_soc -f database_schema.sql

# Verify
psql -U aegis_admin -d aegis_soc -c "\dt"
```

### npm Dependencies Error

**Error:** `npm ERR! ERESOLVE unable to resolve dependency tree`

**Solution:**
```bash
# Remove node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Or use legacy peer deps
npm install --legacy-peer-deps
```

### Out of Memory

**Error:** `JavaScript heap out of memory`

**Solution:**
```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npm run dev
```

---

## 📊 Monitoring Development

### View Server Logs

```bash
# Already visible in terminal running npm run dev
# Look for:
# - Request logs
# - Database queries
# - Error messages
```

### Monitor Database

```bash
# In separate terminal
watch -n 1 'psql -U aegis_admin -d aegis_soc -c "SELECT COUNT(*) FROM incidents; SELECT COUNT(*) FROM alerts;"'
```

### Monitor Redis

```bash
# In separate terminal
redis-cli monitor

# Or check memory
redis-cli info memory
```

### Check Active Connections

```bash
# PostgreSQL connections
psql -U aegis_admin -d aegis_soc -c "SELECT pid, usename, application_name, state FROM pg_stat_activity;"

# Redis clients
redis-cli client list
```

---

## 🎯 Common Development Tasks

### Add Sample Data

```bash
# Create a user
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "analyst@example.com",
    "username": "analyst",
    "password": "TestPass123",
    "firstName": "John",
    "lastName": "Analyst"
  }'

# Login and get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"analyst@example.com","password":"TestPass123"}' \
  | jq -r '.data.tokens.accessToken')

# Create incident
curl -X POST http://localhost:3000/api/v1/incidents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Incident",
    "type": "malware",
    "severity": "high",
    "description": "Sample incident for testing"
  }'
```

### Enable Debug Logging

```bash
# In .env
LOG_LEVEL=debug
DEBUG=aegis-soc:*

# Then start
npm run dev
```

### Test WebSocket Events

```bash
# Install websocat (macOS)
brew install websocat

# Connect to WebSocket
websocat ws://localhost:3000

# Send message
{"action": "subscribe_threats", "organizationId": "test"}
```

### Export Data

```bash
# Export incidents to CSV
psql -U aegis_admin -d aegis_soc -c "SELECT * FROM incidents;" -F',' > incidents.csv

# Export to JSON
psql -U aegis_admin -d aegis_soc -t -c "SELECT row_to_json(t) FROM incidents t;" > incidents.json
```

---

## 🚀 Next Steps After Setup

1. **Test API** - Use curl or Postman to test endpoints
2. **Open Dashboard** - Open aegis-admin-dashboard.html in browser
3. **Create Test Data** - Add incidents, threats, alerts
4. **Setup Monitoring** - Monitor logs and database
5. **Learn the Code** - Review routes/ and models/ directories
6. **Customize** - Modify for your specific needs
7. **Deploy** - When ready, follow DEPLOYMENT_GUIDE.md

---

## 📚 Additional Resources

- **API Documentation:** API_README.md
- **Database Schema:** DATABASE_SCHEMA_DOCUMENTATION.md
- **Deployment Guide:** DEPLOYMENT_GUIDE.md
- **Project Summary:** PROJECT_SUMMARY.md

---

## ✅ Setup Complete!

You now have AEGIS-SOC running locally on your machine.

**Next: Open a browser and test the dashboard by opening aegis-admin-dashboard.html**

---

*For production deployment, see DEPLOYMENT_GUIDE.md*
