const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, "menu-data.json");

app.use(express.json());
app.use(cors());

function readMenuItems() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch (error) {
    console.error("Could not read menu-data.json:", error.message);
    return [];
  }
}

function writeMenuItems(menuItems) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(menuItems, null, 2));
}

function getNextId(menuItems) {
  if (menuItems.length === 0) return 1;
  return Math.max(...menuItems.map((item) => Number(item.id))) + 1;
}

app.get("/health", (req, res) => {
  res.json({ service: "menu-service", status: "running" });
});

app.get("/menu", (req, res) => {
  res.json(readMenuItems());
});

app.get("/menu/:id", (req, res) => {
  const id = Number(req.params.id);
  const item = readMenuItems().find((menuItem) => menuItem.id === id);
  if (!item) return res.status(404).json({ error: "Menu item not found" });
  res.json(item);
});

app.post("/menu", (req, res) => {
  const { restaurant, item, price, available = true } = req.body;

  if (!restaurant || !item || price === undefined || Number.isNaN(Number(price))) {
    return res.status(400).json({ error: "restaurant, item, and a valid price are required" });
  }

  const menuItems = readMenuItems();
  const newItem = {
    id: getNextId(menuItems),
    restaurant: String(restaurant).trim(),
    item: String(item).trim(),
    price: Number(price),
    available: Boolean(available)
  };

  menuItems.push(newItem);
  writeMenuItems(menuItems);
  res.status(201).json(newItem);
});

app.patch("/menu/:id", (req, res) => {
  const id = Number(req.params.id);
  const menuItems = readMenuItems();
  const item = menuItems.find((menuItem) => menuItem.id === id);

  if (!item) return res.status(404).json({ error: "Menu item not found" });

  const { restaurant, item: itemName, price, available } = req.body;
  if (restaurant !== undefined) item.restaurant = String(restaurant).trim();
  if (itemName !== undefined) item.item = String(itemName).trim();
  if (price !== undefined) item.price = Number(price);
  if (available !== undefined) item.available = Boolean(available);

  writeMenuItems(menuItems);
  res.json(item);
});

app.delete("/menu/:id", (req, res) => {
  const id = Number(req.params.id);
  const menuItems = readMenuItems();
  const index = menuItems.findIndex((menuItem) => menuItem.id === id);

  if (index === -1) return res.status(404).json({ error: "Menu item not found" });

  const removed = menuItems.splice(index, 1)[0];
  writeMenuItems(menuItems);
  res.json({ message: "Menu item removed", item: removed });
});

app.listen(PORT, () => {
  console.log(`Menu Service running on http://localhost:${PORT}`);
});
