import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './TopHeader.css';
import SladeshHub from '../assets/headersvgs/MarkunreadMailboxOutlined.svg'; // Import the SladeshHub icon
import SladeshHubFilled from '../assets/headersvgs/MarkunreadMailboxFilled.svg'; // Import the filled SladeshHub icon

const TopHeader = ({ sladeshCount }) => {
  const location = useLocation();

  return (
    <header className="top-header-container">
      <div className="top-header-content">
          <div className="logo-text">Sladesh!</div> {/* Logo as text */}
        <Link to="/sladesh-hub">
          <div className="nav-icon-container">
            <img
              src={location.pathname === '/sladesh-hub' ? SladeshHubFilled : SladeshHub}
              alt="Sladesh Hub"
              className="user-icon"
            />
            {sladeshCount > 0 && (
              <div className="notification-circle">{sladeshCount}</div>
            )}
          </div>
        </Link>
      </div>
    </header>
  );
};

export default TopHeader;
