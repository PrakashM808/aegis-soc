/**
 * Database Models
 * Core entities for AEGIS-SOC
 */

const { DataTypes } = require('sequelize');
const db = require('./database');

// User Model
const User = db.define('user', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: { isEmail: true },
  },
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  firstName: DataTypes.STRING,
  lastName: DataTypes.STRING,
  role: {
    type: DataTypes.ENUM('admin', 'analyst', 'viewer', 'responder'),
    defaultValue: 'analyst',
  },
  organizationId: DataTypes.UUID,
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  lastLogin: DataTypes.DATE,
  failedLoginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  lockedUntil: DataTypes.DATE,
  mfaEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  mfaSecret: DataTypes.STRING,
});

// Incident Model
const Incident = db.define('incident', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  incidentId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: DataTypes.TEXT,
  type: {
    type: DataTypes.ENUM('malware', 'phishing', 'intrusion', 'exfiltration', 'other'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('open', 'investigating', 'contained', 'resolved', 'closed'),
    defaultValue: 'open',
  },
  severity: {
    type: DataTypes.ENUM('critical', 'high', 'medium', 'low', 'info'),
    allowNull: false,
  },
  organizationId: DataTypes.UUID,
  assignedTo: DataTypes.UUID,
  affectedAssets: DataTypes.JSONB,
  timeline: DataTypes.JSONB,
  containmentActions: DataTypes.JSONB,
  remediationActions: DataTypes.JSONB,
  evidence: DataTypes.JSONB,
  detectedAt: DataTypes.DATE,
  containedAt: DataTypes.DATE,
  resolvedAt: DataTypes.DATE,
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
  },
});

// Threat Model
const Threat = db.define('threat', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  threatId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: DataTypes.TEXT,
  threatType: {
    type: DataTypes.ENUM('malware', 'trojan', 'ransomware', 'botnet', 'apt', 'phishing', 'vulnerability'),
    allowNull: false,
  },
  severity: {
    type: DataTypes.ENUM('critical', 'high', 'medium', 'low'),
    allowNull: false,
  },
  source: DataTypes.STRING,
  sourceIp: DataTypes.STRING,
  targetAssets: DataTypes.JSONB,
  indicators: DataTypes.JSONB, // IOCs, file hashes, URLs
  mitreTechniques: DataTypes.JSONB,
  threatActors: DataTypes.JSONB,
  detectionMethod: DataTypes.STRING,
  confidence: {
    type: DataTypes.INTEGER,
    defaultValue: 50,
  },
  status: {
    type: DataTypes.ENUM('detected', 'confirmed', 'contained', 'resolved'),
    defaultValue: 'detected',
  },
  organizationId: DataTypes.UUID,
  relatedIncidentId: DataTypes.UUID,
  detectedAt: DataTypes.DATE,
});

// Alert Model
const Alert = db.define('alert', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  alertId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: DataTypes.TEXT,
  severity: {
    type: DataTypes.ENUM('critical', 'high', 'medium', 'low', 'info'),
    defaultValue: 'medium',
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('new', 'acknowledged', 'resolved', 'false_positive'),
    defaultValue: 'new',
  },
  organizationId: DataTypes.UUID,
  source: DataTypes.STRING,
  sourceDetails: DataTypes.JSONB,
  affectedAsset: DataTypes.STRING,
  detectedAt: DataTypes.DATE,
  acknowledgedAt: DataTypes.DATE,
  resolvedAt: DataTypes.DATE,
  autoPlaybookExecuted: DataTypes.BOOLEAN,
  playbookId: DataTypes.UUID,
});

// Playbook Model
const Playbook = db.define('playbook', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: DataTypes.TEXT,
  triggerType: {
    type: DataTypes.ENUM('alert', 'incident', 'threat', 'manual'),
    allowNull: false,
  },
  triggerConditions: DataTypes.JSONB,
  actions: DataTypes.JSONB,
  enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  autoExecute: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  organizationId: DataTypes.UUID,
  createdBy: DataTypes.UUID,
  executionHistory: DataTypes.JSONB,
});

// Integration Model
const Integration = db.define('integration', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('siem', 'edr', 'threat_intel', 'email', 'ticketing', 'communication', 'cloud', 'other'),
    allowNull: false,
  },
  provider: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  credentials: DataTypes.JSONB,
  config: DataTypes.JSONB,
  enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  lastSyncAt: DataTypes.DATE,
  organizationId: DataTypes.UUID,
  webhookUrl: DataTypes.STRING,
  webhookSecret: DataTypes.STRING,
});

// Compliance Report Model
const ComplianceReport = db.define('compliance_report', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  framework: {
    type: DataTypes.ENUM('gdpr', 'hipaa', 'pci-dss', 'sox', 'cis', 'nist', 'iso27001'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('compliant', 'non_compliant', 'partial'),
    allowNull: false,
  },
  findings: DataTypes.JSONB,
  recommendations: DataTypes.JSONB,
  organizationId: DataTypes.UUID,
  generatedAt: DataTypes.DATE,
});

// Audit Log Model
const AuditLog = db.define('audit_log', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  entity: DataTypes.STRING,
  entityId: DataTypes.UUID,
  changes: DataTypes.JSONB,
  userId: DataTypes.UUID,
  organizationId: DataTypes.UUID,
  ipAddress: DataTypes.STRING,
  userAgent: DataTypes.STRING,
});

// Export models
module.exports = {
  User,
  Incident,
  Threat,
  Alert,
  Playbook,
  Integration,
  ComplianceReport,
  AuditLog,
};
