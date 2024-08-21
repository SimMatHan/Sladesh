const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

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
    const twelveHoursAgo = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 12 * 60 * 60 * 1000)
    );

    try {
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
        console.log(`Deleting request with ID: ${doc.id}, created at: ${doc.data().createdAt.toDate()}`);
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Deleted ${snapshot.size} old requests.`);
      return null;
    } catch (error) {
      console.error('Error deleting old requests:', error);
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
exports.aggregateBeverageData = functions.pubsub.schedule('0 10 * * *') // Run every day at 11:00 AM
  .timeZone('Europe/Copenhagen')
  .onRun(async (context) => {
    const usersSnapshot = await db.collection('users').get();
    
    let totalBeer = 0;
    let totalWine = 0;
    let totalShots = 0;
    let totalDrinks = 0;

    usersSnapshot.forEach(doc => {
      const data = doc.data();

      totalBeer += data.drinks?.beer || 0;
      totalWine += data.drinks?.wine || 0;
      totalShots += data.drinks?.shots || 0;
      totalDrinks += data.drinks?.drink || 0;
    });

    // Fetch current totals from the statistics collection
    const statsRef = db.collection('statistics').doc('totalDrinks');
    const statsDoc = await statsRef.get();

    if (statsDoc.exists) {
      const statsData = statsDoc.data();
      totalBeer += statsData.beer || 0;
      totalWine += statsData.wine || 0;
      totalShots += statsData.shots || 0;
      totalDrinks += statsData.drinks || 0;
    }

    // Update the statistics collection with the new aggregated totals
    await statsRef.set({
      beer: totalBeer,
      wine: totalWine,
      shots: totalShots,
      drinks: totalDrinks,
    });

    // Reset each user's drinks and totalDrinks
    const batch = db.batch();
    usersSnapshot.forEach(doc => {
      batch.update(doc.ref, {
        drinks: { beer: 0, wine: 0, shots: 0, drink: 0 },
        totalDrinks: 0
      });
    });

    await batch.commit();

    console.log('Aggregated beverage data and updated statistics/totalDrinks.');
    return null;
  });


// Function to update the most sladeshed user daily
exports.updateMostSladeshedUser = functions.pubsub.schedule('0 0 * * *') // Runs every day at midnight
  .timeZone('Europe/Copenhagen')
  .onRun(async (context) => {
    const usersSnapshot = await db.collection('users').get();

    let mostSladeshedUser = { username: '', totalSladeshes: 0 };

    usersSnapshot.forEach(doc => {
      const data = doc.data();

      if (data.totalSladeshes > mostSladeshedUser.totalSladeshes) {
        mostSladeshedUser = {
          username: data.username,
          totalSladeshes: data.totalSladeshes,
        };
      }
    });

    await db.collection('statistics').doc('mostSladeshedUser').set({
      username: mostSladeshedUser.username,
      totalSladeshes: mostSladeshedUser.totalSladeshes,
    });

    console.log('Updated most sladeshed user:', mostSladeshedUser.username);
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

      console.log(`Incremented sladesh count for user: ${recipientUsername} to ${newSladeshCount}`);
      console.log(`Incremented total sladeshes for user: ${recipientUsername} to ${newTotalSladeshes}`);
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

// Function to update the most checked-in user daily
exports.updateMostCheckedInUser = functions.pubsub.schedule('0 0 * * *') // Runs every day at midnight
  .timeZone('Europe/Copenhagen')
  .onRun(async (context) => {
    const usersSnapshot = await db.collection('users').get();

    let mostCheckedInUser = { username: '', checkInCount: 0 };

    usersSnapshot.forEach(doc => {
      const data = doc.data();

      if (data.checkInCount > mostCheckedInUser.checkInCount) {
        mostCheckedInUser = {
          username: data.username,
          checkInCount: data.checkInCount,
        };
      }
    });

    await db.collection('statistics').doc('mostCheckedInUser').set({
      username: mostCheckedInUser.username,
      totalCheckIns: mostCheckedInUser.checkInCount,
    });

    console.log('Updated most checked-in user:', mostCheckedInUser.username);
    return null;
  });
