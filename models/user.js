const { Schema } = require('mongoose');

const User = new Schema(
  {
    username: { type: String, require: true },
    firstName: { type: String, require: true },
    lastName: { type: String, require: true },
    emailAddress: { type: String, require: true },
    city: { type: String, require: true },
    favoriteListings: { type: Array, require: false },
    contributions: { type: Aray, required: false }
  },
  { timestamps: true }
);

module.exports = User;