# Apache Logo URL Fix for Live Server

## Problem
Logo images are not loading on the live site because Apache doesn't have a rule to proxy `/uploads` requests to the backend server.

## Solution
Update your Apache config at `/etc/apache2/sites-available/npdinfotech.conf` to add the uploads proxy rule.

---

## Updated Apache Configuration

Replace your existing config with this fixed version:

```apache
# ============================================
# FIXED APACHE CONFIG: npdinfotech.info
# ============================================

# HTTP → HTTPS Redirect
<VirtualHost *:80>
    ServerName npdinfotech.info
    ServerAlias www.npdinfotech.info

    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</VirtualHost>


# HTTPS Configuration
<IfModule mod_ssl.c>
<VirtualHost *:443>

    ServerName npdinfotech.info
    ServerAlias www.npdinfotech.info

    DocumentRoot /var/www/html/moi_appliation/frontend/dist

    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/npdinfotech.info/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/npdinfotech.info/privkey.pem
    Include /etc/letsencrypt/options-ssl-apache.conf

    # Proxy Backend API & Uploads
    ProxyPreserveHost On
    ProxyRequests Off

    # Forward API requests to backend
    ProxyPass /api http://localhost:5000/api
    ProxyPassReverse /api http://localhost:5000/api
    
    # Forward uploads/logo requests to backend (THIS IS THE FIX)
    ProxyPass /uploads http://localhost:5000/uploads
    ProxyPassReverse /uploads http://localhost:5000/uploads

    # Frontend (React) Configuration
    <Directory /var/www/html/moi_appliation/frontend/dist>
        Options -MultiViews +FollowSymLinks
        AllowOverride All
        Require all granted

        RewriteEngine On
        RewriteBase /

        # React Router support
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^ index.html [L]
    </Directory>

    # Security Headers
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-XSS-Protection "1; mode=block"

    # Logs
    ErrorLog ${APACHE_LOG_DIR}/npdinfotech_error.log
    CustomLog ${APACHE_LOG_DIR}/npdinfotech_access.log combined

</VirtualHost>
</IfModule>
```

---

## Steps to Apply the Fix

### 1. SSH into your server
```bash
ssh root@203.57.85.81
```

### 2. Edit the Apache config
```bash
nano /etc/apache2/sites-available/npdinfotech.conf
```

### 3. Replace the entire content with the updated config above

### 4. Test the Apache config
```bash
apache2ctl configtest
```
**Expected output:** `Syntax OK`

### 5. Restart Apache
```bash
systemctl restart apache2
```

### 6. Verify the service is running
```bash
systemctl status apache2
```

---

## Test the Fix

### 1. Upload a Logo
1. Go to https://npdinfotech.info/
2. Login with admin credentials
3. Go to Admin → Settings
4. Upload a logo image

### 2. Check the Logo URL
Open browser developer tools (F12) → Network tab → Reload page
Look for requests to `/uploads/logo.*` - they should return 200 status

### 3. Test via curl
```bash
# From your local machine
curl -I https://npdinfotech.info/uploads/logo.png
```

**Expected response:** HTTP/2 200 OK (not 404)

---

## What This Fixes

**Before:** 
- Frontend requests `https://npdinfotech.info/uploads/logo.png`
- Apache doesn't have a rule for `/uploads`
- Request fails → Logo doesn't appear

**After:**
- Frontend requests `https://npdinfotech.info/uploads/logo.png`
- Apache sees the `/uploads` proxy rule
- Request is forwarded to `http://localhost:5000/uploads/logo.png`
- Backend serves the file → Logo appears ✓

---

## Important Notes

- **Line added:** The key fix is these two lines:
  ```apache
  ProxyPass /uploads http://localhost:5000/uploads
  ProxyPassReverse /uploads http://localhost:5000/uploads
  ```

- **Backend must be serving uploads:** Verify your backend has this configured in `server.js`:
  ```javascript
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  ```

- **File permissions:** Make sure the uploads folder has proper permissions:
  ```bash
  chmod 755 /var/www/html/moi_appliation/backend/uploads
  ```

---

## Troubleshooting

If the logo still doesn't appear after applying this fix:

### 1. Check if backend is running
```bash
curl http://localhost:5000/uploads/logo.png
```
Should return the logo file or a proper error

### 2. Check Apache logs
```bash
tail -f /var/log/apache2/npdinfotech_error.log
```

### 3. Check if proxy modules are enabled
```bash
apache2ctl -M | grep proxy
```
Should show: `proxy_module`, `proxy_http_module`

If not enabled, run:
```bash
a2enmod proxy
a2enmod proxy_http
systemctl restart apache2
```

### 4. Verify backend uploads path
```bash
ls -la /var/www/html/moi_appliation/backend/uploads/
```
Logo file should be there

---

**Status:** Ready to apply  
**Date:** March 19, 2026
