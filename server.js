/*********************************************************************************
WEB322 – Assignment 04
I declare that this assignment is my own work in accordance with Seneca Academic Policy.  
No part of this assignment has been copied manually or electronically from any other source 
(including 3rd party web sites) or distributed to other students.

Name: Alexandru Zaporojan
Student ID: 105756233 
Date: 2024/10/08

Render App URL: https://web322app-a2-1.onrender.com
GitHub Repository URL: https://github.com/Alex82728/Web322App---A2.git
********************************************************************************/ 

const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
const storeService = require('./store-service'); // Ensure these methods are defined in store-service.js
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const app = express();
const PORT = 8080;

// Cloudinary Configuration (hardcoded credentials)
cloudinary.config({
  cloud_name: 'dwdftakvt',  // Replace with your Cloudinary cloud name
  api_key: '162258875171715',  // Replace with your Cloudinary API key
  api_secret: 'koJ8QmofWIKO9jU-f29ym0q6Daw'  // Replace with your Cloudinary API secret
});

const upload = multer();

// Set up Handlebars engine with runtimeOptions to allow prototype property access
const hbs = exphbs.create({
    extname: '.hbs',
    helpers: {
        navLink: function (url, options) {
            return `<li class="nav-item${(url == app.locals.activeRoute ? ' active' : '')}">
                        <a class="nav-link" href="${url}">${options.fn(this)}</a>
                    </li>`;
        },
        equal: function (lvalue, rvalue, options) {
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        },
        eq: function (a, b) {
            return a === b;
        },
        formatDate: function(dateObj) {
            if (dateObj && Object.prototype.toString.call(dateObj) === '[object Date]' && !isNaN(dateObj)) {
                let year = dateObj.getFullYear();
                let month = (dateObj.getMonth() + 1).toString();
                let day = dateObj.getDate().toString();
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            } else {
                return "Invalid Date";
            }
        },
        formatPrice: function(price) {
            if (typeof price === 'number') {
                return price.toFixed(2);
            }
            return "0.00"; // Default in case price is not a number
        }
    },
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,  // Allow access to prototype properties
        allowProtoMethodsByDefault: true      // Allow access to prototype methods
    }
});

app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');

// Middleware to set active route
app.use((req, res, next) => {
    let route = req.path.split('?')[0];  // Exclude query parameters for active route
    app.locals.activeRoute = route;
    next();
});

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
    res.render('home', { title: "Motorcycle Shop", activeRoute: req.path });
});

app.get('/about', (req, res) => {
    res.render('about', { title: "About Us", activeRoute: req.path });
});

app.get('/items/add', async (req, res) => {
    try {
        let categories = await storeService.getCategories();
        res.render('addItem', { 
            title: "Add New Item", 
            categories: categories, 
            activeRoute: req.path 
        });
    } catch (err) {
        console.error("Error fetching categories for add item:", err);
        res.render('addItem', { 
            title: "Add New Item", 
            categories: [], 
            activeRoute: req.path 
        });
    }
});

// Display all items
app.get('/items', async (req, res) => {
    try {
        const items = await storeService.getItems();
        if (items.length === 0) {
            res.render('items', { title: "Items", message: "No items found", activeRoute: req.path });
        } else {
            res.render('items', { title: "Items", items: items, activeRoute: req.path });
        }
    } catch (err) {
        console.error("Error retrieving items:", err);
        res.render('items', { title: "Items", message: "Error retrieving items", activeRoute: req.path });
    }
});

app.get('/categories/add', (req, res) => {
    res.render('addCategory', { title: "Add New Category", activeRoute: req.path });
});

app.post('/categories/add', (req, res) => {
    const newCategory = {
        name: req.body.name,
        description: req.body.description
    };

    storeService.addCategory(newCategory)
        .then(() => {
            res.redirect('/categories');
        })
        .catch((err) => {
            console.error("Error adding category:", err);
            res.status(500).send("Unable to add category.");
        });
});

