
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // ← IMPORTANTE

// Your web app's Firebase configuration
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

// Inicializar Firestore
export const db = getFirestore(app); // ← EXPORTA db