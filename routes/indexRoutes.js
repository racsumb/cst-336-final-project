const express = require('express');
const router = express.Router();

// TODO: Should get data from database eventually via API routes
router.get('/', (req, res) => {
    res.render('index', { 
        appName: 'The Quest of Life',
        playerLevel: 5,
        playerXp: 450
    });
});

module.exports = router;