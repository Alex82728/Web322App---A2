const fs = require('fs');
const path = require('path');

let items = [];
let categories = [];

// Initialize the store service
module.exports.initialize = () => {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, './data/items.json'), 'utf8', (err, data) => {
            if (err) {
                reject("Unable to read items file: " + err.message);
                return;
            }

            try {
                items = JSON.parse(data);
            } catch (parseErr) {
                reject("Failed to parse items data: " + parseErr.message);
                return;
            }

            fs.readFile(path.join(__dirname, './data/categories.json'), 'utf8', (err, data) => {
                if (err) {
                    reject("Unable to read categories file: " + err.message);
                    return;
                }

                try {
                    categories = JSON.parse(data);
                } catch (parseErr) {
                    reject("Failed to parse categories data: " + parseErr.message);
                    return;
                }
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
        const publishedItems = items.filter(item => item.published);
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
        const filteredItems = items.filter(item => item.categoryId === parseInt(categoryId));
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
        const minDate = new Date(minDateStr);
        const filteredItems = items.filter(item => new Date(item.postDate) >= minDate);
        
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
        itemData.published = itemData.published !== undefined ? itemData.published === 'true' : false;
        itemData.id = items.length ? Math.max(...items.map(item => item.id)) + 1 : 1;
        items.push(itemData);

        fs.writeFile(path.join(__dirname, './data/items.json'), JSON.stringify(items, null, 2), (err) => {
            if (err) {
                reject("Unable to save item: " + err.message);
                return;
            }
            resolve(itemData);
        });
    });
};
