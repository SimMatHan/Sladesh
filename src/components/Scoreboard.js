import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './Scoreboard.css';

const Scoreboard = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersList = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.checkedIn) { // Only include checked-in users
          usersList.push({
            username: userData.username,
            totalDrinks: userData.totalDrinks || 0,
            sladeshCount: userData.sladeshCount || 0,
          });
        }
      });
      setUsers(usersList);
    };

    fetchUsers();
  }, []);

  return (
    <div className="scoreboard-container">
      <h1>Scoreboard</h1>
      <table className="scoreboard-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Total Drinks</th>
            <th>Amount of Sladesh'es</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, index) => (
            <tr key={index}>
              <td>{user.username}</td>
              <td>{user.totalDrinks}</td>
              <td>{user.sladeshCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Scoreboard;
