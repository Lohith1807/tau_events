const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  deanName: {
    type: String,
    default: ''
  },
  levels: [{
    name: {
      type: String, // e.g. "Under Graduate", "Post Graduate"
      required: true
    },
    courses: [{ type: String }]
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('School', schoolSchema);
