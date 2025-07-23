const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  deliveryBoyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // or 'DeliveryBoy' if you use a separate model
    required: true
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  pickedUpAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['assigned', 'picked up', 'in transit', 'delivered', 'failed', 'cancelled'],
    default: 'assigned'
  },
  location: {
    lat: { type: Number },
    lng: { type: Number }
  },
  remarks: {
    type: String,
    default: ''
  },
  signature: {
    type: String // URL of signature or photo
  },
  otp: {
    type: String // Optional for secure delivery verification
  }
}, { timestamps: true });

module.exports = mongoose.model('Delivery', deliverySchema);
