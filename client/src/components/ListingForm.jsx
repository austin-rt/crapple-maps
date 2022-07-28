import { useState } from "react";
import axios from "axios";
import Nav from "./Nav";
const BASE_URL = 'http://localhost:3001/api';


export default function ListingForm() {

  const initialValues = {
    name: '',
    streetAddress: '',
    streetAddressTwo: '',
    city: '',
    state: '',
    zip: '',
    cleanlinessRating: undefined,
    accessibilityRating: undefined,
    overallRating: undefined,
    description: '',
    contributors: undefined,
    img: undefined
  };

  const [formValues, setFormValues] = useState(initialValues);

  const handleChange = e => {
    const { id, value } = e.target;
    setFormValues({ ...formValues, [id]: value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    const postListing = async (input) => {
      await axios.post(`${BASE_URL}/listings`, input)
        .then(response => {
          console.log(response);
        })
        .catch(err => {
          console.log(err);
        });

    };
    postListing(formValues);
    setFormValues(initialValues);
  };

  return (
    <>
      <Nav />
      <h1 className="listing-form-header">Add a Listing</h1>
      <form className="listing-form" onSubmit={handleSubmit}>
        <label htmlFor="name">location</label>
        <input
          id="name"
          type="text"
          size="30"
          onChange={handleChange}
          value={formValues.name}
          placeholder="The Empire State Building"
          required
        />
        <div className="listing-form-street-address-container">
          <label htmlFor="streetAddress">address</label>
          <input
            id="streetAddress"
            type="text"
            size="30"
            onChange={handleChange}
            value={formValues.streetAddress}
            placeholder="20 West 34th Street"
            required
          />
          <div className="address-two-city-state-zip-container">
            <div className="address-two-and-city">
              <div className="address-two-label-and-field">
                <label htmlFor="streetAddressTwo">address cont'd</label>
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
                <label htmlFor="city">city</label>
                <input
                  id="city"
                  type="text"
                  size="15"
                  onChange={handleChange}
                  value={formValues.city}
                  placeholder="New York City"
                  required
                />
              </div>
            </div>
            <div className="state-and-zip">
              <div className="state-label-and-field">
                <label htmlFor="state">state</label>
                <input
                  id="state"
                  type="text"
                  size="15"
                  onChange={handleChange}
                  value={formValues.state}
                  placeholder="NY"
                  required
                />
              </div>
              <div className="zip-label-and-field">
                <label htmlFor="zip">zip</label>
                <input
                  id="zip"
                  type="text"
                  size="15"
                  onChange={handleChange}
                  value={formValues.zip}
                  placeholder="10001"
                  required
                />
              </div>
            </div>
          </div>
        </div>
        <div className="ratings">
          <div className="cleanliness">
            <label htmlFor="cleanlinessRating">cleanliness</label>
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
            <label htmlFor="accessibilityRating">accessibility</label>
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
        <label htmlFor="description">description:</label>
        <textarea
          id="description"
          type="text"
          cols="30"
          rows="10"
          onChange={handleChange}
          value={formValues.description}
          placeholder="description"
        />
        <button className="button" type="submit" onSubmit={handleSubmit}>Submit</button>
      </form>
      <div className="listing-form-background"></div>
    </>
  );
}