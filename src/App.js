import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import GlobalStyle from './globalStyles';
import TopHeader from './components/TopHeader'; // Import the TopHeader component
import Header from './components/Header';
import Home from './components/Home';
import RequestForm from './components/RequestForm';
import UserIdentification from './components/UserIdentification';
import Scoreboard from './components/Scoreboard';
import SladeshHub from './components/SladeshHub'; 
import Charts from './components/Charts'; 
import GameWheel from './components/GameWheel';
import { auth, db } from './firebaseConfig';

const App = () => {
  const [user, setUser] = useState(null);
  const [drinks, setDrinks] = useState({});
  const [sladeshCount, setSladeshCount] = useState(0);
  const [hasViewedHub, setHasViewedHub] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({ uid: user.uid, displayName: userData.username });

          // Set the drinks and sladeshCount from the user's document
          setDrinks(userData.drinks || {});
          setSladeshCount(userData.sladeshCount || 0);
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userRef, (doc) => {
        const data = doc.data();
        if (data) {
          setSladeshCount(data.sladeshCount || 0);
          setDrinks(data.drinks || {}); // Update drinks in real-time
        }
      });

      return () => unsubscribe();
    }
  }, [user]);

  const handleReset = async () => {
    localStorage.removeItem('drinkData');
    setDrinks({});
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), { drinks: {}, totalDrinks: 0 }, { merge: true });
      } catch (error) {
        console.error('Error resetting drinks in Firestore:', error);
      }
    }
  };

  const handleUserSubmit = async (email, password, username) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        username,
        email,
        uid: user.uid,
        checkedIn: false,
        lastSladesh: null,
        sladeshCount: 0,
        drinks: {}, // Initialize drinks as an empty object
        totalDrinks: 0 // Initialize total drinks as 0
      });

      localStorage.setItem('username', username);
      setUser({ uid: user.uid, displayName: username });
    } catch (error) {
      alert('Failed to create user. Please try again.');
      console.error('Error:', error);
    }
  };

  const handleUserSignIn = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        localStorage.setItem('username', userData.username);
        setUser({ uid: user.uid, displayName: userData.username });

        // Set the drinks and sladeshCount from the user's document
        setDrinks(userData.drinks || {});
        setSladeshCount(userData.sladeshCount || 0);
      }
    } catch (error) {
      alert('Failed to sign in. Please try again.');
      console.error('Error:', error);
    }
  };

  const handleViewedSladeshHub = () => {
    setHasViewedHub(true); // Mark that the user has viewed the Sladesh Hub
    setSladeshCount(0); // Reset the Sladesh count
  };

  const handleNewRequests = (count) => {
    if (count > 0) {
      setHasViewedHub(false); // Mark that there are new requests
      setSladeshCount(count); // Set the Sladesh count
    }
  };

  if (!user) {
    return <UserIdentification onSubmit={handleUserSubmit} onSignIn={handleUserSignIn} />;
  }

  return (
    <>
      <GlobalStyle />
      <Router>
        <TopHeader sladeshCount={!hasViewedHub ? sladeshCount : 0} /> {/* Add the TopHeader */}
        <div style={{ paddingTop: '80px', paddingBottom: '60px' }}> {/* Adjust paddingTop to accommodate the top header */}
          <Routes>
            <Route path="/" element={<Home user={user} drinks={drinks} setDrinks={setDrinks} onReset={handleReset} />} />
            <Route path="/requests" element={<RequestForm user={user} />} />
            <Route path="/scoreboard" element={<Scoreboard user={user} />} />
            <Route path="/sladesh-hub" element={<SladeshHub user={user} onViewed={handleViewedSladeshHub} onNewRequests={handleNewRequests} />} />
            <Route path="/charts" element={<Charts />} />
            <Route path="/game-wheel" element={<GameWheel user={user} sladeshCount={sladeshCount} setSladeshCount={setSladeshCount} />} />
          </Routes>
        </div>
        <Header sladeshCount={!hasViewedHub ? sladeshCount : 0} />
      </Router>
    </>
  );
};

export default App;
