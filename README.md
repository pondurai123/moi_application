# 💍 Wedding Gift Collection App

A full-stack application to create wedding events, collect gift entries, and generate PDF/Excel reports.

## Tech Stack
- **Frontend**: React + TypeScript (Vite)
- **Backend**: Node.js + Express
- **Database**: MySQL

## Quick Start

### 1. Setup Database
```bash
mysql -u root -p < backend/schema.sql
```

### 2. Configure Backend
Edit `backend/.env` with your MySQL credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=wedding_gifts
JWT_SECRET=your_secret_key
PORT=5000
```

### 3. Run Backend
```bash
# Load nvm first
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd backend
npm install
npm run dev     # development (nodemon)
# or
npm start       # production
```

### 4. Run Frontend
```bash
cd frontend
npm install
npm run dev     # http://localhost:5173
```

## Admin Login
- **Username**: `admin`
- **Password**: `admin123`

## Features
- ✅ Create wedding events (groom, bride, location, date)
- ✅ Add unlimited gift entries per wedding (donor name, place, amount)
- ✅ Download PDF reports with wedding header + gifts table + total
- ✅ Download Excel reports with styled formatting
- ✅ Admin panel: list all weddings, search/filter, view gifts, export

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/weddings` | Create wedding |
| GET | `/api/weddings` | List weddings (optional `?search=`) |
| GET | `/api/weddings/:id` | Get wedding |
| POST | `/api/weddings/:id/gifts` | Add gift |
| GET | `/api/weddings/:id/gifts` | List gifts + total |
| GET | `/api/weddings/:id/report/pdf` | Download PDF |
| GET | `/api/weddings/:id/report/excel` | Download Excel |
| POST | `/api/admin/login` | Admin login |

## Project Structure
```
moi_appliation/
├── backend/          # Node.js + Express API
│   ├── server.js
│   ├── db.js
│   ├── schema.sql
│   ├── .env
│   ├── middleware/
│   │   └── auth.js
│   └── routes/
│       ├── weddings.js
│       ├── gifts.js
│       ├── reports.js
│       └── admin.js
└── frontend/         # React + TypeScript (Vite)
    └── src/
        ├── App.tsx
        ├── api/client.ts
        ├── pages/
        │   ├── HomePage.tsx
        │   ├── GiftCollectionPage.tsx
        │   ├── AdminLoginPage.tsx
        │   ├── AdminDashboardPage.tsx
        │   └── AdminWeddingDetailPage.tsx
        └── components/
            ├── Navbar.tsx
            ├── GiftTable.tsx
            └── ExportButtons.tsx
```
# moi_application
