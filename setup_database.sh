#!/bin/bash

# AEGIS-SOC Database Setup Script
# This script initializes the PostgreSQL database with complete schema

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}AEGIS-SOC Database Setup${NC}"
echo -e "${YELLOW}========================================${NC}"

# Load environment variables
if [ ! -f .env ]; then
  echo -e "${RED}Error: .env file not found${NC}"
  echo "Please create .env file with database credentials"
  exit 1
fi

# Source environment variables
export $(cat .env | grep -v '#' | xargs)

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-aegis_soc}
DB_USER=${DB_USER:-aegis_admin}
DB_PASSWORD=${DB_PASSWORD}

echo -e "${YELLOW}Configuration:${NC}"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"

# Check if PostgreSQL is running
echo -e "\n${YELLOW}Checking PostgreSQL connection...${NC}"
if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT 1" > /dev/null 2>&1; then
  echo -e "${RED}Failed to connect to PostgreSQL${NC}"
  exit 1
fi
echo -e "${GREEN}✓ PostgreSQL connection successful${NC}"

# Drop existing database (optional - uncomment to reset)
# echo -e "\n${YELLOW}Dropping existing database...${NC}"
# PGPASSWORD=$DB_PASSWORD dropdb -h $DB_HOST -p $DB_PORT -U postgres $DB_NAME --if-exists
# echo -e "${GREEN}✓ Database dropped${NC}"

# Create database if not exists
echo -e "\n${YELLOW}Creating database...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U postgres -c "CREATE DATABASE $DB_NAME ENCODING 'UTF8' LC_COLLATE 'en_US.UTF-8' LC_CTYPE 'en_US.UTF-8';" || echo "Database already exists"
echo -e "${GREEN}✓ Database created${NC}"

# Create extensions
echo -e "\n${YELLOW}Creating PostgreSQL extensions...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS \"pg_trgm\";"
echo -e "${GREEN}✓ Extensions created${NC}"

# Load schema
echo -e "\n${YELLOW}Loading database schema...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database_schema.sql
echo -e "${GREEN}✓ Schema loaded${NC}"

# Create app user (if needed)
echo -e "\n${YELLOW}Setting up application user...${NC}"
APP_PASSWORD=$(openssl rand -base64 32)
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U postgres -c "CREATE ROLE app_user WITH LOGIN PASSWORD '$APP_PASSWORD';" 2>/dev/null || echo "App user already exists"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U postgres -c "GRANT CONNECT ON DATABASE $DB_NAME TO app_user;"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "GRANT USAGE ON SCHEMA public TO app_user;"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;"
echo -e "${GREEN}✓ Application user created${NC}"

# Verify schema
echo -e "\n${YELLOW}Verifying schema...${NC}"
TABLE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';")
echo -e "${GREEN}✓ Created $TABLE_COUNT tables${NC}"

# Show table list
echo -e "\n${YELLOW}Tables created:${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\dt"

# Create backup
echo -e "\n${YELLOW}Creating initial backup...${NC}"
mkdir -p ./backups
BACKUP_FILE="./backups/aegis_soc_$(date +%Y%m%d_%H%M%S).sql"
PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > $BACKUP_FILE
echo -e "${GREEN}✓ Backup created: $BACKUP_FILE${NC}"

echo -e "\n${YELLOW}========================================${NC}"
echo -e "${GREEN}✓ Database setup complete!${NC}"
echo -e "${YELLOW}========================================${NC}"

echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Update .env with app_user password: $APP_PASSWORD"
echo "2. Run: npm install"
echo "3. Run: npm run migrate"
echo "4. Run: npm start"
