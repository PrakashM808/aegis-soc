const axios = require('axios');
require('dotenv').config();

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

const sendSlackAlert = async (threatType, severity, details) => {
  if (!SLACK_WEBHOOK_URL) {
    console.log('Slack webhook URL not configured');
    return { success: false, message: 'Slack not configured' };
  }

  try {
    const color = {
      CRITICAL: '#ff6b6b',
      HIGH: '#ffa500',
      MEDIUM: '#ffeb3b',
      LOW: '#4caf50'
    }[severity] || '#00d4ff';

    const payload = {
      attachments: [
        {
          color: color,
          title: '⚡ AEGIS-SOC Threat Alert',
          fields: [
            {
              title: 'Threat Type',
              value: threatType,
              short: true
            },
            {
              title: 'Severity',
              value: severity,
              short: true
            },
            {
              title: 'Details',
              value: details,
              short: false
            },
            {
              title: 'Time',
              value: new Date().toLocaleString(),
              short: false
            }
          ],
          actions: [
            {
              type: 'button',
              text: 'View in Dashboard',
              url: 'http://localhost:3000/dashboard.html'
            }
          ]
        }
      ]
    };

    const response = await axios.post(SLACK_WEBHOOK_URL, payload);
    console.log('Slack alert sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Slack error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendSlackAlert };
