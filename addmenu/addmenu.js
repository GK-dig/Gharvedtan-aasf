import { db } from '../firebase.js';
import { collection, getDocs, where, query, addDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// DOM Elements
const addMenuForm = document.getElementById('addMenuForm');
const itemNameInput = document.getElementById('itemName');
const sellerNameInput = document.getElementById('sellerName'); // Added this line
const priceInput = document.getElementById('price');
const regionInput = document.getElementById('region');
const availabilityInput = document.getElementById('availability');
const imageUploadInput = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const submitButton = document.getElementById('submitButton');

// Constants
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/dew4c5d4k/upload"; // Replace with your Cloud name
const UPLOAD_PRESET = "vtcjagi4"; 

// Show image preview when file is selected
imageUploadInput.addEventListener('change', function () {
  const file = this.files[0];

  if (file && ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview" class="preview-image" />`;
    };
    reader.readAsDataURL(file);
  } else {
    imagePreview.innerHTML = '<span class="no-image">Please select a valid image (JPEG, PNG)</span>';
    this.value = ''; // Clear invalid file selection
  }
});

// Form submission handler
addMenuForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  submitButton.disabled = true;
  submitButton.textContent = 'Uploading...';

  try {
    // Get form values
    const itemName = itemNameInput.value.trim();
    const sellerName = sellerNameInput.value.trim(); // Get seller name
    const price = parseFloat(priceInput.value);
    const region = regionInput.value;
    const availability = availabilityInput.value;
    const imageFile = imageUploadInput.files[0];

    // Optional fields
    const rating = document.getElementById('rating')?.value ? parseFloat(document.getElementById('rating').value) : 0;
    const type = document.getElementById('type')?.value || '';

    // Validation
    if (!itemName || itemName.length < 2) {
      throw new Error('Item name must be at least 2 characters');
    }
    if (!sellerName || sellerName.length < 2) { // Validate seller name
      throw new Error('Seller name must be at least 2 characters');
    }
    if (isNaN(price) || price <= 0) {
      throw new Error('Please enter a valid price');
    }
    if (!imageFile) {
      throw new Error('Please select an image');
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(imageFile.type)) {
      throw new Error('Only JPEG, PNG images are allowed');
    }

    // Check for duplicates
    const q = query(collection(db, "items"), where("searchName", "==", itemName.toLowerCase()));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      throw new Error('An item with this name already exists!');
    }

    // Upload image to Cloudinary
    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("upload_preset", UPLOAD_PRESET); // Unsigned preset

    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: "POST",
      body: formData,
    });

    const cloudinaryData = await response.json();

    if (!response.ok || !cloudinaryData.secure_url) {
      throw new Error(cloudinaryData.message || "Image upload to Cloudinary failed");
    }

    const photoUrl = cloudinaryData.secure_url;

    // Save to Firestore
    await addDoc(collection(db, "items"), {
      name: itemName,
      sellerName: sellerName, // Added sellerName to the document
      price: price,
      region: region,
      photoUrl: photoUrl,
      availability: availability,
      rating: rating,
      type: type,
      createdAt: new Date().toISOString(),
      searchName: itemName.toLowerCase(),
    });

    // Success
    showSuccessMessage('Item added successfully!');
    resetForm();

  } catch (error) {
    console.error("Error:", error);
    showErrorMessage(`Error: ${error.message}`);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Add Item';
  }
});

// Helper functions
function resetForm() {
  addMenuForm.reset();
  imagePreview.innerHTML = '<span class="no-image">No image selected</span>';
}

function showSuccessMessage(message) {
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert success';
  alertDiv.textContent = message;
  document.body.appendChild(alertDiv);
  setTimeout(() => alertDiv.remove(), 3000);
}

function showErrorMessage(message) {
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert error';
  alertDiv.textContent = message;
  document.body.appendChild(alertDiv);
  setTimeout(() => alertDiv.remove(), 3000);
}