const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:          { type: String, required: true },

  favouriteFood: { type: String, default: null },

  email:         { type: String, required: true, unique: true },

  location:      { type: String },
  
  phone:         { type: String }
},               
{ timestamps: true });

module.exports = mongoose.model('User', userSchema);
