/**
 * Incidents Routes
 * Incident management, status updates, and response actions
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const { Incident, User, AuditLog } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { authorize } = require('../middleware/authentication');

const router = express.Router();

// Validation schema
const incidentSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string(),
  type: Joi.string().valid('malware', 'phishing', 'intrusion', 'exfiltration', 'other').required(),
  severity: Joi.string().valid('critical', 'high', 'medium', 'low', 'info').required(),
  affectedAssets: Joi.array().items(Joi.string()),
  assignedTo: Joi.string().uuid(),
});

/**
 * GET /api/v1/incidents
 * List all incidents with filtering and pagination
 */
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, severity, type, sort = '-createdAt' } = req.query;
    const offset = (page - 1) * limit;

    const where = { organizationId: req.user.organizationId };
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (type) where.type = type;

    const { count, rows } = await Incident.findAndCountAll({
      where,
      offset,
      limit: parseInt(limit),
      order: [sort.startsWith('-') ? [sort.slice(1), 'DESC'] : [sort, 'ASC']],
      include: [
        { model: User, attributes: ['id', 'firstName', 'lastName', 'email'], as: 'assignee' }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        incidents: rows,
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
 * POST /api/v1/incidents
 * Create new incident
 */
router.post('/', authorize(['admin', 'analyst', 'responder']), async (req, res, next) => {
  try {
    const { error, value } = incidentSchema.validate(req.body);
    if (error) throw new AppError(error.details[0].message, 400);

    const incidentId = `INC-${new Date().getFullYear()}-${uuidv4().slice(0, 4).toUpperCase()}`;

    const incident = await Incident.create({
      ...value,
      incidentId,
      organizationId: req.user.organizationId,
      detectedAt: new Date(),
    });

    // Log audit event
    await AuditLog.create({
      action: 'incident_created',
      entity: 'incident',
      entityId: incident.id,
      userId: req.user.id,
      organizationId: req.user.organizationId,
      ipAddress: req.ip,
    });

    // Emit WebSocket event
    req.app.get('io').to(`incidents_${req.user.organizationId}`).emit('incident_created', incident);

    res.status(201).json({
      success: true,
      message: 'Incident created successfully',
      data: { incident }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/incidents/:id
 * Get incident details
 */
router.get('/:id', async (req, res, next) => {
  try {
    const incident = await Incident.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ['id', 'firstName', 'lastName', 'email'], as: 'assignee' }
      ]
    });

    if (!incident) {
      throw new AppError('Incident not found', 404);
    }

    res.status(200).json({
      success: true,
      data: { incident }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/incidents/:id
 * Update incident
 */
router.put('/:id', authorize(['admin', 'analyst', 'responder']), async (req, res, next) => {
  try {
    const incident = await Incident.findByPk(req.params.id);
    if (!incident) {
      throw new AppError('Incident not found', 404);
    }

    const updateSchema = Joi.object({
      title: Joi.string(),
      description: Joi.string(),
      status: Joi.string().valid('open', 'investigating', 'contained', 'resolved', 'closed'),
      severity: Joi.string().valid('critical', 'high', 'medium', 'low', 'info'),
      assignedTo: Joi.string().uuid(),
      containmentActions: Joi.array(),
      remediationActions: Joi.array(),
    });

    const { error, value } = updateSchema.validate(req.body);
    if (error) throw new AppError(error.details[0].message, 400);

    const oldData = incident.toJSON();
    await incident.update(value);

    // Log audit event
    await AuditLog.create({
      action: 'incident_updated',
      entity: 'incident',
      entityId: incident.id,
      changes: { before: oldData, after: incident.toJSON() },
      userId: req.user.id,
      organizationId: req.user.organizationId,
      ipAddress: req.ip,
    });

    // Emit WebSocket event
    req.app.get('io').to(`incidents_${req.user.organizationId}`).emit('incident_updated', incident);

    res.status(200).json({
      success: true,
      message: 'Incident updated successfully',
      data: { incident }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/incidents/:id/contain
 * Execute containment actions
 */
router.post('/:id/contain', authorize(['admin', 'responder']), async (req, res, next) => {
  try {
    const incident = await Incident.findByPk(req.params.id);
    if (!incident) {
      throw new AppError('Incident not found', 404);
    }

    const { actions } = req.body;

    await incident.update({
      status: 'contained',
      containedAt: new Date(),
      containmentActions: actions,
    });

    // Emit WebSocket event
    req.app.get('io').to(`incidents_${req.user.organizationId}`).emit('incident_contained', incident);

    res.status(200).json({
      success: true,
      message: 'Incident contained successfully',
      data: { incident }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/incidents/:id/resolve
 * Resolve incident
 */
router.post('/:id/resolve', authorize(['admin', 'analyst']), async (req, res, next) => {
  try {
    const incident = await Incident.findByPk(req.params.id);
    if (!incident) {
      throw new AppError('Incident not found', 404);
    }

    const { remediationNotes } = req.body;

    await incident.update({
      status: 'resolved',
      resolvedAt: new Date(),
      remediationActions: remediationNotes,
    });

    // Emit WebSocket event
    req.app.get('io').to(`incidents_${req.user.organizationId}`).emit('incident_resolved', incident);

    res.status(200).json({
      success: true,
      message: 'Incident resolved successfully',
      data: { incident }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/incidents/:id
 * Delete incident
 */
router.delete('/:id', authorize(['admin']), async (req, res, next) => {
  try {
    const incident = await Incident.findByPk(req.params.id);
    if (!incident) {
      throw new AppError('Incident not found', 404);
    }

    await incident.destroy();

    // Log audit event
    await AuditLog.create({
      action: 'incident_deleted',
      entity: 'incident',
      entityId: req.params.id,
      userId: req.user.id,
      organizationId: req.user.organizationId,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Incident deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
