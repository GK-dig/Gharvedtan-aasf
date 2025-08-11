import { db } from '../firebase.js';
import { collection, getDocs, where, query, addDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";

// Initialize Firebase Storage
const storage = getStorage(app);

// DOM Elements
const addMenuForm = document.getElementById('addMenuForm');
const itemNameInput = document.getElementById('itemName');
const priceInput = document.getElementById('price');
const regionInput = document.getElementById('region');
const availabilityInput = document.getElementById('availability');
const imageUploadInput = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const submitButton = document.getElementById('submitButton');

// Constants
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

// Show image preview when file is selected
imageUploadInput.addEventListener('change', function() {
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
    const price = parseFloat(priceInput.value);
    const region = regionInput.value;
    const availability = availabilityInput.value;
    const imageFile = imageUploadInput.files[0];
    
    // Optional fields
    const rating = document.getElementById('rating')?.value ? parseFloat(document.getElementById('rating').value) : 0;
    const type = document.getElementById('type')?.value || '';
    const sellerName = document.getElementById('sellerName')?.value || '';

    // Validation
    if (!itemName || itemName.length < 2) {
      throw new Error('Item name must be at least 2 characters');
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

    // Upload image to Firebase Storage
    const storageRef = ref(storage, `menuImages/${Date.now()}-${imageFile.name}`);
    await uploadBytes(storageRef, imageFile);
    const downloadURL = await getDownloadURL(storageRef);

    // Save to Firestore
    await addDoc(collection(db, "items"), {
      name: itemName,
      price: price,
      region: region,
      photoUrl: downloadURL,
      availability: availability,
      rating: rating,
      type: type,
      sellerName: sellerName,
      createdAt: new Date().toISOString(),
      searchName: itemName.toLowerCase()
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
