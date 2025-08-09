import { getFirestore, collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { db } from './firebase.js'; // Your Firestore config setup

// State variables
let otpGenerated = null;
let otpExpirationTime = null;
let userCoordinates = null; // Declare userCoordinates at the top
let locationVerified = false; // Declare locationVerified for tracking location status

// DOM Elements
const cookNameInput = document.getElementById('cookname');
const cookMobInput = document.getElementById('cookmob');
const sendOtpButton = document.getElementById('sendOtpButton');
const otpGroup = document.getElementById('otpGroup');
const otpInput = document.getElementById('otpInput');
const verifyOtpButton = document.getElementById('verifyOtpButton');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const cookAddressInput = document.getElementById('cookaddress');
const detectLocationBtn = document.getElementById('detect-location-btn');
const locationStatus = document.getElementById('location-status');
const coordinatesDisplay = document.getElementById('coordinates-display');
const mapContainer = document.getElementById('map-container');
const osmMap = document.getElementById('osm-map');
const submitBtn = document.getElementById('submitBtn');
const strengthMeter = document.getElementById('strengthMeter');
const passwordMatch = document.getElementById('passwordMatch');
const togglePasswordButtons = document.querySelectorAll('.toggle-password');
const experienceInput = document.getElementById('experience');
const specialtiesInput = document.getElementById('specialties');

function initEventListeners() {
    sendOtpButton.addEventListener('click', handleSendOtp);
    verifyOtpButton.addEventListener('click', handleVerifyOtp);
    passwordInput.addEventListener('input', checkPasswordStrength);
    confirmPasswordInput.addEventListener('input', checkPasswordMatch); // Link the function here
    detectLocationBtn.addEventListener('click', detectLocation);
    submitBtn.addEventListener('click', handleSubmit);

    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            this.textContent = type === 'password' ? '👁️' : '🔒';
        });
    });

    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', validateForm);
    });
}

function generateOTP() {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpExpirationTime = new Date().getTime() + 300000; 
    return otp;
}

function isOtpExpired() {
    return new Date().getTime() > otpExpirationTime;
}

// Function to check if the mobile number already exists in Firestore
async function isMobileNumberAlreadyExists(mobileNumber) {
    const sellersRef = collection(db, "sellers");
    const q = query(sellersRef, where("mobile", "==", mobileNumber));
    const querySnapshot = await getDocs(q);

    return !querySnapshot.empty; // Returns true if the number already exists
}

function handleSendOtp() {
    const mobileNumber = cookMobInput.value.trim();

    if (!/^\d{10}$/.test(mobileNumber)) {
        showStatus(locationStatus, 'Please enter a valid 10-digit mobile number', 'error');
        return;
    }

    otpGenerated = generateOTP();
    console.log(`OTP for ${mobileNumber}: ${otpGenerated}`); 
    showStatus(locationStatus, 'OTP sent to your mobile number', 'success');

    otpGroup.style.display = 'flex';
    sendOtpButton.disabled = true;
    cookMobInput.readOnly = true;

    setTimeout(() => {
        sendOtpButton.disabled = false;
        sendOtpButton.textContent = 'Resend OTP';
    }, 30000);
}

function handleVerifyOtp() {
    const otp = otpInput.value.trim();

    if (!/^\d{6}$/.test(otp)) {
        showStatus(locationStatus, 'Please enter a valid 6-digit OTP', 'error');
        return;
    }

    if (isOtpExpired()) {
        showStatus(locationStatus, 'OTP has expired. Please request a new one.', 'error');
        otpGroup.style.display = 'none';
        sendOtpButton.disabled = false;
        cookMobInput.readOnly = false;
        return;
    }

    if (otp === otpGenerated) {
        showStatus(locationStatus, 'Mobile number verified successfully', 'success');
        otpGroup.style.display = 'none';
        verifyOtpButton.disabled = true;
        otpInput.readOnly = true;
        validateForm();
    } else {
        showStatus(locationStatus, 'Invalid OTP. Please try again.', 'error');
    }
}

function checkPasswordMatch() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (confirmPassword.length === 0) {
        passwordMatch.textContent = '';
    } else if (password === confirmPassword) {
        passwordMatch.textContent = 'Passwords match';
        passwordMatch.className = 'success-message';
    } else {
        passwordMatch.textContent = 'Passwords do not match';
        passwordMatch.className = 'error-message';
    }

    validateForm(); 
}

function checkPasswordStrength() {
    const password = passwordInput.value;
    let strength = 0;
    const meterWidth = password.length > 0 ? 100 : 0;
    
    const hasMinLength = password.length >= 8;
    const hasGoodLength = password.length >= 12;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChars = /[^A-Za-z0-9]/.test(password);
    
    if (hasMinLength) strength += 1;
    if (hasGoodLength) strength += 1;
    if (hasUpperCase) strength += 1;
    if (hasNumbers) strength += 1;
    if (hasSpecialChars) strength += 1;
    
    strengthMeter.style.width = `${meterWidth}%`;
    strengthMeter.className = 'strength-meter-fill';
    
    if (password.length === 0) {
        strengthMeter.style.width = '0%';
    } else if (strength <= 2) {
        strengthMeter.classList.add('strength-weak');
    } else if (strength === 3) {
        strengthMeter.classList.add('strength-medium');
    } else if (strength === 4) {
        strengthMeter.classList.add('strength-strong');
    } else {
        strengthMeter.classList.add('strength-very-strong');
    }
    
    validateForm();
}

