const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'registrar', 'dean', 'faculty', 'student'],
    default: 'student'
  },
  rollNo: {
    type: String,
    default: ''
  },
  department: {
    type: String,
    default: ''
  },
  school: {
    type: String,
    default: ''
  },
  programLevel: {
    type: String,
    enum: ['Under Graduate', 'Post Graduate', ''],
    default: ''
  },
  batch: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    type: String,
    default: null
  },
  otpExpires: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

userSchema.index({ role: 1 });
userSchema.index({ school: 1 });
userSchema.index({ rollNo: 1 });
userSchema.index({ department: 1 });

// Hybrid comparison to support transition without errors
userSchema.methods.comparePassword = async function(candidatePassword) {
  // 1. Try direct literal comparison (New Plain-text strategy)
  if (candidatePassword === this.password) return true;
  
  // 2. Try bcrypt comparison (In case database still has old hashes)
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (err) {
    // If it's not a valid hash or bcrypt fails, just return false
    return false;
  }
};


userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.otp;
  delete user.otpExpires;
  return user;
};

module.exports = mongoose.model('User', userSchema);

