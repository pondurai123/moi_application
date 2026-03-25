# VPS Deployment - Step-by-Step Instructions

**Your VPS Details:**
- Server IP: 203.57.85.81
- Domain: npdinfotech.info
- FTP/SFTP User: root
- Current Project Location: /var/www/html/moi_appliation

---

## 📋 Complete Deployment Checklist

### Phase 1: Upload Project (Using FileZilla)

**Status:** ✓ Connection already established (shown in your screenshot)

1. **In FileZilla:**
   - Left side (Local): Navigate to `C:\Users\YourName\moi_appliation`
   - Right side (Remote): Navigate to `/var/www/html/`
   
2. **Create Directory:**
   - Right-click in remote area → "Create directory" → name it `moi_appliation`
   
3. **Upload Files:**
   - Select entire project folder
   - Drag to remote side
   - Wait for transfer (shown in bottom panel)

---

### Phase 2: Install Dependencies (SSH Terminal)

Open Termius/Terminal and connect to server:

```bash
ssh root@203.57.85.81
```

#### Step 1: Check Node.js
```bash
node -v        # Should be v14+
npm -v         # Should be v6+
nvm --version  # Should show nvm version
```

#### Step 2: Install Backend
```bash
cd /var/www/html/moi_appliation/backend
nvm use 20
npm install
```

#### Step 3: Install Frontend & Build
```bash
cd /var/www/html/moi_appliation/frontend
nvm use 20
npm install
npm run build
```

**Check build was successful:**
```bash
ls -la dist/  # Should show index.html and other files
```

---

### Phase 3: Database Setup

#### Create Database:
```bash
mysql -u root -p
```

Then in MySQL shell:
```sql
CREATE DATABASE moi_application;
CREATE USER 'moi_user'@'localhost' IDENTIFIED BY 'secure_password_123';
GRANT ALL PRIVILEGES ON moi_application.* TO 'moi_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Import Schema:
```bash
mysql -u moi_user -p moi_application < /var/www/html/moi_appliation/backend/schema.sql
```

#### Verify:
```bash
mysql -u moi_user -p moi_application -e "SHOW TABLES;"
```

---

### Phase 4: Configure Environment Files

#### Backend .env:
```bash
nano /var/www/html/moi_appliation/backend/.env
```

Add this content (use Ctrl+X, Y, Enter to save):
```
PORT=5000
DB_HOST=localhost
DB_USER=moi_user
DB_PASSWORD=secure_password_123
DB_NAME=moi_application
NODE_ENV=production
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_long
```

#### Frontend .env:
```bash
nano /var/www/html/moi_appliation/frontend/.env
```

Add:
```
VITE_API_BASE_URL=https://npdinfotech.info/api
```

**Rebuild frontend after env change:**
```bash
cd /var/www/html/moi_appliation/frontend
npm run build
```

---

### Phase 5: Start Backend Service

#### Using PM2 (Recommended):

```bash
# Install PM2 globally
npm install -g pm2

# Start backend
cd /var/www/html/moi_appliation/backend
pm2 start server.js --name "moi-backend"

# Save configuration
pm2 save

# Enable auto-startup
pm2 startup
pm2 save

# Verify it's running
pm2 list
```

#### Test Backend:
```bash
curl http://localhost:5000/api/health
```

Should return:
```json
{"status":"ok","timestamp":"2026-03-17T..."}
```

---

### Phase 6: Configure Apache

#### Copy Apache Config:
```bash
cp /var/www/html/moi_appliation/apache-config.conf /etc/apache2/sites-available/npdinfotech.conf
```

#### Enable Required Modules:
```bash
a2enmod rewrite
a2enmod proxy
a2enmod proxy_http
a2enmod ssl
a2enmod headers
a2enmod deflate
a2enmod expires
```

#### Enable Site:
```bash
a2ensite npdinfotech
```

#### Test Apache Configuration:
```bash
apache2ctl configtest
```

Should return: `Syntax OK`

#### Restart Apache:
```bash
systemctl restart apache2
```

#### Verify Apache Started:
```bash
systemctl status apache2
```

---

### Phase 7: Setup SSL Certificate

#### Option A: Free Let's Encrypt (Recommended)

```bash
# Install Certbot
apt-get update
apt-get install certbot python3-certbot-apache

# Generate certificate
certbot certonly --apache -d npdinfotech.info -d www.npdinfotech.info
```

**Certbot will:**
1. Ask for email (for renewal reminders)
2. Ask to accept terms
3. Generate certificates at `/etc/letsencrypt/live/npdinfotech.info/`

#### Option B: Use Your Existing Certificate

If you have existing certificates, update the paths in:
```
/etc/apache2/sites-available/npdinfotech.conf
```

Look for these lines and update paths:
```apache
SSLCertificateFile /path/to/your/certificate.crt
SSLCertificateKeyFile /path/to/your/private.key
SSLCertificateChainFile /path/to/chain.crt
```

#### Restart Apache After SSL:
```bash
systemctl restart apache2
```

---

### Phase 8: Set File Permissions

```bash
# Set owner
chown -R www-data:www-data /var/www/html/moi_appliation

