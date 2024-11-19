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
        }
    }
}));
app.set('view engine', '.hbs');

// Middleware to set active route
app.use((req, res, next) => {
    app.locals.activeRoute = req.path;
    next();
});

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
    res.render('home', { title: "Motorcycle Shop" });
});

app.get('/about', (req, res) => {
    res.render('about', { title: "About Us" });
});

app.get('/items/add', (req, res) => {
    res.render('addItem', { title: "Add New Item" });
});

app.get('/shop', (req, res) => {
    storeService.getPublishedItems()
        .then((data) => {
            res.render('shop', { title: "Shop", items: data });
        })
        .catch((err) => {
            res.status(500).send("Unable to fetch items.");
        });
});

app.get('/items', (req, res) => {
    const category = req.query.category;
    const minDate = req.query.minDate;

    if (category) {
        storeService.getItemsByCategory(category)
            .then((data) => {
                res.render('items', { title: "Filtered Items", items: data });
            })
            .catch((err) => {
                res.status(500).send("Unable to fetch items.");
            });
    } else if (minDate) {
        storeService.getItemsByMinDate(minDate)
            .then((data) => {
                res.render('items', { title: "Filtered Items", items: data });
            })
            .catch((err) => {
                res.status(500).send("Unable to fetch items.");
            });
    } else {
        storeService.getAllItems()
            .then((data) => {
                res.render('items', { title: "All Items", items: data });
            })
            .catch((err) => {
                res.status(500).send("Unable to fetch items.");
            });
    }
});

app.get('/categories', (req, res) => {
    storeService.getCategories()
        .then((data) => {
            res.render('categories', { title: "Categories", categories: data });
        })
        .catch((err) => {
            res.status(500).send("Unable to fetch categories.");
        });
});

app.get('/item/:id', (req, res) => {
    const id = req.params.id;
    storeService.getItemById(id)
        .then((item) => {
            res.render('itemDetails', { title: "Item Details", item });
        })
        .catch((err) => {
            res.status(404).send("Item not found.");
        });
});

app.post('/items/add', upload.single("featureImage"), (req, res) => {
    if (req.file) {
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
