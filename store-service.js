const { Item, Category, sequelize } = require('./db'); // Assuming Sequelize models
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Cloudinary configuration
cloudinary.config({
  cloud_name: 'dwdftakvt',
  api_key: '162258875171715',
  api_secret: 'koJ8QmofWIKO9jU-f29ym0q6Daw',
});

// Utility function to validate pagination parameters
const validatePagination = (page, pageSize) => {
  const validatedPage = Math.max(parseInt(page, 10) || 1, 1);
  const validatedPageSize = Math.min(Math.max(parseInt(pageSize, 10) || 10, 1), 100); // Set upper limit for pageSize
  return { validatedPage, validatedPageSize };
};

// Get all items with pagination and include category data
module.exports.getAllItems = async (page = 1, pageSize = 10) => {
  try {
    const { validatedPage, validatedPageSize } = validatePagination(page, pageSize);
    console.log(`Fetching all items - page: ${validatedPage}, pageSize: ${validatedPageSize}`);

    const items = await Item.findAll({
      offset: (validatedPage - 1) * validatedPageSize,  // Pagination
      limit: validatedPageSize,  // Pagination
      include: {
        model: Category,
        attributes: ['name'],  // Include the category name
      }
    });

    if (items.length > 0) {
      console.log('Items fetched:', items);
      return items;
    } else {
      throw new Error('No items found');
    }
  } catch (err) {
    console.error('Error retrieving items:', err);
    throw new Error('Error retrieving items: ' + err.message);
  }
};

// Alias method for getItems, calling getAllItems
module.exports.getItems = async (page = 1, pageSize = 10) => {
  return await module.exports.getAllItems(page, pageSize);
};

// Get items by category with pagination
module.exports.getItemsByCategory = async (categoryId, page = 1, pageSize = 10) => {
  try {
    const { validatedPage, validatedPageSize } = validatePagination(page, pageSize);
    console.log(`Fetching items for category ${categoryId} - page: ${validatedPage}, pageSize: ${validatedPageSize}`);

    const items = await Item.findAll({
      where: { categoryId },
      offset: (validatedPage - 1) * validatedPageSize,  // Pagination
      limit: validatedPageSize,  // Pagination
      include: {
        model: Category,
        attributes: ['name'],  // Include category name
      }
    });

    if (items.length > 0) {
      console.log('Items fetched:', items);
      return items;
    } else {
      throw new Error('No items found for this category');
    }
  } catch (err) {
    console.error('Error retrieving items by category:', err);
    throw new Error('Error retrieving items by category: ' + err.message);
  }
};

// Get item by ID
module.exports.getItemById = async (id) => {
  try {
    console.log(`Fetching item by ID: ${id}`);
    const item = await Item.findByPk(id, {
      include: {
        model: Category,
        attributes: ['name'],  // Include category name
      }
    });

    if (item) {
      console.log('Item fetched:', item);
      return item;
    } else {
      throw new Error('Item not found');
    }
  } catch (err) {
    console.error('Error retrieving item by ID:', err);
    throw new Error('Error retrieving item by ID: ' + err.message);
  }
};

// Add a new item with Cloudinary image upload
module.exports.addItem = async (itemData, imageFile) => {
  try {
    console.log('Adding new item with data:', itemData);

    // Ensure published is a boolean
    itemData.published = !!itemData.published;

    // Replace blank values with null
    Object.keys(itemData).forEach((key) => {
      if (itemData[key] === '') {
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
    console.log('New item added:', newItem);
    return newItem;
  } catch (err) {
    console.error('Error adding item:', err);
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
    streamifier.createReadStream(imageFile.buffer).pipe(stream);
  });
};

// Get published items with pagination
module.exports.getPublishedItems = async (page = 1, pageSize = 10) => {
  try {
    const { validatedPage, validatedPageSize } = validatePagination(page, pageSize);
    console.log(`Fetching published items - page: ${validatedPage}, pageSize: ${validatedPageSize}`);

    const items = await Item.findAll({
      where: { published: true },
      offset: (validatedPage - 1) * validatedPageSize,  // Pagination
      limit: validatedPageSize,  // Pagination
      include: {
        model: Category,
        attributes: ['name'],  // Include category name
      }
    });

    if (items.length > 0) {
      console.log('Published items fetched:', items);
      return items;
    } else {
      throw new Error('No published items found');
    }
  } catch (err) {
    console.error('Error retrieving published items:', err);
    throw new Error('Error retrieving published items: ' + err.message);
  }
};

// Get published items by category with pagination
module.exports.getPublishedItemsByCategory = async (categoryId, page = 1, pageSize = 10) => {
  try {
    const { validatedPage, validatedPageSize } = validatePagination(page, pageSize);
    console.log(`Fetching published items for category ${categoryId} - page: ${validatedPage}, pageSize: ${validatedPageSize}`);

    const items = await Item.findAll({
      where: { published: true, categoryId },
      offset: (validatedPage - 1) * validatedPageSize,  // Pagination
      limit: validatedPageSize,  // Pagination
      include: {
        model: Category,
        attributes: ['name'],  // Include category name
      }
    });

    if (items.length > 0) {
      console.log('Published items by category fetched:', items);
      return items;
    } else {
      throw new Error('No published items found for this category');
    }
  } catch (err) {
    console.error('Error retrieving published items by category:', err);
    throw new Error('Error retrieving published items by category: ' + err.message);
  }
};

// Get all categories
module.exports.getCategories = async () => {
  try {
    console.log('Fetching all categories');
    const categories = await Category.findAll();

    if (categories.length > 0) {
      console.log('Categories fetched:', categories);
      return categories;
    } else {
      throw new Error('No categories found');
    }
  } catch (err) {
    console.error('Error retrieving categories:', err);
    throw new Error('Error retrieving categories: ' + err.message);
  }
};

// Add a new category
module.exports.addCategory = async (categoryData) => {
  try {
    console.log('Adding new category with data:', categoryData);
    categoryData.name = categoryData.name || null;
    categoryData.description = categoryData.description || null;

    await Category.create(categoryData);
    console.log('Category added successfully');
  } catch (err) {
    console.error('Error adding category:', err);
    throw new Error('Unable to create category: ' + err.message);
  }
};

// Delete a category by ID, checking for dependencies
module.exports.deleteCategoryById = async (id) => {
  try {
    console.log(`Deleting category by ID: ${id}`);
    const items = await Item.findAll({ where: { categoryId: id } });

    if (items.length > 0) {
      throw new Error('Cannot delete category. Items are still linked to it.');
    }

    const result = await Category.destroy({ where: { id } });
    if (result === 0) {
      throw new Error('Category not found or already deleted');
    }

    console.log('Category deleted successfully');
  } catch (err) {
    console.error('Error deleting category:', err);
    throw new Error('Unable to delete category: ' + err.message);
  }
};

// Delete an item by ID
module.exports.deleteItemById = async (id) => {
  try {
    console.log(`Deleting item by ID: ${id}`);
    const result = await Item.destroy({ where: { id } });

    if (result === 0) {
      throw new Error('Item not found or already deleted');
    }

    console.log('Item deleted successfully');
  } catch (err) {
    console.error('Error deleting item:', err);
    throw new Error('Unable to delete item: ' + err.message);
  }
};
