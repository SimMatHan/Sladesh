// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/9.1.3/firebase-messaging.js');

const firebaseConfig = {
  apiKey: "AIzaSyDR1JwotZQVLSfOP6cXmmOA3Jg2Zi0_ghQ",
  authDomain: "sladeshapp.firebaseapp.com",
  projectId: "sladeshapp",
  storageBucket: "sladeshapp.appspot.com",
  messagingSenderId: "929671423726",
  appId: "1:929671423726:web:2a039112fecfcfcfe8b5ff",
  measurementId: "G-J61WDZSHFK"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = 'New Sladesh Request';
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
