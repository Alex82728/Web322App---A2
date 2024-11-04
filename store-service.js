const fs = require('fs');
const path = require('path');

let items = [];
let categories = [];

// Initialize the store service
module.exports.initialize = () => {
    return new Promise((resolve, reject) => {
        fs.readFile('./data/items.json', 'utf8', (err, data) => {
            if (err) {
                reject("unable to read items file");
                return;
            }

            items = JSON.parse(data);

            fs.readFile('./data/categories.json', 'utf8', (err, data) => {
                if (err) {
                    reject("unable to read categories file");
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
            reject("no results returned");
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
            reject("no results returned");
            return;
        }
        resolve(publishedItems);
    });
};

// Get categories
module.exports.getCategories = () => {
    return new Promise((resolve, reject) => {
        if (categories.length === 0) {
            reject("no results returned");
            return;
        }
        resolve(categories);
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
                reject("unable to save item");
                return;
            }
            resolve(itemData); 
        });
    });
};
