const fs = require('fs');
const path = require('path');

let items = [];
let categories = [];

// Initialize the store service
module.exports.initialize = () => {
    return new Promise((resolve, reject) => {
        fs.readFile('./data/items.json', 'utf8', (err, data) => {
            if (err) {
                reject("Unable to read items file");
                return;
            }

            items = JSON.parse(data);

            fs.readFile('./data/categories.json', 'utf8', (err, data) => {
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
        let filteredItems = items.filter(item => item.categoryId === parseInt(categoryId)); // Ensure comparison against a number
        if (filteredItems.length === 0) {
            reject("No results returned for the specified category.");
            return;
        }
        resolve(filteredItems);
    });
};

// Get items by minimum date
module.exports.getItemsByMinDate = (minDateStr) => {
    return new Promise((resolve, reject) => {
        const minDate = new Date(minDateStr); // Convert the minDateStr to a Date object
        let filteredItems = items.filter(item => new Date(item.postDate) >= minDate); // Compare postDate with minDate
        
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
        const item = items.find(item => item.id === parseInt(id)); // Ensure comparison against a number
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
        itemData.published = (itemData.published !== undefined) ? true : false;

        itemData.id = items.length ? Math.max(...items.map(item => item.id)) + 1 : 1;

        items.push(itemData);

        fs.writeFile('./data/items.json', JSON.stringify(items, null, 2), (err) => {
            if (err) {
                reject("Unable to save item");
                return;
            }
            resolve(itemData);
        });
    });
};
