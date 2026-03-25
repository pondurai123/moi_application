#!/bin/bash

# Moi Application - Quick Deployment Script
# Usage: bash deploy.sh

set -e

echo "🚀 Starting Moi Application Deployment..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Configuration
PROJECT_PATH="/var/www/html/moi_appliation"
BACKEND_PATH="$PROJECT_PATH/backend"
FRONTEND_PATH="$PROJECT_PATH/frontend"
DB_NAME="moi_application"
DB_USER="moi_user"

echo -e "${YELLOW}Step 1: Checking Node.js and npm${NC}"
node -v
npm -v

echo -e "${YELLOW}Step 2: Installing backend dependencies${NC}"
cd $BACKEND_PATH
nvm use 20
npm install

echo -e "${YELLOW}Step 3: Installing frontend dependencies${NC}"
cd $FRONTEND_PATH
nvm use 20
npm install
npm run build

echo -e "${YELLOW}Step 4: Creating database${NC}"
mysql -u root -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"
mysql -u root $DB_NAME < $BACKEND_PATH/schema.sql

echo -e "${YELLOW}Step 5: Setting up environment files${NC}"

# Backend .env
cat > $BACKEND_PATH/.env << EOF
PORT=5000
DB_HOST=localhost
DB_USER=$DB_USER
DB_PASSWORD=your_password_here
DB_NAME=$DB_NAME
NODE_ENV=production
JWT_SECRET=$(openssl rand -base64 32)
EOF

echo -e "${YELLOW}Step 6: Setting file permissions${NC}"
chown -R www-data:www-data $PROJECT_PATH
chmod -R 755 $PROJECT_PATH
chmod 777 $PROJECT_PATH/backend/uploads

echo -e "${YELLOW}Step 7: Setting up PM2 for backend${NC}"
npm install -g pm2
cd $BACKEND_PATH
pm2 start server.js --name "moi-backend"
pm2 save
pm2 startup

echo -e "${YELLOW}Step 8: Checking services${NC}"
echo "Backend status:"
pm2 list

echo -e "${GREEN}========================================"
echo "✅ Deployment completed successfully!"
echo "========================================"
echo ""
echo "📝 Next steps:"
echo "1. Configure Apache virtual host"
echo "2. Setup SSL certificate"
echo "3. Test the application at https://npdinfotech.info/"
echo ""
echo "🔗 Test API: curl http://localhost:5000/api/health"
echo "📊 View logs: pm2 logs moi-backend"
