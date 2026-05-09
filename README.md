# CSUF Smart Food Ordering Service

This project is a CPSC 464 software architecture prototype for a CSUF Smart Food Ordering Service.

It demonstrates a microservices architecture with a browser-based frontend, role-based user flows, menu persistence, and order history.

## Architecture Summary

The system contains three backend services:

1. **Menu Service**
   - Runs on `localhost:3001`
   - Stores restaurant/menu data
   - Supports menu create, read, update, and delete operations
   - Persists menu data in `menu-service/menu-data.json`

2. **Order Service**
   - Runs on `localhost:3002`
   - Creates customer orders
   - Validates menu items by calling the Menu Service
   - Stores order history in memory for the current session
   - Updates order status
   - Calls the Notification Service when an order becomes `READY`

3. **Notification Service**
   - Runs on `localhost:3003`
   - Simulates notifications by logging messages in the terminal

The frontend provides two role-based views:

- **Customer View**
  - Browse menus grouped by restaurant
  - Enter customer name
  - Select restaurant
  - Add items using buttons
  - Place order
  - View customer-specific order history

- **Merchant View**
  - Add menu items
  - Remove menu items
  - View all order history
  - Select orders from a dropdown
  - Update order status

No account system is implemented. Role selection is simulated at the UI level for prototype purposes.

## Folder Structure

```text
csuf-smart-food-ordering-polished/
  menu-service/
    menu-data.json
    package.json
    server.js

  order-service/
    package.json
    server.js

  notification-service/
    package.json
    server.js

  frontend/
    index.html
    styles.css
    app.js

  README.md
```

## Required Software

Install Node.js LTS:

```text
https://nodejs.org/
```

Verify installation:

```bash
node -v
npm -v
```

Docker is not required.

## How to Run

Open three separate terminals.

### Terminal 1: Menu Service

```bash
cd menu-service
npm install
npm start
```

Expected output:

```text
Menu Service running on http://localhost:3001
```

### Terminal 2: Notification Service

```bash
cd notification-service
npm install
npm start
```

Expected output:

```text
Notification Service running on http://localhost:3003
```

### Terminal 3: Order Service

```bash
cd order-service
npm install
npm start
```

Expected output:

```text
Order Service running on http://localhost:3002
```

## How to Run the Frontend

Open this file in your browser:

```text
frontend/index.html
```

Optional cleaner method:

```bash
cd frontend
npx serve
```

Then open the local URL shown in the terminal.

## Demo Flow

### Customer Flow

1. Choose **Customer**
2. Enter a customer name
3. Select a restaurant
4. Click menu items to add them
5. Place the order
6. View the order in **My Order History**

### Merchant Flow

1. Switch to **Merchant**
2. Add or remove menu items
3. Refresh orders
4. Select an order from the dropdown
5. Change its status to `READY`
6. Check the Notification Service terminal for the notification log

## Persistence Notes

The Menu Service persists menu changes in:

```text
menu-service/menu-data.json
```

That means added or deleted menu items remain after restarting the Menu Service.

The Order Service stores orders in memory. Orders reset when the Order Service restarts. This is intentional for the prototype to keep the implementation focused on architecture and inter-service communication. In a production system, the Order Service would use its own database.

## Manual API Tests

### View Menu

```bash
curl http://localhost:3001/menu
```

### Add Menu Item

```bash
curl -X POST http://localhost:3001/menu ^
  -H "Content-Type: application/json" ^
  -d "{\"restaurant\":\"Titan Grill\",\"item\":\"Fries\",\"price\":3.99,\"available\":true}"
```

### Delete Menu Item

```bash
curl -X DELETE http://localhost:3001/menu/1
```

### Place Order

```bash
curl -X POST http://localhost:3002/orders ^
  -H "Content-Type: application/json" ^
  -d "{\"customerName\":\"Alex\",\"items\":[2,3]}"
```

### View Orders

```bash
curl http://localhost:3002/orders
```

### View Orders for One Customer

```bash
curl "http://localhost:3002/orders?customerName=Alex"
```

### Update Order Status

```bash
curl -X PATCH http://localhost:3002/orders/1/status ^
  -H "Content-Type: application/json" ^
  -d "{\"status\":\"READY\"}"
```

When an order is marked `READY`, the Notification Service terminal should show a message similar to:

```text
Notification sent: Order 1 for Alex is READY for pickup.
```

## Architecture Concepts Demonstrated

- Microservices architecture
- REST API communication
- Role-based UI behavior
- Menu persistence through service-owned JSON storage
- Order history views
- Merchant-side order processing
- Event-like behavior through Order Service triggering Notification Service
- Separation of concerns between Menu, Order, and Notification services
