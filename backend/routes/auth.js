const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendSMS, sendEmail } = require('../utils/notifications');

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('phone').matches(/^[0-9]{10,15}$/).withMessage('Please provide a valid phone number'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { name, email, phone, password, upiId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email or phone already exists'
      });
    }

    // Create user
    const user = new User({
      name,
      email,
      phone,
      password,
      upiId
    });

    await user.save();

    // Generate OTP for phone verification
    const phoneOtp = user.generateOtp('phone');
    await user.save();

    // Send SMS OTP
    try {
      await sendSMS(phone, `Your PayUS verification code is: ${phoneOtp}`);
    } catch (error) {
      console.error('SMS sending failed:', error);
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your phone number.',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          isPhoneVerified: user.isPhoneVerified,
          isEmailVerified: user.isEmailVerified
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('identifier').notEmpty().withMessage('Email or phone is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { identifier, password } = req.body;

    // Find user by email or phone
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phone: identifier }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    // Update last active
    await user.updateLastActive();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          upiId: user.upiId,
          isPhoneVerified: user.isPhoneVerified,
          isEmailVerified: user.isEmailVerified,
          notificationSettings: user.notificationSettings
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during login'
    });
  }
});

// @route   POST /api/auth/send-otp
// @desc    Send OTP for verification
// @access  Public
router.post('/send-otp', [
  body('phone').matches(/^[0-9]{10,15}$/).withMessage('Please provide a valid phone number'),
  body('type').isIn(['phone', 'email']).withMessage('Invalid OTP type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { phone, type } = req.body;

    // Find user by phone
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Generate OTP
    const otp = user.generateOtp(type);
    await user.save();

    // Send OTP
    if (type === 'phone') {
      try {
        await sendSMS(phone, `Your PayUS verification code is: ${otp}`);
      } catch (error) {
        console.error('SMS sending failed:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to send SMS OTP'
        });
      }
    } else if (type === 'email') {
      try {
        await sendEmail(user.email, 'PayUS Verification Code', `Your verification code is: ${otp}`);
      } catch (error) {
        console.error('Email sending failed:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to send email OTP'
        });
      }
    }

    res.json({
      success: true,
      message: `OTP sent to your ${type} successfully`
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while sending OTP'
    });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP
// @access  Public
router.post('/verify-otp', [
  body('phone').matches(/^[0-9]{10,15}$/).withMessage('Please provide a valid phone number'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('type').isIn(['phone', 'email']).withMessage('Invalid OTP type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { phone, otp, type } = req.body;

    // Find user by phone
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify OTP
    const isValid = user.verifyOtp(otp, type);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP'
      });
    }

    await user.save();

    res.json({
      success: true,
      message: `${type} verified successfully`,
      data: {
        isPhoneVerified: user.isPhoneVerified,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while verifying OTP'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          upiId: user.upiId,
          profilePicture: user.profilePicture,
          isPhoneVerified: user.isPhoneVerified,
          isEmailVerified: user.isEmailVerified,
          notificationSettings: user.notificationSettings,
          totalRequestsSent: user.totalRequestsSent,
          totalRequestsReceived: user.totalRequestsReceived,
          lastActive: user.lastActive
        }
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset OTP
// @access  Public
router.post('/forgot-password', [
  body('phone').matches(/^[0-9]{10,15}$/).withMessage('Please provide a valid phone number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { phone } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Generate OTP for password reset
    const otp = user.generateOtp('phone');
    await user.save();

    // Send SMS
    try {
      await sendSMS(phone, `Your PayUS password reset code is: ${otp}`);
    } catch (error) {
      console.error('SMS sending failed:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to send reset code'
      });
    }

    res.json({
      success: true,
      message: 'Password reset code sent successfully'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with OTP
// @access  Public
router.post('/reset-password', [
  body('phone').matches(/^[0-9]{10,15}$/).withMessage('Please provide a valid phone number'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { phone, otp, newPassword } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify OTP
    const isValid = user.verifyOtp(otp, 'phone');
    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;