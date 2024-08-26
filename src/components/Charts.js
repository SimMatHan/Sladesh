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
  const [selectedMonth, setSelectedMonth] = useState('overall');
  const [availableMonths, setAvailableMonths] = useState([]);

  // Fetch available months for dropdown
  const fetchAvailableMonths = async () => {
    try {
      const monthsSnapshot = await getDocs(collection(db, 'statistics/totalDrinks'));
      const monthsList = [];
      
      monthsSnapshot.forEach((doc) => {
        monthsList.push(doc.id);  // Assuming the doc IDs are in the format 'YYYY-MM'
      });

      // Ensure that "2024-08" is always included
      if (!monthsList.includes('2024-08')) {
        monthsList.push('2024-08');
      }

      setAvailableMonths(monthsList);
    } catch (error) {
      console.error("Error fetching months: ", error);
    }
  };

  const fetchTopUsers = async (monthYear) => {
    try {
      let docRef;
      if (monthYear === 'overall') {
        docRef = doc(db, 'statistics', 'topUsers/overall');
      } else {
        docRef = doc(db, 'statistics', `topUsers/${monthYear}`);
      }

      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setTopUsers(docSnap.data().topThree);
      } else {
        console.log("No top users data for the selected period!");
        setTopUsers([]);  // Clear the data if no record is found
      }
    } catch (error) {
      console.error("Error fetching top users: ", error);
    }
  };

  const fetchDrinkData = async (monthYear) => {
    try {
      let docRef;
      if (monthYear === 'overall') {
        docRef = doc(db, 'statistics', 'totalDrinks');
      } else {
        docRef = doc(db, 'statistics', `totalDrinks/${monthYear}`);
      }

      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        console.log("Fetched drink data:", docSnap.data()); // Log the fetched data
        setDrinkData(docSnap.data());
      } else {
        console.log("No such document for selected period!");
      }

      const sladeshedRef = doc(db, 'statistics', `mostSladeshedUser/${monthYear}`);
      const sladeshedSnap = await getDoc(sladeshedRef);

      if (sladeshedSnap.exists()) {
        console.log("Fetched most Sladeshed User:", sladeshedSnap.data()); // Log the fetched data
        setMostSladeshedUser(sladeshedSnap.data());
      } else {
        console.log("No such document for mostSladeshedUser in selected period!");
        setMostSladeshedUser({});
      }

      const checkedInRef = doc(db, 'statistics', `mostCheckedInUser/${monthYear}`);
      const checkedInSnap = await getDoc(checkedInRef);

      if (checkedInSnap.exists()) {
        console.log("Fetched most Checked-In User:", checkedInSnap.data()); // Log the fetched data
        setMostCheckedInUser(checkedInSnap.data());
      } else {
        console.log("No such document for mostCheckedInUser in selected period!");
        setMostCheckedInUser({});
      }
    } catch (error) {
      console.error("Error fetching drink data: ", error);
    }
  };

  useEffect(() => {
    fetchAvailableMonths(); // Fetch available months
    fetchTopUsers(selectedMonth); // Fetch top users based on selected month
    fetchDrinkData(selectedMonth); // Fetch drink data based on selected month
  }, [selectedMonth]);

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
      <div className="filter-container">
        <label htmlFor="month-select">Filter by Month:</label>
        <select id="month-select" onChange={(e) => setSelectedMonth(e.target.value)}>
          <option value="overall">Overall</option>
          {availableMonths.map(month => (
            <option key={month} value={month}>{month}</option>
          ))}
        </select>
      </div>

      <h1 className="charts-heading">Top 3 Drinkers</h1>
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

      <div className="statistics-cards">
        <div className="statistics-card">
          <h3>Most Sladeshed User</h3>
          <p>{mostSladeshedUser.username || 'Loading...'}</p>
          <p>{`${mostSladeshedUser.totalSladeshes || ''}`}</p> {/* Display total sladeshes */}
        </div>
        <div className="statistics-card">
          <h3>Most Checked-In User</h3>
          <p>{mostCheckedInUser.username || 'Loading...'}</p>
          <p>{`${mostCheckedInUser.totalCheckIns || ''}`}</p> {/* Display total check-ins */}
        </div>
      </div>
    </div>
  );
};

export default Charts;
