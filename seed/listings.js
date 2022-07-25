const db = require('../db');
const { Listing } = require('../models');

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const main = async () => {
  const listings = [
    {
      name: "Austin's House",
      streetAddress: "1092 Hobson St SW",
      city: "Atlanta",
      state: "GA",
      zip: "30310",
    },
    {
      name: "Empire State Building",
      streetAddress: "West 34th Street",
      streetAddressTwo: "100th FLR",
      city: "New York City",
      state: "NY",
      zip: "10001",
      cleanlinessRating: 1,
      accessibilityRating: 1,
      overallRating: 1,
      description: "gross",
      contributors: ['user1', 'user2'],
      img: "https://i.redd.it/h5lgpe7c83wz.jpg"
    }
  ];

  await Publisher.insertMany(publishers);
  console.log('created test listings');
};
const run = async () => {
  await main();
  db.close();
};

run();