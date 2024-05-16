/** Database connection for messagely. */


const { Pool } = require("pg");
const { DB_URI } = require("./config");

const pool = new Pool({
    database: DB_URI,
    password: process.env.PASSWORD,
    host: 'localhost',
    user: 'postgres',
    port: 5432
});

module.exports = pool;
