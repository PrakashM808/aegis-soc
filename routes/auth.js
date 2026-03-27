/**
 * Authentication Routes
 * User login, registration, and token management
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const { User } = require('../models');
const { generateToken, generateRefreshToken, authenticate } = require('../middleware/authentication');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Validation schemas
const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

/**
 * POST /api/v1/auth/signup
 * User registration
 */
router.post('/signup', async (req, res, next) => {
  try {
    const { error, value } = signupSchema.validate(req.body);
    if (error) throw new AppError(error.details[0].message, 400);

    const { email, username, password, firstName, lastName } = value;

    // Check if user exists
    const existingUser = await User.findOne({
      where: { email }
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);

    // Create user
    const user = await User.create({
      email,
      username,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'analyst',
    });

    // Generate tokens
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
        tokens: {
          accessToken,
          refreshToken,
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/auth/login
 * User login
 */
router.post('/login', async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) throw new AppError(error.details[0].message, 400);

    const { email, password } = value;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AppError('Account is temporarily locked. Try again later.', 429);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await user.update({
        failedLoginAttempts: user.failedLoginAttempts + 1,
        lockedUntil: user.failedLoginAttempts >= 4 ? new Date(Date.now() + 15 * 60 * 1000) : null,
      });
      throw new AppError('Invalid email or password', 401);
    }

    // Reset login attempts
    await user.update({
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLogin: new Date(),
    });

    // Generate tokens
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        tokens: {
          accessToken,
          refreshToken,
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token required', 400);
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const newAccessToken = generateToken(user);

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/auth/me
 * Get current user
 */
router.get('/me', authenticate, async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: {
        id: req.user.id,
        email: req.user.email,
        username: req.user.username,
        role: req.user.role,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        isActive: req.user.isActive,
        lastLogin: req.user.lastLogin,
      }
    }
  });
});

/**
 * POST /api/v1/auth/logout
 * User logout (client-side token deletion)
 */
router.post('/logout', authenticate, (req, res) => {
  // Token invalidation handled on client-side
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

module.exports = router;
