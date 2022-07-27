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
    cleanlinessRating: [],
    accessibilityRating: [],
    overallRating: [],
    description: '',
    contributors: [],
    img: []
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
    console.log(formValues);
    postListing(formValues);
    setFormValues(initialValues);
  };

  return (
    <>
      <Nav />
      <form className="listing-form" onSubmit={handleSubmit}>
        <label htmlFor="name">name:</label>
        <input
          id="name"
          type="text"
          size="30"
          onChange={handleChange}
          value={formValues.name}
          placeholder="The Empire State Building"
          required
        />
        <label htmlFor="street-address">street address:</label>
        <input
          id="street-address"
          type="text"
          size="30"
          onChange={handleChange}
          value={formValues.streetAddress}
          placeholder="20 West 34th Street"
          required
        />
        <label htmlFor="street-address-two">street address cont'd:</label>
        <input
          id="streetAddressTwo"
          type="text"
          size="15"
          onChange={handleChange}
          value={formValues.streetAddressTwo}
          placeholder="102 Flr"
        />
        <label htmlFor="city">city:</label>
        <input
          id="city"
          type="text"
          size="15"
          onChange={handleChange}
          value={formValues.city}
          placeholder="New York City"
          required
        />
        <label htmlFor="state">state:</label>
        <input
          id="state"
          type="text"
          size="15"
          onChange={handleChange}
          value={formValues.state}
          placeholder="NY"
          required
        />
        <label htmlFor="zip">zip:</label>
        <input
          id="zip"
          type="text"
          size="15"
          onChange={handleChange}
          value={formValues.zip}
          placeholder="10001"
          required
        />
        <label htmlFor="cleanliness-rating">cleanliness rating:</label>
        <input
          id="cleanliness-rating"
          type="text"
          size="15"
          onChange={handleChange}
          value={formValues.cleanlinessRating}
          placeholder="2.5"
        />
        <label htmlFor="accessibility-rating">accessibility rating:</label>
        <input
          id="accessibility-rating"
          type="text"
          size="15"
          onChange={handleChange}
          value={formValues.accessibilityRating}
          placeholder="2.5"
        />
        <label htmlFor="overall-rating">overall rating:</label>
        <input
          id="overallRating"
          type="text"
          size="15"
          onChange={handleChange}
          value={formValues.overallRating}
          placeholder="2.5"
        />
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
        <button type="submit" onSubmit={handleSubmit}>Submit</button>
      </form>
    </>
  );
}