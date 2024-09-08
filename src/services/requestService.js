import { db } from "../firebaseConfig";
import { collection, addDoc, query, where, getDocs, serverTimestamp, doc, updateDoc, and, or } from "firebase/firestore"; // Include 'or' for querying multiple conditions
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();
const requestsCollection = collection(db, "requests");
const usersCollection = collection(db, "users");

// Updated createRequest function to return the Firestore document reference
export const createRequest = async (request) => {
  try {
    const docRef = await addDoc(requestsCollection, {
      ...request,
      createdAt: serverTimestamp() // Use server timestamp for consistency
    });
    return docRef;  // Return the document reference for accessing requestId
  } catch (error) {
    console.error('Error creating request:', error);
    throw new Error('Failed to create request');
  }
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
  try {
    const listUsers = httpsCallable(functions, 'listUsers');
    const response = await listUsers();
    const checkedInUsers = response.data.filter(user => user.checkedIn);
    return checkedInUsers;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users');
  }
};

export const createUser = async (user) => {
  const q = query(usersCollection, where("username", "==", user.username));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    throw new Error("Username is already taken");
  }

  try {
    await addDoc(usersCollection, user);
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error('Failed to create user');
  }
};

export const updateRequestStatus = async (requestId, updates) => {
  try {
    if (!requestId) {
      throw new Error('Invalid requestId');
    }

    // Filter out any undefined fields from the updates object
    const validUpdates = Object.fromEntries(
      Object.entries(updates).filter(([key, value]) => value !== undefined)
    );

    console.log('Updating request with ID:', requestId, 'with updates:', validUpdates);

    const requestRef = doc(db, 'requests', requestId);
    await updateDoc(requestRef, validUpdates);

    console.log('Request status updated successfully:', validUpdates);
  } catch (error) {
    console.error('Error updating request status:', error);
    throw error;
  }
};

