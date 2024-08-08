import React, { useState, useEffect } from 'react';
import { getRequests } from '../services/requestService';
import './SladeshHub.css';
import mrlahey from '../assets/mrlahey.gif';

const SladeshHub = ({ user, onViewed, onNewRequests }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const fetchedRequests = await getRequests(user.displayName || user.uid);
        setRequests(fetchedRequests);
        onNewRequests(fetchedRequests.length); // Indicate the number of new requests immediately
      } catch (error) {
        console.error("Failed to fetch requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user, onNewRequests]);

  useEffect(() => {
    onViewed(); // Mark as viewed when the user enters the hub
  }, [onViewed]);

  return (
    <div className="sladesh-hub-container">
      <div className="request-list-container">
        <h2>Any Sladesh for you?!</h2>
        {loading ? (
          <div className="loading-indicator">Loading requests...</div>
        ) : requests.length === 0 ? (
          <p className="no-requests-message">You're safe! No Sladesh for you at the moment.</p>
        ) : (
          <ul className="request-list">
            {requests.map((request, index) => (
              <li key={index} className="request-item">
                <img src={mrlahey} alt="Mr. Lahey" className="request-gif" />
                <p>{request.message}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SladeshHub;
