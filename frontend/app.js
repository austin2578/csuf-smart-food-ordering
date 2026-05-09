const MENU_URL = "http://localhost:3001/menu";
const ORDER_URL = "http://localhost:3002/orders";

let currentRole = null;
let currentMenuData = [];
let selectedOrderItems = [];
let allOrders = [];

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function showResponse(data) {
  document.getElementById("responseBox").textContent = JSON.stringify(data, null, 2);
}

function setRole(role) {
  currentRole = role;
  selectedOrderItems = [];

  document.getElementById("roleScreen").classList.add("hidden");
  document.getElementById("appScreen").classList.remove("hidden");

  const customerPanel = document.getElementById("customerPanel");
  const merchantPanel = document.getElementById("merchantPanel");
  const roleLabel = document.getElementById("currentRoleLabel");
  const roleDescription = document.getElementById("roleDescription");

  if (role === "customer") {
    customerPanel.classList.remove("hidden");
    merchantPanel.classList.add("hidden");
    roleLabel.textContent = "Current Role: Customer";
    roleDescription.textContent = "Browse menus, place orders, and view your order history.";
  } else {
    customerPanel.classList.add("hidden");
    merchantPanel.classList.remove("hidden");
    roleLabel.textContent = "Current Role: Merchant";
    roleDescription.textContent = "Manage menus, view orders, and update order status.";
    loadOrders();
  }

  loadMenu();
}

function changeRole() {
  currentRole = null;
  selectedOrderItems = [];
  document.getElementById("appScreen").classList.add("hidden");
  document.getElementById("roleScreen").classList.remove("hidden");
}

async function loadMenu() {
  try {
    const res = await fetch(MENU_URL);
    const data = await res.json();
    currentMenuData = data;

    renderMenu(data);
    populateRestaurantDropdown(data);

    if (currentRole === "customer") loadRestaurantItems();
    showResponse(data);
  } catch (error) {
    showResponse({
      error: "Could not load menu. Make sure the Menu Service is running on localhost:3001.",
      details: error.message
    });
  }
}

function renderMenu(menuData) {
  const list = document.getElementById("menuList");
  list.innerHTML = "";

  const grouped = {};
  menuData.forEach((item) => {
    const restaurant = item.restaurant || "Unknown Restaurant";
    if (!grouped[restaurant]) grouped[restaurant] = [];
    grouped[restaurant].push(item);
  });

  Object.keys(grouped).sort().forEach((restaurant) => {
    const section = document.createElement("div");
    section.className = "restaurant-section";

    const title = document.createElement("h3");
    title.textContent = restaurant;
    section.appendChild(title);

    grouped[restaurant].forEach((item) => {
      const itemDiv = document.createElement("div");
      itemDiv.className = "menu-item";

      const merchantDeleteButton = currentRole === "merchant"
        ? `<button class="delete-button" onclick="deleteMenuItem(${item.id})">Remove</button>`
        : "";

      itemDiv.innerHTML = `
        <div>
          <strong>${item.item}</strong><br/>
          <small>${item.available ? "Available" : "Unavailable"} • ID ${item.id}</small>
        </div>
        <div class="price-action">
          <span class="price">${money(item.price)}</span>
          ${merchantDeleteButton}
        </div>
      `;

      section.appendChild(itemDiv);
    });

    list.appendChild(section);
  });
}

function populateRestaurantDropdown(menuData) {
  const select = document.getElementById("restaurantSelect");
  if (!select) return;

  const previousValue = select.value;
  const restaurants = [...new Set(menuData.map((item) => item.restaurant || "Unknown Restaurant"))].sort();

  select.innerHTML = `<option value="">Select a restaurant</option>`;
  restaurants.forEach((restaurant) => {
    const option = document.createElement("option");
    option.value = restaurant;
    option.textContent = restaurant;
    select.appendChild(option);
  });

  if (restaurants.includes(previousValue)) select.value = previousValue;
}

function loadRestaurantItems() {
  const selectedRestaurant = document.getElementById("restaurantSelect").value;
  const itemList = document.getElementById("orderItemList");
  selectedOrderItems = [];
  updateSelectedTotal();
  itemList.innerHTML = "";

  if (!selectedRestaurant) {
    itemList.innerHTML = `<p class="empty-state">Select a restaurant to view menu items.</p>`;
    return;
  }

  const items = currentMenuData.filter((item) => item.restaurant === selectedRestaurant && item.available);

  if (items.length === 0) {
    itemList.innerHTML = `<p class="empty-state">No available items for this restaurant.</p>`;
    return;
  }

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "order-item";
    row.innerHTML = `
      <div>
        <strong>${item.item}</strong>
        <p>${money(item.price)}</p>
      </div>
      <button onclick="toggleOrderItem(${item.id}, this)">Add</button>
    `;
    itemList.appendChild(row);
  });
}

function toggleOrderItem(itemId, button) {
  if (selectedOrderItems.includes(itemId)) {
    selectedOrderItems = selectedOrderItems.filter((id) => id !== itemId);
    button.textContent = "Add";
    button.classList.remove("selected");
  } else {
    selectedOrderItems.push(itemId);
    button.textContent = "Selected";
    button.classList.add("selected");
  }
  updateSelectedTotal();
}

