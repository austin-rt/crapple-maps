const db = require('../db');
const Chance = require('chance');
const { Listing, User } = require('../models');

const chance = new Chance();

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const createUsers = async () => {
  const users = [...Array(5)].map((user) => {
    return new User({
      username: `${chance.word()}${chance.word().toUpperCase()}`,
      firstName: chance.first(),
      lastName: chance.last(),
      emailAddress: chance.email(),
      city: chance.city(),
      state: chance.state(),
    });
  });
  await User.insertMany(users);
  console.log('created users');
  return users;
};

const createListings = async () => {
  const images = [
    'https://imgs.search.brave.com/LmEJeq-ney1L_UFV9QCXh0NZz2KaQk6sGMNBVk4NGq4/rs:fit:1200:1200:1/g:ce/aHR0cHM6Ly93d3cu/dGhvdWdodGNvLmNv/bS90aG1iL2tWcERy/WW5SSzk5V3g1QkRi/U09EZFlXbmpvVT0v/NDg5NngzMjY0L2Zp/bHRlcnM6ZmlsbChh/dXRvLDEpL2ludGVy/aW9yLW9mLWVtcHR5/LXB1YmxpYy1yZXN0/cm9vbS01OTM0NTQ0/ODUtNTlkZjkyZjRi/NTAxZTgwMDEwZTI3/YTVjLmpwZw',
    'https://imgs.search.brave.com/pJwBzrOgcGeruibLF5jJhINymdskOZ14i-AxjvkXZeQ/rs:fit:1200:1200:1/g:ce/aHR0cHM6Ly92aWV3/ZnJvbXRoZXdpbmcu/Y29tL3dwLWNvbnRl/bnQvdXBsb2Fkcy8y/MDE3LzExLzIwMTcx/MTA0XzA3MjUwNi5q/cGc',
    'https://imgs.search.brave.com/-gu2ylq4NOyrOfVXDUupXHJaiqhF4kfjno3O5joaSrE/rs:fit:1200:1200:1/g:ce/aHR0cHM6Ly9laG9u/YW1pLmJsb2IuY29y/ZS53aW5kb3dzLm5l/dC9tZWRpYS9zaXRl/cy8zLzIwMjAvMDYv/R2V0dHlJbWFnZXMt/OTU4ODAwODYwLTIw/NDh4MTM2Ny5qcGc',
    'https://imgs.search.brave.com/2ZFc4lgUA2YsE1hTir-Y2HErdswCnc80ApVLzjROFQ4/rs:fit:1200:1200:1/g:ce/aHR0cHM6Ly93d3cu/cmQuY29tL3dwLWNv/bnRlbnQvdXBsb2Fk/cy8yMDE3LzAxLzAx/LU11c3QtS25vdy1F/dGlxdWV0dGUtVGlw/cy1mb3ItVXNpbmct/YS1QdWJsaWMtUmVz/dHJvb20tc3BhY2Ut/NTE2MzE5NDE4LURl/bkJvbWEuanBn',
    'https://imgs.search.brave.com/2SmDhFW6PEdToYMu58O6H6HfmAKnZd-sJbH_dFE9AsU/rs:fit:1200:1200:1/g:ce/aHR0cHM6Ly9pLnJl/ZGQuaXQvaDVsZ3Bl/N2M4M3d6LmpwZw',
    'https://imgs.search.brave.com/QOl4CWFXzwtfhBeC6zUGKSymFOlgqJnO2ANEnA7BRYo/rs:fit:1200:1200:1/g:ce/aHR0cDovL3d3dy5y/b2NhLmNvbS9yb2Nh/bGlmZS93cC1jb250/ZW50L3VwbG9hZHMv/MjAyMC8wNy9NTVpf/OTc0NF9kZWYuanBn',
    'https://imgs.search.brave.com/ipODwcCzGWxNP6_9POBi4gxzYi9XGktJPldTDhOmnaI/rs:fit:1200:1040:1/g:ce/aHR0cHM6Ly92aWV3/ZnJvbXRoZXdpbmcu/Y29tL3dwLWNvbnRl/bnQvdXBsb2Fkcy8y/MDE5LzA4L3NlYXRh/Yy1iYXRocm9vbS1u/b3J0aC1zYXRlbGxp/dGUuanBlZw',
    'https://imgs.search.brave.com/hsjTMtGNY8kjyNm2Gi0Ajiwi29rqPokPudVoUzgwRYQ/rs:fit:1200:1080:1/g:ce/aHR0cHM6Ly9jZG4u/MjQuY28uemEvZmls/ZXMvQ21zL0dlbmVy/YWwvZC8xMDE4NC81/OWI4MmY4MDk0N2I0/NjBmYTA2NTExOTMw/NzExMGQyMy5qcGc',
    'https://imgs.search.brave.com/Tg_CL8SrAO8lFu4C0Y1_WGmKy-566JT2pDCg0yM5TDw/rs:fit:844:225:1/g:ce/aHR0cHM6Ly90c2Ux/Lm1tLmJpbmcubmV0/L3RoP2lkPU9JUC5K/YnVxMG9lenRQSDVv/ZkhsOVlBZVZRSGFF/SyZwaWQ9QXBp',
    'https://imgs.search.brave.com/thuE0eoeg_6IyJwTQiV3GSfyEZv_lZ2cTc-f5m7wGAo/rs:fit:1000:563:1/g:ce/aHR0cDovL3d3dy5l/bnZpcm9waXR0LmNv/bS93cC1jb250ZW50/L3VwbG9hZHMvMjAx/OS8wNy84LVJlYXNv/bnMtUHVibGljLVJl/c3Ryb29tcy1UdXJu/b2ZmLmpwZw'
  ];
  const listings = [...Array(10)].map((listings, index) => {
    return new Listing({
      name: `${chance.capitalize(chance.word())} ${chance.capitalize(chance.word())} ${chance.pickone([chance.capitalize(chance.word()), ``])}`,
      streetAddress: chance.address(),
      city: chance.city(),
      state: chance.state(),
      zip: chance.zip(),
      cleanlinessRating: chance.floating({ min: 0, max: 5, fixed: 1 }),
      overallRating: chance.pickone([chance.floating({ min: 0, max: 5, fixed: 1 })]),
      description: chance.paragraph({ min: 0, max: 7 }),
      contributors: chance.pickone([chance.integer({ min: 100000, max: 999999 }), null]),
      img: images[index]
    });
  });
  await Listing.insertMany(listings);
  console.log('created listings');
};

const run = async () => {
  await createUsers();
  await createListings();
  db.close();
};

run();