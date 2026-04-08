const express = require('express');
const router = express.Router();

// route for our root, the login page
router.get('/', (req, res) => {
    res.render('login', { appName: 'The Quest of Life' });
});

// route for our registration page
router.get('/register', (req, res) => {
    res.render('register', { appName: 'The Quest of Life' });
});

// route for our main dashboard
router.get('/quests', (req, res) => {
    // this is where we would add middleware
    // to ensure a user is actually logged in before and get stats
    res.render('index', { 
        appName: 'The Quest of Life',
        playerLevel: 5,
        playerXp: 450
    });
});

module.exports = router;