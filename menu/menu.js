import { db } from './firebase.js';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
const auth = getAuth();

const catalogue = document.querySelector(".popular-foods__catalogue");
const searchInput = document.querySelector(".subscription__form1 input");
const filterButtons = document.querySelectorAll(".popular-foods__filter-btn");
const searchBtn = document.getElementById("searchBtn"); 

let allItems = [];
let activeRegion = "all";
let currentUser = null;

// Check auth state when page loads
onAuthStateChanged(auth, (user) => {
  currentUser = user;
});

// Helper: Normalize strings
const normalize = str => (str || "").toLowerCase().trim();

// Add to Cart Functionality with User UID and Seller Details
async function addToCart(item) {
  if (!currentUser) {
    alert("Please sign in to add items to your cart");
    window.location.href = "../loginsignup/work.html";
    return;
  }

  const cartRef = doc(db, "carts", currentUser.uid);
  
  try {
    const cartSnap = await getDoc(cartRef);
    
    if (cartSnap.exists()) {
      const cartData = cartSnap.data();
      const existingItem = cartData.items.find(cartItem => 
        cartItem.id === item.id && cartItem.sellerId === item.sellerId
      );
      
      if (existingItem) {
        await updateDoc(cartRef, {
          items: cartData.items.map(cartItem => 
            cartItem.id === item.id && cartItem.sellerId === item.sellerId
              ? { ...cartItem, quantity: cartItem.quantity + 1 }
              : cartItem
          ),
          total: increment(item.price),
          updatedAt: new Date()
        });
        alert(`${item.name} quantity increased in your cart`);
      } else {
        await updateDoc(cartRef, {
          items: arrayUnion({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
            photoUrl: item.photoUrl,
            sellerId: item.sellerId,
            sellerName: item.sellerName
          }),
          total: increment(item.price),
          updatedAt: new Date()
        });
        alert(`${item.name} added to your cart`);
      }
    } else {
      await setDoc(cartRef, {
        userId: currentUser.uid,
        items: [{
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          photoUrl: item.photoUrl,
          sellerId: item.sellerId,
          sellerName: item.sellerName
        }],
        total: item.price,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      alert(`${item.name} added to your cart`);
    }
  } catch (error) {
    console.error("Error updating cart:", error);
    alert("Failed to add item to cart. Please try again.");
  }
}

// Load items from Firestore with seller details
async function loadItems() {
  try {
    const snapshot = await getDocs(collection(db, "items"));
    allItems = snapshot.docs.map(doc => ({
      id: doc.id,
      sellerId: doc.data().sellerId,       // Ensure these fields exist
      sellerName: doc.data().sellerName,   // in your Firestore items
      ...doc.data()
    }));
    renderFilteredItems();
  } catch (error) {
    console.error("Error loading items:", error);
    catalogue.innerHTML = "<p>Failed to load items.</p>";
  }
}

// Render items to DOM with proper seller info
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

      <div class="subscription__form">
        <button class="add-to-cart" data-id="${item.id}">Add to Cart</button>
      </div>
    `;

    catalogue.appendChild(card);
  });

  // Add event listeners to all Add to Cart buttons
  document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', () => {
      const itemId = button.dataset.id;
      const item = allItems.find(i => i.id === itemId);
      if (item) {
        addToCart(item);
      }
    });
  });
}

// Filter and search functionality
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

// Event listeners
filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeRegion = normalize(btn.dataset.region);
    renderFilteredItems();
  });
});

searchBtn.addEventListener("click", () => {
  renderFilteredItems();
});

searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    renderFilteredItems();
  }
});

// Initialize
loadItems();