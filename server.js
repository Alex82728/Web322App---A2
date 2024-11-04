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

const app = express();
const PORT = 8080;


app.use(express.static(path.join(__dirname, 'public')));

// Route for the /about page
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'about.html')); 
});


app.get('/shop', (req, res) => {
    storeService.getPublishedItems()
        .then((data) => {
            res.json(data);
        })
        .catch((err) => {
            res.status(500).json({ message: err });
        });
});


app.get('/items', (req, res) => {
    storeService.getAllItems()
        .then((data) => {
            res.json(data);
        })
        .catch((err) => {
            res.status(500).json({ message: err });
        });
});


app.get('/categories', (req, res) => {
    storeService.getCategories()
        .then((data) => {
            res.json(data);
        })
        .catch((err) => {
            res.status(500).json({ message: err });
        });
});


app.use((req, res) => {
    res.status(404).send('Page Not Found');
});


storeService.initialize()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Failed to start server:", err);
    });
