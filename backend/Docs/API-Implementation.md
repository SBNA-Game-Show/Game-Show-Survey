# ⚙️ API Implementation Guide

This guide explains how we're actually building the API behind the scenes — structure, logic, flow, and best practices.

---

## 🗂 Folder Structure Recap

```
/routes       # API route definitions (entry points)
/controllers  # Handles logic for each request
/models       # Defines database schemas and queries
/middleware   # Authentication, validation, error handling
/utils        # Holds the Utility files, custom error and response class
/db           # handles Database connection
```

---

## 1️⃣ Routes (Entry Points)

Each resource gets its own route file (e.g., `users.js`, `orders.js`). These files define the HTTP methods and link to controllers.

**Example: `/routes/users.js`**
```js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/', auth, userController.getAllUsers);
router.get('/:id', auth, userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', auth, userController.updateUser);
router.delete('/:id', auth, userController.deleteUser);

module.exports = router;
```

---

## 2️⃣ Controllers (Business Logic)

Controllers receive requests from routes and handle all logic (like calling DB, returning responses, etc).

**Example: `/controllers/userController.js`**
```js
const User = require('../models/User');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
```

---

## 3️⃣ Models (Data Layer)

Define how your data looks and interacts with the database.

**MongoDB Example: `/models/User.js`**
```js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String
});

module.exports = mongoose.model('User', userSchema);
```

---

## 4️⃣ Middleware (Auth, Validation, etc.) 

**Auth Example: `/middleware/auth.js`**
```js
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access Denied' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid Token' });
  }
};
```

---

## 5️⃣ Error Handling

Use centralized error middleware:

**Example: `/middleware/errorHandler.js`**
```js
module.exports = function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
};
```

---

## 6️⃣ Connecting It All (Main Server File)

**Example: `server.js` or `index.js`**
```js
const express = require('express');
const app = express();
const mongoose = require('mongoose');
require('dotenv').config();

// Middleware
app.use(express.json());

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/orders', require('./routes/orders'));

// Global error handler (last middleware)
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Start Server
mongoose.connect(process.env.MONGO_URI, () => {
  console.log('Connected to DB');
  app.listen(3000, () => console.log('Server running on port 3000'));
});
```

---

## ✅ Implementation Checklist

- [x] Create clean, modular folders (`routes`, `controllers`, etc.)
- [x] Secure endpoints using JWT middleware
- [x] Handle all errors gracefully
- [x] Use `.env` for sensitive config (e.g., DB URL, JWT secret)
- [x] Return proper HTTP status codes and messages

---

## 🚀 Tips for the Team

- Keep functions short and focused.
- Use async/await — avoid callback hell.
- Use meaningful status codes (`201 Created`, `400 Bad Request`, etc).
- Document any edge cases or custom logic in code comments.

---

## 🧪 Testing

Use **Postman**  to test routes during dev. 

---
