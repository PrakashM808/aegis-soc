// Simple ML-based threat scoring
class ThreatDetectionAI {
  constructor() {
    this.threatPatterns = {
      bruteForce: { weight: 0.8, indicators: ['failed_login', 'multiple_attempts', 'same_ip'] },
      dataExfiltration: { weight: 0.9, indicators: ['large_data_transfer', 'unusual_time', 'external_ip'] },
      malware: { weight: 1.0, indicators: ['executable', 'suspicious_hash', 'network_activity'] },
      sqlInjection: { weight: 0.85, indicators: ['sql_keywords', 'special_chars', 'error_messages'] }
    };
  }

  // Score threat based on indicators
  scoreThreat(indicators) {
    let score = 0;
    let matchedPatterns = [];

    for (const [pattern, data] of Object.entries(this.threatPatterns)) {
      const matches = indicators.filter(ind => data.indicators.includes(ind)).length;
      const matchRatio = matches / data.indicators.length;
      
      if (matchRatio > 0.5) {
        const patternScore = matchRatio * data.weight;
        score += patternScore;
        matchedPatterns.push({ pattern, confidence: Math.round(matchRatio * 100) });
      }
    }

    return {
      riskScore: Math.min(score, 1.0),
      riskLevel: this.getRiskLevel(score),
      matchedPatterns: matchedPatterns,
      recommendation: this.getRecommendation(score)
    };
  }

  getRiskLevel(score) {
    if (score >= 0.8) return 'CRITICAL';
    if (score >= 0.6) return 'HIGH';
    if (score >= 0.4) return 'MEDIUM';
    return 'LOW';
  }

  getRecommendation(score) {
    if (score >= 0.8) return 'IMMEDIATE ACTION REQUIRED - Isolate affected systems immediately';
    if (score >= 0.6) return 'URGENT - Investigate and escalate to security team';
    if (score >= 0.4) return 'MONITOR - Increase monitoring and prepare response';
    return 'INFO - Continue normal monitoring';
  }

  // Detect anomalies
  detectAnomalies(data) {
    const anomalies = [];
    
    // Check for unusual patterns
    if (data.loginAttempts > 10 && data.timeWindow < 300) {
      anomalies.push({
        type: 'brute_force',
        confidence: 0.95,
        description: 'Excessive login attempts detected'
      });
    }

    if (data.dataTransferSize > 1000000000) { // 1GB
      anomalies.push({
        type: 'data_exfiltration',
        confidence: 0.85,
        description: 'Unusually large data transfer detected'
      });
    }

    if (data.privilegeEscalation) {
      anomalies.push({
        type: 'privilege_escalation',
        confidence: 0.92,
        description: 'Unauthorized privilege escalation detected'
      });
    }

    return anomalies;
  }
}

const aiDetection = new ThreatDetectionAI();
module.exports = aiDetection;
