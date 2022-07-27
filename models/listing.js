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
    img: { type: Array, default: ['https://imgs.search.brave.com/kHYuJX_T-M3V1t1uDP_H_VMM1y8zF_S8W-blSSLXhhw/rs:fit:800:800:1/g:ce/aHR0cHM6Ly9ibG94/aW1hZ2VzLm5ld3lv/cmsxLnZpcC50b3du/bmV3cy5jb20vc3Rs/dG9kYXkuY29tL2Nv/bnRlbnQvdG5jbXMv/YXNzZXRzL3YzL2Vk/aXRvcmlhbC9jL2Fl/L2NhZTlmMTM1LWUx/NjUtNWIxNC1hYzdj/LWE3NjQwN2ExZjlj/Mi81NDg1YWI2NDlj/ZWM0LmltYWdlLmpw/Zw'], require: false }
  },
  { timestamps: true }
);

module.exports = Listing;