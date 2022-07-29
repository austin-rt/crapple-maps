import React from 'react';
import { Link } from 'react-router-dom';

export default function Nav() {
  return (
    <header>
      <nav>
        <Link to="/" className="nav--logo-title-container">
          <img className="nav--logo" src="https://i.imgur.com/7jPAI3G.png" />
          <h1 className="nav--title">Crapple Maps</h1>
        </Link>
        <div className="nav--links">
          <Link to="/listings" className="nav--listings">View Listings</Link>
          <Link to="/signup" className="nav--userform">Sign Up</Link>
          <Link to="/contribute" className="nav--contribute">Contribute</Link>
        </div>
      </nav>
    </header>
  );
};;