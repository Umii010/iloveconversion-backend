const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const { pool } = require('../config/database');

const sessionStore = new MySQLStore({}, pool);

const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, 
        sameSite: 'strict'
    }
});

module.exports = sessionMiddleware;