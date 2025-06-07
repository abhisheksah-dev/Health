const mongoose = require('mongoose');

const PharmacySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true },
  license: { type: String, trim: true },
  operatingHours: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

PharmacySchema.pre('save', function(next) { this.updatedAt = Date.now(); next(); });

module.exports = mongoose.model('Pharmacy', PharmacySchema); 