// Shop Route (Display Published Items, Filtered by Category if Query Present)
app.get('/shop', async (req, res) => {
    let viewData = {};

    try {
        let items = [];
        const page = req.query.page || 1;
        const pageSize = req.query.pageSize || 10;
        const validatedPage = parseInt(page);
        const validatedPageSize = parseInt(pageSize);

        console.log(`Fetching items - Page: ${validatedPage}, PageSize: ${validatedPageSize}`);

        if (req.query.category) {
            items = await storeService.getPublishedItemsByCategory(req.query.category, validatedPage, validatedPageSize);
        } else {
            items = await storeService.getPublishedItems(validatedPage, validatedPageSize);
        }

        if (items.length === 0) {
            viewData.message = "No items found.";
        }

        items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));

        let latestItem = items[0];
        viewData.items = items;
        viewData.latestItem = latestItem;
    } catch (err) {
        viewData.message = "Error fetching items.";
        console.error("Error fetching items for shop route:", err);
    }

    try {
        let categories = await storeService.getCategories();
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "No categories available.";
        console.error("Error fetching categories for shop route:", err);
    }

    res.render('shop', { data: viewData });
});

// Category-specific Items Route
app.get('/shop/category/:categoryId', async (req, res) => {
    const { categoryId } = req.params;
    let viewData = {};

    try {
        let items = await storeService.getItemsByCategory(categoryId);
        
        if (items.length === 0) {
            viewData.message = "No items found in this category.";
        }

        items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));
        
        viewData.items = items;
    } catch (err) {
        viewData.message = "Error fetching items for this category.";
        console.error("Error fetching items for category:", err);
    }

    try {
        let categories = await storeService.getCategories();
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "No categories available.";
        console.error("Error fetching categories:", err);
    }

    res.render('shop', { data: viewData });
});

app.get('/categories', (req, res) => {
    storeService.getCategories()
        .then((data) => {
            if (data.length === 0) {
                res.render('categories', { title: "Categories", message: "No categories available", activeRoute: req.path });
            } else {
                res.render('categories', { title: "Categories", categories: data, activeRoute: req.path });
            }
        })
        .catch((err) => {
            console.error("Error retrieving categories:", err);
            res.render('categories', { title: "Categories", message: "Error retrieving categories", activeRoute: req.path });
        });
});

app.delete('/items/:id', (req, res) => {
    const itemId = req.params.id;

    storeService.deleteItem(itemId)
        .then(() => {
            res.status(200).json({ message: "Item deleted successfully." });
        })
        .catch((err) => {
            console.error("Error deleting item:", err);
            res.status(500).send("Unable to delete item.");
        });
});

app.delete('/categories/:id', (req, res) => {
    const categoryId = req.params.id;

    storeService.deleteCategory(categoryId)
        .then(() => {
            res.status(200).json({ message: "Category deleted successfully." });
        })
        .catch((err) => {
            console.error("Error deleting category:", err);
            res.status(500).send("Unable to delete category.");
        });
});

app.get('/shop/:id', (req, res) => {
    const id = req.params.id;
    storeService.getItemById(id)
        .then(async (item) => {
            try {
                const category = await storeService.getCategoryById(item.category);
                res.render('itemDetails', { 
                    title: "Item Details", 
                    item, 
                    category: category ? category.name : "Unknown", 
                    activeRoute: req.path 
                });
            } catch (err) {
                console.error("Error fetching category:", err);
                res.status(500).send("Error fetching category.");
            }
        })
        .catch((err) => {
            console.error("Error fetching item details:", err);
            res.status(404).send("Item not found.");
        });
});

app.post('/items/add', upload.single("featureImage"), (req, res) => {
    if (!req.file) {
        return res.status(400).send("No image file uploaded. Please upload an image.");
    }

    const fileType = req.file.mimetype.split('/')[0];
    if (fileType !== 'image') {
        return res.status(400).send("Only image files are allowed.");
    }

    let streamUpload = (req) => {
        return new Promise((resolve, reject) => {
            let stream = cloudinary.uploader.upload_stream(
                (error, result) => {
                    if (result) {
                        resolve(result);
                    } else {
                        reject(error);
                    }
                }
            );
            streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
    };

    streamUpload(req)
        .then((result) => {
            const newItem = {
                id: 0,
                featureImage: result.secure_url,
                published: req.body.published === 'true',
                postDate: new Date(),
                ...req.body
            };

            storeService.addItem(newItem)
                .then(() => {
                    res.redirect('/shop');
                })
                .catch((err) => {
                    console.error("Error adding item:", err);
                    res.status(500).send("Unable to add item.");
                });
        })
        .catch((error) => {
            console.error("Cloudinary upload error:", error);
            res.status(500).send("Image upload failed.");
        });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
