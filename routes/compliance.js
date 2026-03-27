const express = require('express');
const router = express.Router();

const complianceFrameworks = {
  gdpr: {
    name: 'GDPR',
    requirements: [
      { id: 1, requirement: 'Data Encryption', status: 'compliant', evidence: 'AES-256 encryption enabled' },
      { id: 2, requirement: 'User Consent', status: 'compliant', evidence: 'Consent form implemented' },
      { id: 3, requirement: 'Data Retention Policy', status: 'compliant', evidence: 'Policy documented' },
      { id: 4, requirement: 'Right to be Forgotten', status: 'compliant', evidence: 'Feature implemented' }
    ]
  },
  soc2: {
    name: 'SOC 2',
    requirements: [
      { id: 1, requirement: 'Security Controls', status: 'compliant', evidence: 'Documented and tested' },
      { id: 2, requirement: 'Access Control', status: 'compliant', evidence: 'RBAC implemented' },
      { id: 3, requirement: 'Audit Logging', status: 'compliant', evidence: 'Logging enabled' },
      { id: 4, requirement: 'Incident Response', status: 'compliant', evidence: 'Plan documented' }
    ]
  },
  hipaa: {
    name: 'HIPAA',
    requirements: [
      { id: 1, requirement: 'PHI Protection', status: 'compliant', evidence: 'Encryption enabled' },
      { id: 2, requirement: 'Access Audit', status: 'compliant', evidence: 'Audit logs maintained' },
      { id: 3, requirement: 'Data Integrity', status: 'compliant', evidence: 'Checksums verified' },
      { id: 4, requirement: 'Backup & Recovery', status: 'compliant', evidence: 'Daily backups' }
    ]
  }
};

// Get compliance status
router.get('/status/:standard', (req, res) => {
  const standard = req.params.standard.toLowerCase();
  const framework = complianceFrameworks[standard];

  if (!framework) {
    return res.status(404).json({ success: false, message: 'Compliance standard not found' });
  }

  const total = framework.requirements.length;
  const compliant = framework.requirements.filter(r => r.status === 'compliant').length;
  const percentage = Math.round((compliant / total) * 100);

  res.json({
    success: true,
    data: {
      standard: framework.name,
      complianceLevel: percentage,
      requirements: framework.requirements,
      summary: {
        total: total,
        compliant: compliant,
        nonCompliant: total - compliant
      }
    }
  });
});

// Get all frameworks
router.get('/', (req, res) => {
  const frameworks = Object.keys(complianceFrameworks).map(key => ({
    id: key,
    name: complianceFrameworks[key].name
  }));

  res.json({ success: true, data: frameworks });
});

module.exports = router;
