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
const storeService = require('./store-service');
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const app = express();
const PORT = 8080;

cloudinary.config({
    cloud_name: 'dwdftakvt',
    api_key: '242931154419331',
    api_secret: 'CJeSPxAcuaHBYV8NpPZSd8aQP4c',
    secure: true
});

const upload = multer();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Homepage route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'home.html'));
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
    const id = req.params.id;
    storeService.getItemById(id)
        .then((item) => {
            res.json(item);
        })
        .catch((err) => {
            res.status(404).json({ message: err });
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

        streamUpload(req)
            .then((result) => {
                const newItem = {
                    id: 0, // Placeholder, will be updated in store service
                    featureImage: result.secure_url,
                    published: req.body.published === 'true',
                    ...req.body // Include other item data from the form
                };

                storeService.addItem(newItem)
                    .then((item) => {
                        res.status(201).json(item);
                    })
                    .catch((err) => {
                        res.status(500).json({ message: err });
                    });
            })
            .catch((error) => {
                res.status(500).json({ message: "Upload failed." });
            });
    } else {
        res.status(400).json({ message: "No image file provided." });
    }
});

// Route for deleting an item by ID
app.delete('/items/:id', (req, res) => {
    const itemId = req.params.id; // Get item ID from URL

    storeService.deleteItem(itemId)
        .then(() => {
            res.status(200).json({ message: "Item deleted successfully." });
        })
        .catch((error) => {
            res.status(500).json({ message: error.message });
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
