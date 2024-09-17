import React, { useEffect, useRef, useState, useCallback } from 'react';
import './GameWheel.css';
import { doc, updateDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Outcomes array (reverted to equal spacing)
const outcomes = [
  { id: 1, spinText: 'CHUG YOUR DRINK', text: 'Drink your entire drink!', action: 'drink_beer' },
  { id: 2, spinText: 'Sladesh back!', text: 'Get your Sladesh back!', action: 'get_sladesh' },
  { id: 3, spinText: 'Sladesh for a Friend!', text: 'Give a random user a Sladesh back!', action: 'random_sladesh' },
  { id: 4, spinText: 'Beer Run!', text: 'Beer Run! Time to get the next round.', action: 'beer_run' },
];

// Set up equal arc spacing for each outcome
const sectors = outcomes.map((outcome, index) => {
  const colors = ['#d3d2c1', '#87643d', '#d4e653', '#a8a793'];
  return { 
    color: colors[index % colors.length], 
    label: outcome.spinText, 
    action: outcome.action,
  };
});

const rand = (m, M) => Math.random() * (M - m) + m;
const PI = Math.PI;
const TAU = 2 * PI;
const friction = 0.985;

const MAX_SPINS_PER_DAY = 5;

const GameWheel = ({ user }) => {
  const [angVel, setAngVel] = useState(0);
  const [ang, setAng] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState('');
  const [remainingSpins, setRemainingSpins] = useState(MAX_SPINS_PER_DAY);
  const [sladeshMessage, setSladeshMessage] = useState(''); // New state for displaying Sladesh messages
  const canvasRef = useRef(null);
  const spinRef = useRef(null);
  const requestRef = useRef(null);

  // Each sector will have an equal arc size
  const tot = sectors.length;
  const arc = TAU / tot;

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
    setSelectedOutcome(sector.label);

    switch (sector.action) {
      case 'get_sladesh':
        if (user && user.uid) {
          const userDocRef = doc(db, 'users', user.uid);
          await updateDoc(userDocRef, { lastSladesh: null });
          setSladeshMessage('You got your Sladesh back!'); // Sladesh back for the current user
        }
        break;

      case 'random_sladesh':
        const message = await giveRandomUserSladeshBack();
        setSladeshMessage(message); // Display message after random Sladesh is given
        break;

      case 'drink_beer':
        setSladeshMessage('Drink a whole beer!');
        break;

      case 'beer_run':
        setSladeshMessage('Beer Run! Time to get the next round.');
        break;

      default:
        break;
    }
  }, [getIndex, user]);

  const giveRandomUserSladeshBack = async () => {
    try {
      const usersCollection = collection(db, 'users');
      const querySnapshot = await getDocs(usersCollection);
      const checkedInUsers = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.checkedIn) {
          checkedInUsers.push({ id: doc.id, ...data });
        }
      });

      if (checkedInUsers.length > 0) {
        const randomIndex = Math.floor(Math.random() * checkedInUsers.length);
        const randomUser = checkedInUsers[randomIndex];

        const randomUserDocRef = doc(db, 'users', randomUser.id);
        await updateDoc(randomUserDocRef, { lastSladesh: new Date() });

        console.log(`Sladesh given back to: ${randomUser.username}`);
        return `Sladesh back to ${randomUser.username}!`; // Return the name of the user who got the Sladesh back
      } else {
        return 'No users are checked in.'; // Return message if no users are checked in
      }
    } catch (error) {
      console.error('Error giving random user a Sladesh back:', error);
      return 'Error occurred while giving Sladesh back.';
    }
  };

  const frame = useCallback(() => {
    if (!angVel) return;

    setAngVel(prevVel => {
      const newVel = prevVel * friction;
      if (newVel < 0.002) {
        setIsSpinning(false);
        handleOutcome();
        return 0;
      }
      return newVel;
    });

    setAng(prevAng => (prevAng + angVel) % TAU);
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
    rotate();
  }, [drawSector, rotate]);

  const handleSpin = async () => {
    if (!isSpinning && remainingSpins > 0) {
      setIsSpinning(true);
      setAngVel(rand(0.3, 0.5));
      setSelectedOutcome('');
      setSladeshMessage(''); // Clear the message when spinning starts
      const newRemainingSpins = remainingSpins - 1;
      setRemainingSpins(newRemainingSpins);

      if (user && user.uid) {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, { remainingSpins: newRemainingSpins, lastSpinDate: new Date() });
      }
    }
  };

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
        <div id="top-pointer"></div>
      </div>
      <div className="outcome-display">
        {sladeshMessage || selectedOutcome} {/* Display either the Sladesh message or the outcome */}
      </div>
    </div>
  );
};

export default GameWheel;
