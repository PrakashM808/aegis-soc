# AEGIS-SOC Entity Relationship Diagram

## ER Diagram (Text Format)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│                       AEGIS-SOC DATA MODEL                                    │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘


                            ┌─────────────────────┐
                            │  ORGANIZATIONS      │
                            ├─────────────────────┤
                            │ id (PK)             │
                            │ name                │
                            │ slug                │
                            │ tier                │
                            │ subscription_*      │
                            └─────────────────────┘
                                      │
                   ┌──────────────────┴──────────────────┐
                   │                                     │
         ┌─────────▼──────────┐              ┌──────────▼────────────┐
         │       USERS        │              │  COMPLIANCE_*         │
         ├────────────────────┤              ├───────────────────────┤
         │ id (PK)            │              │ id (PK)               │
         │ org_id (FK)        │              │ org_id (FK)           │
         │ email              │              │ framework_name        │
         │ password_hash      │              │ is_applicable         │
         │ role               │              └───────────────────────┘
         │ mfa_enabled        │
         │ is_active          │
         └────────────────────┘
                   │
         ┌─────────┴─────────────────────────────────────────────┐
         │                                                       │
         │                                                       │
    ┌────▼──────────────────┐              ┌─────────────────────▼─────┐
    │  INCIDENTS (Primary)  │              │  ALERTS (Real-time Events)│
    ├───────────────────────┤              ├──────────────────────────┤
    │ id (PK)               │              │ id (PK)                  │
    │ org_id (FK)           │              │ org_id (FK)              │
    │ incident_number (UQ)  │              │ alert_number (UQ)        │
    │ title                 │              │ title                    │
    │ type                  │              │ alert_type               │
    │ severity              │              │ severity                 │
    │ status                │              │ status                   │
    │ assigned_to (FK→User) │              │ source_system            │
    │ created_by (FK→User)  │              │ affected_asset_id        │
    │ detected_at           │              │ user_involved            │
    │ contained_at          │              │ src_ip, dest_ip          │
    │ resolved_at           │              │ playbook_triggered       │
    └───────────────────────┘              │ assigned_incident_id(FK) │
             │                             └──────────────────────────┘
             │                                      │
    ┌────────┼─────────────────┬──────────────────┘
    │        │                 │
    │    ┌───▼────────────────────┐    ┌────────────────────────┐
    │    │ INCIDENT_TIMELINE      │    │  ALERT_EVIDENCE        │
    │    ├────────────────────────┤    ├────────────────────────┤
    │    │ id (PK)                │    │ id (PK)                │
    │    │ incident_id (FK)       │    │ alert_id (FK)          │
    │    │ event_type             │    │ evidence_type          │
    │    │ timestamp              │    │ content                │
    │    │ actor_id (FK→User)     │    │ file_path              │
    │    │ description            │    └────────────────────────┘
    │    └────────────────────────┘
    │
    │    ┌────────────────────────┐    ┌────────────────────────┐
    │    │ INCIDENT_EVIDENCE      │    │ INCIDENT_CONTAINMENT   │
    │    ├────────────────────────┤    ├────────────────────────┤
    │    │ id (PK)                │    │ id (PK)                │
    │    │ incident_id (FK)       │    │ incident_id (FK)       │
    │    │ evidence_type          │    │ action_name            │
    │    │ title                  │    │ action_status          │
    │    │ file_name              │    │ initiated_by (FK)      │
    │    │ file_hash              │    │ initiated_at           │
    │    └────────────────────────┘    │ completed_at           │
    │                                 └────────────────────────┘
    │
    └─────────────────────────────────────────────────┐
                                                      │
                        ┌─────────────────────────────▼──────────────────┐
                        │  THREATS (Intelligence)                        │
                        ├──────────────────────────────────────────────┤
                        │ id (PK)                                        │
                        │ org_id (FK)                                    │
                        │ threat_number (UQ)                             │
                        │ name                                           │
                        │ threat_type                                    │
                        │ threat_actor                                   │
                        │ severity                                       │
                        │ confidence (0-100)                             │
                        │ cve_identifiers[] (array)                      │
                        │ mitre_tactics[] (array)                        │
                        │ detected_at                                    │
                        │ related_incident_id (FK)                       │
                        └──────────────────────────────────────────────┘
                                      │
                        ┌─────────────┴─────────────┐
                        │                           │
        ┌───────────────▼──────────────┐   ┌───────▼──────────────────┐
        │  THREAT_INDICATORS (IOCs)    │   │  THREAT_INTELLIGENCE     │
        ├────────────────────────────┤   ├──────────────────────────┤
        │ id (PK)                     │   │ id (PK)                  │
        │ threat_id (FK)              │   │ threat_id (FK)           │
        │ indicator_type              │   │ title                    │
        │ indicator_value             │   │ content                  │
        │ tlp_level                   │   │ source                   │
        │ confidence                  │   │ published_at             │
        │ source                      │   └──────────────────────────┘
        └────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────┐
