import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

const firebaseConfig = {
    apiKey: "AIzaSyB_9nIQROt0ZyeOj9verY8WePifdB-L3_s",
    authDomain: "ggl-login-f3407.firebaseapp.com",
    projectId: "ggl-login-f3407",
    storageBucket: "ggl-login-f3407.firebasestorage.app",
    messagingSenderId: "135713948667",
    appId: "1:135713948667:web:e7ff6937013fa387d8015e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, "asia-northeast1");

export { app, auth, db, functions, httpsCallable };
