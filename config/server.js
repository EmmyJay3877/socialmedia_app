const express = require('express');

const createServer = () => {
    const app = express();

    // built-in middleware to handle urlencoded form data
    app.use(express.urlencoded({ extended: false }));

    // built-in middleware for json / body parser, reading data from body into req.body
    app.use(express.json({ limit: '5mb' }));

    return app;
};

module.exports = createServer;