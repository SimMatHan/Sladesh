import React, { useState, useEffect } from 'react';
import { createRequest, getRequests, getUsers } from '../services/requestService';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './RequestForm.css'; // Import the CSS file

const RequestForm = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const fetchedRequests = await getRequests(user.displayName || user.uid);
        setRequests(fetchedRequests);
      } catch (error) {
        console.error("Failed to fetch requests:", error);
      }
    };

    const fetchUsers = async () => {
      try {
        const fetchedUsers = await getUsers();
        console.log("Fetched users:", fetchedUsers);
        // Filter out the current user
        const filteredUsers = fetchedUsers.filter(u => u.username !== user.displayName);
        setUsers(filteredUsers);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
    fetchUsers();
  }, [user]);

  const sendRequest = async (e) => {
    e.preventDefault();
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

        const message = `You have been sladesh'ed by ${user.displayName}`;
        await createRequest({ sender: user, recipient: selectedUser.username, message });

        await setDoc(userDocRef, { lastSladesh: now }, { merge: true });

        setSuccess('Sladesh sent successfully!');
        setSelectedUser(null);
        const fetchedRequests = await getRequests(user.displayName);
        setRequests(fetchedRequests);
      } else {
        throw new Error("User document does not exist");
      }
    } catch (error) {
      console.error("Failed to send request:", error);
      setError('Failed to send request. Please try again.');
    }
  };

  const toggleUserSelection = (user) => {
    if (selectedUser && selectedUser.id === user.id) {
      setSelectedUser(null);
    } else {
      setSelectedUser(user);
    }
  };

  return (
    <div className="request-form-container">
      <form onSubmit={sendRequest} className="request-form">
        {loading ? (
          <div className="loading-indicator">Loading users...</div>
        ) : (
          <>
            <div className="user-cards-container">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={`user-card ${selectedUser && selectedUser.id === user.id ? 'selected' : ''}`}
                  onClick={() => toggleUserSelection(user)}
                >
                  <div className="user-info">
                    <h3>{user.username}</h3>
                  </div>
                </div>
              ))}
            </div>
            <button type="submit" className="form-button" disabled={!selectedUser}>Send Sladesh</button>
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}
          </>
        )}
      </form>
      <div className="request-list-container">
        <h2>Any Sladesh for you?!</h2>
        {requests.length === 0 ? (
          <p className="no-requests-message">You're safe! No Sladesh for you at the moment.</p>
        ) : (
          <ul className="request-list">
            {requests.map((request, index) => (
              <li key={index} className="request-item">
                {request.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RequestForm;
