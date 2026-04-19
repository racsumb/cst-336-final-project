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
    try {
        const userId = req.query.userId;

        if (!userId) {
            console.log("No userId provided, redirecting to login");
            return res.redirect('/');
        }

        const [rows] = await db.execute(
            `SELECT current_level, total_xp FROM users WHERE id = ?`,
            [userId]
        );

        const user = rows[0];

        if (!user) {
            console.log("User not found in DB");
            return res.render('index', {
                appName: 'The Quest of Life',
                playerLevel: 1,
                playerXp: 0
            });
        }

        res.render('index', { 
            appName: 'The Quest of Life',
            playerLevel: user.current_level,
            playerXp: user.total_xp
        });

    } catch (err) {
        console.error("Error in /quests route:", err);
        res.status(500).send("Something went wrong loading your dashboard.");
    }
});

router.get('/stats', (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.redirect('/');
    res.render('stats', { userId });
});



module.exports = router;