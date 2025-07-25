const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
  name: { type: String, required: true },

  emailId: { type: String, required: true, unique: true },
  
  rating: { type: Number, default: 0 }
});

module.exports = mongoose.model('Seller', sellerSchema);
