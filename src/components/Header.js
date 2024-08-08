import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';
import CallMeEmoji from '../assets/CallMeEmoji.svg';
import ClinkingBeerMugs from '../assets/ClinkingBeerMugs.svg';
import ScoreboardIcon from '../assets/Scoreboard.svg';
import OpenMailbox from '../assets/OpenMailbox.svg'; // Import the new icon

const Header = ({ sladeshCount }) => {
  return (
    <header className="header-container">
      <div className="nav-container">
        <div className="nav-links">
          <Link to="/">
            <img src={ClinkingBeerMugs} alt="Drinks Ohøj" className="nav-icon" />
          </Link>
          <Link to="/requests">
            <img src={CallMeEmoji} alt="Sladesh" className="nav-icon" />
          </Link>
          <Link to="/scoreboard">
            <img src={ScoreboardIcon} alt="Scoreboard" className="nav-icon" />
          </Link>
          <Link to="/sladesh-hub">
            <div className="nav-icon-container">
              <img src={OpenMailbox} alt="Sladesh Hub" className="nav-icon" />
              {sladeshCount > 0 && <div className="notification-circle">{sladeshCount}</div>}
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
