import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Nav from '../components/Nav';
const BASE_URL = 'http://localhost:3001/api';

export default function ListingDetails(props) {
  const [listing, setListing] = useState({});

  let { id } = useParams();

  useEffect(() => {
    const getListingDetails = async () => {
      const res = await axios.get(`${BASE_URL}/listings/${id}`);
      setListing(res.data.listing);
    };
    getListingDetails();
  }, [id]);

  const handleClick = (e) => {
    e.preventDefault();
    let button = e.target.id;

    switch (button) {
      case 'delete-listing':
        deleteListing(id);
        break;
      case 'update-listing':
        updateListing(id);
        break;
    }
  };

  const deleteListing = () => {
    console.log(`are you sure you want to delete ${listing.name} id no ${id}?`);
  };

  const updateListing = () => {
    console.log(`are you sure you want to update ${listing.name} id no ${id}?`);
  };

  return (
    <>
      <Nav />
      <div className="listing-detail-container">
        <div className="listing-detail-info-container">
          <h1 className="listing-detail-name"> {listing.name}</h1>
          <h2 className="listing-detail-rating">{listing.overallRating}<span className="star">⭑</span></h2>
          <h3 className="listing-detail-address">{listing.streetAddress} {listing.streetAddressTwo} </h3>
          <h4 className="listing-detail-city">{listing.city}, {listing.state} {listing.zip} </h4>
          <p className="listing-detail-description">{listing.description}</p>
          <div className="listing-detail-buttons-container">
            <button id="update-listing" className="button update-listing-button" onClick={handleClick}>update listing</button>
            <button id="delete-listing" className="button delete-listing-button" onClick={handleClick}>delete listing</button>
          </div>
        </div>
        <div className="right-column">
          <div className="listing-detail-img-container">
            <img src={listing.img} className="listing-detail-img" />
          </div>
        </div>
      </div>
    </>
  );

};