│                          ASSETS & VULNERABILITIES                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────┐         ┌──────────────────────┐                  │
│  │      ASSETS          │         │  ASSET_VULNERABILITY │                  │
│  ├──────────────────────┤         ├──────────────────────┤                  │
│  │ id (PK)              │────────▶│ id (PK)              │                  │
│  │ org_id (FK)          │         │ asset_id (FK)        │                  │
│  │ asset_type           │         │ cve_identifier       │                  │
│  │ asset_name           │         │ severity             │                  │
│  │ asset_value          │         │ cvss_score           │                  │
│  │ criticality          │         │ discovered_at        │                  │
│  │ environment          │         │ remediated_at        │                  │
│  │ vulnerabilities_cnt  │         │ status               │                  │
│  │ last_scanned         │         └──────────────────────┘                  │
│  └──────────────────────┘                                                    │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────┐
│                       AUTOMATION & INTEGRATION                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌────────────────────────────────────┐   ┌────────────────────────────────┐│
│  │       PLAYBOOKS (SOAR)             │   │      INTEGRATIONS              ││
│  ├────────────────────────────────────┤   ├────────────────────────────────┤│
│  │ id (PK)                            │   │ id (PK)                        ││
│  │ org_id (FK)                        │   │ org_id (FK)                    ││
│  │ name                               │   │ name                           ││
│  │ playbook_type                      │   │ integration_type               ││
│  │ trigger_type                       │   │ provider                       ││
│  │ trigger_conditions (JSONB)         │   │ enabled                        ││
│  │ enabled                            │   │ api_key_encrypted              ││
│  │ auto_execute                       │   │ webhook_url                    ││
│  │ created_by (FK→User)               │   │ last_sync_at                   ││
│  └────────────────────────────────────┘   └────────────────────────────────┘│
│         │                                            │                       │
│    ┌────▼──────────────────┐           ┌────────────▼────────────┐         │
│    │  PLAYBOOK_ACTIONS     │           │  INTEGRATION_LOGS       │         │
│    ├───────────────────────┤           ├─────────────────────────┤         │
│    │ id (PK)               │           │ id (PK)                 │         │
│    │ playbook_id (FK)      │           │ integration_id (FK)     │         │
│    │ action_sequence       │           │ action                  │         │
│    │ action_type           │           │ status                  │         │
│    │ action_config (JSONB) │           │ request_details (JSONB) │         │
│    │ is_conditional        │           │ response_details (JSONB)│         │
│    └───────────────────────┘           └─────────────────────────┘         │
│                                                                               │
│    ┌────────────────────────────┐                                           │
│    │  PLAYBOOK_EXECUTIONS       │                                           │
│    ├────────────────────────────┤                                           │
│    │ id (PK)                    │                                           │
│    │ playbook_id (FK)           │                                           │
│    │ org_id (FK)                │                                           │
│    │ trigger_incident_id (FK)   │                                           │
│    │ trigger_alert_id (FK)      │                                           │
│    │ triggered_by_user (FK)     │                                           │
│    │ execution_status           │                                           │
│    │ start_time                 │                                           │
│    │ end_time                   │                                           │
│    │ output_log                 │                                           │
│    └────────────────────────────┘                                           │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────┐
│                         AUDIT & LOGGING                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌────────────────────────┐     ┌──────────────────────┐                    │
│  │    AUDIT_LOGS          │     │  ACTIVITY_LOGS       │                    │
│  ├────────────────────────┤     ├──────────────────────┤                    │
│  │ id (PK)                │     │ id (PK)              │                    │
│  │ org_id (FK)            │     │ org_id (FK)          │                    │
│  │ user_id (FK→User)      │     │ user_id (FK→User)    │                    │
│  │ action                 │     │ activity_type        │                    │
│  │ entity_type            │     │ resource_type        │                    │
│  │ entity_id              │     │ resource_id          │                    │
│  │ old_values (JSONB)     │     │ description          │                    │
│  │ new_values (JSONB)     │     │ ip_address           │                    │
│  │ ip_address             │     │ user_agent           │                    │
│  │ user_agent             │     │ status               │                    │
│  │ status                 │     │ created_at           │                    │
│  │ created_at             │     └──────────────────────┘                    │
│  └────────────────────────┘                                                  │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────┐
│                     NOTIFICATIONS & TEMPLATES                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌───────────────────────────────┐   ┌──────────────────────────────┐       │
│  │ NOTIFICATION_TEMPLATES        │   │ NOTIFICATIONS                │       │
│  ├───────────────────────────────┤   ├──────────────────────────────┤       │
│  │ id (PK)                       │   │ id (PK)                      │       │
│  │ org_id (FK)                   │   │ org_id (FK)                  │       │
│  │ name                          │   │ recipient_user_id (FK)       │       │
│  │ template_type                 │   │ notification_type            │       │
│  │ subject                       │   │ subject                      │       │
│  │ body                          │   │ message                      │       │
│  │ template_variables[]          │   │ channel                      │       │
│  │ channels[]                    │   │ status                       │       │
│  │ enabled                       │   │ related_incident_id (FK)     │       │
│  └───────────────────────────────┘   │ related_alert_id (FK)        │       │
│                                       │ sent_at                      │       │
│                                       │ read_at                      │       │
│                                       │ created_at                   │       │
│                                       └──────────────────────────────┘       │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────┐
│                      CUSTOM FIELDS & VIEWS                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌────────────────────┐          ┌──────────────────────┐                   │
│  │  CUSTOM_FIELDS     │          │  DASHBOARD_VIEWS     │                   │
│  ├────────────────────┤          ├──────────────────────┤                   │
│  │ id (PK)            │          │ id (PK)              │                   │
│  │ org_id (FK)        │          │ org_id (FK)          │                   │
│  │ entity_type        │          │ user_id (FK→User)    │                   │
│  │ field_name         │          │ name                 │                   │
│  │ field_type         │          │ view_type            │                   │
│  │ field_label        │          │ widgets (JSONB)      │                   │
│  │ field_options[]    │          │ filters (JSONB)      │                   │
│  │ is_required        │          │ is_default           │                   │
│  │ display_order      │          └──────────────────────┘                   │
│  └────────────────────┘                                                      │
│                                                                               │
│  ┌────────────────────────────────┐                                          │
│  │  SAVED_SEARCHES                │                                          │
│  ├────────────────────────────────┤                                          │
│  │ id (PK)                        │                                          │
│  │ org_id (FK)                    │                                          │
│  │ user_id (FK→User)              │                                          │
│  │ name                           │                                          │
│  │ search_entity                  │                                          │
│  │ filters (JSONB)                │                                          │
│  │ is_favorite                    │                                          │
│  │ is_shared                      │                                          │
│  │ shared_with[]                  │                                          │
│  └────────────────────────────────┘                                          │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Table Statistics

