const { Item, Category } = require('./models'); // Assuming you have imported your models from a separate 'models' file
const { Op } = require('sequelize');

// Get all items
module.exports.getAllItems = () => {
    return Item.findAll()
        .then(items => {
            if (items && items.length) {
                return items;
            } else {
                throw new Error('No items found');
            }
        })
        .catch(err => { throw new Error('Error retrieving items: ' + err.message); });
};

// Get items by category
module.exports.getItemsByCategory = (categoryId) => {
    return Item.findAll({ where: { categoryId: categoryId } })
        .then(items => {
            if (items && items.length) {
                return items;
            } else {
                throw new Error('No items found for this category');
            }
        })
        .catch(err => { throw new Error('Error retrieving items by category: ' + err.message); });
};

// Get items by minimum date
module.exports.getItemsByMinDate = (minDateStr) => {
    const { gte } = Op;
    return Item.findAll({
        where: {
            postDate: {
                [gte]: new Date(minDateStr)
            }
        }
    })
    .then(items => {
        if (items && items.length) {
            return items;
        } else {
            throw new Error('No items found after this date');
        }
    })
    .catch(err => { throw new Error('Error retrieving items by date: ' + err.message); });
};

// Get item by ID
module.exports.getItemById = (id) => {
    return Item.findByPk(id)
        .then(item => {
            if (item) {
                return item;
            } else {
                throw new Error('Item not found');
            }
        })
        .catch(err => { throw new Error('Error retrieving item by ID: ' + err.message); });
};

// Add a new item
module.exports.addItem = (itemData) => {
    // Ensure published is a boolean
    itemData.published = itemData.published ? true : false;

    // Replace blank values with null
    Object.keys(itemData).forEach(key => {
        if (itemData[key] === "") {
            itemData[key] = null;
        }
    });

    // Set postDate to current date
    itemData.postDate = new Date();

    return Item.create(itemData)
        .then(item => item)
        .catch(err => { throw new Error('Unable to create item: ' + err.message); });
};

// Get published items
module.exports.getPublishedItems = () => {
    return Item.findAll({ where: { published: true } })
        .then(items => {
            if (items && items.length) {
                return items;
            } else {
                throw new Error('No published items found');
            }
        })
        .catch(err => { throw new Error('Error retrieving published items: ' + err.message); });
};

// Get published items by category
module.exports.getPublishedItemsByCategory = (categoryId) => {
    return Item.findAll({
        where: {
            published: true,
            categoryId: categoryId
        }
    })
    .then(items => {
        if (items && items.length) {
            return items;
        } else {
            throw new Error('No published items found for this category');
        }
    })
    .catch(err => { throw new Error('Error retrieving published items by category: ' + err.message); });
};

// Get all categories
module.exports.getCategories = () => {
    return Category.findAll()
        .then(categories => {
            if (categories && categories.length) {
                return categories;
            } else {
                throw new Error('No categories found');
            }
        })
        .catch(err => { throw new Error('Error retrieving categories: ' + err.message); });
};

// Add a new category
module.exports.addCategory = (categoryData) => {
    // Replace blank values with null
    categoryData.name = categoryData.name || null;
    categoryData.description = categoryData.description || null;

    return Category.create(categoryData)
        .then(() => true) // Successfully created
        .catch(err => { throw new Error('Unable to create category: ' + err.message); });
};

// Delete a category by ID
module.exports.deleteCategoryById = (id) => {
    return Category.destroy({
        where: { id: id }
    })
    .then(result => {
        if (result === 0) {
            throw new Error('Category not found or already deleted');
        } else {
            return true; // Successfully deleted
        }
    })
    .catch(err => { throw new Error('Unable to delete category: ' + err.message); });
};

// Delete an item by ID
module.exports.deleteItemById = (id) => {
    return Item.destroy({
        where: { id: id }
    })
    .then(result => {
        if (result === 0) {
            throw new Error('Item not found or already deleted');
        } else {
            return true; // Successfully deleted
        }
    })
    .catch(err => { throw new Error('Unable to delete item: ' + err.message); });
};
