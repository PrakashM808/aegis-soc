# AEGIS-SOC Database Schema Documentation

## Overview

Complete PostgreSQL database schema for enterprise cybersecurity operations platform with multi-tenancy, comprehensive audit logging, and compliance tracking.

**Database:** PostgreSQL 12+
**Size:** ~30+ tables with relationships
**Performance:** Optimized with 50+ indexes
**Scalability:** Designed for multi-tenant SaaS

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CORE ENTITIES                             │
├─────────────────────────────────────────────────────────────┤
│ Organizations (Multi-tenant)                                │
│ └── Users (RBAC: Admin, Analyst, Responder, Viewer)        │
│                                                              │
│ Incidents (Lifecycle: Open → Investigating → Resolved)      │
│ └── Timeline Events, Evidence, Containment Actions         │
│                                                              │
│ Threats (Detection & Intelligence)                         │
│ └── Indicators, Intelligence, Actor Info                  │
│                                                              │
│ Alerts (Real-time Events)                                  │
│ └── Evidence, Assignments, False Positive Tracking         │
│                                                              │
│ Assets (Monitoring Targets)                                │
│ └── Vulnerabilities, Software, Configuration               │
├─────────────────────────────────────────────────────────────┤
│ Automation & Integration                                    │
│ ├── Playbooks (Response Automation)                        │
│ ├── Integrations (SIEM, EDR, Email, Slack, etc.)          │
│ └── Notifications                                          │
├─────────────────────────────────────────────────────────────┤
│ Compliance & Governance                                     │
│ ├── Compliance Frameworks & Controls                       │
│ ├── Compliance Reports                                     │
│ └── Audit Logs & Activity Logs                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Tables

### 1. Organizations
```sql
-- Multi-tenant organization management
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(255) UNIQUE,
  slug VARCHAR(255) UNIQUE,
  tier VARCHAR(50), -- starter, professional, enterprise
  subscription_ends_at TIMESTAMP,
  ...
);
```

**Purpose:** Isolate data between customers  
**Relationships:** All other tables reference `organization_id`  
**Key Fields:**
- `tier` - Service level (affects feature access)
- `subscription_ends_at` - Billing/access control
- `max_users`, `max_incidents` - Resource limits

---

### 2. Users
```sql
-- Platform users with authentication & RBAC
CREATE TABLE users (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  role VARCHAR(50), -- admin, analyst, responder, viewer
  is_active BOOLEAN,
  mfa_enabled BOOLEAN,
  ...
);
```

**Purpose:** User authentication and access control  
**Key Fields:**
- `role` - Role-based permissions (admin > analyst > responder > viewer)
- `mfa_enabled` - Two-factor authentication
- `failed_login_attempts`, `locked_until` - Account lockout
- `notification_preferences` - User settings (email, Slack, SMS)

**Indexes:** email, organization_id, role, is_active

---

### 3. Incidents
```sql
-- Security incident management with lifecycle
CREATE TABLE incidents (
  id UUID PRIMARY KEY,
  organization_id UUID,
  incident_number VARCHAR(50) UNIQUE, -- INC-2024-XXXX
  status VARCHAR(50), -- open, investigating, contained, eradicated, resolved, closed
  severity VARCHAR(50), -- critical, high, medium, low, info
  type VARCHAR(50), -- malware, phishing, intrusion, exfiltration, etc.
  detected_at TIMESTAMP,
  contained_at TIMESTAMP,
  resolved_at TIMESTAMP,
  ...
);
```

**Purpose:** Core incident tracking and management  
**Status Workflow:**
```
open → investigating → contained → eradicated → resolved → closed
```

**Key Fields:**
- `incident_number` - Unique identifier (INC-2024-0847)
- `severity` - Risk level for prioritization
- `assigned_to` - Analyst assignment
- `sla_status` - Compliance with response SLAs
- `is_false_positive` - Quality tracking

**Related Tables:**
- `incident_timeline` - Event history (100+ events per incident)
- `incident_evidence` - Attachments and files
- `incident_containment` - Isolation actions

**Indexes:** organization_id, status, severity, assigned_to, created_at

---

### 4. Incident Timeline
```sql
-- Event history for incident
CREATE TABLE incident_timeline (
  id UUID PRIMARY KEY,
  incident_id UUID REFERENCES incidents(id),
  event_type VARCHAR(100), -- status_change, comment, attachment, action
  timestamp TIMESTAMP,
  actor_id UUID,
  description TEXT,
  ...
);
```