```
┌──────────────────────────────┬──────────────┬─────────────────┐
│ Category                     │ Table Count  │ Total Columns   │
├──────────────────────────────┼──────────────┼─────────────────┤
│ Organizations & Users        │ 2            │ 28              │
│ Incident Management          │ 4            │ 52              │
│ Threat Intelligence          │ 3            │ 38              │
│ Alert Management             │ 2            │ 42              │
│ Assets & Vulnerabilities     │ 2            │ 22              │
│ Automation & Integration     │ 5            │ 48              │
│ Compliance & Governance      │ 3            │ 32              │
│ Audit & Logging              │ 2            │ 18              │
│ Notifications                │ 2            │ 16              │
│ Custom Fields & Views        │ 3            │ 24              │
├──────────────────────────────┼──────────────┼─────────────────┤
│ TOTAL                        │ 30           │ 320             │
└──────────────────────────────┴──────────────┴─────────────────┘
```

## Data Flow Diagrams

### Incident Lifecycle Flow
```
Alert Triggered
    ↓
Create Incident (Status: Open)
    ↓
Assign to Analyst
    ↓
Investigate (Timeline Events)
    ↓
Execute Containment Actions (Status: Investigating)
    ↓
Verify Isolation (Status: Contained)
    ↓
Execute Remediation (Status: Eradicated)
    ↓
Resolve Incident (Status: Resolved)
    ↓
Post-Mortem Review (Timeline Complete)
    ↓
Close Incident (Status: Closed)
    ↓
Archive (Audit Trail Preserved)
```

