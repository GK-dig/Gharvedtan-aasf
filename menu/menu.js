import { db } from './firebase.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const catalogue = document.querySelector(".popular-foods__catalogue");
const searchInput = document.querySelector(".subscription__form1 input");
const filterButtons = document.querySelectorAll(".popular-foods__filter-btn");
const searchBtn = document.getElementById("searchBtn"); 

let allItems = [];
let activeRegion = "all"; 
const normalize = str => (str || "").toLowerCase().trim();

async function loadItems() {
  try {
    const snapshot = await getDocs(collection(db, "items"));
    allItems = snapshot.docs.map(doc => doc.data());
    renderFilteredItems();
  } catch (error) {
    console.error(" Error loading items:", error);
    catalogue.innerHTML = "<p> Failed to load items.</p>";
  }
}

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

  const addToCartButtons = document.querySelectorAll(".add-to-cart");
  addToCartButtons.forEach(button => {
    button.addEventListener("click", () => {
      const itemCard = button.closest('.popular-foods__card');
      const itemName = itemCard.querySelector('.popular-foods__card-title').textContent;
      alert(`Added ${itemName} to cart!`);
    });
  });
}

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

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {

    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    activeRegion = normalize(btn.dataset.region); 
    renderFilteredItems(); 
  });
});

searchInput.addEventListener("input", () => {
  renderFilteredItems(); 
});

searchBtn.addEventListener("click", () => {
  renderFilteredItems(); 
});

searchInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    renderFilteredItems(); 
  }
});

window.addEventListener('DOMContentLoaded', () => {
  const allFilterButton = document.querySelector(`[data-region="all"]`);
  if (allFilterButton) {
    allFilterButton.classList.add("active"); 
  }
  loadItems();
});
