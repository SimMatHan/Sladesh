import React, { useState, useEffect } from 'react';
import { getUsers, createRequest } from '../services/requestService';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './RequestForm.css'; 
import LoadingRipples from '../assets/ripples.svg'; 
import ConfirmationIcon from '../assets/Confirmation.svg'; 

const RequestForm = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [checkedIn, setCheckedIn] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [canSendSladesh, setCanSendSladesh] = useState(true);

  let lock = false;

  useEffect(() => {
    const fetchUserStatus = async () => {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setCheckedIn(userData.checkedIn);

        const now = new Date();
        const lastSladesh = userData.lastSladesh ? userData.lastSladesh.toDate() : null;
        const twelveHoursInMillis = 12 * 60 * 60 * 1000;

        if (lastSladesh && (now - lastSladesh) < twelveHoursInMillis) {
          setCanSendSladesh(false);
          setError('You have already used your Sladesh in the last 12 hours.');
        } else {
          setCanSendSladesh(true);
        }
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

    if (beta < -15 && canSendSladesh && !isSending && !lock) {
      lock = true;
      stopGyroscopeMonitoring();
      setTimeout(() => {
        confirmSladesh();
      }, 500); // Delay before calling confirmSladesh
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
      startGyroscopeMonitoring();
    }
  };

  const stopGyroscopeMonitoring = () => {
    window.removeEventListener('deviceorientation', handleGyroscope);
  };

  const sendRequest = async (e) => {
    e.preventDefault();
    if (!canSendSladesh) {
      setError('You have already used your Sladesh in the last 12 hours.');
      return;
    }
    setShowPopup(true);
    requestGyroscopePermission();
  };

  const confirmSladesh = async () => {
    if (isSending) return;
    setIsSending(true);
    setShowPopup(false);

    try {
        setError('');
        setSuccess('');

        if (!user || !user.displayName || !selectedUser) {
            throw new Error("Invalid sender or recipient information");
        }

        const senderDocRef = doc(db, 'users', user.uid);
        const senderDoc = await getDoc(senderDocRef);

        const recipientDocRef = doc(db, 'users', selectedUser.id);
        const recipientDoc = await getDoc(recipientDocRef);

        if (senderDoc.exists() && recipientDoc.exists()) {
            const now = new Date();
            const lastSladesh = senderDoc.data().lastSladesh ? senderDoc.data().lastSladesh.toDate() : null;
            const twelveHoursInMillis = 12 * 60 * 60 * 1000;

            const canIncrement = !lastSladesh || (now - lastSladesh) >= twelveHoursInMillis;

            if (canIncrement) {
                await setDoc(senderDocRef, { lastSladesh: now }, { merge: true });

                // Now create a request after confirming the Sladesh
                createSingleRequest(); 
            } else {
                setError('Sladesh already counted for this session.');
            }
        }
    } catch (error) {
        console.error("Failed to send request:", error);
        setError(error.message || 'Failed to send request. Please try again.');
    } finally {
        setIsSending(false);
    }
  };

  const createSingleRequest = async () => {
    try {
      await createRequest({
        sender: user.displayName,
        recipient: selectedUser.username,
        message: `Sladesh by ${user.displayName}`,
      });
      showConfirmationPopup();
      setSuccess('Sladesh sent successfully!');
    } catch (error) {
      console.error("Failed to create request:", error);
    }
  };

  const showConfirmationPopup = () => {
    setSuccess('Sladesh sent successfully!');
    setShowConfirmation(true);
    setTimeout(() => {
      setShowConfirmation(false);
    }, 3000);
  };

  const toggleUserSelection = (user) => {
    if (!canSendSladesh) {
      setError('You have already used your Sladesh in the last 12 hours.');
      return;
    }

    if (selectedUser && selectedUser.id === user.id) {
      setSelectedUser(null);
    } else {
      setSelectedUser(user);
      setError(''); // Clear any previous error when selecting a new user
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
          disabled={!selectedUser || isSending || !canSendSladesh}
        >
          {isSending ? 'Sending...' : 'Send Sladesh'}
        </button>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
      </form>

      {showConfirmation && (
        <div className="confirmation-popup">
          <img src={ConfirmationIcon} alt="Confirmation" />
        </div>
      )}

      {showPopup && <SladeshPopup />}
    </div>
  );
};

export default RequestForm;
