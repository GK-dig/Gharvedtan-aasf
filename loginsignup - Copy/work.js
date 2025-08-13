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

const firebaseConfig = {
  apiKey: "AIzaSyDImyxdSlB0Yr0PdMx32nVccGt7n3zMWZw",
  authDomain: "gharvedtan-auth.firebaseapp.com",
  projectId: "gharvedtan-auth",
  storageBucket: "gharvedtan-auth.appspot.com",
  messagingSenderId: "32502650170",
  appId: "1:32502650170:web:8268b4c5947d5f04ab6c03"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


const loginForm = document.getElementById('signupForm');
const phoneNumberInput = document.getElementById('signupPhone');
const passwordInput = document.getElementById('signupPassword');
const loginButton = document.getElementById('loginButton');


AOS.init({ duration: 1000, easing: 'ease-in-out', once: true });


const loginUser = async (phoneNumber, password) => {
  try {
    console.log(`Attempting login with phone: ${phoneNumber}`);

    const sellersRef = collection(db, "sellers");
    const q = query(sellersRef, where("mobile", "==", phoneNumber));
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log("No matching documents found");
      alert("No account found with this phone number. Please check your number or register.");
      return false;
    }
    
 
    const sellerDoc = querySnapshot.docs[0];
    const sellerData = sellerDoc.data();
    console.log("Found seller data:", sellerData);
    

    if (sellerData.password !== password) {
      alert("Incorrect password");
      return false;
    }
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    
    if (loggedInUser) {
      alert("Please log out as user, to log in as seller");
      window.location.href = "../index.html";  
      return;  
    }

    sessionStorage.setItem('user', JSON.stringify({
      uid: sellerDoc.id, 
      phoneNumber: sellerData.mobile,
      displayName: sellerData.name || '',
      ...sellerData 
    }));
    
    console.log("Login successful, user data stored in session storage");
    return true;
    
  } catch (error) {
    console.error("Login failed:", error);
    alert(`Login failed: ${error.message}`);
    return false;
  }
};

loginButton.addEventListener('click', async (e) => {
  e.preventDefault();
  
  const phoneNumber = phoneNumberInput.value.trim();
  const password = passwordInput.value.trim();
  
  if (!phoneNumber || !password) {
    alert("Please fill in all fields");
    return;
  }
  
  loginButton.disabled = true;
  loginButton.textContent = "Logging in...";

  const loginSuccess = await loginUser(phoneNumber, password);
  
  if (loginSuccess) {
   window.location.href = "../addmenu/addmenu.html";


  } else {
    loginButton.disabled = false;
    loginButton.textContent = "Login";
  }
});

passwordInput.addEventListener('keypress', async (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    loginButton.click();
  }
});