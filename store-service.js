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
        fs.readFile(path.join(__dirname, 'data', 'items.json'), 'utf8', (err, data) => {
            if (err) {
                reject("Unable to read items file");
                return;
            }

            items = JSON.parse(data);

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

// Function to delete an item
module.exports.deleteItem = (itemId) => {
    return new Promise((resolve, reject) => {
        const itemIndex = items.findIndex(i => i.id === parseInt(itemId));

        if (itemIndex !== -1) {
            const item = items[itemIndex];

            if (item.featureImage) {
                const publicId = item.featureImage.split('/').pop().split('.')[0];

                deleteImage(publicId)
                    .then(() => {
                        items.splice(itemIndex, 1);
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
                items.splice(itemIndex, 1);
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

// Get items by category
module.exports.getItemsByCategory = (categoryId) => {
    return new Promise((resolve, reject) => {
        let filteredItems = items.filter(item => item.categoryId === parseInt(categoryId));
        if (filteredItems.length === 0) {
            reject("No results returned for the specified category.");
            return;
        }
        resolve(filteredItems);
    });
};

// Get published items by category
module.exports.getPublishedItemsByCategory = (categoryId) => {
    return new Promise((resolve, reject) => {
        let filteredItems = items.filter(item => item.published && item.categoryId === parseInt(categoryId));
        if (filteredItems.length === 0) {
            reject("No published items found for the specified category.");
            return;
        }
        resolve(filteredItems);
    });
};

// Get items by minimum date
module.exports.getItemsByMinDate = (minDateStr) => {
    return new Promise((resolve, reject) => {
        const minDate = new Date(minDateStr);
        let filteredItems = items.filter(item => new Date(item.postDate) >= minDate);
        
        if (filteredItems.length === 0) {
            reject("No items found from the given date.");
            return;
        }
        resolve(filteredItems);
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

// Add a new item
module.exports.addItem = (itemData) => {
    return new Promise((resolve, reject) => {
        itemData.published = itemData.published ? true : false;
        itemData.id = items.length ? Math.max(...items.map(item => item.id)) + 1 : 1;

        items.push(itemData);

        fs.writeFile(path.join(__dirname, 'data', 'items.json'), JSON.stringify(items, null, 2), (err) => {
            if (err) {
                reject("Unable to save item. Please check server logs.");
                return;
            }
            resolve(itemData);
        });
    });
};