### Threat Detection Flow
```
IOC Detected (IP, Hash, Domain, URL)
    ↓
Create Threat Record
    ↓
Store Indicators in threat_indicators table
    ↓
Query Threat Intelligence APIs
    ↓
Fetch MITRE ATT&CK Techniques
    ↓
Identify Threat Actor
    ↓
Create/Link to Incident
    ↓
Trigger Playbook (If Auto-Execute Enabled)
    ↓
Log to Audit Trail
    ↓
Notify Security Team
```

### Alert to Incident Conversion
```
Alert Generated (From: SIEM, EDR, Email, WAF)
    ↓
Check for Duplicates
    ↓
Check Against Saved Searches
    ↓
Assess Severity & Type
    ↓
Apply Triage Logic
    ↓
Execute Auto-Playbook (If Configured)
    ↓
Create Incident (If Severity > Medium)
    ↓
Link Alert to Incident
    ↓
Notify Assigned Analyst
    ↓
Record Timeline Event
    ↓
Track SLA Status
```

## Index Strategy

### Equality Filters (Single Column)
```
organization_id   - Filter by tenant
status            - Filter by state
severity          - Filter by risk
alert_type        - Filter by type
created_at        - Filter by date
is_active         - Filter by active status
```

### Range Queries (Date Ranges)
```
created_at        - Date range searches
detected_at       - Detection time range
first_triggered   - Alert trigger range
discovered_at     - Vulnerability discovery
```

### Foreign Keys
```
organization_id   - Multi-tenant isolation
assigned_to       - User assignments
created_by        - Creator tracking
incident_id       - Relationship queries
threat_id         - Intelligence linking
```

### Array/JSONB Searches
```
tags[]            - GIN index for tags
cve_identifiers[] - GIN for CVE searches
mitre_tactics[]   - GIN for technique searches
```

### Full-Text Search
```
title + description - GiST/GIN tsvector
name + description  - Searchable content
```

### Composite Indexes
```
(organization_id, status, severity)     - Dashboard filters
(organization_id, status, created_at)   - Recent incidents
(organization_id, severity, created_at) - Risk trending
```

## Performance Metrics

**Estimated Capacity:**
- 100K+ incidents per year
- 10M+ alerts per year
- 50K+ threats tracked
- 1M+ timeline events
- Support for 1K+ users

**Query Performance:**
- Incident search: < 100ms
- Alert triage: < 50ms
- Threat intelligence: < 200ms
- Dashboard metrics: < 500ms

**Storage Requirements:**
- Base schema: 500MB
- With 12 months data: 50-100GB
- With full audit logs: 100-200GB

---

This ER diagram represents a production-ready cybersecurity operations platform with comprehensive incident management, threat intelligence, and compliance tracking capabilities.
