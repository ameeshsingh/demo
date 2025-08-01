const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  
  // Contact Information
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    match: [/^[0-9]{10,15}$/, 'Please enter a valid phone number']
  },
  
  // Authentication
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  
  // Profile Information
  upiId: {
    type: String,
    trim: true,
    default: null
  },
  
  profilePicture: {
    type: String,
    default: null
  },
  
  // Privacy Settings
  isProfilePublic: {
    type: Boolean,
    default: false
  },
  
  // Verification Status
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  
  // OTP for verification
  emailOtp: {
    code: String,
    expiresAt: Date
  },
  
  phoneOtp: {
    code: String,
    expiresAt: Date
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Preferences
  notificationSettings: {
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    },
    reminderFrequency: {
      type: String,
      enum: ['daily', 'weekly', '3days_before'],
      default: '3days_before'
    }
  },
  
  // Statistics (for privacy, minimal data)
  totalRequestsSent: {
    type: Number,
    default: 0
  },
  
  totalRequestsReceived: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ isActive: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate OTP
userSchema.methods.generateOtp = function(type = 'phone') {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  if (type === 'email') {
    this.emailOtp = { code: otp, expiresAt };
  } else {
    this.phoneOtp = { code: otp, expiresAt };
  }
  
  return otp;
};

// Method to verify OTP
userSchema.methods.verifyOtp = function(otp, type = 'phone') {
  const otpData = type === 'email' ? this.emailOtp : this.phoneOtp;
  
  if (!otpData || !otpData.code || !otpData.expiresAt) {
    return false;
  }
  
  if (new Date() > otpData.expiresAt) {
    return false;
  }
  
  if (otpData.code !== otp) {
    return false;
  }
  
  // Mark as verified
  if (type === 'email') {
    this.isEmailVerified = true;
    this.emailOtp = null;
  } else {
    this.isPhoneVerified = true;
    this.phoneOtp = null;
  }
  
  return true;
};

// Method to get public profile (for privacy)
userSchema.methods.getPublicProfile = function() {
  return {
    _id: this._id,
    name: this.name,
    upiId: this.upiId,
    profilePicture: this.profilePicture,
    isProfilePublic: this.isProfilePublic
  };
};

// Method to update last active
userSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema);