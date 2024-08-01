import { db } from "../firebaseConfig";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

// Initialize Firebase functions
const functions = getFunctions();
const requestsCollection = collection(db, "requests");
const usersCollection = collection(db, "users");

export const createRequest = async (request) => {
  await addDoc(requestsCollection, {
    ...request,
    timestamp: new Date().toISOString()
  });
};

export const getRequests = async (recipientUsername) => {
  // Get the recipient user document by username
  const q = query(usersCollection, where("username", "==", recipientUsername));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error("Recipient not found");
  }

  const recipient = querySnapshot.docs[0].data();

  // Get requests for the recipient
  const requestQuery = query(requestsCollection, where("recipient", "==", recipient.username));
  const requestSnapshot = await getDocs(requestQuery);
  const requests = requestSnapshot.docs.map(doc => doc.data());
  return requests;
};

export const getUsers = async () => {
  // Call the Firebase Cloud Function to get the list of users
  const listUsers = httpsCallable(functions, 'listUsers');
  const response = await listUsers();
  return response.data;
};

export const createUser = async (user) => {
  // Check if the username is already taken
  const q = query(usersCollection, where("username", "==", user.username));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    throw new Error("Username is already taken");
  }

  // Add the new user
  await addDoc(usersCollection, user);
};
