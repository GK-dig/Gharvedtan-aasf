// Firebase imports and configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier, signInWithCredential, PhoneAuthProvider } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

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

// DOM Elements
const elements = {
    sendOtpButton: document.getElementById("sendOtpButton"),
    verifyOtpButton: document.getElementById("verifyOtpButton"),
    submitBtn: document.getElementById("submitBtn"),
    cookname: document.getElementById("cookname"),
    cookmob: document.getElementById("cookmob"),
    password: document.getElementById("password"),
    confirmPassword: document.getElementById("confirmPassword"),
    otpInput: document.getElementById("otpInput"),
    otpGroup: document.getElementById("otpGroup"),
    detectBtn: document.getElementById("detect-location-btn"),
    cityDisplay: document.getElementById("cookaddress"),
    locationStatus: document.getElementById("location-status"),
    passwordMatch: document.getElementById("passwordMatch"),
    strengthMeter: document.getElementById("strengthMeter"),
    togglePasswordButtons: document.querySelectorAll(".toggle-password"),
    mapElement: document.getElementById("map")
};

let verificationId = "";
let isOtpVerified = false;
let isPasswordValid = false;
let doPasswordsMatch = false;
let map;
let marker;
let geocoder;

// Utility functions
function showStatus(message, type = 'info') {
    if (!elements.locationStatus) return;
    elements.locationStatus.textContent = message;
    elements.locationStatus.className = `${type}-message`;
}

async function checkMapsAPI() {
    return new Promise((resolve, reject) => {
        const maxAttempts = 10;
        let attempts = 0;
        
        const check = () => {
            attempts++;
            if (window.google && window.google.maps && google.maps.importLibrary) {
                resolve(true);
            } else if (attempts >= maxAttempts) {
                reject(new Error("Google Maps API failed to load"));
            } else {
                setTimeout(check, 200);
            }
        };
        
        check();
    });
}

// Map functions
async function initMapComponents() {
    try {
        await checkMapsAPI();
        if (!geocoder) {
            geocoder = new google.maps.Geocoder();
        }
        return true;
    } catch (error) {
        console.error("Failed to initialize map components:", error);
        showStatus("Map service initialization failed", "error");
        return false;
    }
}

async function createMap(lat, lng) {
    if (!await initMapComponents()) return false;
    
    try {
        elements.mapElement.style.display = "block";
        const location = { lat, lng };
        
        // Load required libraries
        const { Map } = await google.maps.importLibrary("maps");
        const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
        
        map = new Map(elements.mapElement, {
            center: location,
            zoom: 15,
            mapId: "DEMO_MAP_ID",
            disableDefaultUI: true,
            zoomControl: true
        });
        
        marker = new AdvancedMarkerElement({
            position: location,
            map: map,
            gmpDraggable: true,
            title: "Your location"
        });
        
        marker.addListener("dragend", () => {
            updateAddressFromPosition(marker.position);
        });
        
        return true;
    } catch (error) {
        console.error("Map creation error:", error);
        showStatus("Failed to create map", "error");
        return false;
    }
}

async function updateAddressFromPosition(position) {
    if (!geocoder) {
        showStatus("Geocoding service not ready", "error");
        return;
    }

    try {
        const { results } = await new Promise((resolve, reject) => {
            geocoder.geocode({ location: position }, (results, status) => {
                status === "OK" ? resolve({ results }) : reject(status);
            });
        });

        if (results[0]) {
            elements.cityDisplay.value = results[0].formatted_address;
            showStatus("Location updated! Drag marker to adjust.", "success");
        } else {
            showStatus("No address found for this location", "warning");
        }
    } catch (error) {
        console.error("Geocoding error:", error);
        showStatus("Could not determine address", "error");
    }
}

