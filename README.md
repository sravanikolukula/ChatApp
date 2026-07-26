# 💬 Talkify — Real-Time Chat & Group Application

A modern, full-stack real-time messaging application built with **React 19**, **Vite**, **Tailwind CSS v4**, **Node.js**, **Express 5**, **MongoDB**, **Socket.io**, **JWT Authentication**, and **Cloudinary**.

---

## ✨ Key Features

### 👤 Direct Messaging & User Features
* 🔐 **JWT Authentication**: Secure user registration, password hashing (`bcryptjs`), and token authentication.
* 🟢 **Online Status Badges**: Real-time online/offline user status tracking via Socket.io connection maps.
* ✍️ **Typing Indicators**: Real-time visual indicators when a contact starts or stops typing.
* 💬 **1-on-1 Direct Messaging**: Instant private chat with real-time message delivery and read receipts (`seen`).
* 🖼️ **Profile & Bio Updates**: Customize user display name, bio status, and avatar image uploads via Cloudinary.

### 👥 Group Chat Features
* ➕ **Group Creation**: Create custom chat groups with initial member selections.
* 👥 **Add Members in Middle**: Invite additional users to existing group chats at any time.
* 📢 **Group Message Broadcast**: Broadcast text and image messages instantly to all group members.
* 👁️ **Multi-User Read Receipts**: Track read receipts (`seenBy`) for all members in a group.


### ⚙️ System & Backend Features
* ⚡ **Socket.io Engine**: Event-driven real-time bi-directional communication.
* ☁️ **Cloudinary Integration**: Cloud photo storage for profile avatars and chat media attachments.
* 🛡️ **Protected REST API**: Express routing with JWT token authorization middleware (`protectRoute`).

---

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Frontend** | React.js, Vite, Tailwind CSS, FontAwesome |
| **Backend** | Node.js, Express 5 |
| **Database** | MongoDB, Mongoose |
| **Authentication** | JWT (JSON Web Tokens), Bcryptjs |
| **Real-Time Engine** | Socket.io |
| **Media Storage** | Cloudinary |

---

## ⚙️ Environment Configuration

### Client (`client/.env`)
```env
VITE_BACKEND_URL="http://localhost:5000"
```

### Server (`server/.env`)
```env
PORT=5000
MONGODB_URI="mongodb+srv://<username>:<password>@cluster.mongodb.net"
JWT_SECRET="your_jwt_secret_key"
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

---

## 🚀 How to Run Locally

### 1️⃣ Start Backend
```bash
cd server
npm install
npm run server
```
*The server will run on `http://localhost:5000`.*

### 2️⃣ Start Frontend
In a new terminal window:
```bash
cd client
npm install
npm run dev
```
*The React client will run on `http://localhost:5173`.*

---
