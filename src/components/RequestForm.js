import React, { useState, useEffect } from 'react';
import { createRequest, getRequests, getUsers } from '../services/requestService';
import './RequestForm.css'; // Import the CSS file

const RequestForm = ({ user }) => {
  const [recipient, setRecipient] = useState('');
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);

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
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };

    fetchRequests();
    fetchUsers();
  }, [user]);

  const sendRequest = async (e) => {
    e.preventDefault();
    try {
      if (!user || !user.displayName) {
        throw new Error("Invalid sender information");
      }

      const message = `You have been sladesh'ed by ${user.displayName}`;

      await createRequest({ sender: user, recipient, message });
      setRecipient('');
      const fetchedRequests = await getRequests(user.displayName);
      setRequests(fetchedRequests);
    } catch (error) {
      console.error("Failed to send request:", error);
    }
  };

  return (
    <div className="request-form-container">
      <form onSubmit={sendRequest} className="request-form">
        <label className="form-label">
          Select a user:
          <select
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="form-select"
          >
            <option value="">Select a user</option>
            {users.map((user) => (
              <option key={user.id} value={user.username}>
                {user.username}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="form-button">Send Sladesh</button>
      </form>
      <div className="request-list-container">
        <h2>Requests</h2>
        <ul className="request-list">
          {requests.map((request, index) => (
            <li key={index} className="request-item">
              {request.message}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default RequestForm;
