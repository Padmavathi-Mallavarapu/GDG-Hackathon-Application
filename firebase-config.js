// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCvuKqgsgtIAPzh5U569-FksQdMaHjcyjE",
  authDomain: "student-fee-reminder.firebaseapp.com",
  projectId: "student-fee-reminder",
  storageBucket: "student-fee-reminder.firebasestorage.app",
  messagingSenderId: "652699992618",
  appId: "1:652699992618:web:35edac6c9581c023d37953",
  measurementId: "G-KMK6DPJ20S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log("Firebase initialized successfully!");
