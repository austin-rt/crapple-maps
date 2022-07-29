import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <>
      <nav className="splash-page-nav">
        <Link to="/" className="nav--logo-title-container">
          <img className="nav--logo" alt="crapple maps icon" src="https://i.imgur.com/7jPAI3G.png" />
          <h1 className="nav--title" id="splash-page-title">Crapple Maps</h1>
        </Link>
        <div id="splash-page-nav-links" className="nav--links">
          <Link to="/signup" className="nav--userform">Sign Up</Link>
          <Link to="/contribute" className="nav--contribute">Contribute</Link>
        </div>
      </nav>
      <div className="splash-page-img-wrapper">
        <div className="splash-page-listings-link-container">
          <Link className="splash-page-listings-link" to="/listings">
            <button className="button" id="splash-page-button"> Find a Restroom <span role="img" aria-label="water droplets">💦</span> </button>
          </Link>
        </div>
      </div>
      <div className="polaroid-img-wrapper"><img className="polaroid-image" alt="polaroid toilet collage" src="https://i.imgur.com/MutvdlL.png" /></div>
    </>
  );
}