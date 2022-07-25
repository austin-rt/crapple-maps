const mongoose = require('mongoose');
const UserSchema = require('./user');
const ListingSchema = require('./listing');

const User = mongoose.model('User', UserSchema);
const Listing = mongoose.model('Listing', ListingSchema);

// Listing.methods.averageRatings = function () {
//   console.log(`cleanliness: ${this.cleanlinessRating}, accessibilityRating ${this.accessibilityRating}, overallRating${this.overallRating}`);
// };

module.exports = {
  User,
  Listing
};