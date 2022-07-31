import React from 'react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Listing from './Listing';

const BASE_URL = process.env.REACT_APP_BASE_URL;

export default function Listings() {

  const [listings, setListings] = useState([]);

  useEffect(() => {
    const showAllListings = async () => {
      const res = await axios.get(`${BASE_URL}/listings`);
      setListings(res.data.listings);
    };
    showAllListings();
  }, []);

  return (
    <>
      <div className="listings-container">
        <h1 className="listings-title">Listings - test</h1>
        <div className="listings-grid">
          {listings.map((listing) => (
            <Link to={`/listings/${listing._id}`} key={listing._id} className="listing">
              <Listing
                img={listing.img}
                name={listing.name}
                overallRating={listing.overallRating}
                streetAddress={listing.streetAddress}
                streetAddressTwo={listing.streetAddressTwo}
                city={listing.city}
                state={listing.state}
                zip={listing.zip}
                description={listing.description}
              />
            </Link>
          ))}
        </div>
      </div>
    </>
  );


}