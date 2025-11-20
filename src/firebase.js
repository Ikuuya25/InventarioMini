// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCt5ySU4kmoxqViJd0QAhr9zQatYWiTzC0",
  authDomain: "inventariominilarrytech-82581.firebaseapp.com",
  projectId: "inventariominilarrytech-82581",
  storageBucket: "inventariominilarrytech-82581.firebasestorage.app",
  messagingSenderId: "1006545291534",
  appId: "1:1006545291534:web:c28a8189fac978a0bd2f5f",
  measurementId: "G-QSBS7R865G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);