**Purpose:** Audit trail and forensic evidence  
**Event Types:**
- `status_change` - Status updates
- `comment` - Analyst notes
- `attachment` - Evidence upload
- `action` - Containment action
- `email_sent` - Notification sent

---

### 5. Threats
```sql
-- Threat detection and intelligence
CREATE TABLE threats (
  id UUID PRIMARY KEY,
  organization_id UUID,
  threat_number VARCHAR(50) UNIQUE, -- THR-2024-XXXX
  threat_type VARCHAR(100), -- malware, trojan, ransomware, apt, etc.
  threat_actor VARCHAR(255), -- APT group name
  severity VARCHAR(50),
  confidence INT, -- 0-100
  detected_at TIMESTAMP,
  ...
);
```

**Purpose:** Threat intelligence and detection tracking  
**Key Fields:**
- `threat_actor` - Attribution (e.g., "APT-28", "Wizard Spider")
- `cve_identifiers[]` - Associated CVEs
- `mitre_tactics[]` - MITRE ATT&CK tactics
- `confidence` - Detection confidence score
- `intelligence_sources[]` - VirusTotal, AlienVault, Shodan, etc.

**Related Tables:**
- `threat_indicators` - IOCs (hashes, IPs, domains, URLs)
- `threat_intelligence` - Additional intel and reports

**Indexes:** threat_type, threat_actor, severity, detected_at, cve_identifiers (GIN)

---

### 6. Threat Indicators
```sql
-- Indicators of Compromise (IOCs)
CREATE TABLE threat_indicators (
  id UUID PRIMARY KEY,
  threat_id UUID REFERENCES threats(id),
  indicator_type VARCHAR(50), -- hash, ip, domain, url, email, file_path, mutex, c2_address
  indicator_value VARCHAR(500), -- e.g., "192.168.1.100" or "a.exe:SHA256"
  tlp_level VARCHAR(50), -- white, green, amber, red
  confidence INT,
  source VARCHAR(255), -- VirusTotal, MISP, private intel
  ...
);
```

**Purpose:** Searchable indicators for threat hunting  
**Indicator Types:**
- `hash` - MD5, SHA1, SHA256, SSDEEP
- `ip` - IPv4/IPv6 address
- `domain` - Domain name
- `url` - Full URL
- `email` - Email address
- `file_path` - Windows/Linux file path
- `registry_key` - Windows registry key
- `mutex` - Malware mutex name
- `c2_address` - Command & Control server

---

### 7. Alerts
```sql
-- Real-time security alerts
CREATE TABLE alerts (
  id UUID PRIMARY KEY,
  organization_id UUID,
  alert_number VARCHAR(50) UNIQUE, -- ALT-2024-XXXX
  severity VARCHAR(50),
  status VARCHAR(50), -- new, acknowledged, investigating, resolved, false_positive
  source_system VARCHAR(255), -- SIEM, EDR, WAF, Email Gateway
  affected_asset_id VARCHAR(255),
  user_involved VARCHAR(255),
  src_ip VARCHAR(45),
  dest_ip VARCHAR(45),
  ...
);
```

**Purpose:** Real-time alert ingestion and triage  
**Status Workflow:**
```
new → acknowledged → investigating → (resolved OR false_positive)
```

**Key Fields:**
- `source_system` - Origin (Splunk, CrowdStrike, Proofpoint, etc.)
- `trigger_count` - How many times triggered
- `playbook_triggered` - Auto-response execution
- `assigned_incident_id` - Grouping with incidents
- `sla_status` - Response time tracking

**Indexes:** status, severity, created_at, affected_asset_id

---

### 8. Assets
```sql
-- Monitored infrastructure
CREATE TABLE assets (
  id UUID PRIMARY KEY,
  organization_id UUID,
  asset_type VARCHAR(100), -- host, user, network, application, database, cloud_resource
  asset_name VARCHAR(500),
  asset_value VARCHAR(500), -- IP, hostname, username, resource ARN
  criticality VARCHAR(50), -- critical, high, medium, low
  environment VARCHAR(50), -- production, staging, development
  ...
);
```

**Purpose:** Asset inventory and vulnerability tracking  
**Related Tables:**
- `asset_vulnerability` - CVE tracking and remediation

---

