import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import GlobalStyle from './globalStyles';
import Header from './components/Header';
import Home from './components/Home';
import RequestForm from './components/RequestForm';
import UserIdentification from './components/UserIdentification';
import { auth, db } from './firebaseConfig';

const App = () => {
  const [user, setUser] = useState(null);
  const [drinks, setDrinks] = useState({});

  useEffect(() => {
    const storedData = JSON.parse(localStorage.getItem('drinkData'));
    if (storedData) {
      const now = new Date().getTime();
      const EXPIRATION_TIME_MS = 30 * 1000; // 30 seconds for testing

      if (now - storedData.timestamp < EXPIRATION_TIME_MS) {
        setDrinks(storedData.drinks);
      } else {
        localStorage.removeItem('drinkData');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch the username from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({ uid: user.uid, displayName: userData.username });
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleReset = () => {
    localStorage.removeItem('drinkData');
    setDrinks({});
  };

  const handleUserSubmit = async (email, password, username) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save user information in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        username,
        email,
        uid: user.uid,
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

      // Fetch the username from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        localStorage.setItem('username', userData.username);
        setUser({ uid: user.uid, displayName: userData.username });
      }
    } catch (error) {
      alert('Failed to sign in. Please try again.');
      console.error('Error:', error);
    }
  };

  if (!user) {
    return <UserIdentification onSubmit={handleUserSubmit} onSignIn={handleUserSignIn} />;
  }

  return (
    <>
      <GlobalStyle />
      <Router>
        <Header onReset={handleReset} />
        <Routes>
          <Route path="/" element={<Home user={user} drinks={drinks} setDrinks={setDrinks} />} />
          <Route path="/requests" element={<RequestForm user={user} />} />
        </Routes>
      </Router>
    </>
  );
};

export default App;
