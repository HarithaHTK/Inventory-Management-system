# Database Setup & Seeding Guide

## Automatic Seeding

When you start the backend application with `npm run start:dev` or `npm run start:prod`, the system will **automatically** create the default roles if they don't exist:

- **viewer** - Read-only access
- **manager** - Can manage limited resources
- **admin** - Full access to administrative features

### How It Works

The `DatabaseSeederService` runs automatically on application startup (via the `onModuleInit` lifecycle hook). It checks if each default role exists in the database, and if not, creates it.

You'll see output like this in the terminal:
```
Running automatic database seeding...
✓ Role 'viewer' already exists
✓ Role 'manager' already exists
✓ Role 'admin' already exists
Database seeding completed successfully
```

## Manual Seeding Commands

If you need to manually seed the database:

### Run the full seeder script
```bash
cd backend
npm run seed
```

This will:
1. Create all default roles (if they don't exist)
2. Backfill existing users to admin role (if they have no role assigned)
3. Create default seed users

### Clean up extra roles
```bash
npm run clean-roles
```

This ensures the database only contains the three required roles: viewer, manager, and admin.

## Setup on New Device

### Initial Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   cd ../frontend
   npm install
   ```

2. **Create .env file** in backend folder with database credentials:
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=inventory_db
   NODE_ENV=development
   JWT_SECRET=your_secret_key
   CORS_ORIGIN=http://localhost:3000
   ```

3. **Start the backend**
   ```bash
   cd backend
   npm run start:dev
   ```

   The application will:
   - ✅ Connect to the database
   - ✅ Automatically create tables (synchronize: true in development)
   - ✅ Automatically seed default roles
   - ✅ Be ready to use

4. **Start the frontend** (in another terminal)
   ```bash
   cd frontend
   npm run dev
   ```

## Role System

The system permanently maintains three core roles:

| Role | Name | Description |
|------|------|-------------|
| viewer | Viewer | Read-only access |
| manager | Manager | Can manage limited resources |
| admin | Administrator | Full access to administrative features |

These roles are automatically created on first startup and protected from accidental deletion by the cleanup script.

## Important Notes

- The roles are created with **soft constraints** - the seeder will create them if missing but won't fail if they already exist
- The automatic seeding runs on every application startup, making it safe and idempotent
- No manual seeding is required - just start the application
- The three roles are the only roles that should exist in the system (use `npm run clean-roles` to remove extras)
