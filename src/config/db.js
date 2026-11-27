const mongoose = require('mongoose');

async function connectToDatabase(uri = process.env.MONGODB_URI) {
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add it to your .env file.');
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
}

module.exports = connectToDatabase;
