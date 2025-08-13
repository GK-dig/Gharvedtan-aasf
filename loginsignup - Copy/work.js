import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
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

// Login function with phone number and password (no OTP)
const loginUser = async (phoneNumber, password) => {
  try {
    console.log(`Attempting login with phone: ${phoneNumber}`);
    
    // Check if phone number exists in sellers collection
    const sellersRef = collection(db, "sellers");
    const q = query(sellersRef, where("mobile", "==", phoneNumber));
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log("No matching documents found");
      alert("No account found with this phone number. Please check your number or register.");
      return false;
    }
    
    // Get the first matching seller
    const sellerDoc = querySnapshot.docs[0];
    const sellerData = sellerDoc.data();
    console.log("Found seller data:", sellerData);
    
    // Verify password
    if (sellerData.password !== password) {
      alert("Incorrect password");
      return false;
    }
    
    // Store user data in session storage
    sessionStorage.setItem('user', JSON.stringify({
      uid: sellerDoc.id, // Using Firestore document ID as UID
      phoneNumber: sellerData.mobile,
      displayName: sellerData.name || '',
      // Add any other relevant seller data you want to store
      ...sellerData // Spread all seller data into the session storage
    }));
    
    console.log("Login successful, user data stored in session storage");
    return true;
    
  } catch (error) {
    console.error("Login failed:", error);
    alert(`Login failed: ${error.message}`);
    return false;
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
  
  // Show loading state
  loginButton.disabled = true;
  loginButton.textContent = "Logging in...";

  const loginSuccess = await loginUser(phoneNumber, password);
  
  if (loginSuccess) {
    // Redirect to dashboard after successful login
   window.location.href = "../addmenu/addmenu.html";


  } else {
    // Reset button state if login fails
    loginButton.disabled = false;
    loginButton.textContent = "Login";
  }
});

// Optional: Add enter key functionality
passwordInput.addEventListener('keypress', async (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    loginButton.click();
  }
});