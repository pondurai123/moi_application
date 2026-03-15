# Database Schema — Current + Planned

## Current Tables

### weddings
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT PK | |
| groomName | VARCHAR(255) | |
| brideName | VARCHAR(255) | |
| location | VARCHAR(255) | |
| weddingDate | DATE | |
| createdAt | TIMESTAMP | |

### gifts
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT PK | |
| weddingId | INT FK → weddings(id) | ON DELETE CASCADE |
| donorName | VARCHAR(255) | |
| donorPlace | VARCHAR(255) | |
| amount | DECIMAL(10,2) | |
| createdAt | TIMESTAMP | |

### admin_users
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT PK | |
| username | VARCHAR(100) UNIQUE | |
| passwordHash | VARCHAR(255) | |
| createdAt | TIMESTAMP | |

---

## New Tables (v2.0)

### function_types
Stores the types of events/ceremonies the app supports.
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT PK | |
| nameEn | VARCHAR(255) NOT NULL | English name |
| nameTa | VARCHAR(255) NOT NULL | Tamil name |
| isActive | BOOLEAN DEFAULT TRUE | Soft delete |
| createdAt | TIMESTAMP | |

### typists
Stores typists assigned to a specific event.
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT PK | |
| eventId | INT FK → weddings(id) | ON DELETE CASCADE |
| name | VARCHAR(255) NOT NULL | |
| code | VARCHAR(50) | Optional short code |
| createdAt | TIMESTAMP | |

### settings
Stores admin-configurable site settings (key-value pairs).
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT PK | |
| settingKey | VARCHAR(100) UNIQUE | e.g. 'phone', 'brandName' |
| settingValue | TEXT | |
| updatedAt | TIMESTAMP | |

Default settings:
- `phone` — Phone number shown on receipts
- `brandName` — Company brand name
- `brandContact` — Company contact details
- `receiptAdditionalText` — Extra text on receipts
- `logoUrl` — Path to uploaded logo

### Schema changes to existing tables

**weddings** — Add columns:
| Column | Type | Notes |
|--------|------|-------|
| functionTypeId | INT FK → function_types(id) | Event type |
| phoneNumber | VARCHAR(20) | Event-specific phone |
| personName1 | VARCHAR(255) | Replaces groomName (generic) |
| personName2 | VARCHAR(255) | Replaces brideName (generic) |

**gifts** — Add columns:
| Column | Type | Notes |
|--------|------|-------|
| typistId | INT FK → typists(id) | Who recorded this entry |
| receiptNumber | VARCHAR(50) | Auto-generated receipt # |
