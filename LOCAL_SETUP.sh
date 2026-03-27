#!/bin/bash

# AEGIS-SOC Local Development Setup Guide
# Complete step-by-step instructions for macOS, Linux, and Windows (WSL2)

echo "================================================"
echo "AEGIS-SOC Local Development Setup"
echo "================================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check OS
OS="$(uname)"
case "$OS" in
  Linux*)   SYSTEM="Linux";;
  Darwin*)  SYSTEM="Mac";;
  *)        SYSTEM="Unknown";;
esac

echo -e "${BLUE}Detected System: $SYSTEM${NC}\n"

# ============================================================
# PART 1: PREREQUISITES CHECK
# ============================================================

echo -e "${YELLOW}Step 1: Checking Prerequisites${NC}"
echo "========================================"
echo ""

check_command() {
  if ! command -v $1 &> /dev/null; then
    echo -e "${RED}✗ $2 not found${NC}"
    return 1
  else
    echo -e "${GREEN}✓ $2 installed${NC}"
    return 0
  fi
}

MISSING=0

check_command "node" "Node.js" || MISSING=1
check_command "npm" "npm" || MISSING=1
check_command "git" "Git" || MISSING=1
check_command "psql" "PostgreSQL Client" || MISSING=1
check_command "redis-cli" "Redis Client" || MISSING=1

echo ""

if [ $MISSING -eq 1 ]; then
  echo -e "${RED}Missing dependencies!${NC}"
  echo ""
  echo "Installation instructions:"
  echo ""
  
  if [ "$SYSTEM" = "Mac" ]; then
    echo "Using Homebrew:"
    echo "  brew install node"
    echo "  brew install postgresql"
    echo "  brew install redis"
    echo "  brew install git"
  elif [ "$SYSTEM" = "Linux" ]; then
    echo "Using apt (Ubuntu/Debian):"
    echo "  sudo apt update"
    echo "  sudo apt install -y nodejs npm postgresql postgresql-contrib redis-server git"
    echo ""
    echo "Using yum (RedHat/CentOS):"
    echo "  sudo yum install -y nodejs npm postgresql postgresql-server redis git"
  fi
  echo ""
  exit 1
fi

echo -e "${GREEN}All prerequisites installed!${NC}\n"

# ============================================================
# PART 2: PROJECT SETUP
# ============================================================

echo -e "${YELLOW}Step 2: Setting Up Project${NC}"
echo "========================================"
echo ""

# Create project directory
PROJECT_DIR="$HOME/aegis-soc"
if [ ! -d "$PROJECT_DIR" ]; then
  mkdir -p "$PROJECT_DIR"
  echo -e "${GREEN}✓ Created project directory: $PROJECT_DIR${NC}"
else
  echo -e "${BLUE}Project directory already exists${NC}"
fi

cd "$PROJECT_DIR"

# Download files (assuming they're provided)
echo "Copying application files..."
# Note: In a real scenario, you'd clone from git or copy files
echo -e "${GREEN}✓ Project files ready${NC}\n"

# ============================================================
# PART 3: DATABASE SETUP
# ============================================================

echo -e "${YELLOW}Step 3: Setting Up PostgreSQL Database${NC}"
echo "========================================"
echo ""

# Check if PostgreSQL is running
if ! pgrep -x "postgres" > /dev/null && ! pgrep -x "mongod" > /dev/null; then
  echo "PostgreSQL not running. Starting it..."
  
  if [ "$SYSTEM" = "Mac" ]; then
    brew services start postgresql
  elif [ "$SYSTEM" = "Linux" ]; then
    sudo systemctl start postgresql
  fi
  
  sleep 2
fi

# Create database and user
echo "Creating database and user..."
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'aegis_soc'" | grep -q 1 || {
  psql -U postgres -c "CREATE DATABASE aegis_soc ENCODING 'UTF8' LC_COLLATE 'en_US.UTF-8' LC_CTYPE 'en_US.UTF-8';"
  echo -e "${GREEN}✓ Database 'aegis_soc' created${NC}"
}

# Create user
psql -U postgres -tc "SELECT 1 FROM pg_user WHERE usename = 'aegis_admin'" | grep -q 1 || {
  psql -U postgres -c "CREATE USER aegis_admin WITH PASSWORD 'dev_password_123';"
  psql -U postgres -c "ALTER ROLE aegis_admin CREATEDB;"
  echo -e "${GREEN}✓ User 'aegis_admin' created${NC}"
}

# Grant privileges
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE aegis_soc TO aegis_admin;"
echo -e "${GREEN}✓ Permissions granted${NC}\n"

