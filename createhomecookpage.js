
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier, signInWithCredential, PhoneAuthProvider } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";


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

const sendOtpButton = document.getElementById("sendOtpButton");
const verifyOtpButton = document.getElementById("verifyOtpButton");
const submitBtn = document.getElementById("submitBtn");
const cookname = document.getElementById("cookname");
const cookmob = document.getElementById("cookmob");
const otpInput = document.getElementById("otpInput");
const detectBtn = document.getElementById("detect-location-btn");
const cityDisplay = document.getElementById("cookaddress");  // The address input field

let verificationId = "";


sendOtpButton.addEventListener("click", () => {
  const phoneNumber = cookmob.value;
  
  if (!phoneNumber) {
    alert("Please enter your phone number.");
    return;
  }

  window.recaptchaVerifier = new RecaptchaVerifier('sendOtpButton', {
    size: 'invisible',
    callback: function(response) {
    
    },
  }, auth);

  const appVerifier = window.recaptchaVerifier;
  signInWithPhoneNumber(auth, phoneNumber, appVerifier)
    .then((confirmationResult) => {
      verificationId = confirmationResult.verificationId;
      alert("OTP sent!");
    })
    .catch((error) => {
      console.error(error);
      alert("Error sending OTP");
    });
});

verifyOtpButton.addEventListener("click", () => {
  const otp = otpInput.value;
  
  if (!otp) {
    alert("Please enter OTP.");
    return;
  }

  const credential = PhoneAuthProvider.credential(verificationId, otp);

  signInWithCredential(auth, credential)
    .then((userCredential) => {
      alert("OTP verified successfully.");
    })
    .catch((error) => {
      console.error(error);
      alert("Invalid OTP. Please try again.");
    });
});

submitBtn.addEventListener("click", async () => {
  const sellerName = cookname.value;
  const sellerMob = cookmob.value;
  const sellerCity = cityDisplay.value || "Unknown";  
  
  if (!sellerName || !sellerMob) {
    alert("Please fill in all the details.");
    return;
  }

  try {
    await addDoc(collection(db, "sellers"), {
      name: sellerName,
      mobile: sellerMob,
      city: sellerCity,
      role: "seller" 
    });

    alert("Seller registered successfully!");

  
    cookname.value = "";
    cookmob.value = "";
    otpInput.value = "";
  } catch (e) {
    console.error("Error adding document: ", e);
    alert("Error registering Seller.");
  }
});

function detectLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported.");
    return;
  }

  navigator.geolocation.getCurrentPosition(success, error);

  function success(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
      .then(res => res.json())
      .then(data => {
        const city = data.address.city || data.address.town || data.address.village || "Unknown";
       
        cityDisplay.value = city; 
        console.log("Auto-detected city:", city);
      })
      .catch(() => {
        alert("Could not determine city.");
      });
  }

  function error(err) {
    alert("Please allow location access.");
    console.warn(`Geolocation error (${err.code}): ${err.message}`);
  }
}
document.getElementById("detect-location-btn").addEventListener("click", detectLocation);
