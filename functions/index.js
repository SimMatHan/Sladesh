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
    usersSnapshot.forEach(doc => {
      batch.update(doc.ref, { lastSladesh: null });
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
    const snapshot = await db.collection('requests').get();

    if (snapshot.empty) {
      console.log('No matching documents.');
      return null;
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log('Deleted all requests.');
    return null;
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

exports.sendSladeshNotification = functions.firestore
    .document('requests/{requestId}')
    .onCreate(async (snapshot, context) => {
        const request = snapshot.data();
        const recipientUsername = request.recipient;

        // Get the recipient's user document
        const usersCollection = admin.firestore().collection('users');
        const userQuerySnapshot = await usersCollection.where('username', '==', recipientUsername).get();

        if (!userQuerySnapshot.empty) {
            const userDoc = userQuerySnapshot.docs[0];
            const userData = userDoc.data();

            // Update sladeshCount
            const sladeshCount = (userData.sladeshCount || 0) + 1;
            await userDoc.ref.update({ sladeshCount });

            if (userData.fcmToken) {
                const message = {
                    notification: {
                        title: 'New Sladesh Request',
                        body: `You have been sladesh'ed by ${request.sender.displayName}`,
                    },
                    token: userData.fcmToken,
                };

                try {
                    await admin.messaging().send(message);
                    console.log('Notification sent successfully');
                } catch (error) {
                    console.error('Error sending notification:', error);
                }
            }
        }
    });



