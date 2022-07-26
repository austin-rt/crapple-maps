import './styles/App.css';
import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Nav from './components/Nav';
import Home from './pages/Home';
import UserForm from './components/UserForm';
import Listings from './components/Listings';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route index element={<Home />} />
        <Route path="/listings" element={<Listings />} />
      </Routes>
    </div>
  );
}

export default App;
