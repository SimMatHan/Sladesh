const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

admin.initializeApp();
const db = getFirestore();

exports.resetSladeshCount = functions.pubsub.schedule('0 0,12 * * *')
  .timeZone('Europe/Copenhagen')
  .onRun(async (context) => {
    const usersSnapshot = await db.collection('users').get();

    const batch = db.batch();
    const resetTimestamp = admin.firestore.Timestamp.fromDate(new Date());

    usersSnapshot.forEach(doc => {
      batch.update(doc.ref, { lastSladesh: resetTimestamp, sladeshCount: 0 });
    });

    await batch.commit();
    console.log('Reset Sladesh count for all users.');
    return null;
  });

exports.resetCheckInStatus = functions.pubsub.schedule('0 0,12 * * *')
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

exports.deleteOldRequests = functions.pubsub.schedule('0 0,12 * * *')
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

exports.listUsers = functions.https.onCall(async (data, context) => {
  const usersRef = db.collection('users');
  const querySnapshot = await usersRef.get();

  const users = [];
  querySnapshot.forEach(doc => {
    users.push({ id: doc.id, ...doc.data() });
  });

  return users;
});

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

  exports.aggregateBeverageData = functions.pubsub.schedule('0 0,12 * * *')
  .timeZone('Europe/Copenhagen')
  .onRun(async (context) => {
    const usersSnapshot = await db.collection('users').get();

    let totalBeer = 0;
    let totalWine = 0;
    let totalShots = 0;
    let totalDrinks = 0;

    usersSnapshot.forEach(doc => {
      const data = doc.data();
      totalBeer += data.beer || 0;
      totalWine += data.wine || 0;
      totalShots += data.shots || 0;
      totalDrinks += data.drinks || 0;
    });

    const statsRef = db.collection('statistics').doc('totalDrinks');
    await statsRef.set({
      beer: totalBeer,
      wine: totalWine,
      shots: totalShots,
      drinks: totalDrinks,
    });

    console.log('Aggregated beverage data and updated statistics/totalDrinks.');
    return null;
  });

  exports.updateUserStatistics = functions.pubsub.schedule('0 0,12 * * *')
  .timeZone('Europe/Copenhagen')
  .onRun(async (context) => {
    const usersSnapshot = await db.collection('users').get();

    let mostSladeshedUser = { username: '', totalSladeshes: 0 };
    let mostCheckedInUser = { username: '', totalCheckIns: 0 };

    usersSnapshot.forEach(doc => {
      const data = doc.data();

      if (data.totalSladesh > mostSladeshedUser.totalSladeshes) {
        mostSladeshedUser = {
          username: data.username,
          totalSladeshes: data.totalSladesh,
        };
      }

      if (data.checkIns > mostCheckedInUser.totalCheckIns) {
        mostCheckedInUser = {
          username: data.username,
          totalCheckIns: data.checkIns,
        };
      }
    });

    await db.collection('statistics').doc('mostSladeshedUser').set({
      username: mostSladeshedUser.username,
      totalSladeshes: mostSladeshedUser.totalSladeshes,
    });

    await db.collection('statistics').doc('mostCheckedInUser').set({
      username: mostCheckedInUser.username,
      totalCheckIns: mostCheckedInUser.totalCheckIns,
    });

    console.log('Updated most sladeshed and most checked-in users.');
    return null;
  });
