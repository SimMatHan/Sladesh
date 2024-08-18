import React, { useState, useEffect } from 'react';
import { createRequest, getUsers } from '../services/requestService';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './RequestForm.css'; // Import the CSS file
import LoadingRipples from '../assets/ripples.svg'; // Import the LoadingRipples component
import ConfirmationIcon from '../assets/Confirmation.svg'; // Import the confirmation SVG

const RequestForm = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [checkedIn, setCheckedIn] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const fetchUserStatus = async () => {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setCheckedIn(userData.checkedIn);
      }
    };

    const fetchUsers = async () => {
      try {
        const fetchedUsers = await getUsers();
        const filteredUsers = fetchedUsers.filter(u => u.username !== user.displayName);
        setUsers(filteredUsers);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStatus();
    fetchUsers();
  }, [user]);

  const handleGyroscope = (event) => {
    const beta = event.beta !== null ? event.beta : 0;

    if (beta < -15) {
      confirmSladesh();
    }
  };

  const startGyroscopeMonitoring = () => {
    if (window.DeviceOrientationEvent) {
      console.log("DeviceOrientationEvent is supported.");
      window.addEventListener('deviceorientation', handleGyroscope, true);
    } else {
      console.error("DeviceOrientationEvent is not supported on this device.");
    }
  };

  const requestGyroscopePermission = async () => {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const response = await DeviceOrientationEvent.requestPermission();
        if (response === 'granted') {
          startGyroscopeMonitoring();
        } else {
          console.error("Permission not granted for DeviceOrientationEvent");
        }
      } catch (error) {
        console.error("Error requesting DeviceOrientationEvent permission", error);
      }
    } else {
      startGyroscopeMonitoring(); // For non-iOS devices
    }
  };

  const stopGyroscopeMonitoring = () => {
    window.removeEventListener('deviceorientation', handleGyroscope);
  };

  const sendRequest = async (e) => {
    e.preventDefault();
    setShowPopup(true); // Show the popup
    requestGyroscopePermission(); // Request permission and start gyroscope monitoring
  };

  const confirmSladesh = async () => {
    stopGyroscopeMonitoring();
    setShowPopup(false); // Hide the popup

    try {
      setError('');
      setSuccess('');
      if (!user || !user.displayName || !selectedUser) {
        throw new Error("Invalid sender or recipient information");
      }

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const now = new Date();
        const lastSladesh = userData.lastSladesh ? userData.lastSladesh.toDate() : null;
        const isSameInterval = lastSladesh && (
          (lastSladesh.getHours() < 12 && now.getHours() < 12) ||
          (lastSladesh.getHours() >= 12 && now.getHours() >= 12)
        );

        if (isSameInterval) {
          setError('You have used your Sladesh for this interval.');
          return;
        }

        if (!userData.checkedIn) {
          setError('You need to check in to send a Sladesh.');
          return;
        }

        const recipientDocRef = doc(db, 'users', selectedUser.id);
        const recipientDoc = await getDoc(recipientDocRef);

        if (recipientDoc.exists()) {
          const recipientData = recipientDoc.data();
          if (!recipientData.checkedIn) {
            setError('The recipient needs to check in to receive a Sladesh.');
            return;
          }
        } else {
          setError('Recipient not found.');
          return;
        }

        const message = `Sladesh by ${user.displayName}`;
        await createRequest({ sender: user, recipient: selectedUser.username, message });

        await setDoc(userDocRef, { lastSladesh: now }, { merge: true });

        setSelectedUser(null);
        showConfirmationPopup(); // Show confirmation SVG
      } else {
        throw new Error("User document does not exist");
      }
    } catch (error) {
      console.error("Failed to send request:", error);
      setError('Failed to send request. Please try again.');
    }
  };

  const showConfirmationPopup = () => {
    setSuccess('Sladesh sent successfully!'); // Show success message
    setShowConfirmation(true);
    setTimeout(() => {
      setShowConfirmation(false);
    }, 3000); // Hide the confirmation SVG after 3 seconds
  };

  const toggleUserSelection = (user) => {
    if (selectedUser && selectedUser.id === user.id) {
      setSelectedUser(null);
    } else {
      setSelectedUser(user);
    }
  };

  const handleCheckIn = async () => {
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, { checkedIn: true }, { merge: true });
    setCheckedIn(true);
  };

  const refreshUsers = async () => {
    setLoading(true);
    try {
      const fetchedUsers = await getUsers();
      const filteredUsers = fetchedUsers.filter(u => u.username !== user.displayName);
      setUsers(filteredUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  // Inline Popup Component
  const SladeshPopup = () => (
    <>
      <div className="sladesh-popup-overlay"></div>
      <div className="sladesh-popup">
        <div className="sladesh-popup-content">
          <p>Do the Sladesh with the phone!</p>
        </div>
      </div>
    </>
  );

  return (
    <div className="request-form-container">
      <div className="intro-container">
        <h1 className="intro-heading">Send a Sladesh</h1>
        <p className="intro-text">Select a user to send a Sladesh to. Only users who are currently checked in will appear in the list.</p>
      </div>

      <div className="button-group">
        <button
          onClick={handleCheckIn}
          className="check-in-button"
          disabled={checkedIn}
        >
          {checkedIn ? "You're checked in" : "Check In"}
        </button>
        <button onClick={refreshUsers} type="button" className="refresh-button">Refresh Users</button>
      </div>

      <form onSubmit={sendRequest} className="request-form">
        {loading ? (
          <div className="loading-indicator">
            <img src={LoadingRipples} alt="Loading..." className="loading-ripples" />
            <p>Loading users...</p>
          </div>
        ) : (
          <div className="user-cards-container">
            {users.length === 0 ? (
              <p className="no-users-message">No users are currently checked in.</p>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className={`user-card ${selectedUser && selectedUser.id === user.id ? 'selected' : ''}`}
                  onClick={() => toggleUserSelection(user)}
                >
                  <div className="user-info">
                    <h3>{user.username}</h3>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <button
          type="submit"
          className="form-button"
          disabled={!selectedUser}
        >
          Send Sladesh
        </button>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
      </form>

      {showConfirmation && (
        <div className="confirmation-popup">
          <img src={ConfirmationIcon} alt="Confirmation" />
        </div>
      )}

      {showPopup && <SladeshPopup />} {/* Render Popup only when showPopup is true */}
    </div>
  );
};

export default RequestForm;
