const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/user/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
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
          isProfilePublic: user.isProfilePublic,
          isPhoneVerified: user.isPhoneVerified,
          isEmailVerified: user.isEmailVerified,
          notificationSettings: user.notificationSettings,
          totalRequestsSent: user.totalRequestsSent,
          totalRequestsReceived: user.totalRequestsReceived,
          lastActive: user.lastActive,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('upiId').optional().trim(),
  body('isProfilePublic').optional().isBoolean().withMessage('isProfilePublic must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { name, upiId, isProfilePublic } = req.body;

    const user = await User.findById(req.user._id);
    
    if (name) user.name = name;
    if (upiId !== undefined) user.upiId = upiId;
    if (isProfilePublic !== undefined) user.isProfilePublic = isProfilePublic;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          upiId: user.upiId,
          profilePicture: user.profilePicture,
          isProfilePublic: user.isProfilePublic,
          isPhoneVerified: user.isPhoneVerified,
          isEmailVerified: user.isEmailVerified
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/user/notification-settings
// @desc    Update notification settings
// @access  Private
router.put('/notification-settings', protect, [
  body('email').optional().isBoolean().withMessage('email must be a boolean'),
  body('sms').optional().isBoolean().withMessage('sms must be a boolean'),
  body('push').optional().isBoolean().withMessage('push must be a boolean'),
  body('reminderFrequency').optional().isIn(['daily', 'weekly', '3days_before']).withMessage('Invalid reminder frequency')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { email, sms, push, reminderFrequency } = req.body;

    const user = await User.findById(req.user._id);
    
    if (email !== undefined) user.notificationSettings.email = email;
    if (sms !== undefined) user.notificationSettings.sms = sms;
    if (push !== undefined) user.notificationSettings.push = push;
    if (reminderFrequency) user.notificationSettings.reminderFrequency = reminderFrequency;

    await user.save();

    res.json({
      success: true,
      message: 'Notification settings updated successfully',
      data: {
        notificationSettings: user.notificationSettings
      }
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/user/password
// @desc    Change password
// @access  Private
router.put('/password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    
    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   DELETE /api/user/account
// @desc    Deactivate account
// @access  Private
router.delete('/account', protect, [
  body('password').notEmpty().withMessage('Password is required for account deactivation')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { password } = req.body;

    const user = await User.findById(req.user._id);
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Password is incorrect'
      });
    }

    // Deactivate account
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/user/statistics
// @desc    Get user statistics
// @access  Private
router.get('/statistics', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Get statistics from Request model
    const Request = require('../models/Request');
    
    const [
      totalRequestsSent,
      totalRequestsReceived,
      pendingRequestsSent,
      pendingRequestsReceived,
      paidRequestsSent,
      paidRequestsReceived
    ] = await Promise.all([
      Request.countDocuments({ creator: user._id }),
      Request.countDocuments({ 'recipients.user': user._id }),
      Request.countDocuments({ 
        creator: user._id, 
        status: { $in: ['pending', 'accepted', 'partially_paid'] } 
      }),
      Request.countDocuments({ 
        'recipients.user': user._id, 
        status: { $in: ['pending', 'accepted', 'partially_paid'] } 
      }),
      Request.countDocuments({ creator: user._id, status: 'paid' }),
      Request.countDocuments({ 'recipients.user': user._id, status: 'paid' })
    ]);

    res.json({
      success: true,
      data: {
        statistics: {
          totalRequestsSent,
          totalRequestsReceived,
          pendingRequestsSent,
          pendingRequestsReceived,
          paidRequestsSent,
          paidRequestsReceived,
          totalRequests: totalRequestsSent + totalRequestsReceived,
          pendingRequests: pendingRequestsSent + pendingRequestsReceived
        }
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/user/search
// @desc    Search users by name or phone (for adding contacts)
// @access  Private
router.get('/search', protect, [
  body('query').notEmpty().withMessage('Search query is required')
], async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters long'
      });
    }

    const users = await User.find({
      $and: [
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { phone: { $regex: query, $options: 'i' } }
          ]
        },
        { _id: { $ne: req.user._id } }, // Exclude current user
        { isActive: true },
        { isProfilePublic: true } // Only public profiles
      ]
    }).select('name phone upiId profilePicture isProfilePublic').limit(10);

    res.json({
      success: true,
      data: {
        users: users.map(user => ({
          _id: user._id,
          name: user.name,
          phone: user.phone,
          upiId: user.upiId,
          profilePicture: user.profilePicture
        }))
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;