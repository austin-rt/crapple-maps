const { Schema } = require('mongoose');

const Listing = new Schema(
  {
    name: { type: String, require: true },
    streetAddress: { type: String, require: true },
    streetAddressTwo: { type: String, require: false },
    city: { type: String, require: true },
    state: { type: String, require: true },
    zip: { type: String, require: true },
    cleanlinessRating: { type: Array, default: 3.5, require: true },
    accessibilityRating: { type: Number, default: 3.5, require: true },
    overallRating: { type: Number, default: 3.5, require: true },
    description: { type: String, require: false },
    contributors: { type: Array, require: false },
    img: { type: Array, require: false }
  },
  { timestamps: true }
);

module.exports = Listing;