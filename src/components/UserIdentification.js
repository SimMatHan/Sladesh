import React, { useState } from 'react';
import './UserIdentification.css'; // Adjust the path if necessary
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Ensure you have the correct path

const UserIdentification = ({ onSubmit, onSignIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim() && password.trim() && (isSignUp ? username.trim() : true)) {
      if (isSignUp) {
        onSubmit(email, password, username);
      } else {
        onSignIn(email, password);
      }
    } else {
      alert('Please fill in all fields.');
    }
  };

  const handlePasswordReset = async () => {
    if (email.trim()) {
      try {
        await sendPasswordResetEmail(auth, email);
        alert('Password reset email sent.');
        sendNotificationEmail(email); // Function to send an email notification to you
      } catch (error) {
        alert('Error sending password reset email.');
        console.error('Error:', error);
      }
    } else {
      alert('Please enter your email address.');
    }
  };

  const sendNotificationEmail = async (userEmail) => {
    try {
      await fetch('https://example.com/send-email', { // Replace with your server endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      });
    } catch (error) {
      console.error('Error sending notification email:', error);
    }
  };

  return (
    <div className="user-identification-container">
      <div className="app-introduction">
        <h1>Welcome to Sladesh!</h1>
        <p>
          Sladesh is an app where you can monitor drinks and give your friends a sladesh. 
          Please create your account to get started. <br/>
          <br/>
          Remember, you only need to create an account once!
        </p>
      </div>
      <form onSubmit={handleSubmit} className="user-identification-form">
        {isSignUp && (
          <label className="user-identification-label">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input"
              placeholder="Enter your username"
            />
          </label>
        )}
        <label className="user-identification-label">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="Enter your email"
          />
        </label>
        <label className="user-identification-label">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="Enter your password"
          />
        </label>
        <div className="button-container">
          <button type="submit" className={`button ${isSignUp ? 'button-call-to-action' : ''}`}>
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
          <button type="button" className="button" onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? 'Switch to Sign In' : 'Switch to Sign Up'}
          </button>
        </div>
        {!isSignUp && (
          <p className="forgot-password-link" onClick={handlePasswordReset}>
            Forgot Password?
          </p>
        )}
      </form>
    </div>
  );
};

export default UserIdentification;
