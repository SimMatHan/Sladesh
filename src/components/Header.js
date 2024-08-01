import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  return (
    <header className="header-container">
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/requests">Requests</Link>
      </div>
    </header>
  );
};

export default Header;