function updateSelectedTotal() {
  const total = selectedOrderItems.reduce((sum, id) => {
    const item = currentMenuData.find((menuItem) => menuItem.id === id);
    return sum + (item ? Number(item.price) : 0);
  }, 0);
  document.getElementById("selectedTotal").textContent = money(total);
}

async function addMenuItem() {
  const restaurant = document.getElementById("restaurant").value.trim();
  const item = document.getElementById("item").value.trim();
  const price = parseFloat(document.getElementById("price").value);

  if (!restaurant || !item || Number.isNaN(price)) {
    showResponse({ error: "Please enter restaurant, item, and valid price." });
    return;
  }

  try {
    const res = await fetch(MENU_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurant, item, price, available: true })
    });

    const data = await res.json();
    showResponse(data);

    document.getElementById("restaurant").value = "";
    document.getElementById("item").value = "";
    document.getElementById("price").value = "";

    await loadMenu();
  } catch (error) {
    showResponse({ error: "Could not add item. Make sure the Menu Service is running.", details: error.message });
  }
}

async function deleteMenuItem(id) {
  if (!confirm("Delete this menu item?")) return;

  try {
    const res = await fetch(`${MENU_URL}/${id}`, { method: "DELETE" });
    const data = await res.json();
    showResponse(data);
    await loadMenu();
  } catch (error) {
    showResponse({ error: "Could not delete item.", details: error.message });
  }
}

async function placeOrder() {
  const customerName = document.getElementById("customerName").value.trim();

  if (!customerName) {
    showResponse({ error: "Please enter a customer name." });
    return;
  }

  if (selectedOrderItems.length === 0) {
    showResponse({ error: "Please select at least one menu item." });
    return;
  }

  try {
    const res = await fetch(ORDER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerName, items: selectedOrderItems })
    });

    const data = await res.json();
    showResponse(data);
    selectedOrderItems = [];
    loadRestaurantItems();
    await loadCustomerOrders();
  } catch (error) {
    showResponse({ error: "Could not place order. Make sure the Order Service is running.", details: error.message });
  }
}

async function loadOrders() {
  try {
    const res = await fetch(ORDER_URL);
    allOrders = await res.json();
    renderMerchantOrders(allOrders);
    populateOrderDropdown(allOrders);
    showResponse(allOrders);
  } catch (error) {
    showResponse({ error: "Could not load orders.", details: error.message });
  }
}

function populateOrderDropdown(orders) {
  const select = document.getElementById("orderSelect");
  select.innerHTML = `<option value="">Select an order</option>`;

  orders.forEach((order) => {
    const option = document.createElement("option");
    option.value = order.id;
    const items = order.items.map((item) => item.item).join(", ");
    option.textContent = `#${order.id} • ${order.customerName} • ${items} • ${order.status}`;
    select.appendChild(option);
  });
}

function renderMerchantOrders(orders) {
  const container = document.getElementById("merchantOrderHistory");
  if (!orders || orders.length === 0) {
    container.innerHTML = `<div class="empty-state">No orders have been placed yet.</div>`;
    return;
  }

  container.innerHTML = "";
  [...orders].reverse().forEach((order) => container.appendChild(orderCard(order, true)));
}

async function loadCustomerOrders() {
  const customerName = document.getElementById("customerName").value.trim();
  const container = document.getElementById("customerOrderHistory");

  if (!customerName) {
    container.innerHTML = `<div class="empty-state">Enter a customer name to view orders.</div>`;
    return;
  }

  try {
    const res = await fetch(`${ORDER_URL}?customerName=${encodeURIComponent(customerName)}`);
    const orders = await res.json();
    renderCustomerOrders(orders);
  } catch (error) {
    container.innerHTML = `<div class="empty-state">Could not load customer orders.</div>`;
  }
}

function renderCustomerOrders(orders) {
  const container = document.getElementById("customerOrderHistory");
  if (!orders || orders.length === 0) {
    container.innerHTML = `<div class="empty-state">No orders found for this customer yet.</div>`;
    return;
  }

  container.innerHTML = "";
  [...orders].reverse().forEach((order) => container.appendChild(orderCard(order, false)));
}

function orderCard(order, includeCustomer) {
  const div = document.createElement("div");
  div.className = "history-card";
  const items = order.items.map((item) => item.item).join(", ");
  const statusClass = order.status === "READY" ? "status-ready" : order.status === "COMPLETED" ? "status-completed" : "";

  div.innerHTML = `
    <div>
      <h3>Order #${order.id}</h3>
      ${includeCustomer ? `<p><strong>Customer:</strong> ${order.customerName}</p>` : ""}
      <p><strong>Restaurant:</strong> ${order.restaurant || "Mixed"}</p>
      <p><strong>Items:</strong> ${items}</p>
      <p><strong>Total:</strong> ${money(order.total)}</p>
    </div>
    <span class="status-pill ${statusClass}">${order.status}</span>
  `;

  return div;
}

async function updateOrderStatus() {
  const orderId = document.getElementById("orderSelect").value;
  const status = document.getElementById("status").value;

  if (!orderId) {
    showResponse({ error: "Please select an order." });
    return;
  }

  try {
    const res = await fetch(`${ORDER_URL}/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });

    const data = await res.json();
    showResponse(data);
    await loadOrders();
  } catch (error) {
    showResponse({ error: "Could not update order.", details: error.message });
  }
}
