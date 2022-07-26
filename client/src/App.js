import './styles/App.css';
import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import UserForm from './components/UserForm';
import Listings from './components/Listings';
import ListingForm from './components/ListingForm';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route index element={<Home />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/signup" element={<UserForm />} />
        <Route path="/contribute" element={<ListingForm />} />
      </Routes>
    </div>
  );
}

export default App;
