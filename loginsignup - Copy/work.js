import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
  getFirestore, 
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDImyxdSlB0Yr0PdMx32nVccGt7n3zMWZw",
  authDomain: "gharvedtan-auth.firebaseapp.com",
  projectId: "gharvedtan-auth",
  storageBucket: "gharvedtan-auth.appspot.com",
  messagingSenderId: "32502650170",
  appId: "1:32502650170:web:8268b4c5947d5f04ab6c03"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const loginForm = document.getElementById('signupForm');
const phoneNumberInput = document.getElementById('signupPhone');
const passwordInput = document.getElementById('signupPassword');
const loginButton = document.getElementById('loginButton');

// Initialize animations
AOS.init({ duration: 1000, easing: 'ease-in-out', once: true });

// Login function with better error handling
const loginUser = async (phoneNumber, password) => {
  try {
    console.log(`Attempting login with phone: ${phoneNumber}`);
    
    // Check if phone number exists in sellers collection
    const sellersRef = collection(db, "sellers");
    const q = query(sellersRef, where("phoneNumber", "==", phoneNumber));
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log("No matching documents found");
      alert("No account found with this phone number. Please check your number or register.");
      return;
    }
    
    // Get the first matching seller
    const sellerDoc = querySnapshot.docs[0];
    const sellerData = sellerDoc.data();
    console.log("Found seller data:", sellerData);
    
    if (!sellerData.email) {
      throw new Error("Seller account missing email address");
    }
    
    await signInWithEmailAndPassword(auth, sellerData.email, password);
    window.location.href = "./dashboard.html";
    
  } catch (error) {
    console.error("Login failed:", error);
    alert(`Login failed: ${error.message}`);
  }
};

// Event listener for login button
loginButton.addEventListener('click', async (e) => {
  e.preventDefault();
  
  const phoneNumber = phoneNumberInput.value.trim();
  const password = passwordInput.value.trim();
  
  if (!phoneNumber || !password) {
    alert("Please fill in all fields");
    return;
  }
  
  await loginUser(phoneNumber, password);
});