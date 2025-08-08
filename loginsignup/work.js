AOS.init({
  duration: 1000,
  offset: 100,
});

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

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

window.googleSignIn = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const q = query(collection(db, "users"), where("uid", "==", user.uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      await setDoc(doc(db, "users", user.uid), {
        name: user.displayName,
        phone: user.phoneNumber || "Not Provided",
        email: user.email,
        uid: user.uid,
        createdAt: new Date()
      });
    }

sessionStorage.setItem("loggedInUser", JSON.stringify({
      name: user.displayName,
      phone: user.phoneNumber || "Not Provided",
      email: user.email,
      uid: user.uid
    }));

    alert("Google Sign-In successful!");
    window.location.href = "/index.html";

  } catch (error) {
    console.error("Google Sign-In Error:", error);
    alert("Google Sign-In failed. Please try again.");
  }
};

window.loginUser = async () => {
  const phone = document.getElementById("loginPhone").value.trim();
  const pass = document.getElementById("loginPass").value;

  try {
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

        sessionStorage.setItem("loggedInUser", JSON.stringify({
          name: userData.name,
          phone: userData.phone,
          email: userData.email,
          uid: userData.uid
          
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