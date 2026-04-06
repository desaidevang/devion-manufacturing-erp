# 🚀 Devion Manufacturing ERP

> Production-grade Manufacturing ERP system built with Spring Boot, React, and PostgreSQL.

---

## 🌍 Overview

Devion ERP is a full-stack enterprise application designed to manage end-to-end manufacturing operations.  
It centralizes workflows such as supplier management, inventory tracking, quality inspection, and batch production into a single system.

The system is designed for **real-world usage** and supports **LAN-based on-premise deployment**, allowing multiple users to access it through internal network connectivity.

---

## 🧠 Core Modules

### 🔹 Authentication & User Management
- Secure login system (JWT-based)
- Role-based access control (Admin / Employee)

### 🔹 Supplier Management
- Supplier creation and tracking
- Vendor-related workflows

### 🔹 Product & BOM Management
- Product master
- Bill of Materials (BOM)
- Component mapping

### 🔹 GRN (Goods Receipt Notes)
- Supplier → GRN → verification workflow
- Item-level tracking

### 🔹 PSI (Quality Inspection System)
- Inspection rules and validation
- Quality-based approval/rejection

### 🔹 Batch Production
- Batch creation and assignment
- Priority handling and progress tracking

### 🔹 Inventory & Warehouse
- Warehouse location structure
- Real-time stock tracking
- Inventory movement tracking

### 🔹 Dashboard & Analytics
- System overview
- Operational insights

---

## ⚙️ Tech Stack

**Frontend**
- React.js  
- Tailwind CSS  

**Backend**
- Spring Boot (REST APIs)  
- Spring Security (JWT Authentication)  

**Database**
- PostgreSQL  

---

## 🏗️ Backend Architecture

The backend follows a **layered architecture**:

- Controller Layer → Handles API requests  
- Service Layer → Business logic  
- Repository Layer → Database access  
- DTO Layer → Data transfer  
- Entity Layer → Database models  
- Exception Handling → Centralized error handling  
- Security Filters → JWT authentication  

---

## 🔐 Security

- JWT-based authentication  
- Role-based access control  
- Secure API endpoints  

---

## 🚀 Getting Started

### Backend

```bash
cd backend/erp
./mvnw spring-boot:run
Frontend
cd frontend
npm install
npm start
⚙️ Configuration

Create an application.properties file with your configuration:

spring.datasource.url=your_db_url
spring.datasource.username=your_username
spring.datasource.password=your_password

jwt.secret=your_secret
jwt.expiration=your_expiry
🎯 Purpose

This project was built to solve real manufacturing challenges by digitizing workflows such as inventory management, production tracking, and quality inspection.

It focuses on building a scalable, maintainable, and production-ready system, rather than a basic CRUD application.

👨‍💻 Author

Devang Desai
Full-Stack MERN Developer


---
