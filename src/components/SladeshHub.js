import React, { useState, useEffect } from 'react';
import { getRequests } from '../services/requestService';
import './SladeshHub.css';
import mrlahey from '../assets/mrlahey.gif';

const SladeshHub = ({ user, onViewed, onNewRequests }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('received');
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const fetchedRequests = await getRequests(user.displayName || user.uid, view); // Pass the view as type
        setRequests(fetchedRequests);
        onNewRequests(fetchedRequests.length); // Indicate the number of new requests immediately
      } catch (error) {
        console.error("Failed to fetch requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user, onNewRequests, view]);

  useEffect(() => {
    onViewed(); // Mark as viewed when the user enters the hub
  }, [onViewed]);

  const handleToggleView = (selectedView) => {
    if (view !== selectedView) {
      setTransitioning(true);
      setTimeout(() => {
        setView(selectedView);
        setTransitioning(false);
      }, 500); // Duration of the transition
    }
  };

  const renderRequests = () => {
    if (loading) {
      return <div className="loading-indicator">Loading requests...</div>;
    }

    if (view === 'received' && requests.length === 0) {
      return <p className="no-requests-message">You're safe! No Sladesh for you at the moment.</p>;
    }

    if (view === 'sent' && requests.length === 0) {
      return <p className="no-requests-message">You have not sent any yet, come on maaan!</p>;
    }

    return (
      <ul className={`${view === 'sent' ? 'sent-list' : 'request-list'}`}>
        {requests.map((request, index) => (
          <li key={index} className={`${view === 'sent' ? 'sent-item' : 'request-item'}`}>
            {view === 'received' ? (
              <>
                <img src={mrlahey} alt="Mr. Lahey" className="request-gif" />
                <p>{request.message}</p>
              </>
            ) : (
              <p>Sent to {request.recipient}</p>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="sladesh-hub-container">
      <div className="toggle-container">
        <button
          className={`toggle-button ${view === 'received' ? 'active' : ''}`}
          onClick={() => handleToggleView('received')}
        >
          Received
        </button>
        <button
          className={`toggle-button ${view === 'sent' ? 'active' : ''}`}
          onClick={() => handleToggleView('sent')}
        >
          Sent
        </button>
      </div>

      <div className={`request-list-container ${transitioning ? 'hidden' : 'visible'}`}>
        <h2>{view === 'received' ? 'Any Sladesh for you?!' : 'Sladesh you have sent!'}</h2>
        {renderRequests()}
      </div>
    </div>
  );
};

export default SladeshHub;