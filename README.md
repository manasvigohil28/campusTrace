# 🎓 campusTrace

> **Modern AI-powered lost and found platform for college campuses**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)
![FastAPI](https://img.shields.io/badge/FastAPI-Python-teal?logo=fastapi)

campusTrace is a comprehensive, intelligent platform designed to streamline the lost and found process within college campuses. By leveraging advanced Natural Language Processing (NLP) and Machine Learning algorithms, it automatically matches reported lost items with found items, asks AI-generated verification questions to prevent false claims, and provides a seamless communication channel between students.

---

## ✨ Features

- 🧠 **AI-Powered Matching**: Uses Python (FastAPI + Sentence Transformers) to semantically match lost and found items based on their descriptions.
- 🔐 **Secure Verification**: AI-generated questions to verify ownership before a claim is approved.
- 💬 **Real-time Communication**: Built-in messaging and conversation system for users to coordinate item returns.
- 🔔 **Smart Notifications**: Instant alerts for possible matches, claim attempts, and messages.
- 📊 **Admin Dashboard & Audit Logs**: Comprehensive system settings, reporting, and audit logs to monitor platform activity.
- 🎨 **Modern UI/UX**: Built with Next.js 16, React 19, TailwindCSS v4, and Framer Motion for a beautiful, responsive, and accessible user experience.

---

## 🛠 Tech Stack

The project is divided into three main components:

### 1. Client (Frontend)
- **Framework:** Next.js 16, React 19
- **Styling & Animation:** Tailwind CSS v4, Framer Motion
- **Icons & UI:** Lucide React
- **Database ORM (Client-side usage):** Prisma

### 2. Server (Main Backend)
- **Runtime:** Node.js, Express.js
- **Database:** MongoDB (via Mongoose)
- **Authentication:** JSON Web Tokens (JWT), bcryptjs

### 3. Server AI (Machine Learning Microservice)
- **Framework:** FastAPI (Python), Uvicorn
- **Machine Learning:** Sentence-Transformers (Hugging Face)
- **Data Validation:** Pydantic, Numpy

---

## 📁 Project Structure

```text
campusTrace/
├── client/          # Next.js Frontend Application
├── server/          # Node.js / Express Main API
├── server-ai/       # Python FastAPI AI Matching Microservice
└── README.md        # Project Documentation
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- Python (v3.9 or higher recommended)
- MongoDB instance (local or MongoDB Atlas)

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/campusTrace.git
cd campusTrace
```

### 2. Setup Main Backend (`server/`)

```bash
cd server
npm install
# Create a .env file with your PORT, MONGO_URI, and JWT_SECRET
npm run dev
```

### 3. Setup AI Microservice (`server-ai/`)

```bash
cd server-ai
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app:app --reload
```

### 4. Setup Frontend (`client/`)

```bash
cd client
npm install
# Create a .env.local file with necessary frontend environment variables
npm run dev
```

---

## 🔗 Architecture Overview

1. **User interacts with the Next.js Client**, reporting a lost or found item.
2. **Client sends data to the Node.js Server**, which handles authentication, saves records to MongoDB, and orchestrates notifications.
3. **Node.js Server communicates with the Python AI Server** behind the scenes to perform semantic vector searches and calculate matching scores between new items and existing database entries.
4. **Matches are returned to the user**, who must then answer AI-generated verification questions to claim the item.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
