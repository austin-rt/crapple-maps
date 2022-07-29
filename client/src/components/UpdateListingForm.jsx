import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
const BASE_URL = 'http://localhost:3001/api';


export default function UpdateListingForm(props) {

  let originalListing = props.listing;

  const listingInitalState = {
    submitted: false
  };

  const [listing, setListing] = useState(listingInitalState);

  const initialValues = {
    name: '',
    streetAddress: '',
    streetAddressTwo: '',
    city: '',
    state: '',
    zip: '',
    cleanlinessRating: [],
    accessibilityRating: [],
    overallRating: [],
    description: '',
    contributors: [],
    img: [],
  };

  const [formValues, setFormValues] = useState(originalListing);

  const handleChange = e => {
    const { id, value } = e.target;
    setFormValues({ ...formValues, [id]: value });
  };
  let updatedListing;

  const handleSubmit = e => {
    e.preventDefault();
    const postListing = async (input) => {
      try {
        await axios.put(`${BASE_URL}/listings/${input._id}`, input);
      } catch (err) {
        console.log(err.message);
      }
    };
    postListing(formValues);
    updatedListing = formValues;
    setFormValues(initialValues);
    const listingUpdated = {
      submitted: true
    };
    setListing(listingUpdated);

  };


  return (
    <>
      {!listing.submitted && (
        <form className="listing-form" onSubmit={handleSubmit}>
          <label htmlFor="name">Location</label>
          <input
            id="name"
            type="text"
            size="30"
            onChange={handleChange}
            value={formValues.name}
            placeholder="The Empire State Building"
          />
          <div className="listing-form-street-address-container">
            <label htmlFor="streetAddress">Address</label>
            <input
              id="streetAddress"
              type="text"
              size="30"
              onChange={handleChange}
              value={formValues.streetAddress}
              placeholder="20 West 34th Street"

            />
            <div className="address-two-city-state-zip-container">
              <div className="address-two-and-city">
                <div className="address-two-label-and-field">
                  <label htmlFor="streetAddressTwo">Address Cont'd</label>
                  <input
                    id="streetAddressTwo"
                    type="text"
                    size="15"
                    onChange={handleChange}
                    value={formValues.streetAddressTwo}
                    placeholder="102 Flr"
                  />
                </div>
                <div className="city-label-and-field">
                  <label htmlFor="city">City</label>
                  <input
                    id="city"
                    type="text"
                    size="15"
                    onChange={handleChange}
                    value={formValues.city}
                    placeholder="New York City"

                  />
                </div>
              </div>
              <div className="state-and-zip">
                <div className="state-label-and-field">
                  <label htmlFor="state">State</label>
                  <input
                    id="state"
                    type="text"
                    size="15"
                    onChange={handleChange}
                    value={formValues.state}
                    placeholder="NY"
                  />
                </div>
                <div className="zip-label-and-field">
                  <label htmlFor="zip">Zip</label>
                  <input
                    id="zip"
                    type="number"
                    size="15"
                    min="5"
                    max="5"
                    onChange={handleChange}
                    value={formValues.zip}
                    placeholder="10001"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="ratings">
            <div className="cleanliness">
              <label htmlFor="cleanlinessRating">Cleanliness</label>
              <input
                id="cleanlinessRating"
                type="text"
                size="15"
                onChange={handleChange}
                value={formValues.cleanlinessRating}
                placeholder="2.5"
              />
            </div>
            <div className="accessibility">
              <label htmlFor="accessibilityRating">Accessibility</label>
              <input
                id="accessibilityRating"
                type="text"
                size="15"
                onChange={handleChange}
                value={formValues.accessibilityRating}
                placeholder="2.5"
              />
            </div>
          </div>
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            type="text"
            cols="30"
            rows="10"
            onChange={handleChange}
            value={formValues.description}
            placeholder="Description"
          />
          <button className="button" type="submit" onSubmit={handleSubmit}>Submit</button>
        </form>
      )}
      {listing.submitted && (
        <div className="listing-detail-overlay" id="updated-listing">Thank you for your contribution!
          <Link to={`/listings/`}>
            <button className="button">View Listings</button>
          </Link>
        </div>
      )}
    </>
  );
}