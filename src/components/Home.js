import React, { useEffect, useState } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
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
  const [totalDrinks, setTotalDrinks] = useState(0);

  useEffect(() => {
    const storedData = JSON.parse(localStorage.getItem('drinkData'));
    if (storedData) {
      const now = new Date().getTime();
      if (now - storedData.timestamp < EXPIRATION_TIME_MS) {
        setDrinks(storedData.drinks);
        setTotalDrinks(Object.values(storedData.drinks).reduce((a, b) => a + b, 0));
      } else {
        localStorage.removeItem('drinkData');
      }
    }

    // Fetch user's totalDrinks from Firestore if exists
    const fetchTotalDrinks = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const totalDrinks = userData.totalDrinks || 0;
          setTotalDrinks(totalDrinks);
        }
      }
    };

    fetchTotalDrinks();
  }, [setDrinks, user]);

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
    const totalDrinks = Object.values(drinks).reduce((a, b) => a + b, 0);
    setTotalDrinks(totalDrinks); // Update the total drinks state
    try {
      await setDoc(doc(db, 'drinks', user.uid), { drinks });
      await setDoc(doc(db, 'users', user.uid), { totalDrinks }, { merge: true });
    } catch (error) {
      console.error('Error saving drinks to Firestore:', error);
    }
  };

  const handleReset = async () => {
    const emptyDrinks = {};
    setDrinks(emptyDrinks);
    setTotalDrinks(0);
    localStorage.removeItem('drinkData');
    try {
      await setDoc(doc(db, 'drinks', user.uid), { drinks: emptyDrinks });
      await setDoc(doc(db, 'users', user.uid), { totalDrinks: 0 }, { merge: true });
    } catch (error) {
      console.error('Error resetting drinks in Firestore:', error);
    }
  };

  return (
    <div className="home-container">
      <div className={`intro-container ${totalDrinks > 0 ? 'intro-container-minimized' : ''}`}>
        <h1 className="intro-heading">
          {totalDrinks > 0 ? 'LETS GOOO!' : 'Ready to get a buzz on and sladesh your friends? 🍹🥤'}
        </h1>
        {totalDrinks === 0 && <p className="intro-text">Welcome to Sladesh, {user.displayName || 'Guest'}! Let's dive in and start keeping track of every sip!</p>}
      </div>
      <div className="drink-counter">
        Total Drinks: {totalDrinks}
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
        <button className="main-button reset-button" onClick={handleReset}>Reset Your Drink(s)</button>
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
