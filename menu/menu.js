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
let authReady = false;


const authPromise = new Promise(resolve => {
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    authReady = true;
    console.log("Auth state:", user ? "Authenticated" : "Not authenticated");
    resolve();
  });
});


const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

const normalize = str => (str || "").toLowerCase().trim().replace(/\s+/g, " ");

const searchItems = (query, items) => {
  if (!query.trim()) return items;
  
  const normalizedQuery = normalize(query);
  const queryTerms = normalizedQuery.split(" ").filter(term => term.length > 0);

  return items.filter(item => {
    const searchFields = [
      item.name,
      item.sellerName,
      item.description || '',
      item.region || '',
      item.category || ''
    ].map(field => normalize(field));

    return queryTerms.every(term => 
      searchFields.some(field => field.includes(term))
    );
  });
};

const highlightMatches = (text, query) => {
  if (!query.trim()) return text;
  
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(escapedQuery.split(" ").join("|"), "gi"), 
    match => `<span class="search-highlight">${match}</span>`
  );
};

// Render Functions
function renderItems(items, searchQuery = '') {
  catalogue.innerHTML = '';

  if (items.length === 0) {
    catalogue.innerHTML = `
      <div class="no-results">
        <img src="../assets/search-empty.svg" alt="No results" width="120"/>
        <p>No items found matching "${searchQuery}"</p>
        <button class="clear-search">Clear search</button>
      </div>
    `;
    
    document.querySelector('.clear-search')?.addEventListener('click', () => {
      searchInput.value = '';
      renderFilteredItems();
    });
    return;
  }

  items.forEach(item => {
    const card = document.createElement('article');
    card.className = 'popular-foods__card';
    card.dataset.region = item.region || '';

    card.innerHTML = `
      <img class="popular-foods__card-image" 
           src="${item.photoUrl || '../assets/default.png'}" 
           alt="${item.name || 'Food'}"
           onerror="this.onerror=null; this.src='../assets/default.png';" />

      <h1 class="popular-foods__card-seller">${
        highlightMatches(item.sellerName || 'Unknown Seller', searchQuery)
      }</h1>
      <h4 class="popular-foods__card-title">${
        highlightMatches(item.name || 'Unnamed Dish', searchQuery)
      }</h4>

      <div class="popular-foods__card-details flex-between">
        <div class="popular-foods__card-rating">
          <img src="../assets/star.svg" alt="star" />
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


  document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', async () => {
      const itemId = button.dataset.id;
      const item = allItems.find(i => i.id === itemId);
      if (item) {
        button.disabled = true;
        await addToCart(item);
        button.disabled = false;
      }
    });
  });
}

async function addToCart(item) {
  try {
    if (!authReady) await authPromise;

    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    
    if (!loggedInUser) {
      alert("Please sign in to add items to your cart");
      window.location.href = "../loginsignup/work.html";  
      return;  
    }

    const cartRef = doc(db, "carts", loggedInUser.uid);  
    const cartSnap = await getDoc(cartRef);

    const newItem = {
      id: item.id,
      name: item.name,
      price: item.price,
      photoUrl: item.photoUrl || '../assets/default.png',
      sellerName: item.sellerName || 'Unknown Seller',
      quantity: 1,
      lastUpdated: new Date()
    };

    if (cartSnap.exists()) {
      const cartData = cartSnap.data();
      const items = cartData.items || [];  
      const existingItemIndex = items.findIndex(i => i.id === item.id);

      if (existingItemIndex >= 0) {
        const updatedItems = [...items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1,
          lastUpdated: new Date()
        };

        await updateDoc(cartRef, {
          items: updatedItems,
          total: increment(item.price),
          updatedAt: new Date()
        });
      } else {
        await updateDoc(cartRef, {
          items: arrayUnion(newItem),
          total: increment(item.price),
          updatedAt: new Date()
        });
      }
    } else {
      await setDoc(cartRef, {
        userId: loggedInUser.uid,
        items: [newItem],
        total: item.price,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    const btn = document.querySelector(`.add-to-cart[data-id="${item.id}"]`);
    if (btn) {
      btn.textContent = '✓ Added';
      btn.style.backgroundColor = '#4CAF50';
      setTimeout(() => {
        btn.textContent = 'Add to Cart';
        btn.style.backgroundColor = '';
      }, 2000);
    }
  } catch (error) {
    console.error("Cart error:", error);
    alert(`Failed to update cart: ${error.message}`);
  }
}

const renderFilteredItems = debounce(() => {
  const query = searchInput.value.trim();
  const regionFiltered = activeRegion === "all" 
    ? allItems 
    : allItems.filter(item => normalize(item.region || '') === normalize(activeRegion));

  const searchResults = searchItems(query, regionFiltered);
  renderItems(searchResults, query);
}, 300);

function setupEventListeners() {
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeRegion = normalize(btn.dataset.region);
      renderFilteredItems();
    });
  });

  searchInput.addEventListener('input', renderFilteredItems);
  searchBtn.addEventListener('click', renderFilteredItems);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') renderFilteredItems();
  });
}


async function initialize() {
  try {
    setupEventListeners();
    await authPromise;
    
    const snapshot = await getDocs(collection(db, "items"));
    allItems = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      sellerName: doc.data().sellerName || 'Unknown Seller'
    }));
    
    renderFilteredItems();
  } catch (error) {
    console.error("Initialization error:", error);
    catalogue.innerHTML = `
      <div class="error-state">
        <img src="../assets/error-icon.svg" alt="Error" width="80"/>
        <p>Failed to load menu. Please refresh the page.</p>
        <button onclick="window.location.reload()">Reload Page</button>
      </div>
    `;
  }
}

initialize();
