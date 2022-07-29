import React from 'react';
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Nav from '../components/Nav';
import UpdateListingForm from '../components/UpdateListingForm';
require('dotenv').config();

const BASE_URL = process.env.REACT_APP_BASE_URL;

export default function ListingDetails() {

  window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });

  const overlay = document.querySelector('.listing-detail-overlay');

  const initialConfirmationValues = {
    message: '',
    deleteRequested: false,
    deleteConfirmed: false,
    updateRequest: false,
    updateConfirm: false
  };

  const [listing, setListing] = useState({});

  const [confirmation, setConfirmation] = useState({ initialConfirmationValues });


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
        deleteRequest();
        break;
      case 'update-listing':
        updateRequest();
        break;
    }
  };

  const deleteRequest = async () => {
    const newConfirmation = {
      message: `are you sure you want to delete ${listing.name}?`,
      deleteRequested: true,
      deleteConfirmed: false
    };
    setConfirmation(newConfirmation);
    overlay.classList.remove('hidden');
  };

  const deleteListing = async () => {
    try {
      await axios.delete(`${BASE_URL}/listings/${id}`);
      const newConfirmation = {
        message: `${listing.name} deleted`,
        deleteRequested: true,
        deleteConfirmed: true
      };
      setConfirmation(newConfirmation);
    } catch (error) {
      console.log(error.message);
    }
  };

  const cancelDelete = () => {
    overlay.classList.add('hidden');
  };

  const updateRequest = () => {
    const newConfirmation = {
      message: `are you sure you want to update ${listing.name}?`,
      updateRequest: true,
      updateConfirmed: false
    };
    setConfirmation(newConfirmation);
    overlay.classList.remove('hidden');
  };

  const updateListing = () => {
    const newConfirmation = {
      updateConfirmed: true
    };
    setConfirmation(newConfirmation);
  };

  let overlayDisplay;

  if (confirmation.deleteConfirmed) {
    overlayDisplay =
      <div className="overlay-buttons" >
        <Link to="/listings">
          <button
            id="cancel"
            className="button">
            Return to Listings
          </button>
        </Link>
      </div>;
  } else if (confirmation.deleteRequested) {
    overlayDisplay =
      <div className="overlay-buttons" >
        <button className="button delete-listing-button"
          id="delete"
          onClick={deleteListing}>
          Delete
        </button>
        <button
          id="cancel"
          className="button"
          onClick={cancelDelete}>
          Cancel
        </button>
      </div >;
  } else if (confirmation.updateConfirmed) {
    overlay.style.backgroundColor = 'transparent';
    overlayDisplay =
      <div id="update-listing-form-container">
        <div className="update-listing-form-spacer"></div>
        <UpdateListingForm listing={listing} id={id} />
      </div>;
  } else if (confirmation.updateRequest) {
    overlayDisplay =
      <div className="overlay-buttons" >
        <button className="button"
          id="confirm-update-listing"
          onClick={updateListing}>
          Update
        </button>
        <button
          id="cancel"
          className="button"
          onClick={cancelDelete}>
          Cancel
        </button>
      </div >;
  }

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
            <button id="update-listing" className="button update-listing-button" onClick={handleClick}>Update Listing</button>
            <button id="delete-listing" className="button delete-listing-button" onClick={handleClick}>Delete Listing</button>
          </div>
        </div>
        <div className="right-column">
          <div className="listing-detail-img-container">
            <img src={listing.img} className="listing-detail-img" />
          </div>
        </div>
      </div>
      <div className="listing-detail-overlay hidden">
        <p>{confirmation.message}</p>
        {overlayDisplay}
      </div>
    </>
  );

};