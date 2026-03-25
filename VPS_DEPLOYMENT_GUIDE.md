# VPS Deployment Guide - Moi Application

**Server:** 203.57.85.81 (npdinfotech.info)  
**Project:** Moi Application  
**Date:** March 17, 2026

---

## 📋 Deployment Steps

### Step 1: Transfer Project Files to Server

#### Option A: Using SCP (via Terminal)
```bash
# From your local machine, upload the entire project
scp -r /var/www/html/moi_appliation root@203.57.85.81:/var/www/html/

# Verify transfer
ssh root@203.57.85.81 "ls -la /var/www/html/moi_appliation"
```

#### Option B: Using FileZilla (Already Connected)
1. In FileZilla, navigate to Remote site: `/var/www/html/`
2. Right-click → Create Directory → `moi_appliation`
3. Drag and drop entire project folder from local to remote
4. Wait for transfer to complete

---

### Step 2: Install Dependencies on Server

```bash
# SSH into the server
ssh root@203.57.85.81

# Navigate to project
cd /var/www/html/moi_appliation

# Backend setup
cd backend
nvm use 20
npm install

# Frontend setup
cd ../frontend
nvm use 20
npm install
npm run build

# Verify build
ls -la dist/
```

---

### Step 3: Create Database on Server

```bash
# SSH into server
ssh root@203.57.85.81

# Login to MySQL
mysql -u root -p

# Create database and user
CREATE DATABASE moi_application;
CREATE USER 'moi_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON moi_application.* TO 'moi_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Import schema
mysql -u moi_user -p moi_application < /var/www/html/moi_appliation/backend/schema.sql
```

---

### Step 4: Configure Backend Environment

```bash
# Create .env file in backend directory
nano /var/www/html/moi_appliation/backend/.env
```

**Add the following content:**
```
PORT=5000
DB_HOST=localhost
DB_USER=moi_user
DB_PASSWORD=your_secure_password
DB_NAME=moi_application
NODE_ENV=production
JWT_SECRET=your_super_secret_jwt_key_change_this
```

---

### Step 5: Configure Apache Virtual Host

Create Apache configuration for npdinfotech.info:

```bash
# Create virtual host config
nano /etc/apache2/sites-available/npdinfotech.conf
```

**Add this configuration:**
```apache
# HTTP to HTTPS Redirect
<VirtualHost *:80>
    ServerName npdinfotech.info
    ServerAlias www.npdinfotech.info
    DocumentRoot /var/www/html/moi_appliation/frontend/dist
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</VirtualHost>

# HTTPS Configuration
<VirtualHost *:443>
    ServerName npdinfotech.info
    ServerAlias www.npdinfotech.info
    DocumentRoot /var/www/html/moi_appliation/frontend/dist
    
    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/your_cert.crt
    SSLCertificateKeyFile /etc/ssl/private/your_key.key
    SSLCertificateChainFile /etc/ssl/certs/your_chain.crt
    
    # Enable Rewrite Module
    RewriteEngine On
    
    # Proxy backend API requests
    ProxyPreserveHost On
    ProxyPass /api http://localhost:5000/api
    ProxyPassReverse /api http://localhost:5000/api
    
    # Proxy uploads (logo storage)
    ProxyPass /uploads http://localhost:5000/uploads
    ProxyPassReverse /uploads http://localhost:5000/uploads
    
    # Serve frontend (React Router support)
    <Directory /var/www/html/moi_appliation/frontend/dist>
        Options -MultiViews
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteRule ^ index.html [QSA,L]
    </Directory>
    
    # Security Headers
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-XSS-Protection "1; mode=block"
</VirtualHost>
```

**Enable the site:**
```bash
a2ensite npdinfotech.conf
a2enmod proxy
a2enmod proxy_http
a2enmod rewrite
a2enmod ssl
systemctl restart apache2
```

---

### Step 6: Start Backend Service

#### Option A: Using PM2 (Recommended)

```bash
# Install PM2 globally on server
npm install -g pm2

# Navigate to backend
cd /var/www/html/moi_appliation/backend

# Start backend with PM2
pm2 start server.js --name "moi-backend"

# Save PM2 process
pm2 save

# Enable PM2 startup
pm2 startup

# Verify backend is running
pm2 list
```

#### Option B: Using Systemd Service

Create service file:
```bash
nano /etc/systemd/system/moi-backend.service
```

**Add this content:**
```ini
[Unit]
Description=Moi Application Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/html/moi_appliation/backend
ExecStart=/usr/local/bin/node server.js
Restart=always
RestartSec=10
Environment="NODE_ENV=production"
Environment="PORT=5000"

[Install]
WantedBy=multi-user.target
```

**Enable and start:**
```bash
systemctl daemon-reload
systemctl enable moi-backend
systemctl start moi-backend
systemctl status moi-backend
```

---

### Step 7: Configure Frontend to Connect to Backend

Update the API client to use the server URL:

**File:** `/var/www/html/moi_appliation/frontend/src/api/client.ts`

```typescript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const client = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

// ... rest of code
```

**Create .env file in frontend:**
```bash
nano /var/www/html/moi_appliation/frontend/.env
```

**Add:**
```
VITE_API_BASE_URL=https://npdinfotech.info/api
```

**Rebuild frontend:**
```bash
cd /var/www/html/moi_appliation/frontend
npm run build
```

