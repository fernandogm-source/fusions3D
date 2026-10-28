const mongoose = require('mongoose');
const Profile = require('../models/profile.model');
const RevokedToken = require('../models/revoked-token.model');

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI no está definida');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  await Profile.createIndexes();
  await RevokedToken.createIndexes();
  console.log('MongoDB conectado');
}

module.exports = { connectDB };