# Set permissions
chmod -R 755 /var/www/html/moi_appliation

# Allow uploads
chmod 777 /var/www/html/moi_appliation/backend/uploads

# Verify
ls -la /var/www/html/moi_appliation/
```

---

### Phase 9: Final Testing

#### Test Backend API:
```bash
curl http://localhost:5000/api/health
```

#### Test Frontend (Open Browser):
```
https://npdinfotech.info
```

You should see the Moi Application login page.

#### Test Login:
- Username: `admin`
- Password: `admin123`

#### Test Logo Upload:
1. Go to Admin Settings
2. Upload a logo
3. Should display in settings
4. Create an event
5. Add a gift
6. Print receipt → logo should appear

---

## 🧪 Verification Commands

Run these to verify everything is working:

```bash
# Check backend is running
pm2 list

# Check Apache is running
systemctl status apache2

# Check database connection
mysql -u moi_user -p moi_application -e "SELECT 1;"

# Test API
curl http://localhost:5000/api/health

# Check file permissions
ls -la /var/www/html/moi_appliation/

# Check uploads directory
ls -la /var/www/html/moi_appliation/backend/uploads/

# Check Apache logs
tail -20 /var/log/apache2/moi-error.log
```

---

## 🔍 Troubleshooting Common Issues

### Issue: Frontend shows 404
**Solution:**
```bash
cd /var/www/html/moi_appliation/frontend
npm run build
ls -la dist/
```

### Issue: Backend not responding
**Solution:**
```bash
pm2 logs moi-backend
pm2 restart moi-backend
```

### Issue: Logo won't upload
**Solution:**
```bash
chmod 777 /var/www/html/moi_appliation/backend/uploads
chown www-data:www-data /var/www/html/moi_appliation/backend/uploads
```

### Issue: Database connection error
**Solution:**
```bash
mysql -u moi_user -p moi_application
# If fails, re-run database setup steps
```

### Issue: SSL certificate not working
**Solution:**
```bash
# Check certificate
openssl x509 -in /etc/letsencrypt/live/npdinfotech.info/fullchain.pem -text -noout

# Renew if needed
certbot renew
```

---

## 📊 Project URLs After Deployment

| Service | URL | Notes |
|---------|-----|-------|
| **Frontend** | https://npdinfotech.info | Main app |
| **Admin Panel** | https://npdinfotech.info/admin | Requires login |
| **API Health** | http://localhost:5000/api/health | Backend check |
| **Settings** | https://npdinfotech.info/admin/settings | Logo upload here |

---

## 🔐 Important Security Notes

1. **Change Admin Password:**
   ```bash
   mysql -u moi_user -p moi_application
   UPDATE admin_users SET passwordHash = SHA2('your_new_password', 256) WHERE username = 'admin';
   ```

2. **Update JWT Secret:**
   - Edit `/var/www/html/moi_appliation/backend/.env`
   - Change `JWT_SECRET` to a random 32+ character string
   - Restart backend: `pm2 restart moi-backend`

3. **Backup Your Data:**
   ```bash
   mysqldump -u moi_user -p moi_application > backup_$(date +%Y%m%d).sql
   ```

---

## 📞 If You Get Stuck

1. **Check Logs:**
   ```bash
   # Backend logs
   pm2 logs moi-backend
   
   # Apache error logs
   tail -f /var/log/apache2/moi-error.log
   
   # Apache access logs
   tail -f /var/log/apache2/moi-access.log
   ```

2. **Verify Services:**
   ```bash
   # Backend running?
   netstat -tlnp | grep 5000
   
   # Apache running?
   systemctl status apache2
   
   # MySQL running?
   systemctl status mysql
   ```

3. **Test Connectivity:**
   ```bash
   # From your local machine
   curl https://npdinfotech.info
   curl -v https://npdinfotech.info/api/health
   ```

---

## 🎉 Success Indicators

When deployment is complete, you should see:

- ✅ Frontend loads at https://npdinfotech.info/
- ✅ Login page appears
- ✅ Can login with admin/admin123
- ✅ Dashboard displays
- ✅ Can upload logo
- ✅ Logo appears in settings
- ✅ Can create events
- ✅ Can add gifts
- ✅ Receipt prints with logo
- ✅ No errors in logs

---

**Status:** Ready to Deploy  
**Estimated Time:** 30-45 minutes  
**Last Updated:** March 17, 2026

Start with **Phase 1** and follow each step in order!
