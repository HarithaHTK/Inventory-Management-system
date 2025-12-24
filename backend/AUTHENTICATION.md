# Authentication Feature

## Overview
This implementation adds JWT-based authentication to the backend with user registration, login, and protected routes.

## Features Implemented

### 1. User Entity
- **Location**: [src/users/entities/user.entity.ts](src/users/entities/user.entity.ts)
- **Fields**:
  - `id`: Auto-generated primary key
  - `username`: Unique username
  - `email`: Unique email address
  - `password`: Bcrypt hashed password
  - `createdAt`: Timestamp of user creation
  - `updatedAt`: Timestamp of last update

### 2. Authentication Endpoints

#### Register
- **Endpoint**: `POST /auth/register`
- **Request Body**:
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Response**:
  ```json
  {
    "access_token": "jwt_token",
    "user": {
      "id": 1,
      "username": "string",
      "email": "string"
    }
  }
  ```

#### Login
- **Endpoint**: `POST /auth/login`
- **Request Body**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Response**:
  ```json
  {
    "access_token": "jwt_token",
    "user": {
      "id": 1,
      "username": "string",
      "email": "string"
    }
  }
  ```

### 3. Protected Routes
- **Example**: `GET /users/profile`
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Response**:
  ```json
  {
    "message": "This is a protected route",
    "user": {
      "sub": 1,
      "username": "string"
    }
  }
  ```

## Setup Instructions

### 1. Environment Variables
Ensure your `.env` file includes:
```env
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=1d
```

### 2. Database Migration
The User table will be automatically created when you start the application (if `synchronize: true` in development).

### 3. Seed Initial User
Run the seed command to create an admin user:
```bash
npm run seed
```

**Default Admin Credentials**:
- Username: `admin`
- Password: `admin123`
- Email: `admin@example.com`

## Testing

### Run All Tests
```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e
```

### Test Authentication Flow
1. Register a new user:
   ```bash
   curl -X POST http://localhost:4000/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
   ```

2. Login:
   ```bash
   curl -X POST http://localhost:4000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser","password":"password123"}'
   ```

3. Access protected route:
   ```bash
   curl http://localhost:4000/users/profile \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

## Using Auth Guard

To protect any route, use the `AuthGuard`:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('example')
export class ExampleController {
  @UseGuards(AuthGuard)
  @Get('protected')
  getProtectedData() {
    return { message: 'This is protected' };
  }
}
```

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt with 10 salt rounds
2. **JWT Token**: Tokens expire after 1 day (configurable)
3. **Unique Constraints**: Username and email must be unique
4. **Validation**: Credentials are validated before token generation

## File Structure
```
src/
├── auth/
│   ├── dto/
│   │   ├── login.dto.ts
│   │   └── register.dto.ts
│   ├── guards/
│   │   └── auth.guard.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── users/
│   ├── entities/
│   │   └── user.entity.ts
│   ├── users.controller.ts
│   ├── users.module.ts
│   ├── users.service.ts
│   └── users.service.spec.ts
└── database/
    ├── seeds/
    │   └── user.seed.ts
    └── seed.ts
```

## Next Steps

1. Add password validation rules (min length, complexity)
2. Implement refresh tokens
3. Add email verification
4. Add password reset functionality
5. Implement rate limiting on auth endpoints
6. Add role-based access control (RBAC)
