const express = require('express');
const { body, validationResult } = require('express-validator');
const Contact = require('../models/Contact');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/contact
// @desc    Get all contacts for user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { tag, search } = req.query;
    
    let query = { userId: req.user._id, isActive: true };
    
    // Filter by tag
    if (tag && tag !== 'all') {
      query.tags = tag;
    }
    
    // Search by name
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    const contacts = await Contact.find(query)
      .sort({ lastInteraction: -1 })
      .populate('payusUserId', 'name phone upiId profilePicture');
    
    res.json({
      success: true,
      data: {
        contacts: contacts.map(contact => ({
          _id: contact._id,
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          tags: contact.tags,
          source: contact.source,
          notes: contact.notes,
          profilePicture: contact.profilePicture,
          lastInteraction: contact.lastInteraction,
          isPayusUser: !!contact.payusUserId,
          payusUser: contact.payusUserId ? {
            _id: contact.payusUserId._id,
            name: contact.payusUserId.name,
            phone: contact.payusUserId.phone,
            upiId: contact.payusUserId.upiId,
            profilePicture: contact.payusUserId.profilePicture
          } : null,
          totalRequestsSent: contact.totalRequestsSent,
          totalRequestsReceived: contact.totalRequestsReceived,
          totalAmountRequested: contact.totalAmountRequested,
          totalAmountReceived: contact.totalAmountReceived
        }))
      }
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/contact
// @desc    Add a new contact
// @access  Private
router.post('/', protect, [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('phone').matches(/^[0-9]{10,15}$/).withMessage('Please provide a valid phone number'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
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

    const { name, phone, email, tags, notes, source = 'manual' } = req.body;

    // Check if contact already exists
    const existingContact = await Contact.findOne({
      userId: req.user._id,
      phone: phone
    });

    if (existingContact) {
      return res.status(400).json({
        success: false,
        error: 'Contact with this phone number already exists'
      });
    }

    // Check if this phone number belongs to a PayUS user
    const payusUser = await User.findOne({ phone: phone, isActive: true });

    // Create contact
    const contact = new Contact({
      userId: req.user._id,
      name,
      phone,
      email,
      tags: tags || ['friend'],
      notes,
      source,
      payusUserId: payusUser ? payusUser._id : null
    });

    await contact.save();

    // Populate PayUS user info
    if (payusUser) {
      await contact.populate('payusUserId', 'name phone upiId profilePicture');
    }

    res.status(201).json({
      success: true,
      message: 'Contact added successfully',
      data: {
        contact: {
          _id: contact._id,
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          tags: contact.tags,
          source: contact.source,
          notes: contact.notes,
          profilePicture: contact.profilePicture,
          isPayusUser: !!contact.payusUserId,
          payusUser: contact.payusUserId ? {
            _id: contact.payusUserId._id,
            name: contact.payusUserId.name,
            phone: contact.payusUserId.phone,
            upiId: contact.payusUserId.upiId,
            profilePicture: contact.payusUserId.profilePicture
          } : null
        }
      }
    });
  } catch (error) {
    console.error('Add contact error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/contact/import
// @desc    Import contacts from phone
// @access  Private
router.post('/import', protect, [
  body('contacts').isArray().withMessage('Contacts must be an array'),
  body('contacts.*.name').notEmpty().withMessage('Contact name is required'),
  body('contacts.*.phone').matches(/^[0-9]{10,15}$/).withMessage('Please provide a valid phone number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { contacts } = req.body;
    const importedContacts = [];
    const skippedContacts = [];

    for (const contactData of contacts) {
      try {
        // Check if contact already exists
        const existingContact = await Contact.findOne({
          userId: req.user._id,
          phone: contactData.phone
        });

        if (existingContact) {
          skippedContacts.push({
            name: contactData.name,
            phone: contactData.phone,
            reason: 'Already exists'
          });
          continue;
        }

        // Check if this phone number belongs to a PayUS user
        const payusUser = await User.findOne({ phone: contactData.phone, isActive: true });

        // Create contact
        const contact = new Contact({
          userId: req.user._id,
          name: contactData.name,
          phone: contactData.phone,
          email: contactData.email,
          tags: contactData.tags || ['friend'],
          source: 'imported',
          payusUserId: payusUser ? payusUser._id : null
        });

        await contact.save();
        importedContacts.push(contact);
      } catch (error) {
        skippedContacts.push({
          name: contactData.name,
          phone: contactData.phone,
          reason: 'Invalid data'
        });
      }
    }

    res.json({
      success: true,
      message: `Imported ${importedContacts.length} contacts successfully`,
      data: {
        imported: importedContacts.length,
        skipped: skippedContacts.length,
        skippedContacts
      }
    });
  } catch (error) {
    console.error('Import contacts error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/contact/:id
// @desc    Get specific contact
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    }).populate('payusUserId', 'name phone upiId profilePicture');

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }

    res.json({
      success: true,
      data: {
        contact: {
          _id: contact._id,
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          tags: contact.tags,
          source: contact.source,
          notes: contact.notes,
          profilePicture: contact.profilePicture,
          lastInteraction: contact.lastInteraction,
          isPayusUser: !!contact.payusUserId,
          payusUser: contact.payusUserId ? {
            _id: contact.payusUserId._id,
            name: contact.payusUserId.name,
            phone: contact.payusUserId.phone,
            upiId: contact.payusUserId.upiId,
            profilePicture: contact.payusUserId.profilePicture
          } : null,
          totalRequestsSent: contact.totalRequestsSent,
          totalRequestsReceived: contact.totalRequestsReceived,
          totalAmountRequested: contact.totalAmountRequested,
          totalAmountReceived: contact.totalAmountReceived
        }
      }
    });
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/contact/:id
// @desc    Update contact
// @access  Private
router.put('/:id', protect, [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
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

    const { name, email, tags, notes } = req.body;

    const contact = await Contact.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }

    if (name) contact.name = name;
    if (email !== undefined) contact.email = email;
    if (tags) contact.tags = tags;
    if (notes !== undefined) contact.notes = notes;

    await contact.save();

    res.json({
      success: true,
      message: 'Contact updated successfully',
      data: {
        contact: {
          _id: contact._id,
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          tags: contact.tags,
          source: contact.source,
          notes: contact.notes,
          profilePicture: contact.profilePicture,
          isPayusUser: !!contact.payusUserId
        }
      }
    });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   DELETE /api/contact/:id
// @desc    Delete contact (soft delete)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }

    // Soft delete
    contact.isActive = false;
    await contact.save();

    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/contact/:id/tags
// @desc    Add tag to contact
// @access  Private
router.post('/:id/tags', protect, [
  body('tag').isIn(['friend', 'family', 'colleague', 'other']).withMessage('Invalid tag')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { tag } = req.body;

    const contact = await Contact.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }

    await contact.addTag(tag);

    res.json({
      success: true,
      message: 'Tag added successfully',
      data: {
        tags: contact.tags
      }
    });
  } catch (error) {
    console.error('Add tag error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   DELETE /api/contact/:id/tags/:tag
// @desc    Remove tag from contact
// @access  Private
router.delete('/:id/tags/:tag', protect, async (req, res) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }

    await contact.removeTag(req.params.tag);

    res.json({
      success: true,
      message: 'Tag removed successfully',
      data: {
        tags: contact.tags
      }
    });
  } catch (error) {
    console.error('Remove tag error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;