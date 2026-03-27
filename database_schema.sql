/**
 * AEGIS-SOC Database Schema
 * PostgreSQL 12+
 * 
 * Complete database structure for enterprise cybersecurity platform
 */

-- ============================================================
-- DATABASE SETUP
-- ============================================================

-- Create database (run separately if needed)
-- CREATE DATABASE aegis_soc 
--   WITH OWNER aegis_admin 
--   ENCODING 'UTF8' 
--   LC_COLLATE 'en_US.UTF-8' 
--   LC_CTYPE 'en_US.UTF-8';

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ORGANIZATIONS & USERS
-- ============================================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  logo_url VARCHAR(500),
  website VARCHAR(255),
  industry VARCHAR(100),
  size VARCHAR(50),
  tier VARCHAR(50) DEFAULT 'professional', -- starter, professional, enterprise
  max_users INT DEFAULT 100,
  max_incidents INT DEFAULT 10000,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  billing_email VARCHAR(255),
  billing_status VARCHAR(50) DEFAULT 'active', -- active, suspended, cancelled
  subscription_ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_is_active ON organizations(is_active);
CREATE INDEX idx_organizations_billing_status ON organizations(billing_status);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url VARCHAR(500),
  role VARCHAR(50) NOT NULL DEFAULT 'analyst', -- admin, analyst, responder, viewer
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  last_login TIMESTAMP,
  last_login_ip VARCHAR(45),
  last_login_user_agent TEXT,
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP,
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_secret VARCHAR(255),
  mfa_backup_codes TEXT[],
  timezone VARCHAR(100) DEFAULT 'UTC',
  notification_preferences JSONB DEFAULT '{"email": true, "slack": false, "sms": false}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ============================================================
-- INCIDENTS
-- ============================================================

CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  incident_number VARCHAR(50) NOT NULL UNIQUE, -- INC-2024-XXXX
  title VARCHAR(500) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- malware, phishing, intrusion, exfiltration, lateral_movement, privilege_escalation, other
  severity VARCHAR(50) NOT NULL, -- critical, high, medium, low, info
  status VARCHAR(50) NOT NULL DEFAULT 'open', -- open, investigating, contained, eradicated, resolved, closed
  priority INT DEFAULT 5, -- 1-5, where 1 is highest
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  affected_asset_count INT DEFAULT 0,
  detected_at TIMESTAMP NOT NULL,
  confirmed_at TIMESTAMP,
  contained_at TIMESTAMP,
  eradicated_at TIMESTAMP,
  resolved_at TIMESTAMP,
  closed_at TIMESTAMP,
  detection_method VARCHAR(255), -- Manual, Automated, SIEM, EDR, Email Gateway, etc.
  source_system VARCHAR(255), -- Which system detected it
  business_impact TEXT,
  root_cause TEXT,
  lessons_learned TEXT,
  recovery_time_minutes INT,
  affected_users_count INT,
  affected_systems_count INT,
  is_false_positive BOOLEAN DEFAULT false,
  requires_notification BOOLEAN DEFAULT false,
  notification_status VARCHAR(50), -- pending, sent, failed
  sla_status VARCHAR(50) DEFAULT 'on_track', -- on_track, at_risk, violated
  external_ticket_id VARCHAR(255),
  tags VARCHAR(100)[] DEFAULT ARRAY[]::varchar[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_incidents_organization_id ON incidents(organization_id);
CREATE INDEX idx_incidents_incident_number ON incidents(incident_number);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_type ON incidents(type);
CREATE INDEX idx_incidents_assigned_to ON incidents(assigned_to);
CREATE INDEX idx_incidents_created_by ON incidents(created_by);
CREATE INDEX idx_incidents_detected_at ON incidents(detected_at);
CREATE INDEX idx_incidents_created_at ON incidents(created_at);
CREATE INDEX idx_incidents_tags ON incidents USING gin(tags);

CREATE TABLE incident_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL, -- status_change, comment, attachment, action, email_sent, etc.
  title VARCHAR(255) NOT NULL,
  description TEXT,
  action_taken VARCHAR(500),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_name VARCHAR(255),
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_incident_timeline_incident_id ON incident_timeline(incident_id);
CREATE INDEX idx_incident_timeline_timestamp ON incident_timeline(timestamp);

CREATE TABLE incident_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  evidence_type VARCHAR(100) NOT NULL, -- file, screenshot, log, email, network_traffic, etc.
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_name VARCHAR(255),
  file_path VARCHAR(500),
  file_size BIGINT,
  file_hash VARCHAR(255), -- SHA256
  mime_type VARCHAR(100),
  is_sensitive BOOLEAN DEFAULT false,
  retention_until TIMESTAMP,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_incident_evidence_incident_id ON incident_evidence(incident_id);
CREATE INDEX idx_incident_evidence_evidence_type ON incident_evidence(evidence_type);

CREATE TABLE incident_containment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  action_name VARCHAR(255) NOT NULL,
  description TEXT,
  action_status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, failed
  initiated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  result_details JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_incident_containment_incident_id ON incident_containment(incident_id);

-- ============================================================
-- THREATS
-- ============================================================

CREATE TABLE threats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  threat_number VARCHAR(50) NOT NULL UNIQUE, -- THR-2024-XXXX
  name VARCHAR(500) NOT NULL,
  description TEXT,
  threat_type VARCHAR(100) NOT NULL, -- malware, trojan, ransomware, worm, botnet, apt, zero_day, vulnerability, phishing, etc.
  threat_family VARCHAR(255), -- e.g., "Emotet", "Ryuk", "Wannacry"
  threat_actor VARCHAR(255), -- APT group or threat actor name
  threat_actor_aliases VARCHAR(255)[] DEFAULT ARRAY[]::varchar[],
  threat_actor_country VARCHAR(100),
  cve_identifiers VARCHAR(50)[] DEFAULT ARRAY[]::varchar[], -- CVE-XXXX-XXXXX
  severity VARCHAR(50) NOT NULL DEFAULT 'medium', -- critical, high, medium, low
  confidence INT DEFAULT 50, -- 0-100 confidence level
  status VARCHAR(50) NOT NULL DEFAULT 'detected', -- detected, confirmed, contained, mitigated, resolved
  source_ip VARCHAR(45),
  source_country VARCHAR(100),
  source_asn VARCHAR(50),
  target_industry VARCHAR(100),
  target_geography VARCHAR(255)[] DEFAULT ARRAY[]::varchar[],
  first_seen TIMESTAMP,
  last_seen TIMESTAMP,
  detected_at TIMESTAMP NOT NULL,
  detection_method VARCHAR(255), -- Signature, Behavioral, ML, Manual, Threat Intel, etc.
  detection_source VARCHAR(255), -- SIEM, EDR, Email, Network, Web, etc.
  related_incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
  intelligence_sources VARCHAR(255)[] DEFAULT ARRAY[]::varchar[], -- VirusTotal, AlienVault, Shodan, etc.
  mitre_tactics VARCHAR(100)[] DEFAULT ARRAY[]::varchar[], -- reconnaissance, resource_development, initial_access, etc.
  mitre_techniques VARCHAR(100)[] DEFAULT ARRAY[]::varchar[],
  tags VARCHAR(100)[] DEFAULT ARRAY[]::varchar[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_threats_organization_id ON threats(organization_id);
CREATE INDEX idx_threats_threat_number ON threats(threat_number);
CREATE INDEX idx_threats_threat_type ON threats(threat_type);
CREATE INDEX idx_threats_threat_actor ON threats(threat_actor);
CREATE INDEX idx_threats_severity ON threats(severity);
CREATE INDEX idx_threats_status ON threats(status);
CREATE INDEX idx_threats_detected_at ON threats(detected_at);
CREATE INDEX idx_threats_cve_identifiers ON threats USING gin(cve_identifiers);
CREATE INDEX idx_threats_mitre_tactics ON threats USING gin(mitre_tactics);
CREATE INDEX idx_threats_tags ON threats USING gin(tags);

CREATE TABLE threat_indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  threat_id UUID NOT NULL REFERENCES threats(id) ON DELETE CASCADE,
  indicator_type VARCHAR(50) NOT NULL, -- hash (md5, sha1, sha256, ssdeep), ip, domain, url, email, file_path, registry_key, mutex, c2_address
  indicator_value VARCHAR(500) NOT NULL,
  tlp_level VARCHAR(50) DEFAULT 'white', -- white, green, amber, red
  confidence INT DEFAULT 50, -- 0-100
  source VARCHAR(255), -- VirusTotal, MISP, Private Intel, etc.
  first_seen TIMESTAMP,
  last_seen TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_threat_indicators_threat_id ON threat_indicators(threat_id);
CREATE INDEX idx_threat_indicators_type ON threat_indicators(indicator_type);
CREATE INDEX idx_threat_indicators_value ON threat_indicators(indicator_value);

CREATE TABLE threat_intelligence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  threat_id UUID NOT NULL REFERENCES threats(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  content TEXT,
  source VARCHAR(255),
  source_url VARCHAR(500),
  published_at TIMESTAMP,
  tlp_level VARCHAR(50) DEFAULT 'white',
  severity VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_threat_intelligence_threat_id ON threat_intelligence(threat_id);

-- ============================================================
-- ALERTS
-- ============================================================

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  alert_number VARCHAR(50) NOT NULL UNIQUE, -- ALT-2024-XXXX
  title VARCHAR(500) NOT NULL,
  description TEXT,
  alert_type VARCHAR(100) NOT NULL, -- malware, intrusion, anomaly, policy_violation, configuration_drift, etc.
  severity VARCHAR(50) NOT NULL DEFAULT 'medium', -- critical, high, medium, low, info
  status VARCHAR(50) NOT NULL DEFAULT 'new', -- new, acknowledged, investigating, resolved, false_positive, duplicate
  source_system VARCHAR(255), -- SIEM, EDR, WAF, Email Gateway, etc.
  source_event_id VARCHAR(255),
  affected_asset_type VARCHAR(100), -- host, user, network_segment, application, database, etc.
  affected_asset_id VARCHAR(255),
  affected_asset_name VARCHAR(500),
  user_involved VARCHAR(255),
  src_ip VARCHAR(45),
  src_hostname VARCHAR(255),
  dest_ip VARCHAR(45),
  dest_hostname VARCHAR(255),
  dest_port INT,
  protocol VARCHAR(50),
  action VARCHAR(100), -- allowed, denied, blocked, quarantined, etc.
  first_triggered TIMESTAMP NOT NULL,
  last_triggered TIMESTAMP,
  trigger_count INT DEFAULT 1,
  acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMP,
  investigated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP,
  root_cause TEXT,
  resolution_steps TEXT,
  false_positive_reason TEXT,
  duplicate_of_id UUID REFERENCES alerts(id) ON DELETE SET NULL,
  assigned_incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
  playbook_triggered BOOLEAN DEFAULT false,
  playbook_id UUID,
  playbook_status VARCHAR(50),
  external_ticket_id VARCHAR(255),
  sla_status VARCHAR(50) DEFAULT 'on_track', -- on_track, at_risk, violated
  tags VARCHAR(100)[] DEFAULT ARRAY[]::varchar[],
  raw_event JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_alerts_organization_id ON alerts(organization_id);
CREATE INDEX idx_alerts_alert_number ON alerts(alert_number);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_alert_type ON alerts(alert_type);
CREATE INDEX idx_alerts_source_system ON alerts(source_system);
CREATE INDEX idx_alerts_affected_asset_id ON alerts(affected_asset_id);
CREATE INDEX idx_alerts_user_involved ON alerts(user_involved);
CREATE INDEX idx_alerts_first_triggered ON alerts(first_triggered);
CREATE INDEX idx_alerts_tags ON alerts USING gin(tags);

CREATE TABLE alert_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  evidence_type VARCHAR(100) NOT NULL, -- log, pcap, screenshot, payload, etc.
  content TEXT,
  file_path VARCHAR(500),
  file_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alert_evidence_alert_id ON alert_evidence(alert_id);

-- ============================================================
-- ASSETS
-- ============================================================

CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_type VARCHAR(100) NOT NULL, -- host, user, network, application, database, cloud_resource, etc.
  asset_name VARCHAR(500) NOT NULL,
  asset_value VARCHAR(500), -- IP, hostname, username, resource ARN, etc.
  description TEXT,
  owner_name VARCHAR(255),
  owner_email VARCHAR(255),
  location VARCHAR(255),
  criticality VARCHAR(50) DEFAULT 'medium', -- critical, high, medium, low
  business_unit VARCHAR(255),
  environment VARCHAR(50), -- production, staging, development, test
  platform VARCHAR(100), -- windows, linux, macos, cloud, network, application, etc.
  operating_system VARCHAR(255),
  os_version VARCHAR(100),
  installed_software VARCHAR(500)[] DEFAULT ARRAY[]::varchar[],
  last_scanned TIMESTAMP,
  last_patched TIMESTAMP,
  vulnerabilities_count INT DEFAULT 0,
  critical_vulnerabilities INT DEFAULT 0,
  is_monitored BOOLEAN DEFAULT true,
  tags VARCHAR(100)[] DEFAULT ARRAY[]::varchar[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_assets_organization_id ON assets(organization_id);
CREATE INDEX idx_assets_asset_type ON assets(asset_type);
CREATE INDEX idx_assets_criticality ON assets(criticality);
CREATE INDEX idx_assets_environment ON assets(environment);
CREATE INDEX idx_assets_tags ON assets USING gin(tags);

CREATE TABLE asset_vulnerability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  cve_identifier VARCHAR(50) NOT NULL,
  vulnerability_name VARCHAR(500),
  severity VARCHAR(50),
  cvss_score DECIMAL(3,1),
  cvss_vector VARCHAR(500),
  discovered_at TIMESTAMP,
  remediated_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'open', -- open, in_progress, remediated
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_asset_vulnerability_asset_id ON asset_vulnerability(asset_id);
CREATE INDEX idx_asset_vulnerability_cve ON asset_vulnerability(cve_identifier);

-- ============================================================
-- PLAYBOOKS & AUTOMATION
-- ============================================================

CREATE TABLE playbooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(500) NOT NULL,
  description TEXT,
  playbook_type VARCHAR(50) NOT NULL, -- detection, containment, eradication, recovery, notification, etc.
  trigger_type VARCHAR(50) NOT NULL, -- alert, incident, threat, threat_intel, manual, schedule
  trigger_conditions JSONB NOT NULL DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  auto_execute BOOLEAN DEFAULT false,
  execution_order INT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  requires_approval BOOLEAN DEFAULT false,
  approval_users UUID[] DEFAULT ARRAY[]::uuid[],
  timeout_minutes INT DEFAULT 30,
  retry_on_failure BOOLEAN DEFAULT true,
  max_retries INT DEFAULT 3,
  notifiers VARCHAR(255)[] DEFAULT ARRAY[]::varchar[], -- slack, email, sms, etc.
  tags VARCHAR(100)[] DEFAULT ARRAY[]::varchar[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_playbooks_organization_id ON playbooks(organization_id);
CREATE INDEX idx_playbooks_enabled ON playbooks(enabled);
CREATE INDEX idx_playbooks_playbook_type ON playbooks(playbook_type);

CREATE TABLE playbook_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playbook_id UUID NOT NULL REFERENCES playbooks(id) ON DELETE CASCADE,
  action_sequence INT NOT NULL,
  action_type VARCHAR(100) NOT NULL, -- run_script, api_call, send_notification, update_incident, isolate_host, block_ip, kill_process, etc.
  action_name VARCHAR(255) NOT NULL,
  description TEXT,
  target_system VARCHAR(255),
  action_config JSONB NOT NULL DEFAULT '{}',
  is_conditional BOOLEAN DEFAULT false,
  condition_config JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_playbook_actions_playbook_id ON playbook_actions(playbook_id);

CREATE TABLE playbook_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playbook_id UUID NOT NULL REFERENCES playbooks(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  trigger_incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
  trigger_alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL,
  trigger_threat_id UUID REFERENCES threats(id) ON DELETE SET NULL,
  triggered_by_user UUID REFERENCES users(id) ON DELETE SET NULL,
  execution_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, running, completed, failed, cancelled
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  duration_seconds INT,
  actions_executed INT DEFAULT 0,
  actions_failed INT DEFAULT 0,
  output_log TEXT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_playbook_executions_playbook_id ON playbook_executions(playbook_id);
CREATE INDEX idx_playbook_executions_organization_id ON playbook_executions(organization_id);
CREATE INDEX idx_playbook_executions_execution_status ON playbook_executions(execution_status);

-- ============================================================
-- INTEGRATIONS
-- ============================================================

CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(500) NOT NULL,
  integration_type VARCHAR(50) NOT NULL, -- siem, edr, email, ticketing, communication, cloud, threat_intel, network, deception, etc.
  provider VARCHAR(255) NOT NULL, -- Splunk, CrowdStrike, Slack, Jira, AWS, Azure, etc.
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  api_version VARCHAR(50),
  base_url VARCHAR(500),
  api_key_encrypted VARCHAR(500),
  api_secret_encrypted VARCHAR(500),
  webhook_url VARCHAR(500),
  webhook_secret VARCHAR(255),
  authentication_type VARCHAR(50), -- api_key, oauth, basic_auth, custom
  test_connection_status VARCHAR(50), -- success, failed, untested
  last_tested_at TIMESTAMP,
  last_sync_at TIMESTAMP,
  sync_frequency VARCHAR(50), -- real_time, hourly, daily, weekly, manual
  field_mappings JSONB DEFAULT '{}',
  config_options JSONB DEFAULT '{}',
  rate_limit INT,
  is_primary BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_integrations_organization_id ON integrations(organization_id);
CREATE INDEX idx_integrations_integration_type ON integrations(integration_type);
CREATE INDEX idx_integrations_provider ON integrations(provider);
CREATE INDEX idx_integrations_enabled ON integrations(enabled);

CREATE TABLE integration_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  action VARCHAR(255) NOT NULL, -- fetch_data, send_event, test_connection, etc.
  status VARCHAR(50) NOT NULL, -- success, failed, partial
  request_details JSONB DEFAULT '{}',
  response_details JSONB DEFAULT '{}',
  error_message TEXT,
  duration_ms INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_integration_logs_integration_id ON integration_logs(integration_id);
CREATE INDEX idx_integration_logs_created_at ON integration_logs(created_at);

-- ============================================================
-- COMPLIANCE & REPORTING
-- ============================================================

CREATE TABLE compliance_frameworks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  framework_name VARCHAR(100) NOT NULL, -- GDPR, HIPAA, PCI-DSS, SOX, NIST, CIS, ISO27001, etc.
  framework_version VARCHAR(50),
  is_applicable BOOLEAN DEFAULT true,
  assessment_frequency VARCHAR(50) DEFAULT 'quarterly', -- quarterly, semi_annual, annual
  last_assessment TIMESTAMP,
  next_assessment TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_compliance_frameworks_organization_id ON compliance_frameworks(organization_id);

CREATE TABLE compliance_controls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  framework_id UUID NOT NULL REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
  control_id VARCHAR(50) NOT NULL,
  control_name VARCHAR(500) NOT NULL,
  control_description TEXT,
  requirement TEXT,
  status VARCHAR(50) DEFAULT 'not_assessed', -- compliant, partial, non_compliant, not_assessed
  responsible_user UUID REFERENCES users(id) ON DELETE SET NULL,
  evidence_items UUID[],
  last_assessed TIMESTAMP,
  assessment_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_compliance_controls_framework_id ON compliance_controls(framework_id);

CREATE TABLE compliance_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  framework_id UUID REFERENCES compliance_frameworks(id) ON DELETE SET NULL,
  report_name VARCHAR(500) NOT NULL,
  report_type VARCHAR(50) NOT NULL, -- full_assessment, audit, executive_summary, detailed
  status VARCHAR(50) DEFAULT 'draft', -- draft, in_review, approved, published, archived
  summary_findings TEXT,
  critical_findings INT,
  major_findings INT,
  minor_findings INT,
  overall_compliance_score INT,
  generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP,
  published_at TIMESTAMP,
  file_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_compliance_reports_organization_id ON compliance_reports(organization_id);
CREATE INDEX idx_compliance_reports_framework_id ON compliance_reports(framework_id);
CREATE INDEX idx_compliance_reports_status ON compliance_reports(status);

-- ============================================================
-- AUDIT & LOGGING
-- ============================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL, -- create, read, update, delete, export, share, etc.
  entity_type VARCHAR(100) NOT NULL, -- incident, threat, alert, playbook, integration, user, etc.
  entity_id VARCHAR(255),
  entity_name VARCHAR(500),
  old_values JSONB DEFAULT '{}',
  new_values JSONB DEFAULT '{}',
  changes_description TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(50) DEFAULT 'success', -- success, failed
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  activity_type VARCHAR(100) NOT NULL, -- login, logout, view, export, share, etc.
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  resource_name VARCHAR(500),
  description TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(50) DEFAULT 'success',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_organization_id ON activity_logs(organization_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- ============================================================
-- NOTIFICATIONS & COMMUNICATION
-- ============================================================

CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(500) NOT NULL,
  template_type VARCHAR(50) NOT NULL, -- alert, incident, threat, escalation, daily_summary, etc.
  subject VARCHAR(500),
  body TEXT NOT NULL,
  template_variables VARCHAR(100)[],
  channels VARCHAR(50)[] NOT NULL, -- email, slack, sms, teams, etc.
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notification_templates_organization_id ON notification_templates(organization_id);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(20),
  notification_type VARCHAR(100) NOT NULL,
  subject VARCHAR(500),
  message TEXT,
  channel VARCHAR(50) NOT NULL, -- email, slack, sms, in_app
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed, bounced, read
  related_incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
  related_alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL,
  retry_count INT DEFAULT 0,
  last_error TEXT,
  sent_at TIMESTAMP,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_organization_id ON notifications(organization_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- ============================================================
-- CUSTOM FIELDS & METADATA
-- ============================================================

CREATE TABLE custom_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type VARCHAR(100) NOT NULL, -- incident, alert, threat, asset, etc.
  field_name VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) NOT NULL, -- text, number, date, select, multiselect, checkbox, etc.
  field_label VARCHAR(255),
  field_description TEXT,
  field_options VARCHAR(255)[] DEFAULT ARRAY[]::varchar[], -- For select/multiselect
  is_required BOOLEAN DEFAULT false,
  is_visible BOOLEAN DEFAULT true,
  display_order INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, entity_type, field_name)
);

CREATE INDEX idx_custom_fields_organization_id ON custom_fields(organization_id);

-- ============================================================
-- VIEWS & DASHBOARDS
-- ============================================================

CREATE TABLE dashboard_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  view_type VARCHAR(50) NOT NULL, -- personal, team, organization
  description TEXT,
  widgets JSONB DEFAULT '[]',
  filters JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_dashboard_views_organization_id ON dashboard_views(organization_id);
CREATE INDEX idx_dashboard_views_user_id ON dashboard_views(user_id);

-- ============================================================
-- SAVED SEARCHES & FILTERS
-- ============================================================

CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  search_entity VARCHAR(100) NOT NULL, -- incidents, alerts, threats, assets
  filters JSONB NOT NULL DEFAULT '{}',
  sort_by VARCHAR(100),
  sort_order VARCHAR(10) DEFAULT 'DESC',
  is_favorite BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false,
  shared_with UUID[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_saved_searches_organization_id ON saved_searches(organization_id);
CREATE INDEX idx_saved_searches_user_id ON saved_searches(user_id);

-- ============================================================
-- PERFORMANCE INDEXES & OPTIMIZATION
-- ============================================================

-- Full-text search indexes
CREATE INDEX idx_incidents_title_search ON incidents USING gin(
  to_tsvector('english', title || ' ' || COALESCE(description, ''))
);

CREATE INDEX idx_threats_name_search ON threats USING gin(
  to_tsvector('english', name || ' ' || COALESCE(description, ''))
);

CREATE INDEX idx_alerts_title_search ON alerts USING gin(
  to_tsvector('english', title || ' ' || COALESCE(description, ''))
);

-- Composite indexes for common queries
CREATE INDEX idx_incidents_org_status_severity ON incidents(organization_id, status, severity);
CREATE INDEX idx_alerts_org_status_created ON alerts(organization_id, status, created_at);
CREATE INDEX idx_threats_org_severity_created ON threats(organization_id, severity, created_at);

-- ============================================================
-- MATERIALIZED VIEWS FOR REPORTING
-- ============================================================

CREATE MATERIALIZED VIEW mv_incident_summary AS
SELECT 
  i.organization_id,
  COUNT(*) as total_incidents,
  COUNT(CASE WHEN i.status = 'open' THEN 1 END) as open_incidents,
  COUNT(CASE WHEN i.severity = 'critical' THEN 1 END) as critical_incidents,
  COUNT(CASE WHEN i.severity = 'high' THEN 1 END) as high_incidents,
  AVG(EXTRACT(EPOCH FROM (COALESCE(i.resolved_at, CURRENT_TIMESTAMP) - i.detected_at)) / 60)::INT as avg_resolution_time_minutes
FROM incidents i
WHERE i.deleted_at IS NULL
GROUP BY i.organization_id;

CREATE MATERIALIZED VIEW mv_alert_summary AS
SELECT
  a.organization_id,
  COUNT(*) as total_alerts,
  COUNT(CASE WHEN a.status = 'new' THEN 1 END) as new_alerts,
  COUNT(CASE WHEN a.severity = 'critical' THEN 1 END) as critical_alerts,
  COUNT(CASE WHEN a.status = 'false_positive' THEN 1 END) as false_positives
FROM alerts a
WHERE a.deleted_at IS NULL AND a.created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY a.organization_id;

CREATE MATERIALIZED VIEW mv_threat_summary AS
SELECT
  t.organization_id,
  COUNT(DISTINCT t.id) as total_threats,
  COUNT(DISTINCT t.threat_actor) as unique_actors,
  COUNT(CASE WHEN t.severity = 'critical' THEN 1 END) as critical_threats,
  COUNT(CASE WHEN t.status = 'detected' THEN 1 END) as active_threats
FROM threats t
WHERE t.deleted_at IS NULL
GROUP BY t.organization_id;

-- Create indexes on materialized views
CREATE INDEX idx_mv_incident_summary_org ON mv_incident_summary(organization_id);
CREATE INDEX idx_mv_alert_summary_org ON mv_alert_summary(organization_id);
CREATE INDEX idx_mv_threat_summary_org ON mv_threat_summary(organization_id);

-- ============================================================
-- REFRESH MATERIALIZED VIEW FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_incident_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_alert_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_threat_summary;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS & AUDIT
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for incidents
CREATE TRIGGER trigger_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for threats
CREATE TRIGGER trigger_threats_updated_at
  BEFORE UPDATE ON threats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for alerts
CREATE TRIGGER trigger_alerts_updated_at
  BEFORE UPDATE ON alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for playbooks
CREATE TRIGGER trigger_playbooks_updated_at
  BEFORE UPDATE ON playbooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for integrations
CREATE TRIGGER trigger_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================

COMMENT ON TABLE organizations IS 'Multi-tenant organizations';
COMMENT ON TABLE users IS 'Platform users with role-based access control';
COMMENT ON TABLE incidents IS 'Security incidents with full lifecycle management';
COMMENT ON TABLE incident_timeline IS 'Incident event history and timeline';
COMMENT ON TABLE threats IS 'Detected threats with intelligence data';
COMMENT ON TABLE threat_indicators IS 'Indicators of Compromise (IOCs)';
COMMENT ON TABLE alerts IS 'Security alerts from various sources';
COMMENT ON TABLE assets IS 'Monitored assets and resources';
COMMENT ON TABLE playbooks IS 'Automated incident response playbooks';
COMMENT ON TABLE integrations IS 'Third-party tool integrations';
COMMENT ON TABLE compliance_frameworks IS 'Compliance framework mappings';
COMMENT ON TABLE audit_logs IS 'System audit trail';
COMMENT ON TABLE notifications IS 'User notifications and alerts';

-- ============================================================
-- INITIAL DATA SETUP
-- ============================================================

-- Create default organization
INSERT INTO organizations (name, slug, description, tier)
VALUES ('Default Organization', 'default-org', 'Default AEGIS-SOC Organization', 'professional')
ON CONFLICT (name) DO NOTHING;

-- Create default compliance frameworks
INSERT INTO compliance_frameworks (organization_id, framework_name, framework_version, is_applicable)
SELECT id, 'GDPR', 'GDPR', true FROM organizations WHERE slug = 'default-org'
ON CONFLICT DO NOTHING;

INSERT INTO compliance_frameworks (organization_id, framework_name, framework_version, is_applicable)
SELECT id, 'HIPAA', 'HIPAA', true FROM organizations WHERE slug = 'default-org'
ON CONFLICT DO NOTHING;

INSERT INTO compliance_frameworks (organization_id, framework_name, framework_version, is_applicable)
SELECT id, 'PCI-DSS', 'v3.2.1', true FROM organizations WHERE slug = 'default-org'
ON CONFLICT DO NOTHING;
