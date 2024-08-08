import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './Scoreboard.css';

const Scoreboard = () => {
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const usersList = [];
    const currentTime = new Date();

    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      console.log('User Data:', userData); // Debug log
      if (userData.checkedIn) { // Only include checked-in users
        const lastSladeshTimestamp = userData.lastSladesh ? new Date(userData.lastSladesh.seconds * 1000) : null;
        const sladeshUsed = lastSladeshTimestamp ? (currentTime - lastSladeshTimestamp) / (1000 * 60 * 60) < 12 : false;

        usersList.push({
          username: userData.username,
          totalDrinks: userData.totalDrinks || 0,
          sladeshCount: userData.sladeshCount || 0,
          sladeshUsed: sladeshUsed,
        });
      }
    });

    console.log('Users List before sorting:', usersList); // Debug log

    // Sort users by totalDrinks in descending order
    usersList.sort((a, b) => b.totalDrinks - a.totalDrinks);

    console.log('Users List after sorting:', usersList); // Debug log
    setUsers(usersList);
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
            <th>Amout of Sladesh'ed</th>
            <th>Sladesh Used</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((user, index) => (
              <tr key={index}>
                <td>{user.username}</td>
                <td>{user.totalDrinks}</td>
                <td>{user.sladeshCount}</td>
                <td>{user.sladeshUsed ? 'Yes' : 'No'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">No users checked in</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Scoreboard;