### 9. Playbooks
```sql
-- Automated incident response
CREATE TABLE playbooks (
  id UUID PRIMARY KEY,
  organization_id UUID,
  name VARCHAR(500),
  playbook_type VARCHAR(50), -- detection, containment, eradication, recovery
  trigger_type VARCHAR(50), -- alert, incident, threat, manual
  trigger_conditions JSONB, -- {"severity": "critical", "type": "malware"}
  enabled BOOLEAN,
  auto_execute BOOLEAN,
  ...
);
```

**Purpose:** SOAR automation workflows  
**Example Playbook:**
```json
{
  "name": "Ransomware Response",
  "trigger_type": "alert",
  "trigger_conditions": {
    "alert_type": "ransomware",
    "severity": "critical"
  },
  "auto_execute": true,
  "actions": [
    {"type": "isolate_host", "target": "${asset_id}"},
    {"type": "send_notification", "channel": "slack"},
    {"type": "create_incident", "severity": "critical"}
  ]
}
```

**Related Tables:**
- `playbook_actions` - Individual response steps
- `playbook_executions` - Execution history and logs

---

### 10. Integrations
```sql
-- Third-party tool connections
CREATE TABLE integrations (
  id UUID PRIMARY KEY,
  organization_id UUID,
  integration_type VARCHAR(50), -- siem, edr, email, ticketing, communication
  provider VARCHAR(255), -- Splunk, CrowdStrike, Jira, Slack, etc.
  api_key_encrypted VARCHAR(500),
  webhook_url VARCHAR(500),
  enabled BOOLEAN,
  last_sync_at TIMESTAMP,
  ...
);
```

**Purpose:** Data ingestion and action execution  
**Supported Types:**
- SIEM: Splunk, ELK, Sumo Logic
- EDR: CrowdStrike, Microsoft Defender, SentinelOne
- Email: Microsoft 365, Gmail, Proofpoint
- Ticketing: Jira, ServiceNow, Zendesk
- Communication: Slack, Teams, Discord
- Cloud: AWS, Azure, GCP
- Threat Intel: VirusTotal, AlienVault, Shodan

**Related Tables:**
- `integration_logs` - Sync history and errors

---

### 11. Compliance
```sql
-- Compliance framework tracking
CREATE TABLE compliance_frameworks (
  id UUID PRIMARY KEY,
  framework_name VARCHAR(100), -- GDPR, HIPAA, PCI-DSS, SOX, NIST, CIS, ISO27001
  is_applicable BOOLEAN,
  assessment_frequency VARCHAR(50), -- quarterly, semi_annual, annual
  ...
);

CREATE TABLE compliance_controls (
  id UUID PRIMARY KEY,
  framework_id UUID,
  control_id VARCHAR(50), -- e.g., "PCI-DSS-1.1"
  status VARCHAR(50), -- compliant, partial, non_compliant, not_assessed
  ...
);

CREATE TABLE compliance_reports (
  id UUID PRIMARY KEY,
  framework_id UUID,
  overall_compliance_score INT, -- 0-100
  critical_findings INT,
  major_findings INT,
  minor_findings INT,
  ...
);
```

**Purpose:** Compliance management and reporting  
**Features:**
- Control mapping
- Evidence attachment
- Automated assessments
- Executive reports

---

### 12. Audit & Activity Logs
```sql
-- System audit trail
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  organization_id UUID,
  user_id UUID,
  action VARCHAR(255), -- create, read, update, delete, export, share
  entity_type VARCHAR(100), -- incident, threat, alert, playbook, user
  entity_id VARCHAR(255),
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP,
  ...
);

CREATE TABLE activity_logs (
  id UUID PRIMARY KEY,
  organization_id UUID,
  user_id UUID,
  activity_type VARCHAR(100), -- login, logout, view, export
  resource_type VARCHAR(100),
  created_at TIMESTAMP,
  ...
);
```

**Purpose:** Compliance and security auditing  
**Retention:** 7 years (configurable)

---

## Key Design Features

### 1. Multi-Tenancy
```sql
-- All tables include organization_id for data isolation
ALTER TABLE incidents ADD CONSTRAINT 
  UNIQUE (organization_id, incident_number);
```

### 2. Soft Deletes
```sql
-- Preserve audit trail
ALTER TABLE incidents ADD deleted_at TIMESTAMP;
SELECT * FROM incidents WHERE deleted_at IS NULL;
```

