# Izaj-Inventory

A comprehensive multi-branch inventory management system built with modern web technologies for desktop deployment.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [User Roles](#user-roles)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## 🎯 Overview

Izaj-Inventory is a desktop application for managing inventory across multiple branches. It provides real-time stock tracking, inter-branch product requests, comprehensive audit logging, and role-based access control. The system ensures inventory integrity through reservation mechanisms and approval workflows.

## ✨ Features

### 🔐 Authentication & User Management

- Secure user registration with email-based account setup
- Password reset functionality
- Role-based access control (Super Admin, Branch Manager, Admin)
- 24-hour session management with expiry warnings
- Audit trail for all user activities

### 📦 Inventory Management

- Multi-branch inventory tracking
- Product categorization
- Real-time stock levels with status indicators (In Stock, Low Stock, Out of Stock)
- Inventory reservation system to prevent over-commitment
- Bulk product import/export (Excel support)
- Search and filter capabilities

### 🔄 Product Request System

- Inter-branch product requisition
- Two-stage approval workflow (pending → approved/rejected)
- Automatic inventory reservation
- Email notifications for request status
- Request history tracking

### 📊 Dashboard & Analytics

- Real-time dashboard with key metrics
- Branch-specific analytics
- Product statistics
- Request tracking
- Visual charts and graphs (ECharts/Recharts)

### 📍 Branch Management

- Multi-branch support with location mapping
- Google Maps integration for branch locations
- Branch-specific user assignments
- Branch analytics and reporting

### 📝 Audit Trail

- Comprehensive logging of all system activities
- User activity tracking
- Product change history
- Request decision logs
- Exportable audit logs

### 🎨 User Interface

- Modern, responsive design with Tailwind CSS
- Dark/Light theme support
- Collapsible sidebar navigation
- Real-time notifications
- Optimized for desktop experience

## 🛠 Tech Stack

### Frontend

- **React 19** - UI library
- **TypeScript** - Type safety
- **Tauri 2** - Desktop application framework
- **React Router** - Navigation
- **Tailwind CSS 4** - Styling
- **Heroicons** - Icon library
- **Lucide React** - Additional icons
- **ECharts/Recharts** - Data visualization
- **React Hot Toast** - Notifications

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Supabase** - PostgreSQL database
- **Nodemailer** - Email service
- **bcrypt** - Password hashing
- **JWT** - Authentication tokens
- **Helmet** - Security headers
- **Rate Limiting** - API protection

### Database

- **PostgreSQL** (via Supabase)
- Comprehensive indexing for performance
- Triggers for automatic status updates
- Views for analytics
- Audit trail tables

## 📦 Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **bun**
- **Rust** (for Tauri)
- **Supabase account**
- **Google Maps API key** (for branch locations)
- **Email service credentials** (Gmail, etc.)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/Izaj-Inventory.git
cd Izaj-Inventory
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
# Using npm
cd backend/Server
npm install

# OR using bun
bun install
```

### 4. Database Setup

Run the SQL schema to set up your database:

```bash
# Connect to your Supabase database and run
psql -h your-db-host -U your-username -d your-db-name -f schema.sql
```

### 5. Create Super Admin Account

```bash
cd backend/Server
npm run create-superadmin
```

### 6. Environment Configuration

Copy the example environment file and fill in your credentials:

```bash
cp env.example .env
```

## ⚙️ Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Backend
BACKEND_PORT=5000
```

### Email Setup (Gmail Example)

1. Enable 2-Step Verification on your Google Account
2. Generate an App Password
3. Use the app password in `EMAIL_PASS`

## 🎮 Usage

### Development Mode

Run both frontend and backend simultaneously:

```bash
# Using npm
npm run dev:npm

# Using bun (faster)
npm run dev:bun
```

This will start:

- Frontend: Vite dev server (usually `http://localhost:1420`)
- Backend: Express server (usually `http://localhost:5000`)

### Production Build

```bash
# Build the application
npm run build

# Start the Tauri application
npm run tauri dev
```

### Available Scripts

```bash
npm run dev              # Start development server (frontend only)
npm run dev:npm         # Start both frontend and backend (npm)
npm run dev:bun         # Start both frontend and backend (bun)
npm run tauri           # Start Tauri in dev mode
npm run build           # Build for production
npm run preview         # Preview production build
npm run create:superadmin  # Create super admin user
```

## 📁 Project Structure

```
Izaj-Inventory/
├── backend/
│   └── Server/
│       ├── server.js           # Express server
│       ├── package.json
│       ├── scripts/            # Utility scripts
│       └── utils/              # Security, validation, email
├── src/
│   ├── components/             # React components
│   │   ├── AuditLogs/         # Audit logging components
│   │   ├── Aut/               # Authentication
│   │   ├── Branch/            # Branch management
│   │   ├── Branch-Manager-SuperAdmin/  # Admin tools
│   │   ├── Dashboard/         # Dashboard components
│   │   ├── Sales/             # Sales management
│   │   ├── Sidebar/           # Navigation
│   │   └── Stock_Components/  # Inventory management
│   ├── contexts/              # React contexts
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities
│   ├── types/                 # TypeScript types
│   └── utils/                 # Helper functions
├── src-tauri/                 # Tauri configuration
├── schema.sql                 # Database schema
├── package.json
└── README.md
```

## 🗄️ Database Schema

See `schema.sql` for complete schema with indexes and triggers.

## 👥 User Roles

### Super Admin

- Full system access
- User management
- Branch management
- All audit logs
- Product management across all branches

### Branch Manager

- Approve/reject product requests
- Manage products in their branch
- View branch analytics
- Create product requests
- View audit logs
- User management within branch

### Admin

- View products
- Create product requests
- View sales and stock
- Manage categories
- View their activity logs

## 📄 License

Copyright (c) 2025 CtrlAltDelight

All rights reserved. Distribution, modification, or commercial use is prohibited without permission.

---

**Built with ❤️ using Tauri + React + TypeScript**
