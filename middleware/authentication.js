const jwt = require('jsonwebtoken');

const authentication = async (req, res, next) => {
  // Skip auth for testing in development
  if (process.env.NODE_ENV === 'development') {
    req.user = { id: 1, username: 'admin', role: 'admin' };
    return next();
  }
  
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authentication;
