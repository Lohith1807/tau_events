const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: 'General'
  },
  // Eligibility
  eligibility: {
    batches: [{ type: String }],
    schools: [{ type: String }],
    departments: [{ type: String }]
  },
  // Schedule
  schedule: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    venue: { type: String, default: '' },
    mode: { type: String, enum: ['offline', 'online', 'hybrid'], default: 'offline' }
  },
  // Media
  poster: { type: String, default: '' },
  images: [{ type: String }],
  // Registration
  registration: {
    type: { type: String, enum: ['limited', 'unlimited'], default: 'unlimited' },
    maxSeats: { type: Number, default: 0 },
    registeredCount: { type: Number, default: 0 },
    startDate: { type: Date },
    endDate: { type: Date }
  },
  // Certificate
  certificate: {
    enabled: { type: Boolean, default: false },
    preview: { type: String, default: '' }
  },
  // Approval workflow
  status: {
    type: String,
    enum: ['draft', 'pending_dean', 'pending_registrar', 'approved', 'rejected', 'published'],
    default: 'draft'
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  // References
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewedByDean: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedByRegistrar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deanReviewDate: Date,
  registrarReviewDate: Date
}, {
  timestamps: true
});

eventSchema.index({ status: 1 });
eventSchema.index({ createdBy: 1 });
eventSchema.index({ 'eligibility.schools': 1 });
eventSchema.index({ 'eligibility.departments': 1 });
eventSchema.index({ 'eligibility.batches': 1 });


module.exports = mongoose.model('Event', eventSchema);
