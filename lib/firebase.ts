import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDrj1hpS_KR4cCw2GuAiJ5G2HnaownJf5M",
  authDomain: "apnaai-9654a.firebaseapp.com",
  projectId: "apnaai-9654a",
  storageBucket: "apnaai-9654a.firebasestorage.app",
  messagingSenderId: "440123176897",
  appId: "1:440123176897:web:931150c14758338c47a140",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);