function detectLocation() {
    showStatus(locationStatus, 'Detecting your location...', 'warning');
    
    if (!navigator.geolocation) {
        showStatus(locationStatus, 'Geolocation is not supported by your browser', 'error');
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        position => {
            userCoordinates = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
            };
            showStatus(locationStatus, 'Location detected! Fetching address...', 'success');
            displayCoordinates(userCoordinates);
            reverseGeocode(userCoordinates);
            showMap(userCoordinates);
        },
        error => {
            handleGeolocationError(error);
        },
        { 
            enableHighAccuracy: true, 
            timeout: 10000,
            maximumAge: 0
        }
    );
}

function displayCoordinates(coords) {
    coordinatesDisplay.textContent = `Latitude: ${coords.latitude.toFixed(6)}, Longitude: ${coords.longitude.toFixed(6)} (Accuracy: ${Math.round(coords.accuracy)} meters)`;
    coordinatesDisplay.style.display = 'block';
}

async function reverseGeocode(coords) {
    try {
        const { latitude, longitude } = coords;
        const apiKey = '746316c1987948209ad60505dfd5e8be'; // Replace with your OpenCage API key
        const apiUrl = `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${apiKey}&language=en&pretty=1`;

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Failed to fetch the address');

        const data = await response.json();

        if (data.status.code !== 200) {
            throw new Error('Failed to fetch address');
        }

        const address = data.results[0].formatted;
        cookAddressInput.value = address;

        showStatus(locationStatus, 'Address fetched successfully!', 'success');
        locationVerified = true;
        validateForm();

    } catch (error) {
        console.error('Reverse geocoding error:', error);
        showStatus(locationStatus, 'Failed to fetch address details. You can enter it manually.', 'error');
        cookAddressInput.readOnly = false;
        locationVerified = true;
        validateForm();
    }
}

function constructReadableAddress(address) {
    const addressParts = [
        address.road,
        address.neighbourhood,
        address.suburb,
        address.city_district,
        address.city,
        address.state,
        address.country
    ].filter(part => part); 
    
    return addressParts.join(', ');
}

function showMap(coords) {
    const { latitude, longitude } = coords;
    const zoom = 15;
    
    osmMap.src = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.01}%2C${latitude-0.01}%2C${longitude+0.01}%2C${latitude+0.01}&layer=mapnik&marker=${latitude}%2C${longitude}`;
    mapContainer.style.display = 'block';
}

function validateForm() {
    const isNameValid = cookNameInput.value.trim().length >= 2;
    const isMobileValid = /^\d{10}$/.test(cookMobInput.value.trim());
    const isPasswordValid = passwordInput.value.length >= 8;
    const isPasswordMatchValid = passwordInput.value === confirmPasswordInput.value && passwordInput.value.length > 0;
    const isAddressValid = cookAddressInput.value.trim().length > 0;
    const isExperienceValid = experienceInput.value.trim().length > 0;
    const isSpecialtiesValid = specialtiesInput.value.trim().length > 0;

    submitBtn.disabled = !(isNameValid && isMobileValid && otpGenerated && isPasswordValid && 
        isPasswordMatchValid && isAddressValid && locationVerified &&
        isExperienceValid && isSpecialtiesValid);
    
    return !submitBtn.disabled;
}

function showStatus(element, message, type) {
    element.textContent = message;
    element.className = `${type}-message`;
    element.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

async function handleSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
        showStatus(locationStatus, 'Please fill all required fields correctly', 'error');
        return;
    }

    const mobile = cookMobInput.value.trim();

    // Check if the mobile number is already in use
    const isDuplicate = await isMobileNumberAlreadyExists(mobile);

    if (isDuplicate) {
        showStatus(locationStatus, 'This mobile number is already registered. Please use a different number.', 'error');
        return;
    }

    const password = passwordInput.value;
    const name = cookNameInput.value.trim();
    const experience = experienceInput.value.trim();
    const specialties = specialtiesInput.value.trim().split(',').map(s => s.trim());
    const address = cookAddressInput.value.trim();

    // Firestore logic to save data
    try {
        const docRef = await addDoc(collection(db, "sellers"), {
            password,
            name,
            mobile,
            experience,
            specialties,
            address,
            location: userCoordinates // save location if needed
        });

        console.log("Document written with ID: ", docRef.id);
        showStatus(locationStatus, 'Form submitted and data saved successfully!', 'success');
        alert('Form submitted successfully!');
    } catch (error) {
        console.error("Error adding document: ", error);
        showStatus(locationStatus, 'There was an error saving your data. Please try again.', 'error');
    }
}

initEventListeners();