### 3. JSON/JSONB Fields
```sql
-- Flexible schema for extensibility
timeline_events JSONB, -- Timeline data
trigger_conditions JSONB, -- Playbook conditions
raw_event JSONB, -- Original alert event
metadata JSONB -- Custom fields
```

### 4. UUID Primary Keys
```sql
-- Distributed systems friendly
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
```

### 5. Comprehensive Indexing
```sql
-- 50+ indexes for performance
idx_incidents_organization_id
idx_incidents_status
idx_incidents_severity
idx_incidents_created_at
idx_incidents_tags (GIN for array searches)
idx_incidents_title_search (Full-text search)
idx_incidents_org_status_severity (Composite)
```

### 6. Audit Triggers
```sql
-- Auto-update timestamps
CREATE TRIGGER trigger_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 7. Materialized Views
```sql
-- Pre-calculated metrics for dashboards
CREATE MATERIALIZED VIEW mv_incident_summary AS
SELECT organization_id,
       COUNT(*) as total_incidents,
       COUNT(CASE WHEN status = 'open' THEN 1 END) as open_incidents,
       ...
```

---

## Query Examples

### Find Critical Open Incidents
```sql
SELECT incident_number, title, severity, assigned_to, created_at
FROM incidents
WHERE organization_id = $1
  AND status = 'open'
  AND severity = 'critical'
ORDER BY created_at DESC;
```

### Search for Malware Indicators
```sql
SELECT t.threat_number, t.name, ti.indicator_value
FROM threats t
JOIN threat_indicators ti ON t.id = ti.threat_id
WHERE t.organization_id = $1
  AND ti.indicator_type = 'hash'
  AND ti.indicator_value = $2;
```

### Get Incident Timeline
```sql
SELECT event_type, timestamp, actor_name, description
FROM incident_timeline
WHERE incident_id = $1
ORDER BY timestamp DESC;
```

### Compliance Status Report
```sql
SELECT 
  cf.framework_name,
  COUNT(cc.id) as total_controls,
  COUNT(CASE WHEN cc.status = 'compliant' THEN 1 END) as compliant,
  ROUND(100.0 * COUNT(CASE WHEN cc.status = 'compliant' THEN 1 END) / COUNT(cc.id), 1) as compliance_score
FROM compliance_frameworks cf
LEFT JOIN compliance_controls cc ON cf.id = cc.framework_id
WHERE cf.organization_id = $1
GROUP BY cf.framework_name;
```

---

## Performance Optimization

### Connection Pooling
```
-- config/database.js
pool: {
  max: 10,
  min: 2,
  acquire: 30000,
  idle: 10000,
}
```

### Index Strategy
- Equality filters: Single-column indexes
- Range queries: Composite indexes
- Array searches: GIN indexes (tags)
- Full-text search: GiST/GIN on tsvector
- Hot queries: Covering indexes

### Query Optimization
- Use EXPLAIN ANALYZE for slow queries
- Refresh materialized views nightly
- Archive old incidents to separate tables
- Implement table partitioning for time-series data

---

## Maintenance & Backups

### Automated Backups
```bash
# Daily backups
pg_dump -U aegis_admin -d aegis_soc > /backups/aegis_soc_$(date +%Y%m%d).sql

# Weekly retention
find /backups -name "aegis_soc_*.sql" -mtime +30 -delete
```

### Refresh Materialized Views
```sql
-- Run nightly
SELECT refresh_all_materialized_views();
```

### Vacuum & Analyze
```sql
-- Weekly maintenance
VACUUM ANALYZE;
```

---

## Deployment Steps

```bash
# 1. Create database
createdb -U aegis_admin aegis_soc

# 2. Load schema
psql -U aegis_admin -d aegis_soc -f database_schema.sql

# 3. Verify
psql -U aegis_admin -d aegis_soc -c "\dt"

# 4. Create user role (if needed)
psql -U postgres -c "CREATE ROLE app_user WITH LOGIN PASSWORD 'secure_password';"
psql -U postgres -c "GRANT CONNECT ON DATABASE aegis_soc TO app_user;"
```

---

## Security Considerations

✅ Row-level security (RLS) for multi-tenancy  
✅ Encrypted sensitive fields (API keys, secrets)  
✅ Audit logging for all changes  
✅ SSL/TLS for database connections  
✅ Regular backups with encryption  
✅ GDPR compliance (data retention, deletion)  
✅ Principle of least privilege (user roles)  

---

This schema supports a production-grade cybersecurity platform handling 100K+ incidents and millions of alerts annually.
