const express = require('express');
const { body, validationResult } = require('express-validator');
const Request = require('../models/Request');
const Contact = require('../models/Contact');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendRequestNotification, sendRequestReminder } = require('../utils/notifications');

const router = express.Router();

// @route   GET /api/request
// @desc    Get all requests for user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    
    let query = {
      $or: [
        { creator: req.user._id },
        { 'recipients.user': req.user._id }
      ]
    };
    
    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Filter by type (sent/received)
    if (type === 'sent') {
      query = { creator: req.user._id };
    } else if (type === 'received') {
      query = { 'recipients.user': req.user._id };
    }
    
    const skip = (page - 1) * limit;
    
    const [requests, total] = await Promise.all([
      Request.find(query)
        .populate('creator', 'name phone')
        .populate('recipients.user', 'name phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Request.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: {
        requests: requests.map(request => ({
          _id: request._id,
          requestId: request.requestId,
          type: request.type,
          title: request.title,
          description: request.description,
          totalAmount: request.totalAmount,
          status: request.status,
          repaymentDate: request.repaymentDate,
          createdAt: request.createdAt,
          creator: {
            _id: request.creator._id,
            name: request.creator.name,
            phone: request.creator.phone
          },
          recipients: request.recipients.map(recipient => ({
            _id: recipient.user._id,
            name: recipient.name,
            phone: recipient.phone,
            isPayusUser: recipient.isPayusUser
          })),
          paymentStatus: request.paymentStatus,
          tags: request.tags,
          priority: request.priority,
          isCreator: request.creator._id.toString() === req.user._id.toString()
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/request
// @desc    Create a new request
// @access  Private
router.post('/', protect, [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description cannot be more than 500 characters'),
  body('totalAmount').isFloat({ min: 1, max: 100000 }).withMessage('Amount must be between ₹1 and ₹1,00,000'),
  body('repaymentDate').isISO8601().withMessage('Please provide a valid repayment date'),
  body('recipients').isArray({ min: 1 }).withMessage('At least one recipient is required'),
  body('recipients.*.contactId').notEmpty().withMessage('Contact ID is required'),
  body('type').isIn(['individual', 'group']).withMessage('Invalid request type'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const {
      title,
      description,
      totalAmount,
      repaymentDate,
      recipients,
      type,
      tags,
      priority = 'medium',
      individualAmounts
    } = req.body;

    // Validate repayment date
    const repaymentDateObj = new Date(repaymentDate);
    if (repaymentDateObj <= new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Repayment date must be in the future'
      });
    }

    // Get contacts and validate
    const contactIds = recipients.map(r => r.contactId);
    const contacts = await Contact.find({
      _id: { $in: contactIds },
      userId: req.user._id,
      isActive: true
    });

    if (contacts.length !== recipients.length) {
      return res.status(400).json({
        success: false,
        error: 'Some contacts not found'
      });
    }

    // Prepare recipients data
    const recipientsData = contacts.map(contact => ({
      user: contact.payusUserId || contact._id, // Use PayUS user ID if available
      contact: contact._id,
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      isPayusUser: !!contact.payusUserId
    }));

    // Create request
    const request = new Request({
      type,
      creator: req.user._id,
      recipients: recipientsData,
      totalAmount,
      title,
      description,
      repaymentDate: repaymentDateObj,
      tags: tags || [],
      priority,
      individualAmounts: type === 'group' ? individualAmounts : []
    });

    await request.save();

    // Update user statistics
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { totalRequestsSent: 1 }
    });

    // Update contact statistics
    for (const contact of contacts) {
      await Contact.findByIdAndUpdate(contact._id, {
        $inc: { totalRequestsSent: 1, totalAmountRequested: totalAmount }
      });
    }

    // Send notifications to recipients
    for (const recipient of recipientsData) {
      if (recipient.isPayusUser) {
        const recipientUser = await User.findById(recipient.user);
        if (recipientUser) {
          await sendRequestNotification(recipientUser, request, 'new_request');
        }
      }
    }

    // Populate creator and recipients for response
    await request.populate('creator', 'name phone');
    await request.populate('recipients.user', 'name phone');

    res.status(201).json({
      success: true,
      message: 'Request created successfully',
      data: {
        request: {
          _id: request._id,
          requestId: request.requestId,
          type: request.type,
          title: request.title,
          description: request.description,
          totalAmount: request.totalAmount,
          status: request.status,
          repaymentDate: request.repaymentDate,
          createdAt: request.createdAt,
          creator: {
            _id: request.creator._id,
            name: request.creator.name,
            phone: request.creator.phone
          },
          recipients: request.recipients.map(recipient => ({
            _id: recipient.user._id,
            name: recipient.name,
            phone: recipient.phone,
            isPayusUser: recipient.isPayusUser
          })),
          tags: request.tags,
          priority: request.priority
        }
      }
    });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/request/:id
// @desc    Get specific request
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const request = await Request.findOne({
      _id: req.params.id,
      $or: [
        { creator: req.user._id },
        { 'recipients.user': req.user._id }
      ]
    })
    .populate('creator', 'name phone upiId')
    .populate('recipients.user', 'name phone upiId')
    .populate('messages.sender', 'name');

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    // Get user's role in this request
    const isCreator = request.creator._id.toString() === req.user._id.toString();
    const userPaymentStatus = request.paymentStatus.find(
      ps => ps.recipientId.toString() === req.user._id.toString()
    );

    res.json({
      success: true,
      data: {
        request: {
          _id: request._id,
          requestId: request.requestId,
          type: request.type,
          title: request.title,
          description: request.description,
          totalAmount: request.totalAmount,
          status: request.status,
          repaymentDate: request.repaymentDate,
          createdAt: request.createdAt,
          creator: {
            _id: request.creator._id,
            name: request.creator.name,
            phone: request.creator.phone,
            upiId: request.creator.upiId
          },
          recipients: request.recipients.map(recipient => ({
            _id: recipient.user._id,
            name: recipient.name,
            phone: recipient.phone,
            email: recipient.email,
            isPayusUser: recipient.isPayusUser,
            upiId: recipient.user.upiId
          })),
          paymentStatus: request.paymentStatus,
          messages: request.messages.map(message => ({
            _id: message._id,
            message: message.message,
            isPrivate: message.isPrivate,
            createdAt: message.createdAt,
            sender: {
              _id: message.sender._id,
              name: message.sender.name
            }
          })),
          tags: request.tags,
          priority: request.priority,
          reminders: request.reminders,
          isCreator,
          userPaymentStatus
        }
      }
    });
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/request/:id/status
// @desc    Update request payment status
// @access  Private
router.put('/:id/status', protect, [
  body('status').isIn(['accepted', 'rejected', 'partially_paid', 'paid', 'cancelled']).withMessage('Invalid status'),
  body('paidAmount').optional().isFloat({ min: 0 }).withMessage('Paid amount must be a positive number'),
  body('notes').optional().isLength({ max: 200 }).withMessage('Notes cannot be more than 200 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { status, paidAmount = 0, notes = '' } = req.body;

    const request = await Request.findOne({
      _id: req.params.id,
      'recipients.user': req.user._id
    }).populate('creator', 'name phone');

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found or you are not a recipient'
      });
    }

    // Update payment status
    await request.updatePaymentStatus(req.user._id, status, paidAmount, notes);

    // Update contact statistics
    const contact = await Contact.findOne({
      userId: req.user._id,
      phone: request.creator.phone
    });

    if (contact) {
      if (status === 'paid' || status === 'partially_paid') {
        await Contact.findByIdAndUpdate(contact._id, {
          $inc: { totalRequestsReceived: 1, totalAmountReceived: paidAmount }
        });
      }
    }

    // Send notification to creator
    if (request.creator) {
      await sendRequestNotification(request.creator, request, status === 'paid' ? 'payment_received' : 'request_accepted');
    }

    res.json({
      success: true,
      message: 'Request status updated successfully',
      data: {
        request: {
          _id: request._id,
          status: request.status,
          paymentStatus: request.paymentStatus
        }
      }
    });
  } catch (error) {
    console.error('Update request status error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/request/:id/message
// @desc    Add message to request
// @access  Private
router.post('/:id/message', protect, [
  body('message').trim().isLength({ min: 1, max: 200 }).withMessage('Message must be between 1 and 200 characters'),
  body('isPrivate').optional().isBoolean().withMessage('isPrivate must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { message, isPrivate = false } = req.body;

    const request = await Request.findOne({
      _id: req.params.id,
      $or: [
        { creator: req.user._id },
        { 'recipients.user': req.user._id }
      ]
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    // Add message
    await request.addMessage(req.user._id, message, isPrivate);

    res.json({
      success: true,
      message: 'Message added successfully',
      data: {
        message: {
          message,
          isPrivate,
          createdAt: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   DELETE /api/request/:id
// @desc    Cancel request (only creator can cancel)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const request = await Request.findOne({
      _id: req.params.id,
      creator: req.user._id,
      status: { $in: ['pending', 'accepted'] }
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found or cannot be cancelled'
      });
    }

    // Cancel request
    request.status = 'cancelled';
    request.cancelledAt = new Date();
    await request.save();

    res.json({
      success: true,
      message: 'Request cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel request error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/request/pending/count
// @desc    Get count of pending requests
// @access  Private
router.get('/pending/count', protect, async (req, res) => {
  try {
    const [sentCount, receivedCount] = await Promise.all([
      Request.countDocuments({
        creator: req.user._id,
        status: { $in: ['pending', 'accepted', 'partially_paid'] }
      }),
      Request.countDocuments({
        'recipients.user': req.user._id,
        status: { $in: ['pending', 'accepted', 'partially_paid'] }
      })
    ]);

    res.json({
      success: true,
      data: {
        pendingSent: sentCount,
        pendingReceived: receivedCount,
        totalPending: sentCount + receivedCount
      }
    });
  } catch (error) {
    console.error('Get pending count error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;