const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const registrationSchema = new mongoose.Schema({
  registrationId: {
    type: String,
    default: () => uuidv4().slice(0, 8).toUpperCase(),
    unique: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['registered', 'attended', 'cancelled'],
    default: 'registered'
  },
  qrData: {
    type: String,
    default: ''
  },
  idCardGenerated: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

registrationSchema.index({ event: 1, student: 1 }, { unique: true });
registrationSchema.index({ student: 1 });
registrationSchema.index({ event: 1 });


module.exports = mongoose.model('Registration', registrationSchema);
