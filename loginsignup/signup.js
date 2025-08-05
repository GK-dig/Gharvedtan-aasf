AOS.init({
  duration: 1000,
  offset: 100,
});

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

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

let confirmationResult = null;

window.sendOTP = () => {
  const phone = document.getElementById("signupPhone").value.trim();
  if (phone.length !== 10) return alert("Enter a valid 10-digit phone number.");

  const fullPhone = "+91" + phone;

  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier("recaptcha-container", {
      size: "invisible",
      callback: () => {
        sendOTP();
      }
    }, auth);
    window.recaptchaVerifier.render();
  }

  signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier)
    .then((result) => {
      confirmationResult = result;
      alert("OTP sent!");
    })
    .catch((error) => {
      console.error(error);
      alert("Failed to send OTP: " + error.message);
    });
};

window.verifyOTP = () => {
  const name = document.getElementById("signupName").value.trim();
  const phone = document.getElementById("signupPhone").value.trim();
  const pass = document.getElementById("signupPass").value;
  const repass = document.getElementById("signupRepass").value;
  const otp = document.getElementById("otpInput").value.trim();

  if (!confirmationResult) return alert("Send OTP first.");
  if (!name || !phone || !pass || !repass || !otp) return alert("All fields required.");
  if (pass !== repass) return alert("Passwords do not match.");

  confirmationResult.confirm(otp)
    .then(async (result) => {
      const user = result.user;

      await setDoc(doc(db, "users", user.uid), {
        name,
        phone,
        password: pass,
        uid: user.uid,
        createdAt: new Date()
      });
      localStorage.setItem("loggedInUser", JSON.stringify({
        name: name,
        phone: phone,
        uid: user.uid
      }));

      alert("Signup successful!");
      window.location.href = "/index.html";
    })
    .catch((error) => {
      console.error(error);
      alert("Invalid OTP: " + error.message);
    });
};

window.googleSignIn = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    await setDoc(doc(db, "users", user.uid), {
      name: user.displayName,
      phone: user.phoneNumber || "Not Provided",
      email: user.email,
      uid: user.uid,
      createdAt: new Date()
    });

    localStorage.setItem("loggedInUser", JSON.stringify({
      name: user.displayName,
      phone: user.phoneNumber || "Not Provided",
      email: user.email,
      uid: user.uid
    }));

    alert("Google Sign-In successful!");
    window.location.href = "../index.html"; 

  } catch (error) {
    console.error("Google Sign-In Error:", error);
    alert("Google Sign-In failed. Please try again.");
  }
};
