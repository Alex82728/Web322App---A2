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

// Cloudinary Configuration
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
            return `<li class="nav-item${(url == app.locals.activeRoute ? ' active' : '')}"><a class="nav-link" href="${url}">${options.fn(this)}</a></li>`;
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
            let year = dateObj.getFullYear();
            let month = (dateObj.getMonth() + 1).toString();
            let day = dateObj.getDate().toString();
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
    },
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true
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

// Home Route
app.get('/', (req, res) => {
    res.render('home', { title: "Motorcycle Shop", activeRoute: req.path });
});

// About Route
app.get('/about', (req, res) => {
    res.render('about', { title: "About Us", activeRoute: req.path });
});

// Add Item Route (GET)
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
            activeRoute: req.path,
            errors: { general: "Error fetching categories." }
        });
    }
});

// Shop Route (Display Published Items, Filtered by Category if Query Present)
app.get('/shop', async (req, res) => {
    let viewData = {};

    try {
        let items = [];

        if (req.query.category) {
            items = await storeService.getPublishedItemsByCategory(req.query.category);
        } else {
            items = await storeService.getPublishedItems();
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

// Add Item (POST route with Image Upload)
app.post('/items/add', upload.single("featureImage"), (req, res) => {
    let errors = {};
    let hasError = false;

    // Validate fields
    if (!req.body.name || req.body.name.trim().length === 0) {
        errors.name = "Item name is required.";
        hasError = true;
    }
    if (!req.body.categoryId) {
        errors.categoryId = "Category is required.";
        hasError = true;
    }
    if (!req.body.price || isNaN(req.body.price) || parseFloat(req.body.price) <= 0) {
        errors.price = "Please enter a valid price.";
        hasError = true;
    }
    if (!req.body.description || req.body.description.trim().length === 0) {
        errors.description = "Description is required.";
        hasError = true;
    }
    if (!req.file) {
        errors.featureImage = "Feature image is required.";
        hasError = true;
    }

    if (hasError) {
        storeService.getCategories()
            .then((categories) => {
                res.render('addItem', {
                    title: "Add New Item",
                    categories: categories,
                    errors: errors,
                    name: req.body.name,
                    categoryId: req.body.categoryId,
                    price: req.body.price,
                    description: req.body.description,
                    published: req.body.published === 'true'
                });
            })
            .catch((err) => {
                console.error("Error fetching categories for add item:", err);
                res.status(500).send("Unable to fetch categories.");
            });
    } else {
        // Upload image to Cloudinary
        const fileType = req.file.mimetype.split('/')[0];
        if (fileType !== 'image') {
            errors.featureImage = "Only image files are allowed.";
            return res.render('addItem', {
                title: "Add New Item",
                categories: [],
                errors: errors,
                name: req.body.name,
                categoryId: req.body.categoryId,
                price: req.body.price,
                description: req.body.description,
                published: req.body.published === 'true'
            });
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
                res.status(500).send("Cloudinary upload error.");
            });
    }
});

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});
