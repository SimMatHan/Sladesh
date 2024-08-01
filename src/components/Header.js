import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  return (
    <header className="header-container">
      <div className="nav-container">
        <div className="nav-links">
          <Link to="/">Drinks ohøj!</Link>
          <Link to="/requests">Sladesh!</Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
