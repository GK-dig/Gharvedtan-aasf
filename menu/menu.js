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

// Wait for auth to be ready
const authPromise = new Promise(resolve => {
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    authReady = true;
    console.log("Auth state:", user ? "Authenticated" : "Not authenticated");
    resolve();
  });
});

// Enhanced search function with debouncing
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

// Highlight search matches in results
const highlightMatches = (text, query) => {
  if (!query.trim()) return text;
  
  return text.replace(new RegExp(query.split(" ").join("|"), "gi"), 
    match => `<span class="search-highlight">${match}</span>`
  );
};

// Enhanced render function with search highlighting
function renderItems(items, searchQuery = '') {
  catalogue.innerHTML = '';

  if (items.length === 0) {
    catalogue.innerHTML = `
      <div class="no-results">
        <img src="/assets/search-empty.svg" alt="No results" width="120"/>
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

    card.innerHTML = `
      <img class="popular-foods__card-image" 
           src="${item.photoUrl || '/assets/default.png'}" 
           alt="${item.name || 'Food'}"
           onerror="this.onerror=null; this.src='/assets/default.png';" />

      <h1 class="popular-foods__card-seller">${
        highlightMatches(item.sellerName || 'Unknown Seller', searchQuery)
      }</h1>
      <h4 class="popular-foods__card-title">${
        highlightMatches(item.name || 'Unnamed Dish', searchQuery)
      }</h4>

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

  document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', () => {
      const itemId = button.dataset.id;
      const item = allItems.find(i => i.id === itemId);
      if (item) addToCart(item);
    });
  });
}

// Optimized cart function with quantity validation
async function addToCart(item) {
  try {
    if (!authReady) await authPromise;
    if (!currentUser) {
      alert("Please sign in to add items to your cart");
      window.location.href = "../loginsignup/work.html";
      return;
    }

    const cartRef = doc(db, "carts", currentUser.uid);
    const cartSnap = await getDoc(cartRef);
    
    const newItem = {
      id: item.id,
      name: item.name,
      price: item.price,
      photoUrl: item.photoUrl || '/assets/default.png',
      sellerName: item.sellerName || 'Unknown Seller',
      quantity: 1,
      lastUpdated: new Date()
    };

    if (cartSnap.exists()) {
      const cartData = cartSnap.data();
      const existingItemIndex = cartData.items.findIndex(i => i.id === item.id);
      
      if (existingItemIndex >= 0) {
        const updatedItems = [...cartData.items];
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
        userId: currentUser.uid,
        items: [newItem],
        total: item.price,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Visual feedback
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

// Filter and render with debouncing
const renderFilteredItems = debounce(() => {
  const query = searchInput.value.trim();
  const regionFiltered = activeRegion === "all" 
    ? allItems 
    : allItems.filter(item => normalize(item.region) === normalize(activeRegion));

  const searchResults = searchItems(query, regionFiltered);
  renderItems(searchResults, query);
}, 300);

// Event listeners
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
searchInput.addEventListener('keypress', (e) => e.key === 'Enter' && renderFilteredItems());

// Initialize
async function initialize() {
  try {
    await authPromise;
    const snapshot = await getDocs(collection(db, "items"));
    allItems = snapshot.docs.map(doc => ({
      id: doc.id,
      sellerName: doc.data().sellerName || 'Unknown Seller',
      ...doc.data()
    }));
    renderFilteredItems();
  } catch (error) {
    console.error("Initialization error:", error);
    catalogue.innerHTML = `
      <div class="error-state">
        <img src="/assets/error-icon.svg" alt="Error" width="80"/>
        <p>Failed to load menu. Please refresh the page.</p>
        <button onclick="window.location.reload()">Reload Page</button>
      </div>
    `;
  }
}

initialize();

// Add this CSS to your styles:
/*
.search-highlight {
  background-color: #fff9c4;
  padding: 0 2px;
  border-radius: 3px;
  font-weight: 500;
}

.no-results, .error-state {
  text-align: center;
  padding: 2rem;
  margin: 2rem 0;
}

.no-results img, .error-state img {
  margin-bottom: 1rem;
  opacity: 0.7;
}

.clear-search, .error-state button {
  background: #FF6B6B;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  margin-top: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-search:hover, .error-state button:hover {
  background: #FF5252;
}
*/