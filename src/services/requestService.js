import { db } from "../firebaseConfig";
import { collection, addDoc, query, where, getDocs, serverTimestamp, doc, updateDoc, and, or } from "firebase/firestore"; // Include 'or' for querying multiple conditions
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();
const requestsCollection = collection(db, "requests");
const usersCollection = collection(db, "users");

export const createRequest = async (request) => {
  await addDoc(requestsCollection, {
    ...request,
    createdAt: serverTimestamp() // Use server timestamp for consistency
  });
};

export const getRequests = async (username, type = 'received') => {
  let requestQuery;

  if (type === 'received') {
    requestQuery = query(
      requestsCollection,
      and(
        where("recipient", "==", username),
        or(
          where("status", "==", "completed"),
          where("status", "==", "confirmed")
        )
      )
    );
  } else if (type === 'sent') {
    requestQuery = query(requestsCollection, where("sender", "==", username));
  }

  const querySnapshot = await getDocs(requestQuery);
  const requests = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  return requests;
};

export const getUsers = async () => {
  const listUsers = httpsCallable(functions, 'listUsers');
  const response = await listUsers();
  const checkedInUsers = response.data.filter(user => user.checkedIn);
  return checkedInUsers;
};

export const createUser = async (user) => {
  const q = query(usersCollection, where("username", "==", user.username));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    throw new Error("Username is already taken");
  }

  await addDoc(usersCollection, user);
};

export const updateRequestStatus = async (requestId, updates) => {
  try {
    if (!requestId) {
      throw new Error('Invalid requestId');
    }

    console.log('Updating request with ID:', requestId, 'with updates:', updates);

    const requestRef = doc(db, 'requests', requestId);

    await updateDoc(requestRef, updates);
    console.log('Request status updated successfully:', updates);
  } catch (error) {
    console.error('Error updating request status:', error);
    throw error;
  }
};