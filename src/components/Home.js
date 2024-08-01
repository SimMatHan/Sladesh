import React, { useEffect, useState } from 'react';
import { FaBeer, FaWineGlassAlt, FaCocktail, FaGlassWhiskey, FaCoffee } from 'react-icons/fa';
import './Home.css';

const EXPIRATION_TIME_MS = 30 * 1000; // 30 seconds for testing

const iconMap = {
  beer: <FaBeer />,
  wine: <FaWineGlassAlt />,
  cocktail: <FaCocktail />,
  whiskey: <FaGlassWhiskey />,
  coffee: <FaCoffee />,
};

const getIcon = (drinkType) => {
  return iconMap[drinkType.toLowerCase()] || <FaBeer />;
};

const Home = ({ user, drinks, setDrinks }) => {
  const [drinkType, setDrinkType] = useState('');

  useEffect(() => {
    const storedData = JSON.parse(localStorage.getItem('drinkData'));
    if (storedData) {
      const now = new Date().getTime();
      if (now - storedData.timestamp < EXPIRATION_TIME_MS) {
        setDrinks(storedData.drinks);
      } else {
        localStorage.removeItem('drinkData');
      }
    }
  }, [setDrinks]);

  const handleAddDrinkType = () => {
    if (drinkType && !drinks[drinkType]) {
      setDrinks({ ...drinks, [drinkType]: 0 });
      setDrinkType('');
    }
  };

  const handleAddDrink = (type) => {
    const newDrinks = { ...drinks, [type]: drinks[type] + 1 };
    setDrinks(newDrinks);
    localStorage.setItem('drinkData', JSON.stringify({ drinks: newDrinks, timestamp: new Date().getTime() }));
  };

  return (
    <div className="home-container">
      <h2>Welcome, {user.displayName || 'Guest'}</h2> {/* Use user.displayName */}
      <div className="drink-counter">
        Total Drinks: {Object.values(drinks).reduce((a, b) => a + b, 0)}
      </div>
      <input
        className="drink-input"
        type="text"
        value={drinkType}
        onChange={(e) => setDrinkType(e.target.value)}
        placeholder="Type of drink"
      />
      <button className="drink-button" onClick={handleAddDrinkType}>Add Drink Type</button>
      <ul className="drink-list">
        {Object.keys(drinks).map((type) => (
          <li key={type} className="drink-item">
            <div className="drink-icon">{getIcon(type)}</div>
            <div className="drink-name">{type}</div>
            <div className="drink-count">{drinks[type]}</div>
            <button className="drink-button" onClick={() => handleAddDrink(type)}>
              Add
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Home;
