const db = require('../db');
const { Listing } = require('../models');

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const main = async () => {
  const listings = [
  ];

  await Listing.insertMany(listings);
  console.log('created test listings');
};
const run = async () => {
  await main();
  db.close();
};

run();