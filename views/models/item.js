const mongoose = require('mongoose');

// Define the item schema
const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  published: { type: Boolean, default: false }
});

// Create the Item model
const Item = mongoose.model('Item', itemSchema);

module.exports = Item;