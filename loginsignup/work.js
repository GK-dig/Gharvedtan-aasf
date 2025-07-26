AOS.init({
  duration: 1000,
  offset: 100,
});

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

import {
  getFirestore,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDImyxdSlB0Yr0PdMx32nVccGt7n3zMWZw",
  authDomain: "gharvedtan-auth.firebaseapp.com",
  projectId: "gharvedtan-auth",
  storageBucket: "gharvedtan-auth.firebasestorage.app",
  messagingSenderId: "32502650170",
  appId: "1:32502650170:web:8268b4c5947d5f04ab6c03"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Login function
window.loginUser = async () => {
  const phone = document.getElementById("loginPhone").value.trim();
  const pass = document.getElementById("loginPass").value;

  try {
    // Query Firestore for a user with the matching phone number
    const q = query(collection(db, "users"), where("phone", "==", phone));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      alert("User not found");
      return;
    }

    let found = false;

    querySnapshot.forEach((doc) => {
      const userData = doc.data();
     if (userData.password === pass) {
  found = true;
  
  // Save user data to localStorage
  localStorage.setItem("loggedInUser", JSON.stringify({
    name: userData.name,
    phone: userData.phone
  }));

  alert("Login successful!");
  window.location.href = "/index.html";
}

    });

    if (!found) {
      alert("Incorrect password");
    }

  } catch (error) {
    console.error("Login failed:", error);
    alert("Error: " + error.message);
  }
};
