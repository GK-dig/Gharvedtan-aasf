import { db } from './firebase.js';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
const auth = getAuth();

// DOM Elements
const catalogue = document.querySelector(".popular-foods__catalogue");
const searchInput = document.querySelector(".subscription__form1 input");
const filterButtons = document.querySelectorAll(".popular-foods__filter-btn");

let allItems = [];
let activeRegion = "all";

// Normalize strings
const normalize = str => (str || "").toLowerCase().trim();

// 🔁 Load items from Firestore
async function loadItems() {
  try {
    const snapshot = await getDocs(collection(db, "items"));
    allItems = snapshot.docs.map(doc => {
      const item = doc.data();
      item.id = doc.id; // Include item ID
      return item;
    });
    renderFilteredItems(); // initial render
  } catch (error) {
    console.error("❌ Error loading items:", error);
    catalogue.innerHTML = "<p>❌ Failed to load items.</p>";
  }
}

// 🛒 Add to Cart
async function addToCart(item) {
  const user = auth.currentUser;
  if (!user) {
    alert("Please login to add items to cart.");
    return;
  }

  const cartRef = doc(db, "carts", user.uid);
  const cartSnap = await getDoc(cartRef);
  const newItem = {
    id: item.id,
    name: item.name,
    price: item.price,
    qty: 1
  };

  if (cartSnap.exists()) {
    const cartData = cartSnap.data();
    const items = cartData.items || [];

    const index = items.findIndex(i => i.id === item.id);
    if (index !== -1) {
      items[index].qty += 1;
    } else {
      items.push(newItem);
    }

    await setDoc(cartRef, { items }, { merge: true });
  } else {
    await setDoc(cartRef, { items: [newItem] });
  }

  alert(`${item.name} added to cart!`);
}

// 🧱 Render items to DOM
function renderItems(items) {
  catalogue.innerHTML = '';

  if (items.length === 0) {
    catalogue.innerHTML = `<p>No items found.</p>`;
    return;
  }

  items.forEach(item => {
    const card = document.createElement('article');
    card.className = 'popular-foods__card';

    card.innerHTML = `
      <img class="popular-foods__card-image" 
           src="${item.photoUrl || '/assets/default.png'}" 
           alt="${item.name || 'Food'}"
           onerror="this.onerror=null; this.src='/assets/default.png';" />

      <h1 class="popular-foods__card-seller">${item.sellerName || 'Unknown Seller'}</h1>
      <h4 class="popular-foods__card-title">${item.name || 'Unnamed Dish'}</h4>

      <div class="popular-foods__card-details flex-between">
        <div class="popular-foods__card-rating">
          <img src="/assets/star.svg" alt="star" />
          <p>${item.rating || 'N/A'}</p>
        </div>
        <p class="popular-foods__card-price">₹${item.price || 'N/A'}</p>
      </div>

      <p>Category: ${item.category || 'N/A'}</p>
      <p>Availability: ${item.availability || 'N/A'}</p>
      <p>Region: ${item.region || 'N/A'}</p>

      <div class="subscription__form">
        <button class="add-to-cart">Add to Cart</button>
      </div>
    `;

    catalogue.appendChild(card);
  });

  // Bind Add to Cart Buttons
  const addToCartButtons = document.querySelectorAll(".add-to-cart");
  addToCartButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      const item = items[index];
      addToCart(item);
    });
  });
}

// 🔍 Filter + Search logic
function renderFilteredItems() {
  const query = normalize(searchInput.value);

  const filtered = allItems.filter(item => {
    const nameMatch = normalize(item.name).includes(query);
    const sellerMatch = normalize(item.sellerName).includes(query);
    const regionMatch = normalize(item.region).includes(query);

    const matchesSearch = nameMatch || sellerMatch || regionMatch;

    const itemRegion = normalize(item.region).replace(/\s+/g, "");
    const activeRegionNorm = activeRegion.replace(/\s+/g, "");

    const matchesRegion = activeRegion === "all" || itemRegion === activeRegionNorm;

    return matchesSearch && matchesRegion;
  });

  renderItems(filtered);
}

// 🌐 Region filter buttons
filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    activeRegion = normalize(btn.dataset.region);
    renderFilteredItems();
  });
});

// 🚀 Load items on page load
loadItems();
