import { Link } from 'react-router-dom';
import Home from '../pages/Home';

export default function Nav() {
  return (
    <header>
      <nav>
        <Link to="/">
          <img className="nav--logo" src="https://i.imgur.com/7jPAI3G.png" />
        </Link>
        <h1 className="nav--title">Crapple Maps</h1>
        <Link to="/listings" className="nav--listings">View Listings</Link>
        <Link to="/contribute" className="nav--contribute">Contribute</Link>
      </nav>
    </header>
  );
};;