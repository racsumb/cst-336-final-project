require('dotenv').config();
const mysql = require('mysql2/promise');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set Templating Engine
app.set('view engine', 'ejs');

// Route Setup
const indexRoutes = require('./routes/indexRoutes');
const apiRoutes = require('./routes/apiRoutes');

app.use('/', indexRoutes);
app.use('/api', apiRoutes);

// Start Server
app.listen(PORT, () => {
    console.log(`🛡️ The Quest of Life server running on http://localhost:${PORT}`);
});