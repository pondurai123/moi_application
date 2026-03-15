# API Endpoints Reference

## Current Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | — | Health check |
| POST | `/api/weddings` | — | Create event |
| GET | `/api/weddings` | — | List events (`?search=`) |
| GET | `/api/weddings/:id` | — | Get event details |
| POST | `/api/weddings/:id/gifts` | — | Add gift entry |
| GET | `/api/weddings/:id/gifts` | — | List gifts + totals |
| GET | `/api/weddings/:id/report/pdf` | — | Download PDF report |
| GET | `/api/weddings/:id/report/excel` | — | Download Excel report |
| POST | `/api/admin/login` | — | Admin login → JWT |

## New Endpoints (v2.0)

### Function Types
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/function-types` | — | List active function types |
| POST | `/api/function-types` | JWT | Create function type (nameEn, nameTa) |
| PUT | `/api/function-types/:id` | JWT | Update function type |
| DELETE | `/api/function-types/:id` | JWT | Soft-delete function type |

### Typists
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/events/:id/typists` | — | Add typist to event |
| GET | `/api/events/:id/typists` | — | List typists for event |
| DELETE | `/api/events/:id/typists/:tid` | JWT | Remove typist |

### Gifts (Updated)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/events/:id/gifts` | — | Add gift (now includes typistId, denominations) |
| GET | `/api/events/:id/gifts?typistId=` | — | List gifts, filter by typist |

### Settings
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/settings` | — | Get all settings |
| PUT | `/api/settings` | JWT | Update settings (bulk key-value) |
| POST | `/api/settings/logo` | JWT | Upload logo image |

### Receipts
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/events/:id/gifts/:giftId/receipt` | — | Get receipt data for printing |

### Reports (Updated)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/events/:id/report/pdf?typistId=` | — | PDF, optional typist filter |
| GET | `/api/events/:id/report/excel?typistId=` | — | Excel, optional typist filter |
