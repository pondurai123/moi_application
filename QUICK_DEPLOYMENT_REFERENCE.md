# VPS Deployment - Quick Reference

**Server:** 203.57.85.81 | **Domain:** npdinfotech.info | **Date:** March 17, 2026

---

## 🚀 Quick Deployment (5 Minutes)

### 1. Upload Project via FileZilla
```
Source: C:\Users\YourName\moi_appliation (local)
Target: /var/www/html/moi_appliation (server)
```

### 2. SSH into Server
```bash
ssh root@203.57.85.81
```

### 3. Run Deployment Script
```bash
cd /var/www/html/moi_appliation
chmod +x deploy.sh
bash deploy.sh
```

### 4. Configure Apache
```bash
cp /var/www/html/moi_appliation/apache-config.conf /etc/apache2/sites-available/npdinfotech.conf
a2ensite npdinfotech
a2enmod rewrite proxy proxy_http ssl headers deflate expires
systemctl restart apache2
```

### 5. Setup SSL Certificate
```bash
apt-get install certbot python3-certbot-apache
certbot certonly --apache -d npdinfotech.info -d www.npdinfotech.info
# Update certificate paths in apache config, then restart
```

### 6. Verify
```bash
# Check backend
curl http://localhost:5000/api/health

# Check Apache
systemctl status apache2

# View logs
pm2 logs moi-backend
```

---

## 📁 Server File Structure

```
/var/www/html/moi_appliation/
├── backend/
│   ├── server.js              (Main backend)
│   ├── package.json           (Dependencies)
│   ├── .env                   (Config - KEEP SECRET)
│   ├── schema.sql             (Database schema)
│   ├── uploads/               (Logo storage)
│   └── routes/                (API routes)
├── frontend/
│   ├── dist/                  (Built website - served by Apache)
│   ├── src/                   (React source code)
│   └── package.json           (Dependencies)
├── docs/                      (Documentation)
├── VPS_DEPLOYMENT_GUIDE.md    (Full guide)
├── deploy.sh                  (Deployment script)
└── apache-config.conf         (Apache config)
```

---

## 🔧 Important Commands

### Backend Management (PM2)
```bash
# View backend status
pm2 list

# View logs
pm2 logs moi-backend

# Restart backend
pm2 restart moi-backend

# Stop backend
pm2 stop moi-backend

# Start backend
pm2 start /var/www/html/moi_appliation/backend/server.js --name "moi-backend"
```

### Database Management
```bash
# Login to MySQL
mysql -u moi_user -p moi_application

# Backup database
mysqldump -u moi_user -p moi_application > backup.sql

# Restore database
mysql -u moi_user -p moi_application < backup.sql
```

### Apache Management
```bash
# Check syntax
apache2ctl configtest

# Restart Apache
systemctl restart apache2

# View error logs
tail -f /var/log/apache2/moi-error.log

# View access logs
tail -f /var/log/apache2/moi-access.log
```

### File Permissions
```bash
# Fix permissions
chown -R www-data:www-data /var/www/html/moi_appliation
chmod -R 755 /var/www/html/moi_appliation
chmod 777 /var/www/html/moi_appliation/backend/uploads

# Check ownership
ls -la /var/www/html/moi_appliation/
```

---

## 🧪 Testing Checklist

- [ ] Visit https://npdinfotech.info/ → Should load login page
- [ ] Login with admin/admin123 → Should redirect to dashboard
- [ ] Test Settings page → Should load without errors
- [ ] Upload a logo → Should display in settings
- [ ] Create new event → Should save to database
- [ ] Add gift entry → Should generate receipt
- [ ] Print receipt → Should display logo

---

## 🔐 Security Checklist

- [ ] Change admin password in database
- [ ] Update JWT_SECRET in backend .env
- [ ] Update DB password in backend .env
- [ ] Enable SSL/HTTPS certificate
- [ ] Disable directory listing
- [ ] Set proper file permissions
- [ ] Backup database regularly
- [ ] Monitor error logs

---

## 📝 Environment Files

### Backend .env (`/var/www/html/moi_appliation/backend/.env`)
```
PORT=5000
DB_HOST=localhost
DB_USER=moi_user
DB_PASSWORD=your_secure_password
DB_NAME=moi_application
NODE_ENV=production
JWT_SECRET=generate_random_secure_key
```

### Frontend .env (`/var/www/html/moi_appliation/frontend/.env`)
```
VITE_API_BASE_URL=https://npdinfotech.info/api
```

---

## 🆘 Troubleshooting

### Frontend shows 404 error
```bash
# Check if frontend dist exists
ls -la /var/www/html/moi_appliation/frontend/dist/

# If missing, rebuild
cd /var/www/html/moi_appliation/frontend
npm run build
```

### Backend not responding
```bash
# Check if running
pm2 list

# Check port 5000
netstat -tlnp | grep 5000

# View error logs
pm2 logs moi-backend
```

### Can't upload logo
```bash
# Check permissions
ls -la /var/www/html/moi_appliation/backend/uploads/

# Fix if needed
chmod 777 /var/www/html/moi_appliation/backend/uploads
```

### SSL certificate issues
```bash
# Check certificate validity
openssl x509 -in /etc/letsencrypt/live/npdinfotech.info/fullchain.pem -text -noout

# Renew certificate
certbot renew

# Test SSL
openssl s_client -connect npdinfotech.info:443
```

---

## 📊 Performance Monitoring

### Check Server Resources
```bash
# CPU and Memory usage
top

# Disk usage
df -h

# Check running processes
ps aux | grep node
ps aux | grep apache2
```

### Monitor Logs
```bash
# Real-time Apache errors
tail -f /var/log/apache2/moi-error.log

# Real-time backend logs
pm2 logs moi-backend --lines 100

# Check PHP-FPM if applicable
tail -f /var/log/php8.x-fpm.log
```

---

## 🔄 Update Process

```bash
# Pull latest code
cd /var/www/html/moi_appliation
git pull origin main

# Rebuild frontend
cd frontend
npm install
npm run build

# Restart backend
pm2 restart moi-backend

# Restart Apache
systemctl restart apache2
```

---

## 📞 Support Commands

### Database Stats
```bash
mysql -u moi_user -p moi_application -e "
SELECT 
    (SELECT COUNT(*) FROM weddings) as events,
    (SELECT COUNT(*) FROM gifts) as gifts,
    (SELECT COUNT(*) FROM admin_users) as users;
"
```

### Backend Health
```bash
curl -s http://localhost:5000/api/health | jq .
```

### File Integrity
```bash
ls -lh /var/www/html/moi_appliation/backend/uploads/
ls -lh /var/www/html/moi_appliation/frontend/dist/
```

---

## 📅 Maintenance Schedule

### Daily
- Monitor error logs
- Check server resources

### Weekly
- Review database size
- Check SSL certificate status

### Monthly
- Update system packages
- Review and rotate logs
- Database optimization

### Quarterly
- Database backup verification
- Security audit

---

**Last Updated:** March 17, 2026  
**Status:** Ready for Deployment  
**Next Step:** Upload project and run deploy.sh script
