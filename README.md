# Inventory Management System

A full-stack application for managing inventory, reports, and merchant communications built with **NestJS** (backend) and **Next.js** (frontend).

## Table of Contents
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Backend Setup](#backend-setup)
  - [Installation](#backend-installation)
  - [Database Configuration](#database-configuration)
  - [Database Seeding](#database-seeding)
  - [Running the Backend](#running-the-backend)
- [Frontend Setup](#frontend-setup)
  - [Installation](#frontend-installation)
  - [Running the Frontend](#running-the-frontend)
- [System Startup Guide](#system-startup-guide)
- [Default Credentials](#default-credentials)
- [API Documentation](#api-documentation)

## Prerequisites

Ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **MySQL** (v8 or higher)
- **Git** (optional, for cloning the repository)

### Verify Installation
```bash
node --version
npm --version
mysql --version
```

---

## Project Structure

```
inventory-management-system/
├── backend/          # NestJS REST API
│   ├── src/
│   ├── test/
│   ├── package.json
│   └── .env
├── frontend/         # Next.js React app
│   ├── app/
│   ├── lib/
│   ├── package.json
│   └── next.config.ts
└── README.md
```

---

## Backend Setup

### Backend Installation

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

### Database Configuration

1. **Create a MySQL database:**
   ```bash
   mysql -u root -p
   CREATE DATABASE inventory_db;
   EXIT;
   ```

2. **Configure environment variables:**
   Create or update the `.env` file in the `backend` directory:

   ```dotenv
   # Environment configuration for NestJS backend
   # Update these values for your local/dev setup

   # App
   NODE_ENV=development
   PORT=4000

   # CORS
   CORS_ORIGIN=http://localhost:3000

   # Database (MySQL)
   DB_TYPE=mysql
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root          # Your MySQL username
   DB_PASSWORD=root      # Your MySQL password
   DB_NAME=inventory_db

   # Auth
   JWT_SECRET=your-secret-key-change-in-production
   JWT_EXPIRES_IN=1d

   # Email (SendGrid - optional)
   SENDGRID_API_KEY=your-sendgrid-api-key
   SENDGRID_FROM_EMAIL=your-email@example.com
   ```

   **Update the following values according to your setup:**
   - `DB_USER` - Your MySQL username (default: `root`)
   - `DB_PASSWORD` - Your MySQL password (default: `root`)
   - `DB_NAME` - Database name (default: `inventory_db`)
   - `JWT_SECRET` - Use a strong secret key for production

### Database Seeding

The seeding process will:
- Create database tables automatically (via TypeORM synchronize)
- Create default roles: **Admin**, **Manager**, **Viewer**
- Create a default admin user for login
- Populate sample merchants and inventory items

1. **Run the seed script:**
   ```bash
   npm run seed
   ```

   **Expected output:**
   ```
   Initializing database connection...
   Database connected successfully
   Running role seed...
   Role viewer created
   Role manager created
   Role admin created
   Backfilling existing users to admin role...
   Running user seed...
   ✓ Default admin user created
     Username: admin
     Password: admin
     Email: admin@admin.com
   Running merchant seed...
   All seeds completed successfully
   ```

2. **Optional: Clear database if needed**
   ```bash
   npm run clear-db
   ```

   Or reseed specific data:
   ```bash
   npm run clean-roles
   npm run seed
   ```

### Running the Backend

**Development mode** (with hot reload):
```bash
npm run start:dev
```

**Production build:**
```bash
npm run build
npm run start:prod
```

**Testing:**
```bash
# Run all tests
npm test

# Run end-to-end tests
npm run test:e2e

# Run tests with coverage
npm run test:cov
```

The backend will be available at: **http://localhost:4000**

---

## Frontend Setup

### Frontend Installation

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

### Running the Frontend

**Development mode:**
```bash
npm run dev
```

**Production build:**
```bash
npm run build
npm run start
```

The frontend will be available at: **http://localhost:3000**

---

## System Startup Guide

### Quick Start (Complete System)

Follow these steps to start the entire system from scratch:

#### 1. **Start MySQL Service**
   - **Windows:**
     ```bash
     # If installed as service
     net start MySQL80
     ```
   - **macOS:**
     ```bash
     brew services start mysql
     ```
   - **Linux:**
     ```bash
     sudo systemctl start mysql
     ```

#### 2. **Setup and Start Backend**
   ```bash
   cd backend
   npm install
   npm run seed      # Seed database with roles and default admin user
   npm run start:dev # Start backend in development mode
   ```
   ✅ Backend running on: **http://localhost:4000**

#### 3. **Setup and Start Frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev       # Start frontend in development mode
   ```
   ✅ Frontend running on: **http://localhost:3000**

#### 4. **Access the Application**
   - Open browser and navigate to: **http://localhost:3000**
   - Login with default credentials (see below)

---

## Default Credentials

After running the seed script, use these credentials to login:

### Admin User
| Field | Value |
|-------|-------|
| **Username** | `admin` |
| **Password** | `admin` |
| **Email** | `admin@admin.com` |
| **Role** | Administrator |

### Available Roles
1. **Admin** - Full access to all features
2. **Manager** - Can manage limited resources
3. **Viewer** - Read-only access

---

## API Documentation

### Authentication Endpoints
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token

### User Management
- `GET /users` - List all users
- `GET /users/:id` - Get user details
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Merchants
- `GET /merchants` - List merchants
- `POST /merchants` - Create merchant
- `GET /merchants/:id` - Get merchant details
- `PATCH /merchants/:id` - Update merchant
- `DELETE /merchants/:id` - Delete merchant

### Inventory
- `GET /inventory` - List inventory items
- `POST /inventory` - Create inventory item
- `GET /inventory/:id` - Get item details
- `PATCH /inventory/:id` - Update item
- `DELETE /inventory/:id` - Delete item

### Reports
- `GET /reports` - List reports
- `POST /reports` - Create report
- `POST /reports/send-emails` - Send report emails to merchants
- `GET /reports/:id` - Get report details
- `GET /reports/:id/with-email-status` - Get report with email status
- `PATCH /reports/:id` - Update report

### Email Logs
- `GET /email-logs` - List email logs
- `GET /email-logs/:id` - Get email log details
- `GET /email-logs/report/:reportId` - Get emails for a report
- `GET /email-logs/report/:reportId/stats` - Get email statistics
- `PATCH /email-logs/:id` - Update email log
- `PATCH /email-logs/:id/status` - Update email status
- `DELETE /email-logs/:id` - Delete email log

### Health Check
- `GET /health` - System health status

---

## Troubleshooting

### Database Connection Error
**Error:** `Error: connect ECONNREFUSED 127.0.0.1:3306`

**Solution:**
1. Verify MySQL is running
2. Check database credentials in `.env` file
3. Ensure database `inventory_db` exists

### Port Already in Use
**Error:** `Error: listen EADDRINUSE: address already in use :::4000`

**Solution:**
```bash
# Change port in .env or kill process on port 4000
# Windows: netstat -ano | findstr :4000 && taskkill /PID <PID> /F
# macOS/Linux: lsof -ti:4000 | xargs kill -9
```

### CORS Error
**Error:** `Access to XMLHttpRequest blocked by CORS policy`

**Solution:**
1. Ensure `CORS_ORIGIN=http://localhost:3000` in backend `.env`
2. Restart backend server

### Seed Script Fails
**Error:** `Error: Admin role missing; seed roles before users`

**Solution:**
```bash
npm run clear-db
npm run seed
```

---

## Development Notes

### Useful Commands

**Backend:**
```bash
npm run lint       # Check and fix linting issues
npm run format     # Format code with Prettier
npm run start:debug # Start with debugger
```

**Frontend:**
```bash
npm run lint       # Run ESLint
npm run build      # Build for production
```

---

## Environment Files Reference

### Backend (.env)
```dotenv
NODE_ENV=development      # App environment
PORT=4000                 # Backend port
CORS_ORIGIN=http://localhost:3000  # Frontend URL
DB_HOST=localhost         # Database host
DB_PORT=3306              # Database port
DB_USER=root              # Database user
DB_PASSWORD=root          # Database password
DB_NAME=inventory_db      # Database name
JWT_SECRET=secret-key     # JWT signing secret
JWT_EXPIRES_IN=1d         # JWT expiration
SENDGRID_API_KEY=...      # Optional: SendGrid API key
SENDGRID_FROM_EMAIL=...   # Optional: Sender email
```

---

## Support & Contact

For issues or questions:
1. Check the troubleshooting section above
2. Review API documentation
3. Check application logs in terminal

---

**Last Updated:** December 2025

**Version:** 1.0.0
