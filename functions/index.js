const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

admin.initializeApp();
const db = getFirestore();

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
