import React, { useEffect, useRef, useState, useCallback } from 'react';
import './GameWheel.css';
import { doc, updateDoc, getDoc } from 'firebase/firestore'; // Import getDoc to fetch user data
import { db } from '../firebaseConfig';

const outcomes = [
  { id: 1, spinText:'CHUG A DRINK', text: 'Drink a whole beer!', action: 'drink_beer' },
  { id: 2, spinText:'Sladesh back!', text: 'Get your Sladesh back!', action: 'get_sladesh' },
  { id: 3, spinText:'Nothing!', text: 'Nothing! You\'re safe... for now.', action: 'nothing' },
  { id: 4, spinText:'Beer Run!', text: 'Beer Run! Time to get the next round.', action: 'beer_run' },
];

const sectors = outcomes.map((outcome, index) => {
  const colors = ['#d3d2c1', '#87643d', '#d4e653', '#a8a793'];
  return { color: colors[index % colors.length], label: outcome.spinText, action: outcome.action };
});

const rand = (m, M) => Math.random() * (M - m) + m;
const PI = Math.PI;
const TAU = 2 * PI;
// Increased friction to slow the wheel down faster
const friction = 0.985; // Adjusted for a faster slow down

const MAX_SPINS_PER_DAY = 5;

const GameWheel = ({ user }) => {
  const [angVel, setAngVel] = useState(0); // Angular velocity
  const [ang, setAng] = useState(0); // Angle in radians
  const [isSpinning, setIsSpinning] = useState(false); // Spinning state
  const [selectedOutcome, setSelectedOutcome] = useState(''); // Outcome display state
  const [remainingSpins, setRemainingSpins] = useState(MAX_SPINS_PER_DAY); // Track remaining spins
  const canvasRef = useRef(null);
  const spinRef = useRef(null);
  const requestRef = useRef(null);

  const tot = sectors.length;
  const arc = TAU / tot;

  useEffect(() => {
    if (user && user.uid) {
      const fetchUserData = async () => {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnapshot = await getDoc(userDocRef);

        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          const lastSpinDate = userData.lastSpinDate ? userData.lastSpinDate.toDate() : null;
          const today = new Date();
          const isSameDay = lastSpinDate && lastSpinDate.toDateString() === today.toDateString();

          if (isSameDay) {
            setRemainingSpins(userData.remainingSpins);
          } else {
            setRemainingSpins(MAX_SPINS_PER_DAY);
            await updateDoc(userDocRef, { remainingSpins: MAX_SPINS_PER_DAY, lastSpinDate: today });
          }
        } else {
          await updateDoc(userDocRef, { remainingSpins: MAX_SPINS_PER_DAY, lastSpinDate: new Date() });
        }
      };

      fetchUserData();
    }
  }, [user]);

  const getIndex = useCallback(() => {
    return Math.floor(tot - (ang / TAU) * tot) % tot;
  }, [ang, tot]);

  const drawSector = useCallback((ctx, sector, i) => {
    const ang = arc * i;
    const rad = ctx.canvas.width / 2;

    ctx.save();
    // COLOR
    ctx.beginPath();
    ctx.fillStyle = sector.color;
    ctx.moveTo(rad, rad);
    ctx.arc(rad, rad, rad, ang, ang + arc);
    ctx.lineTo(rad, rad);
    ctx.fill();
    // TEXT
    ctx.translate(rad, rad);
    ctx.rotate(ang + arc / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px sans-serif'; // Adjusted for better fit
    ctx.fillText(sector.label, rad - 20, 10);
    ctx.restore();
  }, [arc]);

  const rotate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.canvas.style.transform = `rotate(${ang - PI / 2}rad)`;
  }, [ang]);

  const handleOutcome = useCallback(async () => {
    const sector = sectors[getIndex()];
    setSelectedOutcome(sector.label); // Update the displayed outcome
    console.log('Selected outcome:', sector.label);

    switch (sector.action) {
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
  }, [getIndex, user]);

  const frame = useCallback(() => {
    if (!angVel) return;

    setAngVel(prevVel => {
      const newVel = prevVel * friction;
      if (newVel < 0.002) {
        setIsSpinning(false);
        handleOutcome(); // Trigger outcome handling
        return 0; // Stop the rotation
      }
      return newVel;
    });

    setAng(prevAng => (prevAng + angVel) % TAU); // Update angle
    rotate();
  }, [angVel, rotate, handleOutcome]);

  useEffect(() => {
    if (isSpinning) {
      requestRef.current = requestAnimationFrame(frame);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [frame, isSpinning]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    sectors.forEach((sector, i) => drawSector(ctx, sector, i));
    rotate(); // Initial rotation
  }, [drawSector, rotate]);

  const handleSpin = async () => {
    if (!isSpinning && remainingSpins > 0) {
      setIsSpinning(true);
      // Increase initial angular velocity for a quicker spin
      setAngVel(rand(0.3, 0.5)); // Adjusted for a faster start
      setSelectedOutcome(''); // Clear the outcome when spinning starts

      // Update remaining spins
      const newRemainingSpins = remainingSpins - 1;
      setRemainingSpins(newRemainingSpins);

      if (user && user.uid) {
        const userDocRef = doc(db, 'users', user.uid);
        try {
          await updateDoc(userDocRef, { remainingSpins: newRemainingSpins, lastSpinDate: new Date() });
        } catch (error) {
          console.error('Error updating remaining spins:', error);
        }
      }
    }
  };

  // Add the conditional text logic before the return statement
  let outcomeMessage = '';
  if (selectedOutcome === 'Beer Run!') {
    outcomeMessage = 'Beer Run! Time to get the next round.';
  } else if (selectedOutcome === 'CHUG A DRINK') {
    outcomeMessage = 'Drink a whole beer!';
  } else if (selectedOutcome === 'Sladesh back!') {
    outcomeMessage = 'Get your Sladesh back!';
  } else if (selectedOutcome === 'Nothing!') {
    outcomeMessage = 'Nothing! You\'re safe... for now.';
  }

  return (
    <div className="game-wheel-container">
      <div className="credits-display">
        {`Remaining Spins: ${remainingSpins}`}
      </div>
      <div id="wheelOfFortune">
        <canvas id="wheel" ref={canvasRef} width="500" height="500"></canvas>
        <div id="spin" ref={spinRef} onClick={handleSpin}>
          SPIN
        </div>
        <div id="top-pointer"></div> {/* This is the pointer at the top of the wheel */}
      </div>
      <div className="outcome-display">
        {outcomeMessage}
      </div>
    </div>
  );
};

export default GameWheel;
