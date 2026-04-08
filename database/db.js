const mysql = require('mysql2');
require('dotenv').config();

let poolConfig;

// check if the JAWSDB_URL is present in the environment
if (process.env.JAWSDB_URL) {
    console.log("Connecting to the remote Heroku/JawsDB database...");
    poolConfig = process.env.JAWSDB_URL;
} else {
    // if it's missing, fall back to the local machine settings
    console.log("💻 Connecting to the LOCAL MySQL database...");
    poolConfig = {
        host: 'localhost',
        user: 'root',          // Your local MySQL username
        password: 'password1', // Your local MySQL password
        database: 'quest_of_life' // Your local DB name
    };
}

// create the connection pool using whichever config was chosen above
const connectionPool = mysql.createPool(poolConfig);

// export it with .promise() so your routes can use async/await
module.exports = connectionPool.promise();