import { useState } from "react";
import axios from "axios";
const BASE_URL = 'http://localhost:3001/api';

export default function UserForm() {

  const initialValues = {
    username: '',
    firstName: '',
    lastName: '',
    emailAddress: '',
    city: '',
  };

  const [formValues, setFormValues] = useState(initialValues);

  const handleChange = e => {
    const { id, value } = e.target;
    setFormValues({ ...formValues, [id]: value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    const postUser = async (input) => {
      await axios.post(`${BASE_URL}/users`, input)
        .then(response => {
          console.log(response);
        })
        .catch(err => {
          console.log(err);
        });

    };
    postUser(formValues);
    setFormValues(initialValues);
  };

  return (

    <form onSubmit={handleSubmit}>
      <label htmlFor="username">username:</label>
      <input
        id="username"
        type="text"
        onChange={handleChange}
        value={formValues.username}
        placeholder="username"
        required
      />
      <label htmlFor="firstName">first name:</label>
      <input id="firstName"
        type="text"
        onChange={handleChange}
        value={formValues.firstName}
        placeholder="first name"
        required
      />
      <label htmlFor="lastName">last name:</label>
      <input
        id="lastName"
        type="text"
        onChange={handleChange}
        value={formValues.lastName}
        placeholder="last name"
        required
      />
      <label htmlFor="emailAddress">email:</label>
      <input
        id="emailAddress"
        type="text"
        onChange={handleChange}
        value={formValues.emailAddress}
        placeholder="email address"
        required
      />
      <label htmlFor="city">city:</label>
      <input
        id="city"
        type="text"
        onChange={handleChange}
        value={formValues.city}
        placeholder="city"
        required
      />
      <button type="submit" className="button">Sign Up</button>
    </form>
  );
};