const axios = require('axios');
require('dotenv').config();

const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY;
const ABUSEIPDB_API_KEY = process.env.ABUSEIPDB_API_KEY;

// Check IP reputation on AbuseIPDB
const checkIPReputation = async (ip) => {
  if (!ABUSEIPDB_API_KEY) {
    return { success: false, message: 'AbuseIPDB API key not configured' };
  }

  try {
    const response = await axios.get('https://api.abuseipdb.com/api/v2/check', {
      params: {
        ipAddress: ip,
        maxAgeInDays: 90
      },
      headers: {
        'Key': ABUSEIPDB_API_KEY,
        'Accept': 'application/json'
      }
    });

    return {
      success: true,
      data: {
        ip: ip,
        abuseScore: response.data.data.abuseScore,
        usageType: response.data.data.usageType,
        isp: response.data.data.isp,
        domain: response.data.data.domain,
        totalReports: response.data.data.totalReports
      }
    };
  } catch (error) {
    console.error('AbuseIPDB error:', error);
    return { success: false, error: error.message };
  }
};

// Check file/URL on VirusTotal
const checkFileOnVirusTotal = async (hash) => {
  if (!VIRUSTOTAL_API_KEY) {
    return { success: false, message: 'VirusTotal API key not configured' };
  }

  try {
    const response = await axios.get(`https://www.virustotal.com/api/v3/files/${hash}`, {
      headers: {
        'x-apikey': VIRUSTOTAL_API_KEY
      }
    });

    return {
      success: true,
      data: {
        hash: hash,
        lastAnalysisStats: response.data.data.attributes.last_analysis_stats,
        lastAnalysisDate: response.data.data.attributes.last_analysis_date,
        malicious: response.data.data.attributes.last_analysis_stats.malicious,
        suspicious: response.data.data.attributes.last_analysis_stats.suspicious
      }
    };
  } catch (error) {
    console.error('VirusTotal error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { checkIPReputation, checkFileOnVirusTotal };
