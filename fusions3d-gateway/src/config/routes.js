require('dotenv').config();

const routes = [
  {
    prefix: '/api',
    target: process.env.BACK_URL || 'http://localhost:3000'
  }
];

module.exports = { routes };
