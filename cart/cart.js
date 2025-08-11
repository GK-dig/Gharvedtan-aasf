import { db } from '../firebase.js';
import { 
  doc, 
  getDoc,
  updateDoc,
  arrayRemove,
  increment
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// DOM Elements
const cartItemsContainer = document.getElementById('cartItems');
const itemCountElement = document.getElementById('itemCount');
const subtotalElement = document.getElementById('subtotal');
const totalElement = document.getElementById('total');
const checkoutBtn = document.getElementById('checkoutBtn');
const clearCartBtn = document.getElementById('clearCartBtn'); 

let cartData = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const loggedInUserStr = sessionStorage.getItem('loggedInUser');
    const loggedInUser = loggedInUserStr ? JSON.parse(loggedInUserStr) : null;

    if (!loggedInUser || !loggedInUser.uid) {
      console.warn("User not logged in or session missing");
      redirectToLogin();
      return;
    }

    await loadCart(loggedInUser.uid);
  } catch (error) {
    console.error("Error initializing cart:", error);
    showErrorState();
  }
});

function redirectToLogin() {
  window.location.href = "../loginsignup/work.html";
}

async function loadCart(userId) {
  try {
    const cartRef = doc(db, "carts", userId);
    const cartSnap = await getDoc(cartRef);

    console.log("Loading cart for user:", userId);
    console.log("Cart exists:", cartSnap.exists());

    if (cartSnap.exists()) {
      const data = cartSnap.data();

      cartData = {
        items: Array.isArray(data.items) ? data.items : [],
        total: typeof data.total === 'number' ? data.total : 0
      };

      cartData.items = cartData.items
        .filter(item => item && item.id && item.name && typeof item.price === 'number')
        .map(item => ({
          id: item.id,
          name: item.name,
          price: Math.max(0, parseFloat(item.price) || 0),
          quantity: item.quantity > 0 ? item.quantity : 1,
          sellerName: item.sellerName || 'Unknown Seller',
          photoUrl: item.photoUrl?.trim() || null
        }));

      renderCart();
    } else {
      showEmptyCart();
    }
  } catch (error) {
    console.error("Error loading cart:", error);
    showErrorState();
  }
}

function renderCart() {
  if (!cartData?.items || cartData.items.length === 0) {
    showEmptyCart();
    return;
  }

  cartItemsContainer.innerHTML = '';

  cartData.items.forEach(item => {
    const itemElement = document.createElement('div');
    itemElement.className = 'cart-item';
    itemElement.dataset.id = item.id;

    itemElement.innerHTML = `
      <img 
        src="${item.photoUrl || '../assets/default-food.png'}" 
        alt="${item.name}" 
        class="cart-item-image"
        onerror="this.onerror=null; this.src='../assets/default-food.png';">
      <div class="cart-item-details">
        <div class="cart-item-header">
          <h3 class="cart-item-name">${item.name}</h3>
          <span class="cart-item-price">₹${(item.price * item.quantity).toFixed(2)}</span>
        </div>
        <p class="cart-item-seller">${item.sellerName}</p>
        <div class="cart-item-actions">
          <div class="quantity-control">
            <button class="quantity-btn decrease" data-id="${item.id}">−</button>
            <span class="quantity-value">${item.quantity}</span>
            <button class="quantity-btn increase" data-id="${item.id}">+</button>
          </div>
          <button class="remove-item" data-id="${item.id}">Remove</button>
        </div>
      </div>
    `;

    cartItemsContainer.appendChild(itemElement);
  });

  attachEventListeners();
  updateSummary();
}

function attachEventListeners() {
  document.querySelectorAll('.decrease').forEach(btn => {
    btn.removeEventListener('click', handleDecrease);
    btn.addEventListener('click', handleDecrease);
  });

  document.querySelectorAll('.increase').forEach(btn => {
    btn.removeEventListener('click', handleIncrease);
    btn.addEventListener('click', handleIncrease);
  });

  document.querySelectorAll('.remove-item').forEach(btn => {
    btn.removeEventListener('click', handleRemove);
    btn.addEventListener('click', handleRemove);
  });

  if (clearCartBtn) {
    clearCartBtn.removeEventListener('click', handleClearCart);
    clearCartBtn.addEventListener('click', handleClearCart);
  }

  // Updated checkout button handler
  if (checkoutBtn) {
    checkoutBtn.removeEventListener('click', handleCheckout);
    checkoutBtn.addEventListener('click', handleCheckout);
  }
}

// Handler functions
const handleDecrease = async (e) => {
  const itemId = e.target.dataset.id;
  const user = getLoggedInUser();
  if (!user) return;

  const item = cartData.items.find(i => i.id === itemId);
  if (!item) return;

  if (item.quantity <= 1) {
    await removeItem(itemId, user.uid);
  } else {
    await updateQuantity(itemId, -1, user.uid);
  }
};

const handleIncrease = async (e) => {
  const itemId = e.target.dataset.id;
  const user = getLoggedInUser();
  if (!user) return;
  await updateQuantity(itemId, 1, user.uid);
};

const handleRemove = async (e) => {
  const itemId = e.target.dataset.id;
  const user = getLoggedInUser();
  if (!user) return;
  await removeItem(itemId, user.uid);
};

const handleClearCart = async () => {
  const user = getLoggedInUser();
  if (!user) return;

  const confirmed = window.confirm("Are you sure you want to clear your entire cart?");
  if (!confirmed) return;

  try {
    const cartRef = doc(db, "carts", user.uid);
    await updateDoc(cartRef, {
      items: [],
      total: 0,
      updatedAt: new Date()
    });

    cartData.items = [];
    cartData.total = 0;
    renderCart();
  } catch (error) {
    console.error("Failed to clear cart:", error);
    alert("Could not clear cart. Please try again.");
  }
};

