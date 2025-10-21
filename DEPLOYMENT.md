# 🚀 Deployment Guide

This guide will help you deploy your Inventory Tracker system to various platforms.

## 📋 Prerequisites

- Node.js 16+ installed
- MongoDB database (local or cloud)
- Email service (Gmail SMTP recommended)
- Git installed

## 🐳 Docker Deployment (Recommended)

### 1. Using Docker Compose

```bash
# Clone the repository
git clone https://github.com/ShaheerSaud2004/Inventory-.git
cd Inventory-

# Copy environment file
cp env.production .env

# Edit .env with your configuration
nano .env

# Start the application
docker-compose up -d
```

### 2. Using Docker

```bash
# Build the image
docker build -t inventory-tracker .

# Run the container
docker run -d \
  --name inventory-tracker \
  -p 5000:5000 \
  -e MONGODB_URI=your_mongodb_uri \
  -e JWT_SECRET=your_jwt_secret \
  -e EMAIL_USER=your_email \
  -e EMAIL_PASS=your_password \
  inventory-tracker
```

## ☁️ Cloud Deployment Options

### 1. Heroku Deployment

```bash
# Install Heroku CLI
# Create Heroku app
heroku create your-inventory-tracker

# Set environment variables
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_jwt_secret
heroku config:set EMAIL_USER=your_email
heroku config:set EMAIL_PASS=your_password
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

### 2. Railway Deployment

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically

### 3. DigitalOcean App Platform

1. Create a new app in DigitalOcean
2. Connect your GitHub repository
3. Set environment variables
4. Deploy

### 4. AWS EC2 Deployment

```bash
# Connect to your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Node.js and MongoDB
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get install -y mongodb

# Clone and setup
git clone https://github.com/ShaheerSaud2004/Inventory-.git
cd Inventory-
npm run install-all

# Setup environment
cp env.production .env
nano .env

# Install PM2 for process management
sudo npm install -g pm2

# Start the application
pm2 start server/index.js --name inventory-tracker
pm2 startup
pm2 save
```

## 🗄️ Database Setup

### MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string
4. Update `MONGODB_URI` in your environment variables

### Local MongoDB

```bash
# Install MongoDB
# Ubuntu/Debian
sudo apt-get install -y mongodb

# macOS
brew install mongodb-community

# Start MongoDB
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS
```

## 📧 Email Configuration

### Gmail SMTP Setup

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use the app password in your environment variables

### Other Email Providers

Update these environment variables:
```env
EMAIL_HOST=your_smtp_host
EMAIL_PORT=587
EMAIL_USER=your_email
EMAIL_PASS=your_password
```

## 🔧 Environment Variables

Create a `.env` file with these variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/inventory_tracker

# JWT Secret (CHANGE THIS!)
JWT_SECRET=your_super_secret_jwt_key_here

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Server Configuration
PORT=5000
NODE_ENV=production
CLIENT_URL=http://localhost:3000

# Admin Configuration
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=admin123
```

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm run install-all

# Setup environment
cp env.example .env
# Edit .env with your settings

# Seed database with sample data
cd server && npm run seed

# Start development
npm run dev

# Start production
npm start
```

## 🔍 Health Checks

After deployment, verify everything is working:

1. **Check API Health**: `GET /api/health`
2. **Test Login**: Use demo credentials
3. **Check Database**: Verify data is being saved
4. **Test Email**: Try checkout process

## 🛠️ Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MongoDB is running
   - Verify connection string
   - Check firewall settings

2. **Email Not Sending**
   - Verify email credentials
   - Check SMTP settings
   - Test with different email provider

3. **Build Failures**
   - Check Node.js version (16+)
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall

4. **Permission Errors**
   - Check file permissions
   - Ensure uploads directory exists
   - Verify user has write access

### Logs

```bash
# Docker logs
docker-compose logs -f

# PM2 logs
pm2 logs inventory-tracker

# Heroku logs
heroku logs --tail
```

## 📊 Monitoring

### Performance Monitoring

- Use PM2 monitoring: `pm2 monit`
- Set up health checks
- Monitor database performance
- Track API response times

### Security

- Use HTTPS in production
- Set strong JWT secrets
- Enable rate limiting
- Regular security updates

## 🔄 Updates

To update your deployment:

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Or with PM2
pm2 restart inventory-tracker
```

## 📞 Support

If you encounter issues:

1. Check the logs
2. Verify environment variables
3. Test database connection
4. Check email configuration
5. Review the README.md for setup instructions

---

**Your Inventory Tracker is now ready for production! 🎉**
