import { db } from '../firebase.js';
import { collection, getDocs, where, query, addDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";


const addMenuForm = document.getElementById('addMenuForm');
const itemNameInput = document.getElementById('itemName');
const sellerNameInput = document.getElementById('sellerName'); 
const priceInput = document.getElementById('price');
const regionInput = document.getElementById('region');
const availabilityInput = document.getElementById('availability');
const imageUploadInput = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const submitButton = document.getElementById('submitButton');


const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/dew4c5d4k/upload"; 
const UPLOAD_PRESET = "vtcjagi4"; 

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
    this.value = ''; 
  }
});


addMenuForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  submitButton.disabled = true;
  submitButton.textContent = 'Uploading...';

  try {

    const itemName = itemNameInput.value.trim();
    const sellerName = sellerNameInput.value.trim(); 
    const price = parseFloat(priceInput.value);
    const region = regionInput.value;
    const availability = availabilityInput.value;
    const imageFile = imageUploadInput.files[0];


    const rating = document.getElementById('rating')?.value ? parseFloat(document.getElementById('rating').value) : 0;
    const type = document.getElementById('type')?.value || '';


    if (!itemName || itemName.length < 2) {
      throw new Error('Item name must be at least 2 characters');
    }
    if (!sellerName || sellerName.length < 2) { 
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


    const q = query(collection(db, "items"), where("searchName", "==", itemName.toLowerCase()));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      throw new Error('An item with this name already exists!');
    }


    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("upload_preset", UPLOAD_PRESET); 

    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: "POST",
      body: formData,
    });

    const cloudinaryData = await response.json();

    if (!response.ok || !cloudinaryData.secure_url) {
      throw new Error(cloudinaryData.message || "Image upload to Cloudinary failed");
    }

    const photoUrl = cloudinaryData.secure_url;


    await addDoc(collection(db, "items"), {
      name: itemName,
      sellerName: sellerName, 
      price: price,
      region: region,
      photoUrl: photoUrl,
      availability: availability,
      rating: rating,
      type: type,
      createdAt: new Date().toISOString(),
      searchName: itemName.toLowerCase(),
    });

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