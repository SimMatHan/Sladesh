import React, { useEffect, useState } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { FaBeer, FaWineGlassAlt, FaCocktail, FaGlassWhiskey } from 'react-icons/fa';
import './Home.css';
import { db } from '../firebaseConfig';
import youSureAboutThatGif from '../assets/gifs/yousureaboutthat.gif'; 
import CR7DrinkingGif from '../assets/gifs/CR7.gif'; // CR7 gif for 3 wines
import oBeerMa from '../assets/gifs/Obeerma.jpg';
import beernieSanders from '../assets/gifs/Beernie Sanders.jpg';
import beatStab from '../assets/gifs/beatStab.jpg';
import morebeer from '../assets/gifs/morebeer.jpg';
import mrLaheyGif from '../assets/gifs/mrlahey.gif';


const EXPIRATION_TIME_MS = 30 * 1000; // 30 seconds for testing

const iconMap = {
  beer: <FaBeer />,
  wine: <FaWineGlassAlt />,
  drink: <FaCocktail />,
  shots: <FaGlassWhiskey />,
};

const drinkOrder = ['beer', 'wine', 'drink', 'shots']; // Define a consistent order

const getIcon = (drinkType) => {
  return iconMap[drinkType.toLowerCase()] || <FaBeer />;
};

const Home = ({ user, drinks, setDrinks, onReset }) => {
  const [drinkType, setDrinkType] = useState('');
  const [totalDrinks, setTotalDrinks] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [popupImage, setPopupImage] = useState(null); // Image for the popup
  const [isConfirmation, setIsConfirmation] = useState(false); // State for confirmation popup
  const [popupShown, setPopupShown] = useState({}); // Tracks which popups have been shown

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

  useEffect(() => {
    const beers = drinks.beer || 0;
    const wines = drinks.wine || 0;

    // Track which popups have already been shown and prevent showing the same one again
    if (totalDrinks === 10 && !popupShown["totalDrinks10"]) {
      setShowPopup(true);
      setPopupImage(morebeer); // CR7 gif for 10 total drinks
      setPopupShown((prev) => ({ ...prev, totalDrinks10: true }));
    } else if (totalDrinks === 15 && !popupShown["totalDrinks15"]) {
      setShowPopup(true);
      setPopupImage(beatStab); // beatStab for 15 total drinks
      setPopupShown((prev) => ({ ...prev, totalDrinks15: true }));
    } else if (beers === 3 && !popupShown["beers3"]) {
      setShowPopup(true);
      setPopupImage(beernieSanders); // beernieSanders for 3 beers
      setPopupShown((prev) => ({ ...prev, beers3: true }));
    } else if (beers === 5 && !popupShown["beers5"]) {
      setShowPopup(true);
      setPopupImage(oBeerMa); // oBeerMa for 5 beers
      setPopupShown((prev) => ({ ...prev, beers5: true }));
    } else if (wines === 3 && !popupShown["wines3"]) { // New condition for 3 wines
      setShowPopup(true);
      setPopupImage(CR7DrinkingGif); // Show CR7DrinkingGif when 3 wines are reached
      setPopupShown((prev) => ({ ...prev, wines3: true }));
    } else if (totalDrinks === 20 && !popupShown["totalDrinks20"]) { // New condition for 3 wines
      setShowPopup(true);
      setPopupImage(mrLaheyGif); // Show CR7DrinkingGif when 3 wines are reached
      setPopupShown((prev) => ({ ...prev, totalDrinks20: true }));
    }
    

    // Automatically close the popup after 5 seconds if not a confirmation
    if (showPopup && popupImage && !isConfirmation) {
      const timer = setTimeout(() => {
        setShowPopup(false);
        setPopupImage(null); // Reset popup image after close
      }, 5000);

      return () => clearTimeout(timer); // Clear timeout on cleanup
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalDrinks, drinks, popupImage, showPopup]);

  const handleAddDrink = (type) => {
    const newDrinks = { ...drinks, [type]: (drinks[type] || 0) + 1 };
    setDrinks(newDrinks);
    setDrinkType(''); // Reset the drinkType selection
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
      await setDoc(doc(db, 'users', user.uid), { drinks, totalDrinks }, { merge: true });
    } catch (error) {
      console.error('Error saving drinks to Firestore:', error);
    }
  };

  const handleReset = async () => {
    const emptyDrinks = {};
    setDrinks(emptyDrinks);
    setTotalDrinks(0);
    localStorage.removeItem('drinkData');
    setPopupShown({}); // Reset shown popups on reset
    try {
      await setDoc(doc(db, 'users', user.uid), { drinks: emptyDrinks, totalDrinks: 0 }, { merge: true });
    } catch (error) {
      console.error('Error resetting drinks in Firestore:', error);
    }
  };

  const confirmReset = () => {
    setIsConfirmation(true); // Indicate it's a confirmation popup
    setShowPopup(true);
    setPopupImage(youSureAboutThatGif); // Default popup for reset confirmation
  };

  const handlePopupResponse = (response) => {
    if (response === 'yes') {
      handleReset();
    }
    setShowPopup(false);
    setIsConfirmation(false); // Reset the confirmation state
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
      <select
        className="drink-select"
        value={drinkType}
        onChange={(e) => setDrinkType(e.target.value)}
      >
        <option value="">Select a drink</option>
        <option value="beer">Beer</option>
        <option value="wine">Wine</option>
        <option value="drink">Drink</option>
        <option value="shots">Shots</option>
      </select>
      <div className="button-container">
        <button className="main-button" onClick={() => handleAddDrink(drinkType)} disabled={!drinkType}>Add Drink</button>
        <button className="main-button reset-button" onClick={confirmReset}>Reset Your Drink(s)</button>
      </div>
      <ul className="drink-list">
        {drinkOrder.map((type) => (
          drinks[type] > 0 && (
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
          )
        ))}
      </ul>
      {showPopup && (
        <div className="popup-backdrop">
          <div className="popup">
            <div className="popup-content">
              {popupImage && <img src={popupImage} alt="Popup" className="popup-gif" />}
              {isConfirmation ? (
                <div className="popup-buttons">
                  <button className="popup-button" onClick={() => handlePopupResponse('yes')}>Yes</button>
                  <button className="popup-button" onClick={() => handlePopupResponse('no')}>No</button>
                </div>
              ) : (
                <button className="popup-button" onClick={() => setShowPopup(false)}>OK</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
