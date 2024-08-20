import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import './Charts.css'; // Import the CSS file

// Register the components with Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

const Charts = () => {
  const [topUsers, setTopUsers] = useState([]);
  const [drinkData, setDrinkData] = useState({ beer: 0, wine: 0, shots: 0, drinks: 0 });
  const [mostSladeshedUser, setMostSladeshedUser] = useState({});
  const [mostCheckedInUser, setMostCheckedInUser] = useState({});

  const fetchTopUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersList = [];

      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.highestDrinksIn12Hours) {
          usersList.push({
            username: userData.username,
            highestDrinksIn12Hours: userData.highestDrinksIn12Hours,
          });
        }
      });

      // Sort users by highestDrinksIn12Hours in descending order
      usersList.sort((a, b) => b.highestDrinksIn12Hours - a.highestDrinksIn12Hours);

      // Get the top 3 users
      const topThree = usersList.slice(0, 3);
      setTopUsers(topThree);
    } catch (error) {
      console.error("Error fetching top users: ", error);
    }
  };

  const fetchDrinkData = async () => {
    try {
      const docRef = doc(db, 'statistics', 'totalDrinks');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        console.log("Fetched drink data:", docSnap.data()); // Log the fetched data
        setDrinkData(docSnap.data());
      } else {
        console.log("No such document for totalDrinks!");
      }

      const sladeshedRef = doc(db, 'statistics', 'mostSladeshedUser');
      const sladeshedSnap = await getDoc(sladeshedRef);

      if (sladeshedSnap.exists()) {
        console.log("Fetched most Sladeshed User:", sladeshedSnap.data()); // Log the fetched data
        setMostSladeshedUser(sladeshedSnap.data());
      } else {
        console.log("No such document for mostSladeshedUser!");
      }

      const checkedInRef = doc(db, 'statistics', 'mostCheckedInUser');
      const checkedInSnap = await getDoc(checkedInRef);

      if (checkedInSnap.exists()) {
        console.log("Fetched most Checked-In User:", checkedInSnap.data()); // Log the fetched data
        setMostCheckedInUser(checkedInSnap.data());
      } else {
        console.log("No such document for mostCheckedInUser!");
      }
    } catch (error) {
      console.error("Error fetching drink data: ", error);
    }
  };

  useEffect(() => {
    fetchTopUsers();
    fetchDrinkData();
  }, []);

  const data = {
    labels: ['Beer', 'Wine', 'Shots', 'Drinks'],
    datasets: [
      {
        data: [drinkData.beer, drinkData.wine, drinkData.shots, drinkData.drinks],
        backgroundColor: [
          '#d3d2c1', 
          '#87643d', 
          '#d4e653', 
          '#c0c0c0'
        ],
        hoverBackgroundColor: [
          '#d3d2c1', 
          '#87643d', 
          '#d4e653', 
          '#c0c0c0'
        ],
      },
    ],
  };

  return (
    <div className="charts-container">
      <h1 className="charts-heading">Top 3 Drinkers in the Last 12 Hours</h1>
      <div className="podium">
        <div className="podium-block second">
          {topUsers[1] && (
            <>
              <div className="podium-text">{topUsers[1].username}</div>
              <div className="podium-score">{topUsers[1].highestDrinksIn12Hours} drinks</div>
            </>
          )}
        </div>
        <div className="podium-block first">
          {topUsers[0] && (
            <>
              <div className="podium-text">{topUsers[0].username}</div>
              <div className="podium-score">{topUsers[0].highestDrinksIn12Hours} drinks</div>
            </>
          )}
        </div>
        <div className="podium-block third">
          {topUsers[2] && (
            <>
              <div className="podium-text">{topUsers[2].username}</div>
              <div className="podium-score">{topUsers[2].highestDrinksIn12Hours} drinks</div>
            </>
          )}
        </div>
      </div>
      <div className="pie-chart-container">
        <h2 className="pie-chart-heading">Beverage Breakdown</h2>
        <Pie data={data} />
      </div>
    </div>
  );
};

export default Charts;
