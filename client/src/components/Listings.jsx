import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Listing from './Listing';
import Nav from './Nav';
const BASE_URL = 'http://localhost:3001/api';

export default function Listings() {

  // let navigate = useNavigate();

  // const displayListings = (listing) => {
  //   navigate(`/listing/${listing._id}`);
  // };

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
      <Nav />
      <div className="listings-container">
        <h1 className="listings-title">Listings</h1>
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