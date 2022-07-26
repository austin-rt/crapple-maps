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
        <Link to="/listings" className="nav--listings">Listings</Link>
      </nav>
    </header>
  );
};;