const { Item, Category } = require('./models'); // Assuming you have imported your models from a separate 'models' file
const { Op } = require('sequelize');
const cloudinary = require('cloudinary').v2;

// Get all items
module.exports.getAllItems = async () => {
    try {
        const items = await Item.findAll();
        if (items && items.length) {
            return items;
        } else {
            throw new Error('No items found');
        }
    } catch (err) {
        throw new Error('Error retrieving items: ' + err.message);
    }
};

// Get items by category
module.exports.getItemsByCategory = async (categoryId) => {
    try {
        const items = await Item.findAll({ where: { categoryId } });
        if (items && items.length) {
            return items;
        } else {
            throw new Error('No items found for this category');
        }
    } catch (err) {
        throw new Error('Error retrieving items by category: ' + err.message);
    }
};

// Get items by minimum date
module.exports.getItemsByMinDate = async (minDateStr) => {
    try {
        const { gte } = Op;
        const items = await Item.findAll({
            where: {
                postDate: {
                    [gte]: new Date(minDateStr)
                }
            }
        });
        if (items && items.length) {
            return items;
        } else {
            throw new Error('No items found after this date');
        }
    } catch (err) {
        throw new Error('Error retrieving items by date: ' + err.message);
    }
};

// Get item by ID
module.exports.getItemById = async (id) => {
    try {
        const item = await Item.findByPk(id);
        if (item) {
            return item;
        } else {
            throw new Error('Item not found');
        }
    } catch (err) {
        throw new Error('Error retrieving item by ID: ' + err.message);
    }
};

// Add a new item (with Cloudinary image upload)
module.exports.addItem = async (itemData, imageFile) => {
    try {
        // Ensure published is a boolean
        itemData.published = itemData.published ? true : false;

        // Replace blank values with null
        Object.keys(itemData).forEach(key => {
            if (itemData[key] === "") {
                itemData[key] = null;
            }
        });

        // Upload the image to Cloudinary if provided
        if (imageFile) {
            const fileType = imageFile.mimetype.split('/')[0];
            if (fileType !== 'image') {
                throw new Error('Only image files are allowed.');
            }

            const imageUrl = await streamUpload(imageFile);
            itemData.featureImage = imageUrl;
        }

        itemData.postDate = new Date();
        const newItem = await Item.create(itemData);
        return newItem;
    } catch (err) {
        throw new Error('Unable to create item: ' + err.message);
    }
};

// Helper function for image upload to Cloudinary
const streamUpload = (imageFile) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            (error, result) => {
                if (result) {
                    resolve(result.secure_url);
                } else {
                    reject(error);
                }
            }
        );
        require('streamifier').createReadStream(imageFile.buffer).pipe(stream);
    });
};

// Get published items
module.exports.getPublishedItems = async () => {
    try {
        const items = await Item.findAll({ where: { published: true } });
        if (items && items.length) {
            return items;
        } else {
            throw new Error('No published items found');
        }
    } catch (err) {
        throw new Error('Error retrieving published items: ' + err.message);
    }
};

// Get published items by category
module.exports.getPublishedItemsByCategory = async (categoryId) => {
    try {
        const items = await Item.findAll({
            where: {
                published: true,
                categoryId
            }
        });
        if (items && items.length) {
            return items;
        } else {
            throw new Error('No published items found for this category');
        }
    } catch (err) {
        throw new Error('Error retrieving published items by category: ' + err.message);
    }
};

// Get all categories
module.exports.getCategories = async () => {
    try {
        const categories = await Category.findAll();
        if (categories && categories.length) {
            return categories;
        } else {
            throw new Error('No categories found');
        }
    } catch (err) {
        throw new Error('Error retrieving categories: ' + err.message);
    }
};

// Add a new category
module.exports.addCategory = async (categoryData) => {
    try {
        categoryData.name = categoryData.name || null;
        categoryData.description = categoryData.description || null;

        await Category.create(categoryData);
    } catch (err) {
        throw new Error('Unable to create category: ' + err.message);
    }
};

// Delete a category by ID
module.exports.deleteCategoryById = async (id) => {
    try {
        const result = await Category.destroy({ where: { id } });
        if (result === 0) {
            throw new Error('Category not found or already deleted');
        }
    } catch (err) {
        throw new Error('Unable to delete category: ' + err.message);
    }
};

// Delete an item by ID
module.exports.deleteItemById = async (id) => {
    try {
        const result = await Item.destroy({ where: { id } });
        if (result === 0) {
            throw new Error('Item not found or already deleted');
        }
    } catch (err) {
        throw new Error('Unable to delete item: ' + err.message);
    }
};
