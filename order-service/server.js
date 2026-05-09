const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3002;
const MENU_SERVICE_URL = "http://localhost:3001";
const NOTIFICATION_SERVICE_URL = "http://localhost:3003";

app.use(express.json());
app.use(cors());

let orders = [];
let nextId = 1;

app.get("/health", (req, res) => {
  res.json({ service: "order-service", status: "running" });
});

app.get("/orders", (req, res) => {
  const customerName = req.query.customerName;
  if (customerName) {
    return res.json(orders.filter((order) => order.customerName.toLowerCase() === customerName.toLowerCase()));
  }
  res.json(orders);
});

app.get("/orders/:id", (req, res) => {
  const id = Number(req.params.id);
  const order = orders.find((order) => order.id === id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});

app.post("/orders", async (req, res) => {
  const { customerName, items } = req.body;

  if (!customerName || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "customerName and at least one menu item are required" });
  }

  try {
    const menuResponse = await fetch(`${MENU_SERVICE_URL}/menu`);
    const menuItems = await menuResponse.json();

    const selectedItems = items.map((id) => menuItems.find((menuItem) => menuItem.id === Number(id)));
    const missingItem = selectedItems.find((item) => !item);
    if (missingItem !== undefined) {
      return res.status(400).json({ error: "One or more selected menu items do not exist" });
    }

    const unavailableItem = selectedItems.find((item) => !item.available);
    if (unavailableItem) {
      return res.status(400).json({ error: `${unavailableItem.item} is currently unavailable` });
    }

    const total = selectedItems.reduce((sum, item) => sum + Number(item.price), 0);
    const restaurant = selectedItems[0]?.restaurant || "Unknown Restaurant";

    const order = {
      id: nextId++,
      customerName: String(customerName).trim(),
      restaurant,
      items: selectedItems.map((item) => ({
        id: item.id,
        restaurant: item.restaurant,
        item: item.item,
        price: item.price
      })),
      total: Number(total.toFixed(2)),
      status: "PLACED",
      createdAt: new Date().toISOString(),
      updatedAt: null
    };

    orders.push(order);
    res.status(201).json(order);
  } catch (error) {
    res.status(503).json({ error: "Could not contact Menu Service", details: error.message });
  }
});

app.patch("/orders/:id/status", async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;
  const validStatuses = ["PLACED", "PREPARING", "READY", "COMPLETED"];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Use one of: ${validStatuses.join(", ")}` });
  }

  const order = orders.find((order) => order.id === id);
  if (!order) return res.status(404).json({ error: "Order not found" });

  order.status = status;
  order.updatedAt = new Date().toISOString();

  if (status === "READY") {
    try {
      await fetch(`${NOTIFICATION_SERVICE_URL}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          customerName: order.customerName,
          message: `Order ${order.id} for ${order.customerName} is READY for pickup.`
        })
      });
    } catch (error) {
      console.log("Notification Service unavailable:", error.message);
    }
  }

  res.json(order);
});

app.listen(PORT, () => {
  console.log(`Order Service running on http://localhost:${PORT}`);
});
