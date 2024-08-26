import React, { useState } from 'react';
import './GameWheel.css';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const outcomes = [
  { id: 1, text: 'Drink a whole beer!', action: 'drink_beer' },
  { id: 2, text: 'Get your Sladesh back!', action: 'get_sladesh' },
  { id: 3, text: 'Nothing! You\'re safe... for now.', action: 'nothing' },
  { id: 4, text: 'Beer Run! Time to get the next round.', action: 'beer_run' },
];

const positions = ['top', 'right', 'bottom', 'left'];

const GameWheel = ({ user }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);

  const handleSpin = () => {
    if (isSpinning) return; // Prevent multiple spins at the same time

    setIsSpinning(true);

    // Select a random outcome
    const randomIndex = Math.floor(Math.random() * outcomes.length);
    const selected = outcomes[randomIndex];

    // Calculate the exact rotation needed to land on the selected outcome
    const degreesPerSegment = 360 / outcomes.length;
    const exactRotation = randomIndex * degreesPerSegment;

    // Determine the final rotation by adding a fixed number of spins
    const additionalSpins = 4; // Fixed number of spins for consistency
    const totalRotation = additionalSpins * 360 + exactRotation;

    console.log('Selected outcome:', selected.text);
    console.log('Exact rotation:', exactRotation);
    console.log('Total rotation applied:', totalRotation);

    setRotation(prevRotation => prevRotation + totalRotation);

    setTimeout(async () => {
      setIsSpinning(false);

      // Handle the selected outcome action
      switch (selected.action) {
        case 'get_sladesh':
          console.log('Action: Get your Sladesh back!');
          if (user && user.uid) {
            const userDocRef = doc(db, 'users', user.uid);
            try {
              await updateDoc(userDocRef, { lastSladesh: null });
              console.log('lastSladesh reset to null in Firebase');
            } catch (error) {
              console.error('Error updating lastSladesh:', error);
            }
          }
          break;

        case 'drink_beer':
          console.log('Action: Drink a whole beer!');
          // Logic for drinking a whole beer
          break;

        case 'nothing':
          console.log('Action: Nothing! You\'re safe... for now.');
          // No additional logic needed for "nothing"
          break;

        case 'beer_run':
          console.log('Action: Beer Run! Time to get the next round.');
          // Logic for beer run - maybe prompt the user to fetch drinks
          break;

        default:
          console.log('Unknown action');
          break;
      }
    }, 3000); // Spin duration
  };

  return (
    <div className="game-wheel-container">
      <div className="spinner">
        <div className="spinner__body"></div>
        <button className="spinner__start-button" onClick={handleSpin} disabled={isSpinning}>
          {isSpinning ? 'Spinning...' : 'GO!'}
        </button>
        <div className="spinner__plate" style={{ transform: `rotate(${rotation}deg)` }}>
          {outcomes.map((outcome, index) => (
            <div
              key={outcome.id}
              className={`spinner__item spinner__item--${positions[index]}`}
            >
              {outcome.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameWheel;
