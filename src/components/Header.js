import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';
import Sladesh from '../assets/headersvgs/RocketLaunchOutlined.svg';
import Drink from '../assets/headersvgs/LocalDrinkOutlined.svg';
import Leaderboard from '../assets/headersvgs/LeaderboardOutlined.svg';
import Videogame from '../assets/headersvgs/VideogameOutlined.svg';
import Chart from '../assets/headersvgs/AreaChartOutlined.svg';
import SladeshFilled from '../assets/headersvgs/RocketLaunchFilled.svg';
import DrinkFilled from '../assets/headersvgs/LocalDrinkFilled.svg';
import LeaderboardFilled from '../assets/headersvgs/LeaderboardFilled.svg';
import VideogameFilled from '../assets/headersvgs/VideogameFilled.svg';
import ChartFilled from '../assets/headersvgs/AreaChartFilled.svg';

const Header = ({ sladeshCount }) => {
  const location = useLocation();

  return (
    <header className="header-container">
      <div className="nav-container">
        <div className="nav-links">
          <Link to="/" className="nav-item">
            <img
              src={location.pathname === '/' ? DrinkFilled : Drink}
              alt="Drinks"
              className="nav-icon"
            />
            <span className="nav-text">Drinks</span>
          </Link>
          <Link to="/game-wheel" className="nav-item">
            <img
              src={location.pathname === '/game-wheel' ? VideogameFilled : Videogame}
              alt="Spin"
              className="nav-icon"
            />
            <span className="nav-text">Spin</span>
          </Link>
          <Link to="/requests" className="nav-item">
            <img
              src={location.pathname === '/requests' ? SladeshFilled : Sladesh}
              alt="Sladesh"
              className="nav-icon"
            />
            <span className="nav-text">Sladesh</span>
          </Link>
          <Link to="/scoreboard" className="nav-item">
            <img
              src={location.pathname === '/scoreboard' ? LeaderboardFilled : Leaderboard}
              alt="Scoreboard"
              className="nav-icon"
            />
            <span className="nav-text">Board</span>
          </Link>
          <Link to="/charts" className="nav-item">
            <img
              src={location.pathname === '/charts' ? ChartFilled : Chart}
              alt="Chart"
              className="nav-icon"
            />
            <span className="nav-text">Charts</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
