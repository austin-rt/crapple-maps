const db = require('../db');
const Chance = require('chance');
const { User } = require('../models');

const chance = new Chance();

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const main = async () => {

  const users = [
  ];

  await Book.insertMany(books);
  console.log('Created books with publishers!');
};
const run = async () => {
  await main();
  db.close();
};

run();