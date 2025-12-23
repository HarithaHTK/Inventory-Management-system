# Inventory Management System (Monorepo)

A full-stack monorepo with **NestJS backend** (port 4000) and **Next.js frontend** (port 3000).

---

## QuickStart

### Prerequisites
- Node.js 18+ and npm
- Two terminal windows

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Start Backend (Terminal 1)

```bash
cd backend
npm run start:dev
```

Backend runs on **http://localhost:4000**

### 3. Start Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

Frontend runs on **http://localhost:3000**

---

## Check API Health

### Method 1: Browser (Easiest)

Open in your browser:
```
http://localhost:3000/health
```

Expected output:
```
Backend Health
Status: ok
Uptime (s): 5.23
Timestamp: 2025-12-23T14:30:45.123Z
Env: development
```

### Method 2: cURL

```bash
curl http://localhost:4000/health
```

**Response:**
```json
{
  "status": "ok",
  "uptime": 5.23,
  "timestamp": "2025-12-23T14:30:45.123Z",
  "env": "development"
}
```

### Method 3: Postman

1. Create new GET request
2. URL: `http://localhost:4000/health`
3. Click Send
4. View JSON response

---

## Run Tests

**Backend unit tests:**
```bash
cd backend
npm test
```

**Backend e2e tests:**
```bash
cd backend
npm run test:e2e
```

---

## Project Structure

```
inventory-management-system/
├── backend/          # NestJS API
│   ├── src/
│   │   ├── main.ts   # Entry point
│   │   ├── app.module.ts
│   │   └── health/   # Health module
│   └── package.json
│
├── frontend/         # Next.js UI
│   ├── app/
│   │   ├── page.tsx  # Home
│   │   └── health/   # Health page
│   └── package.json
│
└── README.md
```

---

## Configuration

**Backend (.env):**
```env
PORT=4000
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_BASE=http://localhost:4000
```
