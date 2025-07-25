const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sellerId: 
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  },
  photo: 
  {
    type: String,
    required: true
  },
  price: 
  {
    type: Number,
    required: true
  },
  description: 
  {
    type: String
  },
  name: 
  {
    type: String,
    required: true
  },
  category: 
  {
    type: String,
    enum: ['Snacks', 'Beverages', 'Desserts', 'Main Course', 'Combo', 'Other'],
    required: true
  },
  availability: 
  {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('Product', productSchema);
