# AEGIS-SOC Deployment Guide

Complete production deployment guide for enterprise cybersecurity platform.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Docker Deployment](#docker-deployment)
4. [AWS Deployment](#aws-deployment)
5. [Azure Deployment](#azure-deployment)
6. [GCP Deployment](#gcp-deployment)
7. [Production Checklist](#production-checklist)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools
- Node.js 16+
- Docker & Docker Compose
- PostgreSQL 12+
- Redis 6+
- Git
- AWS CLI / Azure CLI / gcloud (for cloud deployments)

### Minimum Hardware
- **Development:** 2 CPU, 4GB RAM, 10GB storage
- **Production:** 4 CPU, 16GB RAM, 100GB storage
- **High Volume:** 8+ CPU, 32GB+ RAM, 500GB+ storage

### Network Requirements
- Outbound HTTPS (443) for threat intel APIs
- Inbound HTTPS (443) for user access
- Outbound to SIEM/EDR platforms
- Email SMTP (587)

---

## Local Development

### 1. Clone Repository
```bash
git clone https://github.com/aegis-soc/platform.git
cd platform
```

### 2. Setup Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env with local settings
nano .env

# Key variables to set:
# DB_HOST=localhost
# DB_PORT=5432
# NODE_ENV=development
# JWT_SECRET=your_dev_secret_key
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Setup Database
```bash
# Start PostgreSQL
docker run -d \
  --name postgres \
  -e POSTGRES_DB=aegis_soc \
  -e POSTGRES_USER=aegis_admin \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:15-alpine

# Run migrations
npm run migrate

# Load sample data
npm run seed:dev
```

### 5. Start Redis
```bash
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7-alpine
```

### 6. Start Development Server
```bash
# Terminal 1: API
npm run dev

# Terminal 2: Frontend (if using React)
cd frontend && npm start
```

**Access Application:**
- API: http://localhost:3000
- Frontend: http://localhost:3001
- Dashboard: http://localhost:3000/admin

---

## Docker Deployment

### 1. Build Docker Images

#### API Image
```bash
# Build from Dockerfile
docker build -t aegis-soc-api:latest .

# Tag for registry
docker tag aegis-soc-api:latest your-registry/aegis-soc-api:latest

# Push to registry
docker push your-registry/aegis-soc-api:latest
```

#### Full Stack with Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop all services
docker-compose down

# Rebuild services
docker-compose up -d --build
```

### 2. Docker Compose Configuration

```yaml
# docker-compose.yml (already provided)
# Services:
# - api (Node.js)
# - postgres (Database)
# - redis (Cache)
# - pgadmin (DB Management)

# Start stack
docker-compose up -d

# Verify health
docker-compose ps
```

### 3. Docker Network
```bash
# Create custom network
docker network create aegis-network

# Run with custom network
docker run --network aegis-network ...
```

### 4. Data Persistence
```bash
# Create volumes for persistence
docker volume create aegis_postgres_data
docker volume create aegis_redis_data

# Mount in docker-compose.yml:
volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
```

### 5. Environment Configuration

```bash
# Create .env file for Docker
cat > .env.docker << EOF
NODE_ENV=production
PORT=3000
DB_HOST=postgres
DB_PORT=5432
DB_NAME=aegis_soc
DB_USER=aegis_admin
DB_PASSWORD=strong_secure_password
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET=$(openssl rand -base64 32)
EOF

# Pass to Docker
docker-compose --env-file .env.docker up -d
```

### 6. Scaling with Docker
```bash
# Scale API instances
docker-compose up -d --scale api=3

# Use load balancer (add to docker-compose.yml)
services:
  loadbalancer:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - api
```

---

## AWS Deployment

### 1. AWS Infrastructure Setup

#### RDS PostgreSQL Database
```bash
# Create RDS instance via AWS CLI
aws rds create-db-instance \
  --db-instance-identifier aegis-soc-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --master-username aegis_admin \
  --master-user-password $(openssl rand -base64 32) \
  --allocated-storage 100 \
  --storage-type gp3 \
  --multi-az \
  --publicly-accessible false \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name aegis-subnet-group

# Get endpoint
aws rds describe-db-instances \
  --db-instance-identifier aegis-soc-db \
  --query 'DBInstances[0].Endpoint.Address'
```

#### ElastiCache Redis
```bash
# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id aegis-soc-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1 \
  --security-group-ids sg-xxxxx

# Get endpoint
aws elasticache describe-cache-clusters \
  --cache-cluster-id aegis-soc-redis \
  --show-cache-node-info \
  --query 'CacheClusters[0].CacheNodes[0].Endpoint'
```

#### EC2 Instances
```bash
# Launch EC2 for API
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.medium \
  --key-name aegis-key \
  --security-group-ids sg-xxxxx \
  --subnet-id subnet-xxxxx \
  --iam-instance-profile Name=aegis-instance-role \
  --user-data file://init.sh

# User data script (init.sh)
#!/bin/bash
sudo yum update -y
sudo yum install -y nodejs npm
cd /home/ec2-user
git clone https://github.com/aegis-soc/platform.git
cd platform
npm install
# Copy .env from S3 or Secrets Manager
aws secretsmanager get-secret-value --secret-id aegis-soc-env > .env
npm start
```

#### Application Load Balancer (ALB)
```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name aegis-soc-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx \
  --scheme internet-facing

# Create target group
aws elbv2 create-target-group \
  --name aegis-soc-api \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxxxx \
  --health-check-path /health

# Register targets (EC2 instances)
aws elbv2 register-targets \
  --target-group-arn arn:aws:elasticloadbalancing:... \
  --targets Id=i-xxxxx Id=i-yyyyy
```

### 2. S3 for Static Files
```bash
# Create S3 bucket
aws s3 mb s3://aegis-soc-static --region us-east-1

# Upload files
aws s3 cp frontend/build/ s3://aegis-soc-static/frontend/ --recursive

# Enable CloudFront CDN
aws cloudfront create-distribution \
  --origin-domain-name aegis-soc-static.s3.amazonaws.com \
  --default-root-object index.html
```

### 3. AWS Secrets Manager
```bash
# Store sensitive data
aws secretsmanager create-secret \
  --name aegis-soc-env \
  --secret-string file://env.json

# Access in application
import boto3
client = boto3.client('secretsmanager')
secret = client.get_secret_value(SecretId='aegis-soc-env')
```

### 4. ECR (Container Registry)
```bash
# Create ECR repository
aws ecr create-repository \
  --repository-name aegis-soc-api \
  --region us-east-1

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  123456789.dkr.ecr.us-east-1.amazonaws.com

# Push image
docker tag aegis-soc-api:latest \
  123456789.dkr.ecr.us-east-1.amazonaws.com/aegis-soc-api:latest
docker push \
  123456789.dkr.ecr.us-east-1.amazonaws.com/aegis-soc-api:latest
```

### 5. ECS Cluster
```bash
# Create ECS cluster
aws ecs create-cluster \
  --cluster-name aegis-soc-cluster

# Create task definition
aws ecs register-task-definition \
  --cli-input-json file://task-definition.json

# Create service
aws ecs create-service \
  --cluster aegis-soc-cluster \
  --service-name aegis-soc-api \
  --task-definition aegis-soc-api:1 \
  --desired-count 3 \
  --load-balancers targetGroupArn=arn:aws:...,containerName=api,containerPort=3000
```

### 6. RDS Automated Backups
```bash
# Enable automated backups
aws rds modify-db-instance \
  --db-instance-identifier aegis-soc-db \
  --backup-retention-period 30 \
  --preferred-backup-window "03:00-04:00" \
  --apply-immediately
```

### 7. CloudWatch Monitoring
```bash
# Create CloudWatch alarm for API
aws cloudwatch put-metric-alarm \
  --alarm-name aegis-soc-api-cpu \
  --alarm-description "Alert when API CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:123456789:alerts
```

---

## Azure Deployment

### 1. Azure Infrastructure Setup

#### Azure Database for PostgreSQL
```bash
# Create PostgreSQL server
az postgres server create \
  --resource-group aegis-rg \
  --name aegis-soc-db \
  --location eastus \
  --admin-user aegis_admin \
  --admin-password $(openssl rand -base64 32) \
  --sku-name B_Gen5_2 \
  --storage-size 51200 \
  --backup-retention 30 \
  --geo-redundant-backup Enabled

# Create database
az postgres db create \
  --resource-group aegis-rg \
  --server-name aegis-soc-db \
  --name aegis_soc

# Configure firewall
az postgres server firewall-rule create \
  --resource-group aegis-rg \
  --server-name aegis-soc-db \
  --name allow-azure-services \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

#### Azure Cache for Redis
```bash
# Create Redis cache
az redis create \
  --resource-group aegis-rg \
  --name aegis-soc-redis \
  --location eastus \
  --sku Standard \
  --vm-size c0 \
  --minimum-tls-version 1.2

# Get connection string
az redis list-keys \
  --resource-group aegis-rg \
  --name aegis-soc-redis
```

#### App Service
```bash
# Create App Service Plan
az appservice plan create \
  --name aegis-soc-plan \
  --resource-group aegis-rg \
  --sku P1V2 \
  --is-linux

# Create Web App
az webapp create \
  --resource-group aegis-rg \
  --plan aegis-soc-plan \
  --name aegis-soc-api \
  --runtime "NODE|16-lts"

# Deploy from GitHub
az webapp deployment github-actions add \
  --resource-group aegis-rg \
  --name aegis-soc-api \
  --repo your-repo \
  --branch main \
  --runtime "node" \
  --runtime-version "16"
```

#### Application Insights
```bash
# Create Application Insights
az monitor app-insights component create \
  --app aegis-soc-insights \
  --location eastus \
  --resource-group aegis-rg \
  --application-type web

# Get instrumentation key
az monitor app-insights component show \
  --resource-group aegis-rg \
  --app aegis-soc-insights \
  --query instrumentationKey
```

#### Azure Container Registry
```bash
# Create ACR
az acr create \
  --resource-group aegis-rg \
  --name aegissocregistry \
  --sku Standard

# Build and push image
az acr build \
  --registry aegissocregistry \
  --image aegis-soc-api:latest .

# Deploy to App Service
az webapp create \
  --resource-group aegis-rg \
  --plan aegis-soc-plan \
  --name aegis-soc-api \
  --deployment-container-image-name aegissocregistry.azurecr.io/aegis-soc-api:latest
```

### 2. Azure Key Vault
```bash
# Create Key Vault
az keyvault create \
  --name aegis-soc-kv \
  --resource-group aegis-rg \
  --location eastus

# Store secrets
az keyvault secret set \
  --vault-name aegis-soc-kv \
  --name DBPassword \
  --value $(openssl rand -base64 32)

az keyvault secret set \
  --vault-name aegis-soc-kv \
  --name JWTSecret \
  --value $(openssl rand -base64 32)

# Access in app
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient

credential = DefaultAzureCredential()
client = SecretClient(vault_url="https://aegis-soc-kv.vault.azure.net/", credential=credential)
secret = client.get_secret("DBPassword")
```

### 3. Azure Monitor & Alerts
```bash
# Create alert rule
az monitor metrics alert create \
  --name aegis-soc-cpu-alert \
  --resource-group aegis-rg \
  --scopes /subscriptions/{}/resourceGroups/aegis-rg/providers/Microsoft.Web/sites/aegis-soc-api \
  --condition "avg Percentage CPU > 80" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --actions /subscriptions/{}/resourcegroups/aegis-rg/providers/microsoft.insights/actiongroups/myactiongroup
```

---

## GCP Deployment

### 1. GCP Infrastructure Setup

#### Cloud SQL (PostgreSQL)
```bash
# Create Cloud SQL instance
gcloud sql instances create aegis-soc-db \
  --database-version POSTGRES_13 \
  --tier db-custom-2-8192 \
  --region us-central1 \
  --enable-bin-log \
  --backup-start-time 03:00 \
  --retained-backups-count 30

# Create database
gcloud sql databases create aegis_soc \
  --instance aegis-soc-db

# Create user
gcloud sql users create aegis_admin \
  --instance aegis-soc-db \
  --password $(openssl rand -base64 32)

# Get connection string
gcloud sql instances describe aegis-soc-db \
  --format='value(connectionName)'
```

#### Cloud Memorystore (Redis)
```bash
# Create Redis instance
gcloud redis instances create aegis-soc-redis \
  --size 1 \
  --region us-central1 \
  --redis-version 7.0

# Get host and port
gcloud redis instances describe aegis-soc-redis \
  --region us-central1 \
  --format='value(host,port)'
```

#### Cloud Run
```bash
# Deploy to Cloud Run
gcloud run deploy aegis-soc-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DB_HOST=cloudsql,DB_USER=aegis_admin \
  --memory 2Gi \
  --cpu 2 \
  --timeout 600 \
  --max-instances 100

# Get service URL
gcloud run services describe aegis-soc-api \
  --region us-central1 \
  --format='value(status.url)'
```

#### Cloud Load Balancing
```bash
# Create backend service
gcloud compute backend-services create aegis-soc-backend \
  --global \
  --protocol HTTP2 \
  --health-checks https \
  --load-balancing-scheme EXTERNAL

# Create URL map
gcloud compute url-maps create aegis-soc-lb \
  --default-service aegis-soc-backend

# Create HTTPS proxy
gcloud compute target-https-proxies create aegis-soc-proxy \
  --url-map aegis-soc-lb \
  --ssl-certificates aegis-soc-cert

# Create forwarding rule
gcloud compute forwarding-rules create aegis-soc-https \
  --global \
  --target-https-proxy aegis-soc-proxy \
  --address aegis-soc-ip \
  --ports 443
```

### 2. Secret Manager
```bash
# Store secrets
echo -n "your-jwt-secret" | gcloud secrets create JWT_SECRET \
  --data-file -

# Access in app
from google.cloud import secretmanager
client = secretmanager.SecretManagerServiceClient()
name = client.secret_version_path(project_id, "JWT_SECRET", "latest")
response = client.access_secret_version(request={"name": name})
secret_value = response.payload.data.decode("UTF-8")
```

### 3. Cloud Monitoring
```bash
# Create uptime check
gcloud monitoring uptime create aegis-soc-api \
  --display-name "AEGIS-SOC API Uptime" \
  --monitored-resource uptime-url \
  --host aegis-soc-api.run.app \
  --path /health \
  --period 60

# Create alert policy
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="AEGIS-SOC API Error Rate" \
  --condition-display-name="High error rate"
```

---

## Production Checklist

### Pre-Deployment

- [ ] Database backups configured and tested
- [ ] SSL/TLS certificates obtained (use Let's Encrypt or AWS ACM)
- [ ] Environment variables secured in Secrets Manager
- [ ] API rate limiting configured
- [ ] CORS properly configured
- [ ] Database connection pooling optimized
- [ ] Redis cache configured
- [ ] CDN setup for static files
- [ ] Email SMTP configured
- [ ] All integrations tested

### Deployment

- [ ] Database migrations run successfully
- [ ] Health checks passing
- [ ] Load balancer configured
- [ ] Auto-scaling policies set
- [ ] SSL certificates installed
- [ ] Domain DNS configured
- [ ] Email notifications working
- [ ] Backup automation running
- [ ] Monitoring dashboards created
- [ ] Alert thresholds configured

### Post-Deployment

- [ ] Test all critical paths
- [ ] Monitor error rates
- [ ] Check database performance
- [ ] Verify backup jobs
- [ ] Test incident response
- [ ] Load testing completed
- [ ] Security scanning passed
- [ ] Documentation updated
- [ ] Team trained on deployment
- [ ] Runbooks created

---

## Monitoring & Maintenance

### Health Checks

```bash
# API Health
curl https://api.aegis-soc.com/health

# Database Health
SELECT 1;

# Redis Health
redis-cli ping

# Response: PONG
```

### Log Aggregation

```bash
# CloudWatch Logs
aws logs tail /aws/ecs/aegis-soc-api --follow

# Azure Monitor
az monitor log-analytics query \
  --workspace aegis-soc-workspace \
  --analytics-query "AzureActivity | limit 10"

# GCP Cloud Logging
gcloud logging read "resource.type=cloud_run_revision" --limit 50
```

### Database Maintenance

```bash
# Weekly VACUUM
sudo -u postgres psql -d aegis_soc -c "VACUUM ANALYZE;"

# Monthly backup verification
pg_restore --list /backups/aegis_soc_backup.sql | head -20

# Quarterly index analysis
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY tablename;
```

### Performance Tuning

```sql
-- Find slow queries
SELECT query, calls, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check connection usage
SELECT count(*) FROM pg_stat_activity;

-- Monitor table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Automated Tasks

```bash
# Daily backup (crontab)
0 3 * * * /usr/bin/pg_dump -U aegis_admin aegis_soc > /backups/aegis_$(date +\%Y\%m\%d).sql

# Weekly index maintenance
0 2 * * 0 sudo -u postgres psql -d aegis_soc -c "VACUUM ANALYZE;"

# Monthly log cleanup
0 1 1 * * find /var/log -name "*.log" -mtime +90 -delete
```

---

## Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -h localhost -U aegis_admin -d aegis_soc

# Check firewall
sudo ufw allow 5432/tcp

# Verify credentials in .env
grep DB_ .env
```

#### High CPU Usage
```bash
# Monitor processes
top -u node

# Check Node.js memory
node --max-old-space-size=4096 server.js

# Profile with clinic.js
npm install -g clinic
clinic doctor -- node server.js
```

#### Redis Connection Issues
```bash
# Check Redis status
redis-cli ping

# Monitor Redis memory
redis-cli info memory

# Clear cache if needed
redis-cli FLUSHALL

# Check connection pool
redis-cli CLIENT LIST
```

#### SSL Certificate Errors
```bash
# Verify certificate
openssl x509 -in /path/to/cert.pem -text -noout

# Renew Let's Encrypt
certbot renew --dry-run

# Update in load balancer
aws elbv2 modify-listener \
  --listener-arn arn:aws:... \
  --certificates CertificateArn=arn:aws:acm:...
```

#### Out of Disk Space
```bash
# Check disk usage
df -h

# Find large files
du -sh /* | sort -hr

# Clean old backups
find /backups -name "*.sql" -mtime +30 -delete

# Compress logs
gzip /var/log/aegis-soc/*.log
```

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=debug
export DEBUG=aegis-soc:*

# Run with detailed output
node --inspect server.js

# Chrome DevTools: chrome://inspect
```

### Performance Issues

```bash
# Enable slow query logging
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();

# Check query plans
EXPLAIN ANALYZE SELECT * FROM incidents WHERE status = 'open';

# Monitor real-time activity
SELECT * FROM pg_stat_activity;
```

---

## SSL/TLS Configuration

### Let's Encrypt with Nginx

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --nginx -d api.aegis-soc.com

# Configure auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Verify renewal
sudo certbot renew --dry-run
```

### Nginx SSL Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name api.aegis-soc.com;

    ssl_certificate /etc/letsencrypt/live/api.aegis-soc.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.aegis-soc.com/privkey.pem;

    # SSL security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name api.aegis-soc.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Backup & Disaster Recovery

### Automated Backups

```bash
#!/bin/bash
# backup.sh - Daily automated backup

BACKUP_DIR="/backups"
DB_NAME="aegis_soc"
DB_USER="aegis_admin"
DATE=$(date +%Y%m%d_%H%M%S)

# PostgreSQL backup
pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/aegis_$DATE.sql

# Compress
gzip $BACKUP_DIR/aegis_$DATE.sql

# Upload to S3
aws s3 cp $BACKUP_DIR/aegis_$DATE.sql.gz s3://aegis-backups/

# Cleanup old backups (>30 days)
find $BACKUP_DIR -name "aegis_*.sql.gz" -mtime +30 -delete
```

### Restore from Backup

```bash
# List available backups
aws s3 ls s3://aegis-backups/

# Download backup
aws s3 cp s3://aegis-backups/aegis_20240101_120000.sql.gz .

# Decompress
gunzip aegis_20240101_120000.sql.gz

# Restore to database
psql -U aegis_admin aegis_soc < aegis_20240101_120000.sql

# Verify
psql -U aegis_admin -d aegis_soc -c "SELECT COUNT(*) FROM incidents;"
```

---

This deployment guide covers complete production setup from Docker containers to cloud platforms (AWS, Azure, GCP) with monitoring, maintenance, and disaster recovery procedures.
