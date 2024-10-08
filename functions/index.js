const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin SDK
admin.initializeApp();

const db = getFirestore();

// Function to reset Sladesh count daily
exports.resetSladeshCount = functions.pubsub.schedule('0 0 * * *') // Every day at midnight
  .timeZone('Europe/Copenhagen')
  .onRun(async (context) => {
    const usersSnapshot = await db.collection('users').get();

    const batch = db.batch();

    usersSnapshot.forEach(doc => {
      batch.update(doc.ref, { sladeshCount: 0 });
    });

    await batch.commit();
    console.log('Reset Sladesh count for all users.');
    return null;
  });

// Function to reset check-in status daily
exports.resetCheckInStatus = functions.pubsub.schedule('0 0 * * *') // Every day at midnight
  .timeZone('Europe/Copenhagen')
  .onRun(async (context) => {
    const usersSnapshot = await db.collection('users').get();

    const batch = db.batch();
    usersSnapshot.forEach(doc => {
      batch.update(doc.ref, { checkedIn: false });
    });

    await batch.commit();
    console.log('Reset check-in status for all users.');
    return null;
  });

// Function to delete old requests older than 12 hours
exports.deleteOldRequests = functions.pubsub.schedule('0 0,12 * * *') // Runs twice a day at midnight and noon
  .timeZone('Europe/Copenhagen')
  .onRun(async (context) => {
    try {
      const twelveHoursAgo = admin.firestore.Timestamp.fromDate(
        new Date(Date.now() - 12 * 60 * 60 * 1000)
      );

      console.log('Current time:', new Date().toISOString());
      console.log('Twelve hours ago:', twelveHoursAgo.toDate().toISOString());

      // Fetch documents older than 12 hours
      const snapshot = await db.collection('requests')
        .where('createdAt', '<', twelveHoursAgo)
        .get();

      if (snapshot.empty) {
        console.log('No old requests to delete.');
        return null;
      }

      console.log(`Found ${snapshot.size} requests older than 12 hours.`);

      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        console.log(`Deleting request with ID: ${doc.id}, created at: ${doc.data().createdAt.toDate().toISOString()}`);
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Deleted ${snapshot.size} old requests.`);
      return null;
    } catch (error) {
      console.error('Error deleting old requests:', error);
      if (error.message.includes("no matching index found")) {
        console.error("Firestore may require a composite index for this query. Check the Firestore console for suggested indexes.");
      }
      return null;
    }
  });

// Function to list all users (for your listUsers function)
exports.listUsers = functions.https.onCall(async (data, context) => {
  const usersRef = db.collection('users');
  const querySnapshot = await usersRef.get();

  const users = [];
  querySnapshot.forEach(doc => {
    users.push({ id: doc.id, ...doc.data() });
  });

  return users;
});

// Function to update the highest drinks in 12 hours
exports.updateHighestDrinksIn12Hours = functions.pubsub.schedule('0 0,12 * * *')
  .timeZone('Europe/Copenhagen')
  .onRun(async (context) => {
    const usersSnapshot = await db.collection('users').get();

    const batch = db.batch();
    const now = new Date();

    usersSnapshot.forEach(doc => {
      const data = doc.data();
      const lastReset = data.lastSladesh ? data.lastSladesh.toDate() : new Date(now.getTime() - 12 * 60 * 60 * 1000);
      const timeSinceLastReset = now.getTime() - lastReset.getTime();
      const isWithin12Hours = timeSinceLastReset <= 12 * 60 * 60 * 1000;

      if (isWithin12Hours) {
        if (!data.highestDrinksIn12Hours || data.totalDrinks > data.highestDrinksIn12Hours) {
          batch.update(doc.ref, { highestDrinksIn12Hours: data.totalDrinks });
        }
      }
    });

    await batch.commit();
    console.log('Updated highest drinks in 12 hours for all users.');
    return null;
  });

// Function to aggregate beverage data and reset the drink counts daily
exports.aggregateBeverageData = functions.pubsub.schedule('00 11 * * *') // Run every day at 09:45 AM
  .timeZone('Europe/Copenhagen')
  .onRun(async (context) => {
    try {
      const usersSnapshot = await db.collection('users').get();

      let totalBeer = 0;
      let totalWine = 0;
      let totalShots = 0;
      let totalDrinks = 0;

      // Calculate the totals for the day
      usersSnapshot.forEach(doc => {
        const data = doc.data();

        totalBeer += data.drinks?.beer || 0;
        totalWine += data.drinks?.wine || 0;
        totalShots += data.drinks?.shots || 0;
        totalDrinks += data.drinks?.drink || 0;
      });

      const now = new Date();
      const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      console.log(`Aggregating data for: ${monthYear}`);

      // Save monthly data as a map inside totalDrinks
      const statsRef = db.doc('statistics/totalDrinks');
      const statsDoc = await statsRef.get();

      let totalDrinksData = {
        [monthYear]: {
          beer: totalBeer,
          wine: totalWine,
          shots: totalShots,
          drinks: totalDrinks,
        }
      };

      if (statsDoc.exists) {
        const statsData = statsDoc.data();
        // Accumulate the data for the current month
        const previousMonthData = statsData[monthYear] || { beer: 0, wine: 0, shots: 0, drinks: 0 };

        totalDrinksData = {
          ...statsData,
          [monthYear]: {
            beer: previousMonthData.beer + totalBeer,
            wine: previousMonthData.wine + totalWine,
            shots: previousMonthData.shots + totalShots,
            drinks: previousMonthData.drinks + totalDrinks,
          }
        };
      }

      await statsRef.set(totalDrinksData, { merge: true });
      console.log(`Updated monthly totals for ${monthYear}`);

      // Update the overall totals
      let overallBeer = totalBeer;
      let overallWine = totalWine;
      let overallShots = totalShots;
      let overallDrinks = totalDrinks;

      if (statsDoc.exists) {
        const statsData = statsDoc.data();
        overallBeer += statsData.overall?.beer || 0;
        overallWine += statsData.overall?.wine || 0;
        overallShots += statsData.overall?.shots || 0;
        overallDrinks += statsData.overall?.drinks || 0;
      }

      await statsRef.set({
        overall: {
          beer: overallBeer,
          wine: overallWine,
          shots: overallShots,
          drinks: overallDrinks,
        }
      }, { merge: true });
      console.log('Updated overall totals');

      // Reset each user's drinks and totalDrinks
      const batch = db.batch();
      usersSnapshot.forEach(doc => {
        batch.update(doc.ref, {
          drinks: { beer: 0, wine: 0, shots: 0, drink: 0 },
          totalDrinks: 0
        });
      });

      await batch.commit();
      console.log('Reset all users\' drink counts to zero.');

      return null;
    } catch (error) {
      console.error('Error in aggregateBeverageData function:', error);
      return null;
    }
  });

// Function to update the most sladeshed user daily at 10:05 AM
exports.updateMostSladeshedUser = functions.pubsub.schedule('5 0 * * *') // Runs every day at 10:05 AM
  .timeZone('Europe/Copenhagen')
  .onRun(async (context) => {
    const usersSnapshot = await db.collection('users').get();

    let mostSladeshedUserThisMonth = { username: '', totalSladeshes: 0 };
    let overallMostSladeshedUser = { username: '', totalSladeshes: 0 };

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const monthYear = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    // Use Promise.all to handle async operations in parallel
    const userPromises = usersSnapshot.docs.map(async (doc) => {
      const data = doc.data();

      // Ensure that totalSladeshes and sladeshesAtStartOfMonth are initialized
      const totalSladeshes = data.totalSladeshes ?? 0;
      let sladeshesAtStartOfMonth = data.sladeshesAtStartOfMonth ?? totalSladeshes;

      // If it's a new month, reset sladeshesAtStartOfMonth
      const lastSladeshDate = data.lastSladesh ? data.lastSladesh.toDate() : new Date();
      if (lastSladeshDate.getMonth() + 1 !== currentMonth || lastSladeshDate.getFullYear() !== currentYear) {
        // Reset sladeshesAtStartOfMonth for the new month
        sladeshesAtStartOfMonth = totalSladeshes;
        await doc.ref.update({ sladeshesAtStartOfMonth: totalSladeshes });
      }

      // Set the current month's sladeshes from sladeshesAtStartOfMonth
      const sladeshesThisMonth = sladeshesAtStartOfMonth;

      // Update most sladeshed user for this month
      if (sladeshesThisMonth > mostSladeshedUserThisMonth.totalSladeshes) {
        mostSladeshedUserThisMonth = {
          username: data.username,
          totalSladeshes: sladeshesThisMonth
        };
      }

      // Update overall most sladeshed user
      if (totalSladeshes > overallMostSladeshedUser.totalSladeshes) {
        overallMostSladeshedUser = {
          username: data.username,
          totalSladeshes: totalSladeshes
        };
      }
    });

    // Wait for all user updates to complete
    await Promise.all(userPromises);

    // Store the most sladeshed user and totals for the current month in Firestore
    const mostSladeshedUserRef = db.collection('statistics').doc('mostSladeshedUser');
    await mostSladeshedUserRef.set({
      [monthYear]: {
        totalSladeshes: mostSladeshedUserThisMonth.totalSladeshes, // Current month sladeshes
        username: mostSladeshedUserThisMonth.username
      },
      overall: {
        totalSladeshes: overallMostSladeshedUser.totalSladeshes,  // Overall sladeshes
        username: overallMostSladeshedUser.username
      }
    }, { merge: true });

    console.log('Updated most sladeshed user for the month:', monthYear);
    console.log('Updated overall most sladeshed user:', overallMostSladeshedUser);
    return null;
  });


// Function to increment sladesh count on sladesh creation and update total sladeshes
exports.incrementSladeshCount = functions.firestore
  .document('requests/{requestId}')
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    const recipientUsername = data.recipient;

    // Get the user's document
    const userRef = db.collection('users').where('username', '==', recipientUsername);
    const userSnapshot = await userRef.get();

    if (!userSnapshot.empty) {
      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();

      // Increment the daily sladeshCount field
      const newSladeshCount = (userData.sladeshCount || 0) + 1;
      // Increment the totalSladeshes field
      const newTotalSladeshes = (userData.totalSladeshes || 0) + 1;

      await userDoc.ref.update({
        sladeshCount: newSladeshCount,
        totalSladeshes: newTotalSladeshes
      });

      // Optionally, update the status of the Sladesh request to 'completed'
      await snapshot.ref.update({
        status: 'completed'  // Set status to 'completed' or 'pending'
      });

      console.log(`Incremented sladesh count for user: ${recipientUsername} to ${newSladeshCount}`);
      console.log(`Incremented total sladeshes for user: ${recipientUsername} to ${newTotalSladeshes}`);
      console.log(`Updated request status to 'completed' for requestId: ${context.params.requestId}`);
    } else {
      console.log(`No user found with username: ${recipientUsername}`);
    }
    return null;
  });

// Function to increment check-in count on user check-in
exports.incrementCheckInCount = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Check if the checkedIn status changed from false to true
    if (!before.checkedIn && after.checkedIn) {
      const newCheckInCount = (after.checkInCount || 0) + 1;
      await change.after.ref.update({ checkInCount: newCheckInCount });

      console.log(`Incremented check-in count for user: ${after.username} to ${newCheckInCount}`);
    }
    return null;
  });

// Function to update the most checked-in user daily at 10:05 AM
exports.updateMostCheckedInUser = functions.pubsub.schedule('5 0 * * *') // Runs every day at 10:05 AM
.timeZone('Europe/Copenhagen')
.onRun(async (context) => {
  const usersSnapshot = await db.collection('users').get();

  let mostCheckedInUserThisMonth = { username: '', totalCheckIns: 0 };
  let overallMostCheckedInUser = { username: '', totalCheckIns: 0 };

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthYear = `${currentYear}-${String(currentMonth).padStart(2, '0')}`; // Format as YYYY-MM

  // Use Promise.all to handle async operations in parallel
  const userPromises = usersSnapshot.docs.map(async (doc) => {
    const data = doc.data();

    // Ensure that checkInCount and checkInsAtStartOfMonth are initialized
    const checkInCount = data.checkInCount ?? 0;
    let checkInsAtStartOfMonth = data.checkInsAtStartOfMonth ?? checkInCount;

    // If it's a new month, reset checkInsAtStartOfMonth
    const lastCheckInDate = data.lastCheckIn ? data.lastCheckIn.toDate() : new Date();
    if (lastCheckInDate.getMonth() + 1 !== currentMonth || lastCheckInDate.getFullYear() !== currentYear) {
      // Reset checkInsAtStartOfMonth for the new month
      checkInsAtStartOfMonth = checkInCount;
      await doc.ref.update({ checkInsAtStartOfMonth: checkInCount });
    }

    // Calculate check-ins for the current month using checkInsAtStartOfMonth
    const checkInsThisMonth = checkInCount - checkInsAtStartOfMonth;

    // Get reference to the statistics document
    const monthDataRef = db.collection('statistics').doc('mostCheckedInUser');
    const monthDataDoc = await monthDataRef.get();
    const monthData = monthDataDoc.exists ? monthDataDoc.data() : {};

    const prevMonthTotal = (monthData[monthYear]?.totalCheckIns || 0); // Total already recorded for the month

    // Final monthly check-ins should include any previous values plus new ones
    const finalCheckInsThisMonth = prevMonthTotal + checkInsThisMonth;

    // Update most checked-in user for this month using checkInsAtStartOfMonth
    if (checkInsAtStartOfMonth > mostCheckedInUserThisMonth.totalCheckIns) {
      mostCheckedInUserThisMonth = {
        username: data.username,
        totalCheckIns: checkInsAtStartOfMonth
      };
    }

    // Update overall most checked-in user
    if (checkInCount > overallMostCheckedInUser.totalCheckIns) {
      overallMostCheckedInUser = {
        username: data.username,
        totalCheckIns: checkInCount
      };
    }
  });

  // Wait for all user updates to complete
  await Promise.all(userPromises);

  // Store the most checked-in user and totals for the current month in Firestore
  const mostCheckedInUserRef = db.collection('statistics').doc('mostCheckedInUser');
  await mostCheckedInUserRef.set({
    [monthYear]: {
      totalCheckIns: mostCheckedInUserThisMonth.totalCheckIns,
      username: mostCheckedInUserThisMonth.username
    },
    overall: {
      totalCheckIns: overallMostCheckedInUser.totalCheckIns,
      username: overallMostCheckedInUser.username
    }
  }, { merge: true });

  console.log('Updated most checked-in user for the month:', monthYear);
  console.log('Updated overall most checked-in user:', overallMostCheckedInUser);
  return null;
});


// Function to update the top users daily
exports.updateTopUsers = functions.pubsub.schedule('30 0 * * *') // Runs every midnight
  .timeZone('Europe/Copenhagen')
  .onRun(async (context) => {
    const usersSnapshot = await db.collection('users').get();

    const usersList = [];
    const overallList = [];

    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Get all historical top users from the database
    const topUsersRef = db.collection('statistics').doc('topUsers');
    const topUsersDoc = await topUsersRef.get();
    if (topUsersDoc.exists) {
      const historicalData = topUsersDoc.data();

      // Push all historical top users into the overallList
      for (const month in historicalData) {
        if (month !== 'overall') { // Skip the overall field
          const monthData = historicalData[month];
          if (monthData.topOne) {
            overallList.push(monthData.topOne);
          }
          if (monthData.topTwo) {
            overallList.push(monthData.topTwo);
          }
          if (monthData.topThree) {
            overallList.push(monthData.topThree);
          }
        }
      }
    }

    usersSnapshot.forEach(doc => {
      const data = doc.data();

      if (data.highestDrinksIn12Hours !== null && data.highestDrinksIn12Hours !== undefined) {
        usersList.push({
          username: data.username,
          highestDrinksIn12Hours: data.highestDrinksIn12Hours,
        });

        // Add current user's highestDrinksIn12Hours to the overall list for comparison
        overallList.push({
          username: data.username,
          highestDrinksIn12Hours: data.highestDrinksIn12Hours,
        });
      }
    });

    // Sort users by highestDrinksIn12Hours in descending order for the current month
    usersList.sort((a, b) => b.highestDrinksIn12Hours - a.highestDrinksIn12Hours);

    // Get the top 3 users for the current month
    const topThree = usersList.slice(0, 3);
    const topOne = topThree[0] || {};
    const topTwo = topThree[1] || {};
    const topThreeUser = topThree[2] || {};

    // Sort the overall list by highestDrinksIn12Hours in descending order
    overallList.sort((a, b) => b.highestDrinksIn12Hours - a.highestDrinksIn12Hours);

    // Get the top 3 users for overall
    const overallTopThree = overallList.slice(0, 3);
    const overallTopOne = overallTopThree[0] || {};
    const overallTopTwo = overallTopThree[1] || {};
    const overallTopThreeUser = overallTopThree[2] || {};

    // Store the top users for the current month and update the overall stats with the highest of all time
    await topUsersRef.set({
      [monthYear]: {
        topOne: topOne,
        topTwo: topTwo,
        topThree: topThreeUser
      },
      overall: {
        topOne: overallTopOne,
        topTwo: overallTopTwo,
        topThree: overallTopThreeUser
      }
    }, { merge: true });

    console.log('Updated top users for the month:', monthYear, topThree);
    console.log('Updated overall top users:', overallTopThree);
    return null;
  });