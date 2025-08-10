// Import Firebase modules (this would be in your main HTML file)
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
let detectedLocationData = null;

// DOM Elements
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
const locationDetails = document.getElementById('location-details');

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
      location: detectedLocationData || {
        display: city,
        coordinates: null,
        address: null
      },
      uid: user.uid,
      createdAt: new Date()
    };

    await setDoc(doc(db, 'users', user.uid), userData);
    
    sessionStorage.setItem('loggedInUser', JSON.stringify({
      name,
      phone,
      uid: user.uid,
      location: userData.location.display,
      coordinates: userData.location.coordinates
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
      location: detectedLocationData || {
        display: cityName.textContent === 'None' ? '' : cityName.textContent,
        coordinates: null,
        address: null
      },
      uid: user.uid,
      createdAt: new Date()
    };

    await setDoc(doc(db, 'users', user.uid), userData);

    sessionStorage.setItem('loggedInUser', JSON.stringify({
      name: userData.name,
      phone: userData.phone,
      email: userData.email,
      uid: user.uid,
      location: userData.location.display,
      coordinates: userData.location.coordinates
    }));

    alert('Google Sign-In successful!');
    window.location.href = '../index.html';
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    alert('Google Sign-In failed. Please try again.');
  }
}

// Enhanced Location Detection with precise coordinates
async function detectLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  // Show loading state
  detectLocationBtn.disabled = true;
  detectLocationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Detecting...';
  cityName.textContent = "Detecting your location...";

  try {
    // Get high-accuracy position
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve, 
        reject, 
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    });

    const { latitude, longitude } = position.coords;
    
    // Fetch detailed address from Nominatim
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
    );
    
    if (!response.ok) throw new Error('Location service failed');
    
    const data = await response.json();
    const address = data.address;
    
    // Construct detailed address string
    const addressComponents = [
      address.house_number,
      address.road,
      address.neighbourhood,
      address.suburb,
      address.city_district,
      address.city || address.town || address.village,
      address.state
    ].filter(Boolean);
    
    const locationText = addressComponents.join(', ') || "Your current location";
    
    // Store complete location data with coordinates
    detectedLocationData = {
      display: locationText,
      coordinates: { 
        latitude: latitude, 
        longitude: longitude,
        accuracy: position.coords.accuracy
      },
      address: address,
      timestamp: new Date()
    };
    
    // Update UI
    cityName.textContent = locationText;
    cityDropdown.style.display = 'none';
    locationDetails.style.display = 'block';
    locationDetails.innerHTML = `
      <div>Latitude: ${latitude.toFixed(6)}</div>
      <div>Longitude: ${longitude.toFixed(6)}</div>
      <div>Accuracy: ${position.coords.accuracy.toFixed(2)} meters</div>
    `;
    
  } catch (error) {
    console.error("Location detection error:", error);
    cityName.textContent = "None";
    locationDetails.style.display = 'none';
    alert("Could not determine your location. Please try again or select manually.");
  } finally {
    detectLocationBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Detect My Location';
    detectLocationBtn.disabled = false;
  }
}

// City selection handlers
function setupCitySelection() {
  cityDropdown.addEventListener('change', () => {
    cityName.textContent = cityDropdown.value;
    cityDropdown.style.display = 'none';
    locationDetails.style.display = 'none';
    detectedLocationData = null; // Clear detected data when manually selecting
  });

  clearCityBtn.addEventListener('click', () => {
    cityName.textContent = 'None';
    cityDropdown.style.display = 'block';
    locationDetails.style.display = 'none';
    detectedLocationData = null; // Clear detected data
  });
}

// Form validation
function setupFormValidation() {
  const validateForm = () => {
    const isFormValid = signupName.value.trim() && 
                      signupPass.value && 
                      signupRepass.value && 
                      signupPhone.value.trim().length === 10 &&
                      cityName.textContent !== 'None';
    
    sendOtpBtn.disabled = !isFormValid;
  };

  [signupName, signupPass, signupRepass, signupPhone].forEach(field => {
    field.addEventListener('input', validateForm);
  });

  signupPhone.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
  });

  validateForm();
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