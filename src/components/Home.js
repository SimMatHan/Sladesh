import React, { useEffect, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { FaBeer, FaWineGlassAlt, FaCocktail, FaGlassWhiskey, FaCoffee } from 'react-icons/fa';
import './Home.css';
import { db } from '../firebaseConfig';

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

const Home = ({ user, drinks, setDrinks, onReset }) => {
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
      const newDrinks = { ...drinks, [drinkType]: 0 };
      setDrinks(newDrinks);
      setDrinkType('');
      saveDrinksToFirestore(newDrinks);
    }
  };

  const handleAddDrink = (type) => {
    const newDrinks = { ...drinks, [type]: drinks[type] + 1 };
    setDrinks(newDrinks);
    localStorage.setItem('drinkData', JSON.stringify({ drinks: newDrinks, timestamp: new Date().getTime() }));
    saveDrinksToFirestore(newDrinks);
  };

  const handleSubtractDrink = (type) => {
    if (drinks[type] > 0) {
      const newDrinks = { ...drinks, [type]: drinks[type] - 1 };
      setDrinks(newDrinks);
      localStorage.setItem('drinkData', JSON.stringify({ drinks: newDrinks, timestamp: new Date().getTime() }));
      saveDrinksToFirestore(newDrinks);
    }
  };

  const saveDrinksToFirestore = async (drinks) => {
    try {
      await setDoc(doc(db, 'drinks', user.uid), { drinks });
    } catch (error) {
      console.error('Error saving drinks to Firestore:', error);
    }
  };

  return (
    <div className="home-container">
      <h2>Welcome, {user.displayName || 'Guest'}</h2>
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
      <div className="button-container">
        <button className="main-button" onClick={handleAddDrinkType}>Add Drink Type</button>
        <button className="main-button reset-button" onClick={onReset}>Reset Your Drink(s)</button>
      </div>
      <ul className="drink-list">
        {Object.keys(drinks).map((type) => (
          <li key={type} className="drink-item">
            <div className="drink-icon">{getIcon(type)}</div>
            <div className="drink-name">{type}</div>
            <div className="drink-control">
              <button className="drink-control-button subtract-button" onClick={() => handleSubtractDrink(type)}>
                -
              </button>
              <div className="drink-count">{drinks[type]}</div>
              <button className="drink-control-button add-button" onClick={() => handleAddDrink(type)}>
                +
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Home;
