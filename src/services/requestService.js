import { db } from "../firebaseConfig";
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
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
  const q = query(usersCollection, where("username", "==", username));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error("User not found");
  }

  const user = querySnapshot.docs[0].data();

  let requestQuery;
  if (type === 'received') {
    requestQuery = query(requestsCollection, where("recipient", "==", user.username));
  } else if (type === 'sent') {
    requestQuery = query(requestsCollection, where("sender", "==", user.username));
  }

  const requestSnapshot = await getDocs(requestQuery);
  const requests = requestSnapshot.docs.map(doc => doc.data());
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
