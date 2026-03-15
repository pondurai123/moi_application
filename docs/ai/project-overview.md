# Moi Application — Project Overview

## Purpose
A full-stack web application for **gift contribution tracking** at Indian ceremonies (weddings, engagements, baby showers, etc). Tracks every gift contribution, prints receipts, and generates consolidated reports.

## Tech Stack
- **Frontend**: React + TypeScript (Vite), React Router v6
- **Backend**: Node.js + Express
- **Database**: MySQL 8
- **Reports**: pdfkit (PDF), exceljs (Excel)
- **Auth**: JWT-based admin login (bcryptjs)

## Current Features (MVP — v1.0)
1. Create wedding events (groom, bride, location, date)
2. Add unlimited gift entries per wedding (donor name, place, amount)
3. Download PDF and Excel reports per wedding
4. Admin panel (JWT-protected): list weddings, search/filter, view/export gifts

## Planned Features (v2.0)

### 1. Language Selection (English / Tamil)
- English is the default language
- All UI labels, buttons, headings support both languages
- Language toggle in navbar persists across sessions (localStorage)

### 2. Function Management (Multi-Event Support)
- Replace hardcoded "wedding" concept with generic "function" (event type)
- Admin panel: **Function Management** page to add/edit function types
- Each function type has: `nameEn` (English name) and `nameTa` (Tamil name)
- Examples: Marriage, Engagement, Baby Shower, Birthday, etc.
- When creating an event, user selects from available function types

### 3. Typist Management
- Each event (function) can have multiple typists assigned
- Each typist logs in with a name/code and records their own entries
- Entries track which typist recorded them
- Reports can be filtered per typist or consolidated across all typists

### 4. Receipt Printing
- After every gift entry is saved, a receipt is auto-generated for the contributor
- Receipt is printed via a connected printer (browser Print API)
- Receipt content:
  - Site logo
  - Function name, place, phone number
  - Date and time
  - Contributor name
  - Gift details (denominations × quantities with amounts)
  - Total price
  - Typist name
  - Additional text (configurable in Admin Panel)
  - Company brand and contact details (configurable in Admin Panel)

### 5. Admin Settings (Configurable)
- Site logo upload
- Phone number for receipts
- Additional receipt text
- Company brand name and contact details

## Project Structure
```
moi_appliation/
├── docs/ai/                 # AI reference documentation
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── schema.sql
│   ├── .env
│   ├── middleware/
│   │   └── auth.js
│   └── routes/
│       ├── weddings.js      → renamed to events.js
│       ├── gifts.js
│       ├── reports.js
│       ├── admin.js
│       ├── functions.js     [NEW]
│       ├── typists.js       [NEW]
│       ├── settings.js      [NEW]
│       └── receipts.js      [NEW]
└── frontend/
    └── src/
        ├── App.tsx
        ├── i18n/             [NEW] translations
        ├── api/client.ts
        ├── pages/
        │   ├── HomePage.tsx
        │   ├── GiftCollectionPage.tsx
        │   ├── AdminLoginPage.tsx
        │   ├── AdminDashboardPage.tsx
        │   ├── AdminWeddingDetailPage.tsx
        │   ├── AdminFunctionsPage.tsx    [NEW]
        │   └── AdminSettingsPage.tsx     [NEW]
        └── components/
            ├── Navbar.tsx
            ├── GiftTable.tsx
            ├── ExportButtons.tsx
            ├── LanguageToggle.tsx        [NEW]
            └── ReceiptPrint.tsx          [NEW]
```

## Database Tables
| Table | Purpose |
|-------|---------|
| `weddings` | Event records (will be renamed/refactored to `events`) |
| `gifts` | Gift contribution records |
| `admin_users` | Admin login credentials |
| `function_types` | [NEW] Event type definitions (Marriage, Engagement, etc.) |
| `typists` | [NEW] Typist records per event |
| `settings` | [NEW] Site-wide configurable settings |

## Run Commands
```bash
# Backend
cd backend && ~/.nvm/versions/node/v20.20.0/bin/node server.js

# Frontend
cd frontend && PATH="$HOME/.nvm/versions/node/v20.20.0/bin:$PATH" npm run dev -- --host
```

## Admin Credentials
- Username: `admin`
- Password: `admin123`
