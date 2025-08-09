import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  GoogleAuthProvider, 
  signInWithPopup 
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc 
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// Initialize Firebase
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
const googleProvider = new GoogleAuthProvider();

// Global variables
let confirmationResult = null;
let recaptchaVerifier = null;

// DOM Elements
const signupForm = document.getElementById('signupForm');
const signupName = document.getElementById('signupName');
const signupPass = document.getElementById('signupPass');
const signupRepass = document.getElementById('signupRepass');
const signupPhone = document.getElementById('signupPhone');
const otpInput = document.getElementById('otpInput');
const verifyBtn = document.getElementById('verify-btn');
const sendOtpBtn = document.getElementById('send-otp-btn');
const cityDropdown = document.getElementById('city-dropdown');
const cityName = document.getElementById('city-name');
const clearCityBtn = document.getElementById('clear-city-btn');
const detectLocationBtn = document.getElementById('detect-location-btn');

// Initialize AOS animations
AOS.init({
  duration: 1000,
  offset: 100,
});

// Initialize reCAPTCHA
function initializeRecaptcha() {
  recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
    size: 'invisible',
    callback: () => {
      sendOTP();
    }
  }, auth);
}

// Send OTP function
async function sendOTP() {
  const phone = signupPhone.value.trim();
  
  if (phone.length !== 10) {
    alert('Please enter a valid 10-digit phone number');
    return;
  }

  try {
    if (!recaptchaVerifier) {
      initializeRecaptcha();
    }

    const fullPhone = `+91${phone}`;
    confirmationResult = await signInWithPhoneNumber(auth, fullPhone, recaptchaVerifier);
    
    otpInput.disabled = false;
    verifyBtn.disabled = false;
    sendOtpBtn.textContent = 'Resend OTP';
    alert('OTP sent successfully!');
  } catch (error) {
    console.error('OTP Error:', error);
    alert(`Failed to send OTP: ${error.message}`);
  }
}

// Verify OTP function
async function verifyOTP() {
  const otp = otpInput.value.trim();
  const name = signupName.value.trim();
  const phone = signupPhone.value.trim();
  const password = signupPass.value;
  const repass = signupRepass.value;
  const city = cityName.textContent === 'None' ? '' : cityName.textContent;

  if (!confirmationResult) {
    alert('Please send OTP first');
    return;
  }

  if (!name || !phone || !password || !repass || !city) {
    alert('All fields are required');
    return;
  }

  if (password !== repass) {
    alert('Passwords do not match');
    return;
  }

  try {
    const result = await confirmationResult.confirm(otp);
    const user = result.user;

    const userData = {
      name,
      phone,
      password,
      uid: user.uid,
      createdAt: new Date()
    };

    await setDoc(doc(db, 'users', user.uid), userData);
    
    sessionStorage.setItem('loggedInUser', JSON.stringify({
      name,
      phone,
      uid: user.uid
    }));

    alert('Signup successful!');
    window.location.href = '/index.html';
  } catch (error) {
    console.error('Verification Error:', error);
    alert(`OTP verification failed: ${error.message}`);
  }
}

// Google Sign-In function
async function googleSignIn() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const userData = {
      name: user.displayName || 'Anonymous',
      phone: user.phoneNumber || 'Not provided',
      email: user.email || 'Not provided',
      uid: user.uid,
      createdAt: new Date()
    };

    await setDoc(doc(db, 'users', user.uid), userData);

    sessionStorage.setItem('loggedInUser', JSON.stringify({
      name: userData.name,
      phone: userData.phone,
      email: userData.email,
      uid: user.uid
    }));

    alert('Google Sign-In successful!');
    window.location.href = '../index.html';
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    alert('Google Sign-In failed. Please try again.');
  }
}

// Location detection
function detectLocation() {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const data = await response.json();
        
        const city = data.address.city || data.address.town || 
                     data.address.village || data.address.county || 'Unknown';
        
        cityName.textContent = city;
        cityDropdown.style.display = 'none';
      } catch (error) {
        console.error('Location Error:', error);
        alert('Could not determine your location');
      }
    },
    (error) => {
      console.error('Geolocation Error:', error);
      alert('Please enable location access to use this feature');
    }
  );
}

// City selection handlers
function setupCitySelection() {
  cityDropdown.addEventListener('change', () => {
    cityName.textContent = cityDropdown.value;
    cityDropdown.style.display = 'none';
  });

  clearCityBtn.addEventListener('click', () => {
    cityName.textContent = 'None';
    cityDropdown.style.display = 'block';
  });
}

// Form validation
function setupFormValidation() {
  signupForm.addEventListener('input', () => {
    const isFormValid = signupName.value.trim() && 
                       signupPass.value && 
                       signupRepass.value && 
                       signupPhone.value.trim().length === 10 &&
                       cityName.textContent !== 'None';
    
    sendOtpBtn.disabled = !isFormValid;
  });

  signupPhone.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
  });
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  initializeRecaptcha();
  setupCitySelection();
  setupFormValidation();
});

// Expose functions to window for HTML onclick handlers
window.sendOTP = sendOTP;
window.verifyOTP = verifyOTP;
window.googleSignIn = googleSignIn;
window.detectLocation = detectLocation;