
# Social Media app

This is a backend server for a social media app, where users can create and like posts, comment on posts and also follow other users on the platform.

This app is built with Node.js and Express.js. It provides APIs to handle user authentication, blog post creation, comments, likes, and follows. The server uses MongoDB as the database for storing user data and blog posts.



## 🧐 Features

- User registration and login with JWT authentication
- Well documented API endpoints for post, comment and user interactions
- Password reset and update option
- Error handling middleware for consistent error responses
- User roles verification middleware to grant or deny user's access to an endpoint
- Middleware to verify allowed origins before CORS
- Limit requests from the same IP address
- Data sanitization against xss and no-sql query injection
- Redis Caching for enhanced performance


## Tech Stack

**Server:** Node, Express

**Test:** Jest, Supertest

**Database:** MongoDB, Redis


## Installation

Clone the repository:

```bash
git clone https://github.com/EmmyJay3877/socialmedia_app.git
```
    
Install the dependencies:

```bash
npm Install
```

Set up environment variables:

Create a .env file in the root directory and add the following:

```bash
PORT=8000

DATABASE_URI=mongodb://localhost:27017/

ACCESS_TOKEN_SECRET=your_access_token_secret

REFRESH_TOKEN_SECRET=your_refresh_token_secret

# NODE_ENV=production

NODE_ENV=development
```
Replace your_access_token_secret and your_refresh_token_secret with your own secrets for JWT token generation.

## Usage

To start server, run:

```bash
npm start
```

The server will be running at http://localhost:8000


## Testing

To run the tests, use the following command:

```bash
npm test -- --watchAll
```

Jest will execute the test suite and show the test results
## Contributing

Contributions are always welcome!

If you find any bugs or want to add new features, feel free to submit a pull request.

## License

[MIT](https://choosealicense.com/licenses/mit/)

