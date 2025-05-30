// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
 
  
  apiKey: "AIzaSyDawp7XDQqPjhowIlF14Emcco4M8WcXqmo",
  projectId: "nguyenhuutinh-daf0b",
  storageBucket: "nguyenhuutinh-daf0b.firebasestorage.app",
  databaseURL: "https://nguyenhuutinh-daf0b-default-rtdb.asia-southeast1.firebasedatabase.app",
  messagingSenderId: "381456532401",
  appId: "1:381456532401:android:76c486692e437673187390"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };