import React, { useState, useEffect } from 'react';
import { getRequests, updateRequestStatus } from '../services/requestService';
import './SladeshHub.css';

const SladeshHub = ({ user, onViewed, onNewRequests }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('received');
  const [transitioning, setTransitioning] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let isMounted = true; // track if the component is still mounted
  
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const fetchedRequests = await getRequests(user.displayName || user.uid, view);
        if (isMounted) {  // Only update state if the component is still mounted
          setRequests(fetchedRequests);
          onNewRequests(fetchedRequests.length);
        }
      } catch (error) {
        console.error("Failed to fetch requests:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
  
    fetchRequests();
    onViewed(); // Mark as viewed when the user enters the hub
  
    return () => {
      isMounted = false; // Clean up the effect
    };
  }, [user, view]);  // Dependencies remain the same

  const handleToggleView = (selectedView) => {
    if (view !== selectedView) {
      setTransitioning(true);
      setTimeout(() => {
        setView(selectedView);
        setTransitioning(false);
      }, 500); 
    }
  };

  const confirmCompletion = async (requestId) => {
    try {
      await updateRequestStatus(requestId, { status: 'confirmed', confirmedByRecipient: true });
      setSuccess('Sladesh confirmed!');
      
      // Automatically clear the success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
      const updatedRequests = await getRequests(user.displayName || user.uid, view);
      setRequests(updatedRequests);
    } catch (error) {
      console.error("Failed to confirm Sladesh:", error);
    }
  };

  const renderRequests = () => {
    if (loading) return <div className="loading-indicator">Loading requests...</div>;
  
    if (requests.length === 0) return <p className="no-requests-message">No Sladesh available.</p>;
  
    return (
      <ul className={`${view === 'sent' ? 'sent-list' : 'request-list'}`}>
        {requests.map((request, index) => (
          <li key={index} className={`request-item ${request.status === 'confirmed' && view === 'sent' ? 'completed' : ''}`}>
            {view === 'received' ? (
              <>
                <p>{request.message}</p>
                {user.displayName === request.recipient && (
                  <>
                    {request.status === 'completed' && !request.confirmedByRecipient ? (
                      <button onClick={() => confirmCompletion(request.id)} className="confirm-button">Confirm</button>
                    ) : (
                      <button disabled className="completed-button">Completed</button> // Disabled button for confirmed requests
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                <p>Sent Sladesh to {request.recipient}</p>
                {request.status === 'completed' && !request.confirmedByRecipient && (
                  <p className="waiting-message">Waiting on confirmation from {request.recipient}</p>
                )}
                {request.confirmedByRecipient && (
                  <p className="confirmation-message">{request.recipient} has completed the Sladesh</p>
                )}
              </>
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

      {success && <p className="success-message">{success}</p>}
    </div>
  );
};

export default SladeshHub;
