const { Schema } = require('mongoose');

const Listing = new Schema(
  {
    name: { type: String, require: true },
    streetAddress: { type: String, require: true },
    streetAddressTwo: { type: String, require: false },
    city: { type: String, require: true },
    state: { type: String, require: true },
    zip: { type: String, require: true },
    cleanlinessRating: { type: Array, default: [3.5], require: true },
    accessibilityRating: { type: Array, default: [3.5], require: true },
    overallRating: { type: Array, default: [3.5], require: true },
    description: { type: String, require: false },
    contributors: { type: Array, require: false },
    img: { type: Array, default: ['https://imgs.search.brave.com/fymn7IQlMp5EzesAcyViN3sXxSSTrCiC9PoWwzGdfQE/rs:fit:612:408:1/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vcGhvdG9z/L2RpcnR5LWRlY2F5/aW5nLXRvaWxldC1z/dGFsbHMtcGljdHVy/ZS1pZDQ4NDQ4NDE3/Nj9rPTYmbT00ODQ0/ODQxNzYmcz02MTJ4/NjEyJnc9MCZoPUpn/RUZWODRzR3E2cGc2/LU05ZVJUUVk5SXE3/eHA1dFRMci1SNEJU/LWUzRnM9'], require: false }
  },
  { timestamps: true }
);

module.exports = Listing;