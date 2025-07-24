const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
  photo: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String }
});

module.exports = mongoose.model('Product', productSchema);
