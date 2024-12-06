const { Item, Category } = require('./models'); // Assuming you have imported your models from a separate 'models' file
const { Op } = require('sequelize');
const cloudinary = require('cloudinary').v2;

// Get all items
module.exports.getAllItems = () => {
    return new Promise((resolve, reject) => {
        Item.findAll()
            .then(items => {
                if (items && items.length) {
                    resolve(items);
                } else {
                    reject('No items found');
                }
            })
            .catch(err => reject('Error retrieving items: ' + err.message));
    });
};

// Get items by category
module.exports.getItemsByCategory = (categoryId) => {
    return new Promise((resolve, reject) => {
        Item.findAll({ where: { categoryId: categoryId } })
            .then(items => {
                if (items && items.length) {
                    resolve(items);
                } else {
                    reject('No items found for this category');
                }
            })
            .catch(err => reject('Error retrieving items by category: ' + err.message));
    });
};

// Get items by minimum date
module.exports.getItemsByMinDate = (minDateStr) => {
    return new Promise((resolve, reject) => {
        const { gte } = Op;
        Item.findAll({
            where: {
                postDate: {
                    [gte]: new Date(minDateStr)
                }
            }
        })
            .then(items => {
                if (items && items.length) {
                    resolve(items);
                } else {
                    reject('No items found after this date');
                }
            })
            .catch(err => reject('Error retrieving items by date: ' + err.message));
    });
};

// Get item by ID
module.exports.getItemById = (id) => {
    return new Promise((resolve, reject) => {
        Item.findByPk(id)
            .then(item => {
                if (item) {
                    resolve(item);
                } else {
                    reject('Item not found');
                }
            })
            .catch(err => reject('Error retrieving item by ID: ' + err.message));
    });
};

// Add a new item (with Cloudinary image upload)
module.exports.addItem = (itemData, imageFile) => {
    return new Promise((resolve, reject) => {
        // Ensure published is a boolean
        itemData.published = itemData.published ? true : false;

        // Replace blank values with null
        for (let key in itemData) {
            if (itemData[key] === "") {
                itemData[key] = null;
            }
        }

        // Upload the image to Cloudinary if provided
        if (imageFile) {
            const fileType = imageFile.mimetype.split('/')[0];
            if (fileType !== 'image') {
                return reject('Only image files are allowed.');
            }

            let streamUpload = (file) => {
                return new Promise((resolve, reject) => {
                    let stream = cloudinary.uploader.upload_stream(
                        (error, result) => {
                            if (result) {
                                resolve(result.secure_url);
                            } else {
                                reject(error);
                            }
                        }
                    );
                    require('streamifier').createReadStream(file.buffer).pipe(stream);
                });
            };

            streamUpload(imageFile)
                .then((imageUrl) => {
                    itemData.featureImage = imageUrl;
                    itemData.postDate = new Date();

                    Item.create(itemData)
                        .then(item => resolve(item)) // Successfully created
                        .catch(err => reject('Unable to create item: ' + err.message));
                })
                .catch(err => reject('Image upload failed: ' + err.message));
        } else {
            itemData.postDate = new Date();
            Item.create(itemData)
                .then(item => resolve(item)) // Successfully created
                .catch(err => reject('Unable to create item: ' + err.message));
        }
    });
};

// Get published items
module.exports.getPublishedItems = () => {
    return new Promise((resolve, reject) => {
        Item.findAll({ where: { published: true } })
            .then(items => {
                if (items && items.length) {
                    resolve(items);
                } else {
                    reject('No published items found');
                }
            })
            .catch(err => reject('Error retrieving published items: ' + err.message));
    });
};

// Get published items by category
module.exports.getPublishedItemsByCategory = (categoryId) => {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                published: true,
                categoryId: categoryId
            }
        })
            .then(items => {
                if (items && items.length) {
                    resolve(items);
                } else {
                    reject('No published items found for this category');
                }
            })
            .catch(err => reject('Error retrieving published items by category: ' + err.message));
    });
};

// Get all categories
module.exports.getCategories = () => {
    return new Promise((resolve, reject) => {
        Category.findAll()
            .then(categories => {
                if (categories && categories.length) {
                    resolve(categories);
                } else {
                    reject('No categories found');
                }
            })
            .catch(err => reject('Error retrieving categories: ' + err.message));
    });
};

// Add a new category
module.exports.addCategory = (categoryData) => {
    return new Promise((resolve, reject) => {
        // Replace blank values with null
        categoryData.name = categoryData.name || null;
        categoryData.description = categoryData.description || null;

        Category.create(categoryData)
            .then(() => resolve()) // Successfully created
            .catch(err => reject('Unable to create category: ' + err.message));
    });
};

// Delete a category by ID
module.exports.deleteCategoryById = (id) => {
    return new Promise((resolve, reject) => {
        Category.destroy({
            where: { id: id }
        })
            .then(result => {
                if (result === 0) {
                    reject('Category not found or already deleted');
                } else {
                    resolve(); // Successfully deleted
                }
            })
            .catch(err => reject('Unable to delete category: ' + err.message));
    });
};

// Delete an item by ID
module.exports.deleteItemById = (id) => {
    return new Promise((resolve, reject) => {
        Item.destroy({
            where: { id: id }
        })
            .then(result => {
                if (result === 0) {
                    reject('Item not found or already deleted');
                } else {
                    resolve(); // Successfully deleted
                }
            })
            .catch(err => reject('Unable to delete item: ' + err.message));
    });
};