---

### Step 8: Set File Permissions

```bash
# Set ownership
chown -R www-data:www-data /var/www/html/moi_appliation

# Set permissions
chmod -R 755 /var/www/html/moi_appliation
chmod -R 755 /var/www/html/moi_appliation/backend/uploads

# Make sure backend can write to uploads
chmod 777 /var/www/html/moi_appliation/backend/uploads
```

---

### Step 9: Setup SSL Certificate

#### Option A: Using Let's Encrypt (Free)

```bash
# Install Certbot
apt-get install certbot python3-certbot-apache

# Generate certificate
certbot certonly --apache -d npdinfotech.info -d www.npdinfotech.info

# Update Apache config with certificate paths
# Update /etc/apache2/sites-available/npdinfotech.conf with the certificate paths from certbot
```

#### Option B: Use Existing Certificate
Update the Apache config with your existing certificate paths as shown in Step 5.

---

### Step 10: Verify Everything is Working

```bash
# Check backend is running
curl http://localhost:5000/api/health

# Check Apache status
systemctl status apache2

# Check backend service
systemctl status moi-backend
# or
pm2 list

# Check logs
tail -f /var/log/apache2/error.log
tail -f /var/log/apache2/access.log
```

---

## 🧪 Testing

### Test via Browser
1. Visit https://npdinfotech.info/
2. Should load the Moi Application frontend
3. Login with credentials: `admin` / `admin123`
4. Try uploading a logo in settings
5. Create an event and add a gift
6. Print a receipt

### Test API
```bash
# From your local machine
curl -X GET https://npdinfotech.info/api/health

# Should return: {"status":"ok","timestamp":"..."}
```

---

## 🔧 Troubleshooting

### Frontend Not Loading
```bash
# Check if frontend build exists
ls -la /var/www/html/moi_appliation/frontend/dist/

# If not, rebuild
cd /var/www/html/moi_appliation/frontend
npm run build

# Check Apache error log
tail -f /var/log/apache2/error.log
```

### Backend Not Connecting
```bash
# Check if backend is running
curl http://localhost:5000/api/health

# Check backend logs
pm2 logs moi-backend
# or
journalctl -u moi-backend -f
```

### Database Connection Error
```bash
# Check MySQL is running
systemctl status mysql

# Test database connection
mysql -u moi_user -p moi_application -e "SELECT 1;"

# Check database exists
mysql -u root -p -e "SHOW DATABASES;"
```

### Logo Upload Not Working
```bash
# Verify uploads directory
ls -la /var/www/html/moi_appliation/backend/uploads/

# Check permissions
chmod 777 /var/www/html/moi_appliation/backend/uploads

# Check backend has write access
touch /var/www/html/moi_appliation/backend/uploads/test.txt
```

### HTTPS Certificate Issues
```bash
# Test SSL certificate
openssl s_client -connect npdinfotech.info:443

# Check certificate expiry
openssl x509 -in /path/to/cert.crt -text -noout | grep -A 2 "Validity"
```

---

## 📊 Project Structure on Server

```
/var/www/html/moi_appliation/
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── package.json
│   ├── .env                    ← Created during deployment
│   ├── uploads/                ← Logo storage
│   ├── schema.sql
│   ├── routes/
│   ├── middleware/
│   └── Docs/
├── frontend/
│   ├── dist/                   ← Built frontend
│   ├── src/
│   ├── package.json
│   ├── .env                    ← Created during deployment
│   ├── vite.config.ts
│   └── tsconfig.json
├── docs/
└── README.md
```

---

## 🔐 Security Checklist

- [ ] Change JWT_SECRET in backend .env
- [ ] Change database password
- [ ] Enable HTTPS/SSL certificate
- [ ] Set proper file permissions (755/777)
- [ ] Disable directory listing
- [ ] Enable CORS only for your domain
- [ ] Keep Node.js and npm updated
- [ ] Regular database backups
- [ ] Monitor error logs
- [ ] Use strong admin password (change from `admin123`)

---

## 📈 Performance Optimization

### Enable Compression
```bash
# Add to Apache config
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>
```

### Enable Caching
```bash
# Add to Apache config
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

---

## 📝 Backup Strategy

### Automated Backups
```bash
# Create backup script
nano /usr/local/bin/backup-moi.sh
```

**Add this content:**
```bash
#!/bin/bash

BACKUP_DIR="/backups/moi_application"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
mysqldump -u moi_user -p moi_application > $BACKUP_DIR/db_$DATE.sql

# Backup project files
tar -czf $BACKUP_DIR/project_$DATE.tar.gz /var/www/html/moi_appliation

# Keep last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete
```

**Make executable and schedule with cron:**
```bash
chmod +x /usr/local/bin/backup-moi.sh
crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-moi.sh
```

---

## 🚀 Post-Deployment Checklist

- [ ] Frontend loads at https://npdinfotech.info/
- [ ] Backend API responds at /api/health
- [ ] Admin login works (admin/admin123)
- [ ] Logo upload works
- [ ] Gift entry creation works
- [ ] Receipt printing works
- [ ] Database queries are working
- [ ] No errors in logs
- [ ] SSL certificate is valid
- [ ] All permissions are correct

---

**Status:** Ready for deployment  
**Last Updated:** March 17, 2026
