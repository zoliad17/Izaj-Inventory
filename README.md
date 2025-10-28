# IZAJ-INVENTORY

A comprehensive multi-branch inventory management system built with Tauri, React, TypeScript, and Node.js. This system enables efficient management of products across multiple branches with role-based access control, automated requisitions, and complete audit trails.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [User Roles & Permissions](#user-roles--permissions)
- [Key Features](#key-features)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## 🌟 Features

### Core Functionality

- **Multi-Branch Management**: Support for multiple branches with location tracking
- **Product Management**: CRUD operations for products with categories
- **Inventory Requests**: Inter-branch product requisitions with approval workflow
- **Real-time Dashboard**: Analytics and statistics for inventory, requests, and sales
- **User Management**: Complete user lifecycle management with role-based access
- **Audit Trail**: Comprehensive logging of all system activities
- **Email Notifications**: Automated notifications for requests and account setup
- **Excel Import/Export**: Bulk import and export of products
- **Sales Tracking**: Monitor sales data and trends
- **Session Management**: 24-hour session expiry with security warnings

### Advanced Features

- **Inventory Reservation**: Prevents over-committing stock during requests
- **Two-Stage Request Process**: Request creation with reservation → Review and approval
- **Bulk Operations**: Approve/deny multiple requests simultaneously
- **Category Management**: Organize products by categories
- **Location Tracking**: Google Maps integration for branch locations
- **Responsive UI**: Modern, mobile-friendly interface with dark mode support

## 🛠️ Tech Stack

### Frontend

- **Framework**: React 19
- **Desktop**: Tauri 2
- **Language**: TypeScript
- **Styling**: TailwindCSS 4
- **Charts**: ECharts & Recharts
- **UI Components**: Radix UI
- **Routing**: React Router DOM 7
- **State Management**: Context API
- **Build Tool**: Vite 6

### Backend

- **Runtime**: Node.js
- **Framework**: Express 5
- **Package Manager**: Bun/NPM
- **Authentication**: bcrypt, JWT
- **Email**: Nodemailer
- **Validation**: Custom validation utilities

### Database

- **Platform**: Supabase (PostgreSQL)
- **Features**:
  - Row Level Security (RLS)
  - Real-time subscriptions
  - Database triggers for audit logging
  - Optimized indexes
