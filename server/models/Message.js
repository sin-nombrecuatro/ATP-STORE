const mongoose = require('mongoose');

module.exports = mongoose.model(
  'Message',
  new mongoose.Schema({ name: String, email: String, message: String, user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }, { timestamps: true })
);
