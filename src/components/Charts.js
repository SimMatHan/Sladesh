import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore'; // Removed getDocs
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

  // Mapping for month numbers to names
  const monthNames = {
    '01': 'January',
    '02': 'February',
    '03': 'March',
    '04': 'April',
    '05': 'May',
    '06': 'June',
    '07': 'July',
    '08': 'August',
    '09': 'September',
    '10': 'October',
    '11': 'November',
    '12': 'December',
  };

  // Convert 'YYYY-MM' to 'MonthName YYYY'
  const formatMonthYear = (monthYear) => {
    if (monthYear === 'overall') return 'Overall';
    const [year, month] = monthYear.split('-');
    return `${monthNames[month]} ${year}`;
  };

  // Fetch available months for dropdown
  const fetchAvailableMonths = async () => {
    try {
      const monthsSnapshot = await getDoc(doc(db, 'statistics', 'totalDrinks'));
      const monthsList = Object.keys(monthsSnapshot.data() || {});

      // Ensure "Overall" is always included and at the top
      const uniqueMonthsList = Array.from(new Set(['overall', ...monthsList]));
      
      // Sort months to have "Overall" first and the rest in chronological order
      uniqueMonthsList.sort((a, b) => (a === 'overall' ? -1 : b === 'overall' ? 1 : a.localeCompare(b)));

      setAvailableMonths(uniqueMonthsList);
    } catch (error) {
      console.error("Error fetching months: ", error);
    }
  };

  const fetchTopUsers = async (monthYear) => {
    try {
      const topUsersRef = doc(db, 'statistics', 'topUsers');
      const topUsersDoc = await getDoc(topUsersRef);

      if (topUsersDoc.exists()) {
        const topUsersData = topUsersDoc.data()[monthYear];
        if (topUsersData) {
          setTopUsers([topUsersData.topOne, topUsersData.topTwo, topUsersData.topThree]);
        } else {
          setTopUsers([]); // Clear the data if no record is found
        }
      } else {
        console.log("No top users data for the selected period!");
        setTopUsers([]);
      }
    } catch (error) {
      console.error("Error fetching top users: ", error);
    }
  };

  const fetchDrinkData = async (monthYear) => {
    try {
      const drinkDataRef = doc(db, 'statistics', 'totalDrinks');
      const drinkDataDoc = await getDoc(drinkDataRef);

      if (drinkDataDoc.exists()) {
        const drinkData = drinkDataDoc.data()[monthYear];
        if (drinkData) {
          setDrinkData(drinkData);
        } else {
          setDrinkData({ beer: 0, wine: 0, shots: 0, drinks: 0 });
        }
      } else {
        console.log("No such document for selected period!");
        setDrinkData({ beer: 0, wine: 0, shots: 0, drinks: 0 });
      }

      const sladeshedRef = doc(db, 'statistics', 'mostSladeshedUser');
      const sladeshedSnap = await getDoc(sladeshedRef);
      const sladeshedData = sladeshedSnap.data()[monthYear];

      if (sladeshedData) {
        setMostSladeshedUser(sladeshedData);
      } else {
        setMostSladeshedUser({});
      }

      const checkedInRef = doc(db, 'statistics', 'mostCheckedInUser');
      const checkedInSnap = await getDoc(checkedInRef);
      const checkedInData = checkedInSnap.data()[monthYear];

      if (checkedInData) {
        setMostCheckedInUser(checkedInData);
      } else {
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
          {availableMonths.map(month => (
            <option key={month} value={month}>{formatMonthYear(month)}</option>
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
