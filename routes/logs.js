const express = require('express');
const router = express.Router();

// Store uploaded logs in memory
const uploadedLogs = {};

router.post('/extract-iocs', (req, res) => {
  try {
    const { logContent } = req.body;
    if (!logContent) {
      return res.status(400).json({ success: false, message: 'logContent is required' });
    }

    const iocPatterns = {
      failedLogins: {
        pattern: /Failed password.*?from\s+([\d.]+)/gi,
        severity: 'medium',
        description: 'Failed login attempt'
      },
      sqlInjection: {
        pattern: /(\bUNION\b.*?\bSELECT\b)|('.*?OR.*?'.*?=.*?')/gi,
        severity: 'critical',
        description: 'SQL Injection attempt'
      },
      malware: {
        pattern: /malware|trojan|ransomware|backdoor/gi,
        severity: 'critical',
        description: 'Malware signature detected'
      },
      suspiciousProcess: {
        pattern: /cmd\.exe|powershell|rundll32|wmic/gi,
        severity: 'high',
        description: 'Suspicious process execution'
      },
      dataExfiltration: {
        pattern: /wget.*http|curl.*http|scp.*@/gi,
        severity: 'critical',
        description: 'Data exfiltration attempt'
      }
    };

    const extractedIoCs = {};
    let totalMatches = 0;

    for (const [iocType, config] of Object.entries(iocPatterns)) {
      const matches = logContent.match(config.pattern) || [];
      if (matches.length > 0) {
        extractedIoCs[iocType] = {
          count: matches.length,
          items: [...new Set(matches)].slice(0, 5),
          severity: config.severity,
          description: config.description
        };
        totalMatches += matches.length;
      }
    }

    let overallRisk = 'LOW';
    const criticalCount = Object.values(extractedIoCs)
      .filter(ioc => ioc.severity === 'critical')
      .reduce((sum, ioc) => sum + ioc.count, 0);
    
    if (criticalCount > 0) overallRisk = 'CRITICAL';
    else if (totalMatches > 3) overallRisk = 'HIGH';
    else if (totalMatches > 0) overallRisk = 'MEDIUM';

    res.json({
      success: true,
      data: {
        extractedIoCs,
        totalMatches,
        overallRisk,
        summary: {
          totalIoCs: totalMatches,
          iocTypes: Object.keys(extractedIoCs).length,
          riskLevel: overallRisk
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/analyze-patterns', (req, res) => {
  try {
    const { logContent } = req.body;
    if (!logContent) {
      return res.status(400).json({ success: false, message: 'logContent is required' });
    }

    const patterns = {};

    const failedLoginPattern = /Failed password.*?from\s+([\d.]+)/gi;
    const ips = {};
    let match;
    while ((match = failedLoginPattern.exec(logContent)) !== null) {
      const ip = match[1];
      ips[ip] = (ips[ip] || 0) + 1;
    }

    const bruteForceIPs = Object.entries(ips)
      .filter(([_, count]) => count >= 3)
      .map(([ip, count]) => ({ ip, attempts: count }));

    if (bruteForceIPs.length > 0) {
      patterns.bruteForce = {
        pattern: 'Multiple failed logins from same IP',
        risk: 'HIGH',
        details: bruteForceIPs,
        recommendation: 'Block source IPs immediately'
      };
    }

    if ((logContent.match(/malware|trojan|ransomware/gi) || []).length > 0) {
      patterns.malware = {
        pattern: 'Malware indicators detected',
        risk: 'CRITICAL',
        recommendation: 'Isolate affected system'
      };
    }

    if ((logContent.match(/UNION.*SELECT|OR.*=/gi) || []).length > 0) {
      patterns.sqlInjection = {
        pattern: 'SQL Injection attempts',
        risk: 'CRITICAL',
        recommendation: 'Apply WAF rules'
      };
    }

    res.json({
      success: true,
      data: {
        patterns,
        patternCount: Object.keys(patterns).length,
        recommendations: Object.values(patterns).map(p => p.recommendation)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/parse', (req, res) => {
  try {
    const { logContent } = req.body;
    if (!logContent) {
      return res.status(400).json({ success: false, message: 'logContent is required' });
    }

    const logLines = logContent.split('\n').filter(line => line.trim());
    const sampleLine = logLines[0] || '';
    
    let detectedFormat = 'unknown';
    if (sampleLine.includes('sshd') || sampleLine.includes('auth')) {
      detectedFormat = 'syslog';
    } else if (sampleLine.includes('GET') || sampleLine.includes('POST')) {
      detectedFormat = 'apache/nginx';
    }

    res.json({
      success: true,
      data: {
        logStructure: {
          format: detectedFormat,
          totalLines: logLines.length,
          fields: ['timestamp', 'hostname', 'process', 'message'],
          sampleEntries: logLines.slice(0, 3)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/upload', (req, res) => {
  try {
    const { logContent, fileName } = req.body;
    if (!logContent || !fileName) {
      return res.status(400).json({ success: false, message: 'logContent and fileName are required' });
    }

    const logId = Date.now();
    uploadedLogs[logId] = {
      fileName,
      content: logContent,
      uploadedAt: new Date(),
      lines: logContent.split('\n').length
    };

    res.json({
      success: true,
      message: 'Log file uploaded successfully',
      data: {
        logId,
        fileName,
        lines: uploadedLogs[logId].lines,
        uploadedAt: uploadedLogs[logId].uploadedAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/list', (req, res) => {
  try {
    const logs = Object.entries(uploadedLogs).map(([id, log]) => ({
      id,
      fileName: log.fileName,
      lines: log.lines,
      uploadedAt: log.uploadedAt
    }));

    res.json({
      success: true,
      data: {
        logs,
        totalLogs: logs.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
