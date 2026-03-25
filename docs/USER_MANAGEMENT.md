# User Management Feature - Super Admin Implementation

## Overview
Super Admin users now have complete control over admin user management. They can create, read, update, delete, and manage passwords for all admin users.

## Backend Endpoints (Protected by SUPER_ADMIN Role)

### 1. GET /api/admin/users
**Purpose**: List all admin users  
**Access**: SUPER_ADMIN only  
**Response**:
```json
{
  "users": [
    {
      "id": 1,
      "username": "admin",
      "role": "SUPER_ADMIN",
      "createdAt": "2026-03-21T10:00:00Z"
    }
  ]
}
```

### 2. POST /api/admin/users
**Purpose**: Create a new admin user  
**Access**: SUPER_ADMIN only  
**Request Body**:
```json
{
  "username": "newadmin",
  "password": "secure_password",
  "role": "ADMIN" or "SUPER_ADMIN"
}
```
**Response**: User created successfully with userId

### 3. PUT /api/admin/users/:userId
**Purpose**: Update user details (username and/or role)  
**Access**: SUPER_ADMIN only  
**Request Body**:
```json
{
  "username": "updated_username",
  "role": "ADMIN" or "SUPER_ADMIN"
}
```
**Validation**:
- Cannot demote the last SUPER_ADMIN
- Username must be unique

### 4. DELETE /api/admin/users/:userId
**Purpose**: Delete an admin user  
**Access**: SUPER_ADMIN only  
**Validations**:
- Cannot delete your own account
- Cannot delete the last SUPER_ADMIN

### 5. PUT /api/admin/users/:userId/password
**Purpose**: Change a user's password  
**Access**: SUPER_ADMIN only  
**Request Body**:
```json
{
  "newPassword": "new_secure_password"
}
```

## Frontend Features

### Admin Management Page (`/admin/management`)
- **Access**: SUPER_ADMIN only (auto-redirects if not authorized)
- **Features**:
  1. **Create New Admin**
     - Form to create new admin with username, password, and role selection
     - Input validation for password length (min 6 characters)
     - Success notification on creation

  2. **Manage Existing Admins**
     - Table view of all admin users
     - Edit button to modify username and role
     - Delete button with confirmation dialog
     - Password change button for resetting user passwords
     - Display user creation date
     - Role badges (👑 Super Admin, ⚙️ Admin)

  3. **Password Management**
     - Modal form to change user password
     - Password confirmation field
     - Validates password requirements
     - Success feedback

### Navigation Integration
- Admin Management link appears in navbar only for SUPER_ADMIN users
- Link: `Admin Management` with 👤 icon
- Protected route prevents unauthorized access

## Role-Based Access Control

### SUPER_ADMIN Permissions:
✅ Create new admin users  
✅ View all admin users  
✅ Update admin user details  
✅ Change admin passwords  
✅ Delete admin users  
✅ Access admin management page  
✅ Full access to all other features  

### ADMIN Permissions:
❌ Create/manage/delete users  
❌ Access admin management page  
✅ Access Settings and Functions pages  
✅ Create/manage events  
✅ View gift reports  

## Security Features

1. **Password Hashing**: All passwords are hashed using bcryptjs (10 rounds)
2. **Role Validation**: Endpoints verify SUPER_ADMIN role before allowing modifications
3. **Account Protection**: Cannot delete own account or last SUPER_ADMIN
4. **Token-based Auth**: All endpoints require valid JWT token with SUPER_ADMIN role
5. **Input Validation**: Express-validator for all user inputs

## Database Schema
```sql
CREATE TABLE admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  passwordHash VARCHAR(255) NOT NULL,
  role ENUM('SUPER_ADMIN', 'ADMIN') DEFAULT 'ADMIN',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Usage Flow

### Creating a New Admin User:
1. Super Admin navigates to Admin Management page
2. Clicks "Create New Admin" button
3. Fills in username, password, and selects role
4. Clicks "Create User"
5. New user appears in the user list

### Updating Admin User:
1. Click "Edit" button next to user
2. Modify username and/or role
3. Click "Save"
4. Changes are applied immediately

### Changing User Password:
1. Click "Password" button next to user
2. Enter new password twice (confirmation)
3. Click "Update Password"
4. User will need to login with new password

### Deleting User:
1. Click "Delete" button
2. Confirm deletion in dialog
3. User is removed from system

## Error Handling

- **Username already exists**: Returns 400 with error message
- **Invalid role**: Returns 400 with validation error
- **Unauthorized access**: Returns 403 Forbidden
- **User not found**: Returns 404
- **Password too short**: Returns 400 with validation error
- **Last SUPER_ADMIN demotion/deletion**: Returns 400 with error message

## Default Super Admin

Default super admin credentials created during database initialization:
- **Username**: admin
- **Role**: SUPER_ADMIN
- **Password**: (Set during initial setup)

This account should be secured with a strong password immediately after system setup.