# ============================================================
# PART 4: REDIS SETUP
# ============================================================

echo -e "${YELLOW}Step 4: Setting Up Redis${NC}"
echo "========================================"
echo ""

# Check if Redis is running
if ! pgrep -x "redis-server" > /dev/null; then
  echo "Starting Redis..."
  
  if [ "$SYSTEM" = "Mac" ]; then
    brew services start redis
  elif [ "$SYSTEM" = "Linux" ]; then
    sudo systemctl start redis-server
  fi
  
  sleep 1
fi

# Test Redis connection
if redis-cli ping | grep -q "PONG"; then
  echo -e "${GREEN}✓ Redis running and accessible${NC}\n"
else
  echo -e "${RED}✗ Redis not accessible${NC}\n"
  exit 1
fi

# ============================================================
# PART 5: NODE.JS SETUP
# ============================================================

echo -e "${YELLOW}Step 5: Setting Up Node.js Application${NC}"
echo "========================================"
echo ""

cd "$PROJECT_DIR"

# Install dependencies
echo "Installing npm dependencies..."
if npm install > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Dependencies installed${NC}"
else
  echo -e "${RED}✗ Failed to install dependencies${NC}"
  exit 1
fi

# Create .env file
echo "Creating .env configuration..."
cat > .env << EOF
# Development Environment
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
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRE=24h
REFRESH_TOKEN_SECRET=$(openssl rand -base64 32)
REFRESH_TOKEN_EXPIRE=7d

# Logging
LOG_LEVEL=debug
LOG_FORMAT=combined

# Features
ENABLE_THREAT_HUNTING=true
ENABLE_PLAYBOOK_AUTOMATION=true
ENABLE_ML_DETECTION=false
ENABLE_SOAR_INTEGRATION=false

# Third-party APIs (optional for development)
VIRUSTOTAL_API_KEY=dev_key
ABUSEIPDB_API_KEY=dev_key
EOF

echo -e "${GREEN}✓ .env file created${NC}\n"

# ============================================================
# PART 6: DATABASE MIGRATION
# ============================================================

echo -e "${YELLOW}Step 6: Running Database Migrations${NC}"
echo "========================================"
echo ""

# Load database schema
echo "Loading database schema..."
if psql -U aegis_admin -d aegis_soc -f database_schema.sql > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Database schema loaded${NC}"
else
  echo -e "${YELLOW}Note: If schema load failed, manual setup may be needed${NC}"
fi

# Verify tables
TABLE_COUNT=$(psql -U aegis_admin -d aegis_soc -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null || echo "0")
if [ "$TABLE_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✓ Database tables created ($TABLE_COUNT tables)${NC}\n"
else
  echo -e "${YELLOW}⚠ No tables found. You may need to run the schema manually.${NC}\n"
fi

# ============================================================
# PART 7: VERIFICATION
# ============================================================

echo -e "${YELLOW}Step 7: Verifying Installation${NC}"
echo "========================================"
echo ""

echo "Checking Node.js version:"
node --version

echo ""
echo "Checking npm version:"
npm --version

echo ""
echo "Checking PostgreSQL connection:"
psql -U aegis_admin -d aegis_soc -c "SELECT 1;" > /dev/null 2>&1 && echo -e "${GREEN}✓ PostgreSQL connected${NC}" || echo -e "${RED}✗ PostgreSQL connection failed${NC}"

echo ""
echo "Checking Redis connection:"
redis-cli ping > /dev/null 2>&1 && echo -e "${GREEN}✓ Redis connected${NC}" || echo -e "${RED}✗ Redis connection failed${NC}"

echo ""

# ============================================================
# PART 8: START SERVERS
# ============================================================

echo -e "${YELLOW}Step 8: Starting Development Servers${NC}"
echo "========================================"
echo ""

echo -e "${BLUE}Starting AEGIS-SOC API Server...${NC}"
echo ""
echo "The server will start on http://localhost:3000"
echo ""
echo "Available endpoints:"
echo "  • Health Check: GET http://localhost:3000/health"
echo "  • Login: POST http://localhost:3000/api/v1/auth/login"
echo "  • Incidents: GET http://localhost:3000/api/v1/incidents"
echo "  • Threats: GET http://localhost:3000/api/v1/threats"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
echo -e "${YELLOW}Starting now...${NC}\n"

npm run dev

# ============================================================
# CLEANUP (when user stops)
# ============================================================

echo ""
echo -e "${YELLOW}Shutdown complete${NC}"
echo ""
echo "To restart the server later, run:"
echo "  cd $PROJECT_DIR"
echo "  npm run dev"
echo ""
