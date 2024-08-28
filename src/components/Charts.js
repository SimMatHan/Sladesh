import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import './Charts.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const Charts = () => {
  const [topUsers, setTopUsers] = useState([]);
  const [drinkData, setDrinkData] = useState({ beer: 0, wine: 0, shots: 0, drinks: 0 });
  const [mostSladeshedUser, setMostSladeshedUser] = useState({});
  const [mostCheckedInUser, setMostCheckedInUser] = useState({});
  const [selectedMonth, setSelectedMonth] = useState('overall');
  const [availableMonths, setAvailableMonths] = useState([]);

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

  const formatMonthYear = (monthYear) => {
    if (monthYear === 'overall') return 'Overall';
    const [year, month] = monthYear.split('-');
    return `${monthNames[month]} ${year}`;
  };

  const fetchAvailableMonths = async () => {
    try {
      const monthsSnapshot = await getDoc(doc(db, 'statistics', 'totalDrinks'));
      const monthsList = Object.keys(monthsSnapshot.data() || {});

      const uniqueMonthsList = Array.from(new Set(['overall', ...monthsList]));
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
          setTopUsers([]);
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
    fetchAvailableMonths();
    fetchTopUsers(selectedMonth);
    fetchDrinkData(selectedMonth);
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
        borderWidth: 5,
      },
    ],
  };

  const options = {
    cutout: '70%', // This makes it a donut chart
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += `${context.parsed} drinks`;
            }
            return label;
          }
        }
      },
      legend: {
        display: false, // Disable the legend
      },
      beforeDraw: (chart) => {
        const { ctx, chartArea: { width, height } } = chart;
        ctx.save();

        const totalDrinks = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
        const data = chart.data.datasets[0].data;
        const maxIndex = data.indexOf(Math.max(...data));
        const percentage = `${Math.round((data[maxIndex] / totalDrinks) * 100)}%`;
        const label = chart.data.labels[maxIndex];

        // Draw the number of drinks
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillStyle = '#000';
        ctx.fillText(`${data[maxIndex]} ${label}`, width / 2, height / 2 - 10);

        // Draw the percentage
        ctx.font = '16px sans-serif';
        ctx.fillText(percentage, width / 2, height / 2 + 10);

        ctx.restore();
      },
    },
  };

  return (
    <div className="charts-container">
      <div className="filter-container">
        <select id="month-select" onChange={(e) => setSelectedMonth(e.target.value)}>
          {availableMonths.map(month => (
            <option key={month} value={month}>{formatMonthYear(month)}</option>
          ))}
        </select>
      </div>

      <h1 className="charts-heading">
        Top 3 Drinkers {selectedMonth === 'overall' ? 'Overall' : `in ${formatMonthYear(selectedMonth)}`}
      </h1>

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
        <Doughnut data={data} options={options} />
      </div>

      <div className="statistics-cards">
        <div className="statistics-card">
          <h3>Most Sladeshed User</h3>
          <p>{mostSladeshedUser.username || 'Loading...'}</p>
          <p>{`${mostSladeshedUser.totalSladeshes || ''}`}</p>
        </div>
        <div className="statistics-card">
          <h3>Most Checked-In User</h3>
          <p>{mostCheckedInUser.username || 'Loading...'}</p>
          <p>{`${mostCheckedInUser.totalCheckIns || ''}`}</p>
        </div>
      </div>
    </div>
  );
};

export default Charts;
