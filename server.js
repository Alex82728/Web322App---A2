/*********************************************************************************

WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca Academic Policy.  
No part of this assignment has been copied manually or electronically from any other source 
(including 3rd party web sites) or distributed to other students.

Name: Alexandru Zaporojan
Student ID: 105756233 
Date: 2024/10/08

Render App URL: https://web322app-a2-1.onrender.com 

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

// Configure Express to use Handlebars with custom helpers
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
        }
    }
}));
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

// Add Item Route
app.get('/items/add', (req, res) => {
    res.render('addItem', { title: "Add New Item", activeRoute: req.path });
});

// Shop Route (Display Published Items, Filtered by Category if Query Present)
app.get('/shop', async (req, res) => {
    let viewData = {};

    try {
        let items = [];

        // If there's a "category" query, filter the returned items by category
        if (req.query.category) {
            items = await storeService.getPublishedItemsByCategory(req.query.category);
        } else {
            items = await storeService.getPublishedItems();
        }

        // Sort the published items by itemDate (newest to oldest)
        items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));

        let latestItem = items[0];
        viewData.items = items;
        viewData.latestItem = latestItem;
    } catch (err) {
        viewData.message = "No results found.";
    }

    try {
        let categories = await storeService.getCategories();
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "No categories available.";
    }

    res.render('shop', { data: viewData });
});

// Items Route (Filtered by Category or Date)
const renderItems = (req, res, title, promise) => {
    promise
        .then(data => {
            res.render('items', { title, items: data, activeRoute: req.path });
        })
        .catch(err => {
            res.status(500).send(`Unable to fetch items: ${err.message}`);
        });
};

app.get('/items', (req, res) => {
    const category = req.query.category;
    const minDate = req.query.minDate;

    if (category) {
        renderItems(req, res, "Filtered Items", storeService.getItemsByCategory(category));
    } else if (minDate) {
        renderItems(req, res, "Filtered Items", storeService.getItemsByMinDate(minDate));
    } else {
        renderItems(req, res, "All Items", storeService.getAllItems());
    }
});

// Categories Route
app.get('/categories', (req, res) => {
    storeService.getCategories()
        .then((data) => {
            res.render('categories', { title: "Categories", categories: data, activeRoute: req.path });
        })
        .catch((err) => {
            res.render('categories', { title: "Categories", message: "No results", activeRoute: req.path });
        });
});

// Item Details Route (By ID)
app.get('/item/:id', (req, res) => {
    const id = req.params.id;
    storeService.getItemById(id)
        .then((item) => {
            res.render('itemDetails', { title: "Item Details", item, activeRoute: req.path });
        })
        .catch((err) => {
            res.status(404).send("Item not found.");
        });
});

// Add Item (POST route with Image Upload)
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
                    id: 0,
                    featureImage: result.secure_url,
                    published: req.body.published === 'true',
                    ...req.body
                };

                storeService.addItem(newItem)
                    .then(() => {
                        res.redirect('/shop');
                    })
                    .catch(() => {
                        res.status(500).send("Unable to add item.");
                    });
            })
            .catch(() => {
                res.status(500).send("Image upload failed.");
            });
    } else {
        res.status(400).send("No image file provided.");
    }
});

// Delete Item
app.delete('/items/:id', (req, res) => {
    const itemId = req.params.id;

    storeService.deleteItem(itemId)
        .then(() => {
            res.status(200).json({ message: "Item deleted successfully." });
        })
        .catch(() => {
            res.status(500).send("Unable to delete item.");
        });
});

// 404 Route for unknown paths
app.use((req, res) => {
    res.status(404).render('404', { title: 'Page Not Found', activeRoute: req.path });
});

// Start the server
storeService.initialize()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Failed to initialize store service:", error);
    });