// NEW: Checkout handler with Razorpay integration
const handleCheckout = async (e) => {
  e.preventDefault();
  const user = getLoggedInUser();
  if (!user || !cartData?.items || cartData.items.length === 0) return;

  const totalAmount = parseFloat(totalElement.textContent.replace(/[^\d.]/g, ''));
  
  const options = {
    key: "rzp_test_So0Z8L6zsfTX4h",
    amount: Math.round(totalAmount * 100), // Razorpay expects amount in paise
    currency: "INR",
    name: "My Test Store",
    description: "Order Payment",
    image: "https://your-logo-url.com/logo.png",
    handler: async function(response) {
      // Payment successful
      await handleSuccessfulPayment(response, user.uid, totalAmount);
    },
    prefill: {
      name: user.name || "Customer",
      email: user.email || "customer@example.com",
      contact: user.phoneNumber || "9999999999"
    },
    theme: {
      color: "#3399cc"
    }
  };

  const rzp1 = new Razorpay(options);
  rzp1.open();
};

// NEW: Handle successful payment and game prompt
async function handleSuccessfulPayment(response, userId, amount) {
  try {
    // Save order details
    const order = {
      paymentId: response.razorpay_payment_id,
      amount: amount,
      items: cartData.items,
      date: new Date().toISOString(),
      status: "completed"
    };

    // In a real app, you would save this to your database
    console.log("Order completed:", order);
    
    // Clear the cart after successful payment
    const cartRef = doc(db, "carts", userId);
    await updateDoc(cartRef, {
      items: [],
      total: 0,
      updatedAt: new Date()
    });

    // Ask user if they want to play the game
    const playGame = confirm('Payment successful! Would you like to play a game and earn discounts on your next order?');
    
    if (playGame) {
      // Redirect to game page
      window.location.href = '../game/index.html';
    } else {
      // Redirect to order confirmation or home page
      window.location.href = '../index.html';
    }
  } catch (error) {
    console.error("Error handling successful payment:", error);
    alert("Payment was successful but we encountered an error. Please contact support.");
  }
}

function getLoggedInUser() {
  const userStr = sessionStorage.getItem('loggedInUser');
  const user = userStr ? JSON.parse(userStr) : null;
  if (!user || !user.uid) {
    alert("You must be logged in.");
    redirectToLogin();
    return null;
  }
  return user;
}

async function updateQuantity(itemId, change, userId) {
  try {
    const cartRef = doc(db, "carts", userId);
    const itemIndex = cartData.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;

    const item = cartData.items[itemIndex];
    const newQuantity = item.quantity + change;

    if (newQuantity < 1) {
      await removeItem(itemId, userId);
      return;
    }

    const updatedItems = [...cartData.items];
    updatedItems[itemIndex] = { ...item, quantity: newQuantity };
    const priceDiff = item.price * change;

    await updateDoc(cartRef, {
      items: updatedItems,
      total: increment(priceDiff),
      updatedAt: new Date()
    });

    await loadCart(userId);
  } catch (error) {
    console.error("Update quantity failed:", error);
    alert("Failed to update quantity.");
  }
}

async function removeItem(itemId, userId) {
  try {
    const cartRef = doc(db, "carts", userId);
    const item = cartData.items.find(i => i.id === itemId);
    if (!item) return;

    await updateDoc(cartRef, {
      items: arrayRemove(item),
      total: increment(-item.price * item.quantity),
      updatedAt: new Date()
    });

    await loadCart(userId);
  } catch (error) {
    console.error("Remove item failed:", error);
    alert("Failed to remove item.");
  }
}

function updateSummary() {
  const subtotal = cartData.items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  const itemCount = cartData.items.reduce((sum, item) => sum + item.quantity, 0);
  const deliveryFee = 49;
  const total = subtotal + deliveryFee;

  itemCountElement.textContent = itemCount;
  subtotalElement.textContent = `₹${subtotal.toFixed(2)}`;
  totalElement.textContent = `₹${total.toFixed(2)}`;
  checkoutBtn.disabled = itemCount === 0;

  if (clearCartBtn) {
    clearCartBtn.disabled = itemCount === 0;
    clearCartBtn.style.opacity = itemCount === 0 ? "0.5" : "1";
    clearCartBtn.style.cursor = itemCount === 0 ? "not-allowed" : "pointer";
  }
}

function showEmptyCart() {
  cartItemsContainer.innerHTML = `
    <div class="empty-cart">
      <img src="../assets/empty-cart.svg" alt="Empty cart">
      <h3>Your cart is empty</h3>
      <p>Looks like you haven't added anything to your cart yet</p>
      <a href="../index.html" class="btn-primary">Browse Menu</a>
    </div>
  `;
  itemCountElement.textContent = '0';
  subtotalElement.textContent = '₹0.00';
  totalElement.textContent = '₹49.00';
  checkoutBtn.disabled = true;

  if (clearCartBtn) {
    clearCartBtn.disabled = true;
    clearCartBtn.style.opacity = "0.5";
    clearCartBtn.style.cursor = "not-allowed";
  }
}

function showErrorState() {
  cartItemsContainer.innerHTML = `
    <div class="error-state">
      <img src="../assets/error-icon.svg" alt="Error">
      <h3>Failed to load your cart</h3>
      <p>Please try again later</p>
      <button onclick="window.location.reload()" class="btn-primary">Retry</button>
    </div>
  `;
  checkoutBtn.disabled = true;
  if (clearCartBtn) clearCartBtn.disabled = true;
}