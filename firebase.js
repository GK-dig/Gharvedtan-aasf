
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDImyxdSlB0Yr0PdMx32nVccGt7n3zMWZw",
  authDomain: "gharvedtan-auth.firebaseapp.com",
  projectId: "gharvedtan-auth",
  storageBucket: "gharvedtan-auth.firebasestorage.app",
  messagingSenderId: "32502650170",
  appId: "1:32502650170:web:8268b4c5947d5f04ab6c03"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
