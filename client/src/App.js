import './styles/App.css';
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import UserForm from './components/UserForm';
import ViewListings from './pages/ViewListings';
import ListingDetails from './pages/ListingDetails';
import SubmitListing from './pages/SubmitListing';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route index element={<Home />} />
        <Route path="/listings" element={<ViewListings />} />
        <Route path="/listings/:id" element={<ListingDetails />} />
        <Route path="/signup" element={<UserForm />} />
        <Route path="/contribute" element={<SubmitListing />} />
      </Routes>
    </div>
  );
}

export default App;
