const allowedOrigins = [
    process.env.HOST_URL,
    'http://127.0.0.1:5500',
    'http://localhost:8000',
    'http://localhost:3000',
    ''
];

module.exports = allowedOrigins;