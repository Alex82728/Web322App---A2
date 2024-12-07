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
const { Item, Category } = require('./db');  // Import Sequelize models
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

// Add Item Route
app.get('/items/add', async (req, res) => {
    try {
        const categories = await Category.findAll();
        res.render('addItem', { 
            title: "Add New Item", 
            categories, 
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
        const items = await Item.findAll();
        if (items.length === 0) {
            res.render('items', { title: "Items", message: "No items found", activeRoute: req.path });
        } else {
            res.render('items', { title: "Items", items, activeRoute: req.path });
        }
    } catch (err) {
        console.error("Error retrieving items:", err);
        res.render('items', { title: "Items", message: "Error retrieving items", activeRoute: req.path });
    }
});

// Add Category Route
app.get('/categories/add', (req, res) => {
    res.render('addCategory', { title: "Add New Category", activeRoute: req.path });
});

// Display all categories
app.get('/categories', async (req, res) => {
    try {
        const categories = await Category.findAll();
        if (categories.length === 0) {
            res.render('categories', { title: "Categories", message: "No categories found", activeRoute: req.path });
        } else {
            res.render('categories', { title: "Categories", categories, activeRoute: req.path });
        }
    } catch (err) {
        console.error("Error retrieving categories:", err);
        res.render('categories', { title: "Categories", message: "Error retrieving categories", activeRoute: req.path });
    }
});

// Add category to database
app.post('/categories/add', async (req, res) => {
    const { name, description } = req.body;
    try {
        await Category.create({ name, description });
        res.redirect('/categories');
    } catch (err) {
        console.error("Error adding category:", err);
        res.status(500).send("Unable to add category.");
    }
});

// Shop Route (Display Published Items)
app.get('/shop', async (req, res) => {
    let viewData = {};

    try {
        const page = req.query.page || 1;
        const pageSize = req.query.pageSize || 10;
        const validatedPage = parseInt(page);
        const validatedPageSize = parseInt(pageSize);

        let items = [];
        if (req.query.category) {
            items = await Item.findAll({
                where: { category: req.query.category },
                limit: validatedPageSize,
                offset: (validatedPage - 1) * validatedPageSize
            });
        } else {
            items = await Item.findAll({
                limit: validatedPageSize,
                offset: (validatedPage - 1) * validatedPageSize
            });
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
        const categories = await Category.findAll();
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "No categories available.";
        console.error("Error fetching categories for shop route:", err);
    }

    res.render('shop', { data: viewData });
});

// Item-specific Route
app.get('/shop/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const item = await Item.findByPk(id);
        const category = await Category.findByPk(item.category);
        res.render('itemDetails', { 
            title: "Item Details", 
            item, 
            category: category?.name || "Unknown", 
            activeRoute: req.path 
        });
    } catch (err) {
        console.error("Error fetching item details:", err);
        res.status(500).send("Item not found.");
    }
});

// Add Item Route (POST)
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
                featureImage: result.secure_url,
                published: req.body.published === 'true',
                postDate: new Date(),
                ...req.body
            };

            // Insert new item into the database
            Item.create({
                featureImage: newItem.featureImage,
                published: newItem.published,
                postDate: newItem.postDate,
                name: newItem.name,
                description: newItem.description,
                category: newItem.category
            })
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
