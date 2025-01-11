// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCLfgSsJv8uJEGo5rmBTLxRg4w9YcviIg4",
  authDomain: "dino-7c5ae.firebaseapp.com",
  projectId: "dino-7c5ae",
  storageBucket: "dino-7c5ae.firebasestorage.app",
  messagingSenderId: "916899342818",
  appId: "1:916899342818:web:70050b49666f15b716b1bb",
  measurementId: "G-YB9EYVGTSG"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const firebaseDB = getFirestore(app)