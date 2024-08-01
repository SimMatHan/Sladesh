import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = ({ onReset }) => {
  return (
    <header className="header-container">
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/requests">Requests</Link>
      </div>
      <button className="reset-button" onClick={onReset}>Reset</button>
    </header>
  );
};

export default Header;
