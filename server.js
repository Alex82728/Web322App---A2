/*********************************************************************************

WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca Academic Policy.  
No part of this assignment has been copied manually or electronically from any other source 
(including 3rd party web sites) or distributed to other students.

Name: Alexandru Zaporojan
Student ID: 105756233 
Date: 2024/10/08
Render App URL: https://web322-app-6scn.onrender.com
GitHub Repository URL: https://github.com/azaporojan_seneca/Web-322--app

********************************************************************************/ 

const express = require('express');
const path = require('path');
const storeService = require('./store-service');
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const app = express();
const PORT = 8080;

cloudinary.config({
    cloud_name: 'dwdftakvt',
    api_key: '242931154419331',
    api_secret: 'CJeSPxAcuaHBYV8NpPZSd8aQP4',
    secure: true
});

const upload = multer();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Homepage route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'home.html')); // Serve the home page
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'about.html'));
});

app.get('/items/add', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'addItem.html'));
});

// Route for getting published items
app.get('/shop', (req, res) => {
    storeService.getPublishedItems()
        .then((data) => {
            res.json(data);
        })
        .catch((err) => {
            res.status(500).json({ message: err });
        });
});

// Route for getting items with filtering
app.get('/items', (req, res) => {
    const category = req.query.category;
    const minDate = req.query.minDate;

    if (category) {
        storeService.getItemsByCategory(category)
            .then((data) => {
                res.json(data);
            })
            .catch((err) => {
                res.status(500).json({ message: err });
            });
    } else if (minDate) {
        storeService.getItemsByMinDate(minDate)
            .then((data) => {
                res.json(data);
            })
            .catch((err) => {
                res.status(500).json({ message: err });
            });
    } else {
        storeService.getAllItems()
            .then((data) => {
                res.json(data);
            })
            .catch((err) => {
                res.status(500).json({ message: err });
            });
    }
});

// Route for getting categories
app.get('/categories', (req, res) => {
    storeService.getCategories()
        .then((data) => {
            res.json(data);
        })
        .catch((err) => {
            res.status(500).json({ message: err });
        });
});

// Route for getting a specific item by ID
app.get('/item/:id', (req, res) => {
    const id = req.params.id; // Extract the ID from the URL
    storeService.getItemById(id)
        .then((item) => {
            res.json(item);
        })
        .catch((err) => {
            res.status(404).json({ message: err }); // Send a 404 for not found
        });
});

// POST route for adding new items
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

        async function upload(req) {
            let result = await streamUpload(req);
            console.log(result);
            return result;
        }

        upload(req).then((uploaded) => {
            processItem(uploaded.url);
        }).catch((error) => {
            res.status(500).json({ message: "Failed to upload image to Cloudinary." });
        });
    } else {
        processItem(""); // No image uploaded
    }

    function processItem(imageUrl) {
        req.body.featureImage = imageUrl; // Add the image URL to the item data

        storeService.addItem(req.body)
            .then(() => {
                res.redirect('/items');
            })
            .catch((error) => {
                res.status(500).json({ message: "Failed to add new item." });
            });
    }
});

// Handle 404 errors
app.use((req, res) => {
    res.status(404).send('Page Not Found');
});

// Initialize the store service and start the server
storeService.initialize()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Failed to start server:", err);
    });
