import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Nav from '../components/Nav';
import Listing from '../components/Listing';
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
          <button className="button delete-listing-button">delete listing</button>
          <button className="button update-listing-button">update listing</button>
        </div>
        <div className="listing-detail-img-container">
          <img src={listing.img} className="listing-detail-img" />
        </div>
      </div>
    </>
  );

};