// Location detection
async function detectLocation() {
    if (!elements.locationStatus || !elements.detectBtn) return;

    showStatus("Detecting your location...");
    elements.detectBtn.disabled = true;
    elements.detectBtn.textContent = "Detecting...";

    try {
        if (!navigator.geolocation) {
            throw new Error("Geolocation not supported");
        }

        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000
            });
        });

        const { latitude: lat, longitude: lng, accuracy } = position.coords;
        const mapCreated = await createMap(lat, lng);
        
        if (mapCreated) {
            await updateAddressFromPosition({ lat, lng });
            showStatus(`Location found (accuracy: ${Math.round(accuracy)} meters)`, "success");
        }
    } catch (error) {
        console.error("Location error:", error);
        let message = "Error getting location: ";
        
        if (error.code === error.PERMISSION_DENIED) {
            message += "Please enable location permissions";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
            message += "Location unavailable";
        } else if (error.code === error.TIMEOUT) {
            message += "Request timed out";
        } else {
            message += error.message || "Unknown error";
        }
        
        showStatus(message, "error");
    } finally {
        if (elements.detectBtn) {
            elements.detectBtn.disabled = false;
            elements.detectBtn.textContent = "Detect My Location";
        }
    }
}

// Password validation functions
function checkPasswordStrength(value) {
    let strength = 0;
    
    if (value.length >= 8) strength++;
    if (value.length >= 12) strength++;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) strength++;
    if (/\d/.test(value)) strength++;
    if (/[^a-zA-Z0-9]/.test(value)) strength++;
    
    return strength;
}

function updatePasswordStrength() {
    const value = elements.password.value;
    const strength = checkPasswordStrength(value);
    
    elements.strengthMeter.className = "strength-meter-fill";
    
    if (value.length === 0) {
        elements.strengthMeter.style.width = "0%";
        isPasswordValid = false;
    } else if (strength <= 1) {
        elements.strengthMeter.classList.add("strength-weak");
        isPasswordValid = false;
    } else if (strength === 2) {
        elements.strengthMeter.classList.add("strength-medium");
        isPasswordValid = true;
    } else if (strength === 3) {
        elements.strengthMeter.classList.add("strength-strong");
        isPasswordValid = true;
    } else {
        elements.strengthMeter.classList.add("strength-very-strong");
        isPasswordValid = true;
    }
    
    checkPasswordMatch();
    checkFormCompletion();
}

function checkPasswordMatch() {
    const passwordValue = elements.password.value;
    const confirmValue = elements.confirmPassword.value;
    
    if (confirmValue.length === 0) {
        elements.passwordMatch.textContent = "";
        elements.passwordMatch.className = "";
        doPasswordsMatch = false;
    } else if (passwordValue === confirmValue) {
        elements.passwordMatch.textContent = "Passwords match!";
        elements.passwordMatch.className = "success-message";
        doPasswordsMatch = true;
    } else {
        elements.passwordMatch.textContent = "Passwords do not match!";
        elements.passwordMatch.className = "error-message";
        doPasswordsMatch = false;
    }
    
    checkFormCompletion();
}

// Form validation
function checkFormCompletion() {
    elements.submitBtn.disabled = !(
        elements.cookname.value.trim() && 
        elements.cookmob.value.trim() && 
        elements.cityDisplay.value.trim() && 
        isOtpVerified &&
        isPasswordValid &&
        doPasswordsMatch
    );
}

// OTP functions
async function sendOTP() {
    const phoneNumber = "+91" + elements.cookmob.value.trim();
    
    if (!phoneNumber || phoneNumber.length < 13) {
        showStatus("Please enter a valid 10-digit phone number.", "error");
        return;
    }

    try {
        elements.sendOtpButton.disabled = true;
        elements.sendOtpButton.textContent = "Sending OTP...";
        
        if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
        }

        const recaptchaVerifier = new RecaptchaVerifier('sendOtpButton', {
            'size': 'invisible',
        }, auth);

        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
        verificationId = confirmationResult.verificationId;
        
        elements.otpGroup.style.display = "flex";
        elements.sendOtpButton.textContent = "OTP Sent!";
        showStatus("OTP has been sent to your mobile number.", "success");
    } catch (error) {
        console.error("OTP sending error:", error);
        showStatus("Error sending OTP: " + error.message, "error");
        elements.sendOtpButton.disabled = false;
        elements.sendOtpButton.textContent = "Send OTP";
    }
}

