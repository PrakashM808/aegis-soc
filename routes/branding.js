const express = require('express');
const router = express.Router();

let brandingConfig = {
  companyName: 'AEGIS-SOC',
  logo: 'https://via.placeholder.com/150?text=Logo',
  primaryColor: '#00d4ff',
  secondaryColor: '#302b63',
  favIcon: 'https://via.placeholder.com/32?text=Icon',
  loginPageBg: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
  supportEmail: 'support@aegis-soc.com',
  supportPhone: '+1-800-AEGIS-SOC',
  websiteUrl: 'https://aegis-soc.com'
};

// Get branding config
router.get('/config', (req, res) => {
  res.json({ success: true, data: brandingConfig });
});

// Update branding config
router.put('/config', (req, res) => {
  const updates = req.body;
  
  Object.assign(brandingConfig, updates);
  
  res.json({ 
    success: true, 
    message: 'Branding updated', 
    data: brandingConfig 
  });
});

// Get theme
router.get('/theme', (req, res) => {
  const theme = {
    colors: {
      primary: brandingConfig.primaryColor,
      secondary: brandingConfig.secondaryColor
    },
    fonts: {
      primary: 'Arial, sans-serif'
    },
    spacing: {
      small: '8px',
      medium: '16px',
      large: '24px'
    }
  };
  
  res.json({ success: true, data: theme });
});

module.exports = router;
