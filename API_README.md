# AEGIS-SOC Backend API

Enterprise Cybersecurity Platform - Production-Grade Node.js API

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- Redis 6+
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/aegis-soc/backend.git
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run migrate

# Start development server
npm run dev

# Or start production server
npm start
```

## 📋 API Endpoints

### Authentication
- `POST /api/v1/auth/signup` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/logout` - User logout

### Incidents
- `GET /api/v1/incidents` - List incidents
- `POST /api/v1/incidents` - Create incident
- `GET /api/v1/incidents/:id` - Get incident details
- `PUT /api/v1/incidents/:id` - Update incident
- `POST /api/v1/incidents/:id/contain` - Execute containment
- `POST /api/v1/incidents/:id/resolve` - Resolve incident
- `DELETE /api/v1/incidents/:id` - Delete incident

### Threats
- `GET /api/v1/threats` - List threats
- `POST /api/v1/threats` - Create threat
- `GET /api/v1/threats/:id` - Get threat details
- `PUT /api/v1/threats/:id` - Update threat
- `POST /api/v1/threats/search` - Search by indicators
- `GET /api/v1/threats/intelligence/summary` - Threat intel summary

### Analytics
- `GET /api/v1/analytics/dashboard` - Dashboard metrics
- `GET /api/v1/analytics/reports` - Generate reports

### Integrations
- `GET /api/v1/integrations` - List integrations
- `POST /api/v1/integrations` - Add integration

### Playbooks
- `GET /api/v1/playbooks` - List playbooks
- `POST /api/v1/playbooks/:id/execute` - Execute playbook

### Compliance
- `GET /api/v1/compliance/reports` - Compliance reports

### Users
- `GET /api/v1/users` - List users
- `POST /api/v1/users` - Create user

### Alerts
- `GET /api/v1/alerts` - List alerts
- `PUT /api/v1/alerts/:id` - Update alert

## 🔐 Authentication

All endpoints (except `/auth/*`) require JWT token in Authorization header:

```
Authorization: Bearer <access_token>
```

### Login Example
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "analyst"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token"
    }
  }
}
```

## 📊 Real-Time WebSocket Events

Connect to WebSocket for real-time updates:

```javascript
const socket = io('http://localhost:3000');

// Subscribe to threats
socket.emit('subscribe_threats', { organizationId: 'org-id' });
socket.on('threat_detected', (threat) => console.log(threat));

// Subscribe to incidents
socket.emit('subscribe_incidents', { organizationId: 'org-id' });
socket.on('incident_created', (incident) => console.log(incident));
socket.on('incident_updated', (incident) => console.log(incident));
socket.on('incident_contained', (incident) => console.log(incident));
socket.on('incident_resolved', (incident) => console.log(incident));
```

## 🗄️ Database Schema

### Core Tables
- **users** - User accounts and credentials
- **incidents** - Security incidents
- **threats** - Detected threats
- **alerts** - Security alerts
- **playbooks** - Automated response playbooks
- **integrations** - Third-party integrations
- **compliance_reports** - Compliance assessments
- **audit_logs** - Activity audit trail

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test -- --coverage

# Run specific test file
npm test -- auth.test.js
```

## 📝 Logging

Logs are stored in `/logs/` directory:
- `combined.log` - All logs
- `error.log` - Errors only

Log level configured in `.env`:
```
LOG_LEVEL=info # debug, info, warn, error
```

## 🔒 Security Features

✅ JWT Authentication
✅ Role-Based Access Control (RBAC)
✅ Password hashing with bcrypt
✅ Rate limiting
✅ CORS protection
✅ Helmet security headers
✅ Input validation with Joi
✅ SQL injection prevention (Sequelize ORM)
✅ Account lockout after failed attempts
✅ Audit logging
✅ Environment-based configuration

## 🚀 Production Deployment

### Docker
```bash
docker build -t aegis-soc-api .
docker run -p 3000:3000 --env-file .env aegis-soc-api
```

### Environment Setup
1. Set `NODE_ENV=production`
2. Update all credentials in `.env`
3. Use strong JWT secrets
4. Enable HTTPS
5. Configure database backups
6. Setup monitoring and alerts

## 📞 Support

For issues and questions, open an issue on GitHub or contact support@aegis-soc.com

## 📄 License

MIT License - See LICENSE file for details
