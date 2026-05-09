const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3003;

app.use(express.json());
app.use(cors());

app.get("/health", (req, res) => {
  res.json({ service: "notification-service", status: "running" });
});

app.post("/notify", (req, res) => {
  const { orderId, customerName, message } = req.body;
  const notificationMessage = message || `Order ${orderId} for ${customerName || "customer"} is READY for pickup.`;
  console.log(`Notification sent: ${notificationMessage}`);
  res.json({ message: "Notification sent", orderId, notification: notificationMessage });
});

app.listen(PORT, () => {
  console.log(`Notification Service running on http://localhost:${PORT}`);
});
