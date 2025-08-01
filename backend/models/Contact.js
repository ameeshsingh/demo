const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  // User who owns this contact
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Contact Information
  name: {
    type: String,
    required: [true, 'Contact name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[0-9]{10,15}$/, 'Please enter a valid phone number']
  },
  
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  // Contact Tagging
  tags: [{
    type: String,
    enum: ['friend', 'family', 'colleague', 'other'],
    default: 'friend'
  }],
  
  // Contact Source
  source: {
    type: String,
    enum: ['manual', 'imported', 'app_user'],
    default: 'manual'
  },
  
  // If this contact is also a PayUS user
  payusUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Contact Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Additional Information
  notes: {
    type: String,
    maxlength: [200, 'Notes cannot be more than 200 characters']
  },
  
  // Profile Picture (if available)
  profilePicture: {
    type: String,
    default: null
  },
  
  // Last Interaction
  lastInteraction: {
    type: Date,
    default: Date.now
  },
  
  // Request Statistics (for this specific contact)
  totalRequestsSent: {
    type: Number,
    default: 0
  },
  
  totalRequestsReceived: {
    type: Number,
    default: 0
  },
  
  totalAmountRequested: {
    type: Number,
    default: 0
  },
  
  totalAmountReceived: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
contactSchema.index({ userId: 1, phone: 1 }, { unique: true });
contactSchema.index({ userId: 1, tags: 1 });
contactSchema.index({ userId: 1, isActive: 1 });

// Method to update last interaction
contactSchema.methods.updateLastInteraction = function() {
  this.lastInteraction = new Date();
  return this.save();
};

// Method to add tag
contactSchema.methods.addTag = function(tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
  }
  return this.save();
};

// Method to remove tag
contactSchema.methods.removeTag = function(tag) {
  this.tags = this.tags.filter(t => t !== tag);
  return this.save();
};

// Method to get contact summary
contactSchema.methods.getSummary = function() {
  return {
    _id: this._id,
    name: this.name,
    phone: this.phone,
    email: this.email,
    tags: this.tags,
    profilePicture: this.profilePicture,
    isPayusUser: !!this.payusUserId,
    lastInteraction: this.lastInteraction,
    totalRequestsSent: this.totalRequestsSent,
    totalRequestsReceived: this.totalRequestsReceived
  };
};

// Static method to find contacts by user and tag
contactSchema.statics.findByUserAndTag = function(userId, tag) {
  return this.find({ userId, tags: tag, isActive: true });
};

// Static method to find contacts by user and phone
contactSchema.statics.findByUserAndPhone = function(userId, phone) {
  return this.findOne({ userId, phone, isActive: true });
};

module.exports = mongoose.model('Contact', contactSchema);