async function verifyOTP() {
    const otp = elements.otpInput.value.trim();
    
    if (!otp || otp.length !== 6) {
        showStatus("Please enter a valid 6-digit OTP.", "error");
        return;
    }

    try {
        elements.verifyOtpButton.disabled = true;
        elements.verifyOtpButton.textContent = "Verifying...";
        
        const credential = PhoneAuthProvider.credential(verificationId, otp);
        await signInWithCredential(auth, credential);
        
        isOtpVerified = true;
        elements.verifyOtpButton.textContent = "Verified!";
        elements.verifyOtpButton.style.backgroundColor = "var(--color-success)";
        showStatus("Mobile number verified successfully!", "success");
        checkFormCompletion();
    } catch (error) {
        console.error("OTP verification error:", error);
        showStatus("Invalid OTP. Please try again.", "error");
        elements.verifyOtpButton.disabled = false;
        elements.verifyOtpButton.textContent = "Verify OTP";
        elements.verifyOtpButton.style.backgroundColor = "";
    }
}

// Toggle password visibility
function setupPasswordToggle() {
    elements.togglePasswordButtons.forEach(button => {
        button.addEventListener("click", function() {
            const input = this.parentElement.querySelector("input");
            if (input.type === "password") {
                input.type = "text";
                this.textContent = "👁️";
            } else {
                input.type = "password";
                this.textContent = "👁️";
            }
        });
    });
}

// Form submission
async function submitForm() {
    const sellerName = elements.cookname.value.trim();
    const sellerMob = elements.cookmob.value.trim();
    const sellerLocation = elements.cityDisplay.value.trim();
    const sellerPassword = elements.password.value;
    
    if (!sellerName || !sellerMob || !sellerLocation || !isOtpVerified || !isPasswordValid || !doPasswordsMatch) {
        showStatus("Please complete all required fields correctly.", "error");
        return;
    }

    try {
        elements.submitBtn.disabled = true;
        elements.submitBtn.textContent = "Registering...";
        
        const sellerData = {
            name: sellerName,
            mobile: sellerMob,
            location: sellerLocation,
            password: sellerPassword, // Note: In production, hash this password
            role: "seller",
            timestamp: new Date()
        };

        if (marker) {
            sellerData.coordinates = {
                lat: marker.position.lat,
                lng: marker.position.lng
            };
        }

        await addDoc(collection(db, "sellers"), sellerData);

        showStatus("Registration successful! Thank you for registering.", "success");
        
        // Reset form
        setTimeout(() => {
            elements.cookname.value = "";
            elements.cookmob.value = "";
            elements.password.value = "";
            elements.confirmPassword.value = "";
            elements.otpInput.value = "";
            elements.cityDisplay.value = "";
            elements.otpGroup.style.display = "none";
            isOtpVerified = false;
            isPasswordValid = false;
            doPasswordsMatch = false;
            elements.sendOtpButton.disabled = false;
            elements.sendOtpButton.textContent = "Send OTP";
            elements.verifyOtpButton.disabled = false;
            elements.verifyOtpButton.textContent = "Verify OTP";
            elements.verifyOtpButton.style.backgroundColor = "";
            elements.submitBtn.disabled = true;
            elements.submitBtn.textContent = "Complete Registration";
            elements.locationStatus.textContent = "";
            elements.locationStatus.className = "";
            elements.passwordMatch.textContent = "";
            elements.passwordMatch.className = "";
            elements.strengthMeter.className = "strength-meter-fill";
            elements.strengthMeter.style.width = "0%";
            if (elements.mapElement) elements.mapElement.style.display = "none";
        }, 2000);
        
    } catch (e) {
        console.error("Error adding document: ", e);
        showStatus("Error during registration. Please try again.", "error");
        elements.submitBtn.disabled = false;
        elements.submitBtn.textContent = "Complete Registration";
    }
}

// Initialize event listeners
function initEventListeners() {
    if (elements.detectBtn) {
        elements.detectBtn.addEventListener("click", detectLocation);
    }
    
    if (elements.sendOtpButton) {
        elements.sendOtpButton.addEventListener("click", sendOTP);
    }
    
    if (elements.verifyOtpButton) {
        elements.verifyOtpButton.addEventListener("click", verifyOTP);
    }
    
    if (elements.password) {
        elements.password.addEventListener("input", updatePasswordStrength);
    }
    
    if (elements.confirmPassword) {
        elements.confirmPassword.addEventListener("input", checkPasswordMatch);
    }
    
    if (elements.submitBtn) {
        elements.submitBtn.addEventListener("click", submitForm);
    }
    
    setupPasswordToggle();
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
    initEventListeners();
});