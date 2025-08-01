const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  // Request Details
  requestId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Request Type
  type: {
    type: String,
    enum: ['individual', 'group'],
    required: true
  },
  
  // Request Creator (Borrower)
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Request Recipients (Lenders)
  recipients: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact'
    },
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    email: String,
    isPayusUser: {
      type: Boolean,
      default: false
    }
  }],
  
  // Amount Details
  totalAmount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [1, 'Amount must be at least ₹1'],
    max: [100000, 'Amount cannot exceed ₹1,00,000']
  },
  
  // Individual amounts for group requests
  individualAmounts: [{
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Amount must be at least ₹1']
    },
    paidAmount: {
      type: Number,
      default: 0
    }
  }],
  
  // Request Status
  status: {
    type: String,
    enum: ['pending', 'accepted', 'partially_paid', 'paid', 'cancelled', 'rejected'],
    default: 'pending'
  },
  
  // Payment Status for each recipient
  paymentStatus: [{
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'partially_paid', 'paid', 'rejected'],
      default: 'pending'
    },
    paidAmount: {
      type: Number,
      default: 0
    },
    paidAt: Date,
    notes: String
  }],
  
  // Request Details
  title: {
    type: String,
    required: [true, 'Request title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  
  // Repayment Schedule
  repaymentDate: {
    type: Date,
    required: [true, 'Repayment date is required']
  },
  
  // Reminders
  reminders: [{
    type: {
      type: String,
      enum: ['daily', 'weekly', '3days_before', 'custom'],
      required: true
    },
    sentAt: Date,
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Messages/Updates
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: [200, 'Message cannot be more than 200 characters']
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Privacy Settings
  isPrivate: {
    type: Boolean,
    default: true
  },
  
  // Request Visibility
  visibility: {
    type: String,
    enum: ['private', 'recipients_only', 'public'],
    default: 'private'
  },
  
  // Tags for categorization
  tags: [{
    type: String,
    enum: ['emergency', 'medical', 'travel', 'education', 'business', 'personal', 'other']
  }],
  
  // Request Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Timestamps
  acceptedAt: Date,
  paidAt: Date,
  cancelledAt: Date,
  rejectedAt: Date
}, {
  timestamps: true
});

// Indexes for better query performance
requestSchema.index({ creator: 1, status: 1 });
requestSchema.index({ 'recipients.user': 1, status: 1 });
requestSchema.index({ requestId: 1 });
requestSchema.index({ repaymentDate: 1 });
requestSchema.index({ createdAt: -1 });

// Pre-save middleware to generate request ID
requestSchema.pre('save', function(next) {
  if (!this.requestId) {
    this.requestId = 'REQ' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
  next();
});

// Method to add recipient
requestSchema.methods.addRecipient = function(recipientData) {
  const recipient = {
    user: recipientData.user,
    contact: recipientData.contact,
    name: recipientData.name,
    phone: recipientData.phone,
    email: recipientData.email,
    isPayusUser: recipientData.isPayusUser || false
  };
  
  this.recipients.push(recipient);
  
  // Add payment status entry
  this.paymentStatus.push({
    recipientId: recipientData.user,
    status: 'pending',
    paidAmount: 0
  });
  
  return this.save();
};

// Method to update payment status
requestSchema.methods.updatePaymentStatus = function(recipientId, status, paidAmount = 0, notes = '') {
  const paymentStatus = this.paymentStatus.find(ps => ps.recipientId.toString() === recipientId.toString());
  
  if (paymentStatus) {
    paymentStatus.status = status;
    paymentStatus.paidAmount = paidAmount;
    paymentStatus.notes = notes;
    
    if (status === 'paid' || status === 'partially_paid') {
      paymentStatus.paidAt = new Date();
    }
  }
  
  // Update overall request status
  this.updateOverallStatus();
  
  return this.save();
};

// Method to update overall request status
requestSchema.methods.updateOverallStatus = function() {
  const allPaid = this.paymentStatus.every(ps => ps.status === 'paid');
  const anyPaid = this.paymentStatus.some(ps => ps.status === 'paid' || ps.status === 'partially_paid');
  const anyRejected = this.paymentStatus.some(ps => ps.status === 'rejected');
  
  if (allPaid) {
    this.status = 'paid';
    this.paidAt = new Date();
  } else if (anyPaid) {
    this.status = 'partially_paid';
  } else if (anyRejected) {
    this.status = 'rejected';
    this.rejectedAt = new Date();
  }
};

// Method to add message
requestSchema.methods.addMessage = function(senderId, message, isPrivate = false) {
  this.messages.push({
    sender: senderId,
    message,
    isPrivate
  });
  
  return this.save();
};

// Method to add reminder
requestSchema.methods.addReminder = function(type, recipientId) {
  this.reminders.push({
    type,
    sentAt: new Date(),
    recipientId
  });
  
  return this.save();
};

// Method to get request summary
requestSchema.methods.getSummary = function() {
  return {
    _id: this._id,
    requestId: this.requestId,
    type: this.type,
    title: this.title,
    totalAmount: this.totalAmount,
    status: this.status,
    repaymentDate: this.repaymentDate,
    createdAt: this.createdAt,
    recipientCount: this.recipients.length,
    paidCount: this.paymentStatus.filter(ps => ps.status === 'paid').length
  };
};

// Method to get request details for recipient
requestSchema.methods.getRecipientDetails = function(recipientId) {
  const recipient = this.recipients.find(r => r.user.toString() === recipientId.toString());
  const paymentStatus = this.paymentStatus.find(ps => ps.recipientId.toString() === recipientId.toString());
  
  return {
    requestId: this.requestId,
    title: this.title,
    description: this.description,
    totalAmount: this.totalAmount,
    repaymentDate: this.repaymentDate,
    status: this.status,
    recipient: recipient,
    paymentStatus: paymentStatus,
    createdAt: this.createdAt
  };
};

// Static method to find requests by user
requestSchema.statics.findByUser = function(userId, role = 'all') {
  const query = {};
  
  if (role === 'creator') {
    query.creator = userId;
  } else if (role === 'recipient') {
    query['recipients.user'] = userId;
  } else {
    query.$or = [
      { creator: userId },
      { 'recipients.user': userId }
    ];
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to find pending requests
requestSchema.statics.findPendingRequests = function(userId) {
  return this.find({
    $or: [
      { creator: userId },
      { 'recipients.user': userId }
    ],
    status: { $in: ['pending', 'accepted', 'partially_paid'] }
  }).sort({ repaymentDate: 1 });
};

module.exports = mongoose.model('Request', requestSchema);