const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

// Initialize Cloudinary configuration
cloudinary.config({
    cloud_name: 'dwdftakvt',
    api_key: '242931154419331',
    api_secret: 'CJeSPxAcuaHBYV8NpPZSd8aQP4c',
});

// In-memory storage for items and categories
let items = [];
let categories = [];

// Initialize the store service
module.exports.initialize = () => {
    return new Promise((resolve, reject) => {
        // Load items from items.json
        fs.readFile(path.join(__dirname, 'data', 'items.json'), 'utf8', (err, data) => {
            if (err) {
                reject("Unable to read items file");
                return;
            }

            items = JSON.parse(data);

            // Load categories from categories.json
            fs.readFile(path.join(__dirname, 'data', 'categories.json'), 'utf8', (err, data) => {
                if (err) {
                    reject("Unable to read categories file");
                    return;
                }

                categories = JSON.parse(data);
                resolve();
            });
        });
    });
};

// Function to delete an image from Cloudinary
function deleteImage(publicId) {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
}

// Add a new item
module.exports.addItem = (itemData, file) => {
    return new Promise((resolve, reject) => {
        // Check if published flag is set correctly
        itemData.published = itemData.published ? true : false;

        // Handle feature image upload if provided
        if (file && file.featureImage) {
            const featureImagePath = file.featureImage.tempFilePath;

            // Upload image to Cloudinary
            cloudinary.uploader.upload(featureImagePath, { folder: 'motorcycle_gear' }, (error, result) => {
                if (error) {
                    reject("Error uploading feature image.");
                    return;
                }

                itemData.featureImage = result.secure_url; // Store Cloudinary URL for the image

                // Generate unique item ID
                itemData.id = items.length ? Math.max(...items.map(item => item.id)) + 1 : 1;

                // Auto set the postDate if it's not provided
                itemData.postDate = itemData.postDate || new Date().toISOString().split('T')[0];

                items.push(itemData);

                // Save the new item in items.json
                fs.writeFile(path.join(__dirname, 'data', 'items.json'), JSON.stringify(items, null, 2), (err) => {
                    if (err) {
                        reject("Unable to save item. Please check server logs.");
                        return;
                    }
                    resolve(itemData);
                });
            });
        } else {
            reject("No feature image uploaded");
        }
    });
};

// Function to delete an item
module.exports.deleteItem = (itemId) => {
    return new Promise((resolve, reject) => {
        const itemIndex = items.findIndex(i => i.id === parseInt(itemId));

        if (itemIndex !== -1) {
            const item = items[itemIndex];

            if (item.featureImage) {
                const publicId = item.featureImage.split('/').pop().split('.')[0];

                // Delete image from Cloudinary
                deleteImage(publicId)
                    .then(() => {
                        items.splice(itemIndex, 1); // Remove item from local storage
                        fs.writeFile(path.join(__dirname, 'data', 'items.json'), JSON.stringify(items, null, 2), (err) => {
                            if (err) {
                                reject("Unable to delete item. Please check server logs.");
                                return;
                            }
                            resolve();
                        });
                    })
                    .catch(error => {
                        reject("Failed to delete image from Cloudinary.");
                    });
            } else {
                items.splice(itemIndex, 1); // No image to delete
                fs.writeFile(path.join(__dirname, 'data', 'items.json'), JSON.stringify(items, null, 2), (err) => {
                    if (err) {
                        reject("Unable to delete item. Please check server logs.");
                        return;
                    }
                    resolve();
                });
            }
        } else {
            reject("Item not found");
        }
    });
};

// Get all items
module.exports.getAllItems = () => {
    return new Promise((resolve, reject) => {
        if (items.length === 0) {
            reject("No results returned");
            return;
        }
        resolve(items);
    });
};

// Get published items
module.exports.getPublishedItems = () => {
    return new Promise((resolve, reject) => {
        let publishedItems = items.filter(item => item.published);
        if (publishedItems.length === 0) {
            reject("No results returned");
            return;
        }
        resolve(publishedItems);
    });
};

// Get categories
module.exports.getCategories = () => {
    return new Promise((resolve, reject) => {
        if (categories.length === 0) {
            reject("No results returned");
            return;
        }
        resolve(categories);
    });
};

// Get an item by ID
module.exports.getItemById = (id) => {
    return new Promise((resolve, reject) => {
        const item = items.find(item => item.id === parseInt(id));
        if (!item) {
            reject("Item not found");
            return;
        }
        resolve(item);
    });
};

// Get items by category
module.exports.getItemsByCategory = (categoryName) => {
    return new Promise((resolve, reject) => {
        const filteredItems = items.filter(item => item.category && item.category.toLowerCase() === categoryName.toLowerCase());

        if (filteredItems.length === 0) {
            reject("No items found for this category");
            return;
        }

        resolve(filteredItems);
    });
};

// Get items by minimum date
module.exports.getItemsByMinDate = (minDate) => {
    return new Promise((resolve, reject) => {
        const filteredItems = items.filter(item => new Date(item.postDate) >= new Date(minDate));

        if (filteredItems.length === 0) {
            reject("No items found after this date");
            return;
        }

        resolve(filteredItems);
    });
};
