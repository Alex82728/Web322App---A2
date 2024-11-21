/*********************************************************************************

WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca Academic Policy.  
No part of this assignment has been copied manually or electronically from any other source 
(including 3rd party web sites) or distributed to other students.

Name: Alexandru Zaporojan
Student ID: 105756233 
Date: 2024/10/08

Render App URL: https://web322app-a2-1.onrender.com 

GitHub Repository URL: https://github.com/azaporojan_seneca/Web-322--app

********************************************************************************/

const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
const storeService = require('./store-service');
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const app = express();
const PORT = 8080;

// Cloudinary Configuration
cloudinary.config({
    cloud_name: 'dwdftakvt',
    api_key: '242931154419331',
    api_secret: 'CJeSPxAcuaHBYV8NpPZSd8aQP4c',
    secure: true
});

const upload = multer();

// Configure Handlebars
app.engine('.hbs', exphbs.engine({
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
        // Custom helper to allow raw HTML rendering
        safeHTML: function(options) {
            return new exphbs.SafeString(options.fn(this));  // This allows raw HTML
        }
    }
}));
app.set('view engine', '.hbs');

// Middleware for Active Routes
app.use((req, res, next) => {
    let route = req.path.split('?')[0];
    app.locals.activeRoute = route;
    next();
});

// Middleware for Static Files and Parsing
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes

// Redirect Root to Shop
app.get('/', (req, res) => {
    res.redirect('/shop');
});

// About Route
app.get('/about', (req, res) => {
    res.render('about', { title: "About Us", activeRoute: req.path });
});

// Add Item Route (GET)
app.get('/items/add', (req, res) => {
    res.render('addItem', { title: "Add New Item", activeRoute: req.path });
});

// Shop Route (List of Items, Filtered by Category)
app.get('/shop', async (req, res) => {
    let viewData = {};

    try {
        let items = req.query.category
            ? await storeService.getPublishedItemsByCategory(req.query.category)
            : await storeService.getPublishedItems();

        items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

        viewData.items = items;
        viewData.latestItem = items[0];
    } catch (err) {
        viewData.message = "No results found.";
    }

    try {
        viewData.categories = await storeService.getCategories();
    } catch (err) {
        viewData.categoriesMessage = "No categories available.";
    }

    res.render('shop', { data: viewData });
});

// Add Item (POST with Image Upload)
app.post('/items/add', upload.single("featureImage"), (req, res) => {
    if (req.file) {
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
                    postDate: new Date().toISOString().split('T')[0],
                    ...req.body
                };

                storeService.addItem(newItem)
                    .then(() => res.redirect('/shop'))
                    .catch(() => res.status(500).send("Unable to add item."));
            })
            .catch(() => res.status(500).send("Image upload failed."));
    } else {
        res.status(400).send("No image file provided.");
    }
});

// Shop Item Details Route (By ID)
app.get('/shop/:id', async (req, res) => {
    let viewData = {};

    try {
        let item = await storeService.getItemById(req.params.id);
        viewData.item = item;
    } catch (err) {
        viewData.message = "Item not found.";
    }

    try {
        viewData.categories = await storeService.getCategories();
    } catch (err) {
        viewData.categoriesMessage = "No categories available.";
    }

    res.render('shop', { data: viewData });
});

// Delete Item
app.delete('/items/:id', (req, res) => {
    storeService.deleteItem(req.params.id)
        .then(() => res.status(200).json({ message: "Item deleted successfully." }))
        .catch(() => res.status(500).send("Unable to delete item."));
});

// 404 Route
app.use((req, res) => {
    res.status(404).render('404', { title: 'Page Not Found', activeRoute: req.path });
});

// Initialize Service and Start Server
storeService.initialize()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Failed to initialize store service:", error);
    });
