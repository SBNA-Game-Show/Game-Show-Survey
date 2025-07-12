# 📘 API Design Guide

This document outlines how our team will design and structure the RESTful API for our project.

---

## ✅ Overview: Using REST API

We follow REST principles — a common standard that defines how the frontend and backend communicate.

### 📦 Resources
Resources are entities like `users`, `orders`, or `products`. Each resource is mapped to a URL:
- `/api/users`
- `/api/orders`

### 🔨 HTTP Methods

| Method | Purpose               | Example                        |
|--------|------------------------|--------------------------------|
| GET    | Read data              | `GET /api/users`               |
| POST   | Create new data        | `POST /api/orders`             |
| PUT    | Update existing data   | `PUT /api/users/:id`           |
| DELETE | Remove existing data   | `DELETE /api/orders/:id`       |

### 🗂 JSON Format
- All request and response bodies are in **JSON**
- Use **camelCase** for field names (e.g., `userId`, `createdAt`)

---

## 📍 API Route Design

### 🔹 Route Naming
- Use **nouns** (not verbs)
- Use **plural** resource names: `/users`, `/orders`
- Use **lowercase** with dashes: `/user-profile`, not `/UserProfile`
- Include **IDs** for item-specific actions: `/api/users/:id`

### 🔹 Example Routes

| Method | Endpoint             | Description                |
|--------|----------------------|----------------------------|
| GET    | `/api/users`         | Get all users              |
| GET    | `/api/users/:id`     | Get user by ID             |
| POST   | `/api/orders`        | Create a new order         |
| PUT    | `/api/users/:id`     | Update a user              |
| DELETE | `/api/orders/:id`    | Delete an order            |

---

## 🔁 Request & Response Format

### Example: `POST /api/users`

**Request Body**
```json
{
  "username": "Jake",
  "email": "jake@email.com",
  "password": "securePassword"
}
```

**Response**
```json
{
  "userId": "123",
  "username": "Jake",
  "email": "jake@email.com"
}
```
---

## 🧱 Folder Structure

Organize code by responsibility:

```
/routes       # API route definitions
/controllers  # Logic for each route
/models       # Data schema (MongoDB, Sequelize, etc.)
/middleware   # Auth, error handling, validation
```

---

## 📄 API Documentation

- We'll document each endpoint in a simple table (see above at **Example Routes**)
- Use **Postman** to:
  - Test endpoints
  - Export/share request examples
  - Keep examples synced with code

---
