// src/services/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB9LAdVHFEfvy7XINNcRdbUc5iHjuQFFUg",
  authDomain: "appdecontrolenutricional.firebaseapp.com",
  projectId: "appdecontrolenutricional",
  storageBucket: "appdecontrolenutricional.firebasestorage.app",
  messagingSenderId: "4109971841",
  appId: "1:4109971841:web:c718713170b33bf512b880",
  measurementId: "G-WD73K712ZF"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
