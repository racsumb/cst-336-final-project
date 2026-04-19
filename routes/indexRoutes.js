const express = require('express');
const router = express.Router();
const db = require('../database/db');

// route for our root, the login page
router.get('/', (req, res) => {
    res.render('login', { appName: 'The Quest of Life' });
});

// route for our registration page
router.get('/register', (req, res) => {
    res.render('register', { appName: 'The Quest of Life' });
});

// route for our main dashboard
router.get('/quests', async (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.redirect('/');

    const [rows] = await db.execute(
        "SELECT id, username, current_level, total_xp FROM users WHERE id = ?",
        [userId]
    );

    const user = rows[0];

    console.log("User loaded for /quests:", user);

    res.render("index", {
        appName: "The Quest of Life",
        user,
        userId,
        playerLevel: user.current_level,
        playerXp: user.total_xp
    });
    


});

module.exports = router;