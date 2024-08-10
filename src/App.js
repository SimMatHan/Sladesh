import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import GlobalStyle from './globalStyles';
import Header from './components/Header';
import Home from './components/Home';
import RequestForm from './components/RequestForm';
import UserIdentification from './components/UserIdentification';
import Scoreboard from './components/Scoreboard';
import SladeshHub from './components/SladeshHub'; 
import Charts from './components/Charts'; 
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

          const drinksDoc = await getDoc(doc(db, 'drinks', user.uid));
          if (drinksDoc.exists()) {
            setDrinks(drinksDoc.data().drinks);
          }
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleReset = async () => {
    localStorage.removeItem('drinkData');
    setDrinks({});
    if (user) {
      try {
        await setDoc(doc(db, 'drinks', user.uid), { drinks: {} });
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

        const drinksDoc = await getDoc(doc(db, 'drinks', user.uid));
        if (drinksDoc.exists()) {
          setDrinks(drinksDoc.data().drinks);
        }
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
        <Header sladeshCount={!hasViewedHub ? sladeshCount : 0} />
        <div style={{ paddingBottom: '60px' }}>
          <Routes>
            <Route path="/" element={<Home user={user} drinks={drinks} setDrinks={setDrinks} onReset={handleReset} />} />
            <Route path="/requests" element={<RequestForm user={user} />} />
            <Route path="/scoreboard" element={<Scoreboard user={user} />} />
            <Route path="/sladesh-hub" element={<SladeshHub user={user} onViewed={handleViewedSladeshHub} onNewRequests={handleNewRequests} />} />
            <Route path="/charts" element={<Charts />} />
          </Routes>
        </div>
      </Router>
    </>
  );
};

export default App;
