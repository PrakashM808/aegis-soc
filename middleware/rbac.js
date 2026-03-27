// Role definitions
const ROLES = {
  ADMIN: 'admin',
  ANALYST: 'analyst',
  VIEWER: 'viewer'
};

// Permission definitions
const PERMISSIONS = {
  admin: ['view_all', 'create_incident', 'edit_incident', 'delete_incident', 'manage_users', 'view_reports'],
  analyst: ['view_all', 'create_incident', 'edit_incident', 'view_reports'],
  viewer: ['view_all']
};

// Check role middleware
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role || 'viewer';
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    next();
  };
};

// Check permission middleware
const checkPermission = (permission) => {
  return (req, res, next) => {
    const userRole = req.user?.role || 'viewer';
    const userPermissions = PERMISSIONS[userRole] || [];
    
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    }
    
    next();
  };
};

module.exports = { ROLES, PERMISSIONS, checkRole, checkPermission };
