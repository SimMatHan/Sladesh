import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';
import Sladesh from '../assets/headersvgs/RocketLaunchOutlined.svg';
import Drink from '../assets/headersvgs/LocalDrinkOutlined.svg';
import Leaderboard from '../assets/headersvgs/LeaderboardOutlined.svg';
import Videogame from '../assets/headersvgs/VideogameOutlined.svg'; // Import the outlined Videogame icon
import Chart from '../assets/headersvgs/AreaChartOutlined.svg';
import SladeshFilled from '../assets/headersvgs/RocketLaunchFilled.svg';
import DrinkFilled from '../assets/headersvgs/LocalDrinkFilled.svg';
import LeaderboardFilled from '../assets/headersvgs/LeaderboardFilled.svg';
import VideogameFilled from '../assets/headersvgs/VideogameFilled.svg'; // Import the filled Videogame icon
import ChartFilled from '../assets/headersvgs/AreaChartFilled.svg';

const Header = ({ sladeshCount }) => {
  const location = useLocation();

  return (
    <header className="header-container">
      <div className="nav-container">
        <div className="nav-links">
          <Link to="/">
            <img
              src={location.pathname === '/' ? DrinkFilled : Drink}
              alt="Drinks"
              className="nav-icon"
            />
          </Link>
          <Link to="/requests">
            <img
              src={location.pathname === '/requests' ? SladeshFilled : Sladesh}
              alt="Sladesh"
              className="nav-icon"
            />
          </Link>
          <Link to="/game-wheel">
            <div className="nav-icon-container">
              <img
                src={location.pathname === '/game-wheel' ? VideogameFilled : Videogame}
                alt="Game Wheel"
                className="nav-icon"
              />
            </div>
          </Link>
          <Link to="/scoreboard">
            <img
              src={location.pathname === '/scoreboard' ? LeaderboardFilled : Leaderboard}
              alt="Scoreboard"
              className="nav-icon"
            />
          </Link>
          <Link to="/charts">
            <img
              src={location.pathname === '/charts' ? ChartFilled : Chart}
              alt="Chart"
              className="nav-icon"
            />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
