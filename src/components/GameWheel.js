import React, { useState } from 'react';
import './GameWheel.css';

const outcomes = [
  { id: 1, text: 'Get your Sladesh back!', action: 'get_sladesh' },
  { id: 2, text: 'Drink a whole beer!', action: 'drink_beer' },
  // Add more outcomes if needed
];

const GameWheel = ({ user, sladeshCount, setSladeshCount }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [showPopup, setShowPopup] = useState(false);

  const handleSpin = () => {
    if (isSpinning) return; // Prevent multiple spins at the same time

    setIsSpinning(true);

    const randomIndex = Math.floor(Math.random() * outcomes.length);
    const selected = outcomes[randomIndex];
    const additionalSpins = Math.floor(Math.random() * 4) + 3;
    const degreesPerSegment = 360 / outcomes.length;
    const randomRotation = additionalSpins * 360 + randomIndex * degreesPerSegment;

    setRotation(prevRotation => prevRotation + randomRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setSelectedOutcome(selected);
      setShowPopup(true); // Show the popup after spin
    }, 3000); // Spin duration
  };

  const handlePopupResponse = () => {
    if (selectedOutcome.action === 'get_sladesh') {
      setSladeshCount(sladeshCount + 1);
    } else if (selectedOutcome.action === 'drink_beer') {
      // You can implement more logic here if needed
    }
    setShowPopup(false);
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
              className={`spinner__item spinner__item--${['top', 'bottom'][index % outcomes.length]}`}
            >
              {outcome.text}
            </div>
          ))}
        </div>
      </div>
      {showPopup && (
        <div className="popup-backdrop">
          <div className="popup">
            <div className="popup-content">
              <p>{selectedOutcome.text}</p>
              <button className="popup-button yes-button" onClick={handlePopupResponse}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameWheel;
