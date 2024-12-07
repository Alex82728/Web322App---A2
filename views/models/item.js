const mongoose = require('mongoose');

// Define the Item schema
const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    published: {
        type: Boolean,
        default: false
    },
    featureImage: {
        type: String,  // URL of the image
        required: true
    },
    postDate: {
        type: Date,
        default: Date.now
    }
});

// Create and export the Item model
const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
