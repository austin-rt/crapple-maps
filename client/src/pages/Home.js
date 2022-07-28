import Nav from "../components/Nav";
import UserForm from "../components/UserForm";
import Listings from "../components/Listings";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <>
      <nav className="splash-page-nav">
        <Link to="/" className="nav--logo-title-container">
          <img className="nav--logo" src="https://i.imgur.com/7jPAI3G.png" />
          <h1 className="nav--title">Crapple Maps</h1>
        </Link>
        <div id="splash-page-nav-links" className="nav--links">
          <Link to="/signup" className="nav--userform">Sign Up</Link>
          <Link to="/contribute" className="nav--contribute">Contribute</Link>
        </div>
      </nav>
      <div className="splash-page-img-wrapper">
        <div className="splash-page-listings-link-container">
          <Link className="splash-page-listings-link" to="/listings">
            <button className="button" id="splash-page-button">View Listings</button>
            {/* <img className="splash-page-logo" src="https://i.imgur.com/7jPAI3G.png" /> */}
          </Link>
        </div>
      </div>
      <div className="polaroid-img-wrapper"><img className="polaroid-image" src="https://i.imgur.com/MutvdlL.png" /></div>
    </>
  );
}