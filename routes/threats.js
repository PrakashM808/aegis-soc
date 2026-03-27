/**
 * Threats Routes
 * Threat detection, intelligence, and tracking
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Threat, AuditLog } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { authorize } = require('../middleware/authentication');

const router = express.Router();

/**
 * GET /api/v1/threats
 * List detected threats
 */
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, severity, type, status } = req.query;
    const offset = (page - 1) * limit;

    const where = { organizationId: req.user.organizationId };
    if (severity) where.severity = severity;
    if (type) where.threatType = type;
    if (status) where.status = status;

    const { count, rows } = await Threat.findAndCountAll({
      where,
      offset,
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: {
        threats: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit),
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/threats
 * Create threat detection
 */
router.post('/', authorize(['admin', 'analyst']), async (req, res, next) => {
  try {
    const {
      name,
      description,
      threatType,
      severity,
      source,
      sourceIp,
      targetAssets,
      indicators,
      mitreTechniques,
      detectionMethod,
      confidence,
    } = req.body;

    const threatId = `THR-${new Date().getFullYear()}-${uuidv4().slice(0, 4).toUpperCase()}`;

    const threat = await Threat.create({
      threatId,
      name,
      description,
      threatType,
      severity,
      source,
      sourceIp,
      targetAssets,
      indicators,
      mitreTechniques,
      detectionMethod,
      confidence,
      organizationId: req.user.organizationId,
      detectedAt: new Date(),
    });

    // Emit WebSocket event
    req.app.get('io').to(`threats_${req.user.organizationId}`).emit('threat_detected', threat);

    res.status(201).json({
      success: true,
      message: 'Threat detected and logged',
      data: { threat }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/threats/:id
 * Get threat details
 */
router.get('/:id', async (req, res, next) => {
  try {
    const threat = await Threat.findByPk(req.params.id);

    if (!threat) {
      throw new AppError('Threat not found', 404);
    }

    res.status(200).json({
      success: true,
      data: { threat }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/threats/:id
 * Update threat status
 */
router.put('/:id', authorize(['admin', 'analyst']), async (req, res, next) => {
  try {
    const threat = await Threat.findByPk(req.params.id);

    if (!threat) {
      throw new AppError('Threat not found', 404);
    }

    const { status, confidence } = req.body;

    await threat.update({
      status,
      confidence,
    });

    res.status(200).json({
      success: true,
      message: 'Threat updated',
      data: { threat }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/threats/search
 * Search threats by indicators
 */
router.post('/search', async (req, res, next) => {
  try {
    const { indicator, type } = req.body; // type: 'ip', 'domain', 'hash', 'url'

    const threats = await Threat.findAll({
      where: {
        organizationId: req.user.organizationId,
      },
    });

    // Filter threats by indicator
    const matchedThreats = threats.filter(threat => {
      if (!threat.indicators) return false;
      
      if (Array.isArray(threat.indicators)) {
        return threat.indicators.some(ind => 
          (type === 'hash' && ind.hash === indicator) ||
          (type === 'ip' && ind.ip === indicator) ||
          (type === 'domain' && ind.domain === indicator) ||
          (type === 'url' && ind.url === indicator)
        );
      }
      return false;
    });

    res.status(200).json({
      success: true,
      data: {
        indicator,
        type,
        matchedThreats,
        count: matchedThreats.length,
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/threats/intelligence/summary
 * Get threat intelligence summary
 */
router.get('/intelligence/summary', async (req, res, next) => {
  try {
    const threats = await Threat.findAll({
      where: { organizationId: req.user.organizationId }
    });

    const summary = {
      total: threats.length,
      critical: threats.filter(t => t.severity === 'critical').length,
      high: threats.filter(t => t.severity === 'high').length,
      medium: threats.filter(t => t.severity === 'medium').length,
      low: threats.filter(t => t.severity === 'low').length,
      byType: {},
      topThreatActors: [],
      topIndicators: [],
    };

    // Count by type
    threats.forEach(threat => {
      summary.byType[threat.threatType] = (summary.byType[threat.threatType] || 0) + 1;
    });

    // Get top threat actors
    const actorMap = {};
    threats.forEach(threat => {
      if (threat.threatActors) {
        threat.threatActors.forEach(actor => {
          actorMap[actor] = (actorMap[actor] || 0) + 1;
        });
      }
    });
    summary.topThreatActors = Object.entries(actorMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([actor, count]) => ({ actor, count }));

    res.status(200).json({
      success: true,
      data: { summary }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
