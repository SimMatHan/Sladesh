import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './Scoreboard.css';

const Scoreboard = () => {
  const [users, setUsers] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchUsers = async () => {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const usersList = [];
    const currentTime = new Date();

    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.checkedIn) { // Only include checked-in users
        const lastSladeshTimestamp = userData.lastSladesh ? new Date(userData.lastSladesh.seconds * 1000) : null;
        const sladeshUsed = lastSladeshTimestamp ? (currentTime - lastSladeshTimestamp) / (1000 * 60 * 60) < 12 : false;

        usersList.push({
          username: userData.username,
          totalDrinks: userData.totalDrinks || 0,
          sladeshCount: userData.sladeshCount || 0, 
          sladeshUsed: sladeshUsed,
          drinks: userData.drinks || { beer: 0, wine: 0, shots: 0, drink: 0 }, // Include drinks data
        });
      }
    });

    // Sort users by totalDrinks in descending order
    usersList.sort((a, b) => b.totalDrinks - a.totalDrinks);

    setUsers(usersList);
  };

  const toggleRow = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="scoreboard-container">
      <h1>Scoreboard</h1>
      <button className="main-button refresh-button" onClick={fetchUsers}>Refresh</button>
      <table className="scoreboard-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Total Drinks</th>
            <th>Amount of Sladesh'ed</th>
            <th>Sladesh Used</th>
            <th></th> {/* Empty header for the arrow */}
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((user, index) => (
              <React.Fragment key={index}>
                <tr onClick={() => toggleRow(index)}>
                  <td>{user.username}</td>
                  <td>{user.totalDrinks}</td>
                  <td>{user.sladeshCount}</td>
                  <td>{user.sladeshUsed ? 'Yes' : 'No'}</td>
                  <td className="arrow-cell">{expandedRow === index ? '▼' : '▶'}</td>
                </tr>
                {expandedRow === index && (
                  <tr className="expanded-row">
                    <td colSpan="5">
                      <div className="details-container">
                        <p>Beer: <strong>{user.drinks.beer}</strong></p>
                        <p>Wine: <strong>{user.drinks.wine}</strong></p>
                        <p>Shots: <strong>{user.drinks.shots}</strong></p>
                        <p>Drinks: <strong>{user.drinks.drink}</strong></p>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))
          ) : (
            <tr>
              <td colSpan="5">No users checked in</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Scoreboard;
