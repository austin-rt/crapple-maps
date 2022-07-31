const mongoose = require('mongoose');
require('dotenv').config();

let dbUrl = process.env.NODE_ENV === 'production' ? process.env.MONGODB_URI : 'mongodb://127.0.0.1:27017/crappleMapsDatabase';

mongoose
  .connect('mongodb+srv://austintaylor:s55p137L6o@crapple-maps.n2gxz.mongodb.net/?retryWrites=true&w=majority')
  .then(() => {
    console.log('Successfully connected to MongoDB.');
  })
  .catch((e) => {
    console.error('Connection error', e.message);
  });
mongoose.set('debug', true);
const db = mongoose.connection;

module.exports = db;