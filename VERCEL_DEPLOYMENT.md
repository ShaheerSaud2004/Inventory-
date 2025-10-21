# 🚀 Vercel Deployment Guide

This guide will help you deploy your Inventory Tracker to Vercel.

## 📋 Prerequisites

- Vercel account (free tier available)
- MongoDB Atlas account (for database)
- GitHub repository (already set up)

## 🚀 Quick Deployment Steps

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy from GitHub

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository: `ShaheerSaud2004/Inventory-`
4. Configure the project settings

### 4. Environment Variables

In Vercel dashboard, go to your project → Settings → Environment Variables and add:

```env
# Database (MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/inventory_tracker

# JWT Secret (CHANGE THIS!)
JWT_SECRET=your_super_secret_jwt_key_here

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Server Configuration
NODE_ENV=production
CLIENT_URL=https://your-app.vercel.app

# Admin Configuration
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=admin123
```

### 5. Deploy

```bash
# From your local directory
vercel --prod
```

## 🔧 Configuration Details

### Vercel Configuration

The project includes:
- `vercel.json` - Main Vercel configuration
- `client/vercel.json` - Frontend build configuration
- `api/index.js` - Serverless function entry point

### Build Settings

- **Framework Preset**: Create React App
- **Build Command**: `npm run build`
- **Output Directory**: `client/build`
- **Install Command**: `npm install`

### API Routes

All API routes are automatically deployed as serverless functions:
- `/api/auth/*` - Authentication endpoints
- `/api/items/*` - Item management
- `/api/transactions/*` - Transaction handling
- `/api/users/*` - User management
- `/api/notifications/*` - Notifications
- `/api/analytics/*` - Analytics and reporting

## 🗄️ Database Setup (MongoDB Atlas)

### 1. Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster (free tier available)

### 2. Get Connection String

1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database password

### 3. Update Environment Variables

Add the connection string to Vercel environment variables as `MONGODB_URI`.

## 📧 Email Setup (Gmail)

### 1. Enable 2-Factor Authentication

1. Go to your Google Account settings
2. Security → 2-Step Verification
3. Enable 2-factor authentication

### 2. Generate App Password

1. Go to Security → App passwords
2. Generate password for "Mail"
3. Use this password in `EMAIL_PASS`

### 3. Update Environment Variables

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_character_app_password
```

## 🎯 Testing Your Deployment

### 1. Check Health Endpoint

Visit: `https://your-app.vercel.app/api/health`

Should return:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

### 2. Test Authentication

Use demo credentials:
- **Admin**: admin@example.com / admin123
- **Manager**: manager@example.com / manager123
- **User**: user@example.com / user123

### 3. Seed Database

After first deployment, you can seed the database by calling:
```bash
# This will need to be done manually or through a script
# The seed script is in server/scripts/seedDatabase.js
```

## 🔄 Custom Domain (Optional)

### 1. Add Domain in Vercel

1. Go to your project settings
2. Domains → Add domain
3. Enter your domain name

### 2. Update DNS

Add CNAME record pointing to your Vercel deployment.

### 3. Update Environment Variables

Update `CLIENT_URL` to your custom domain.

## 🛠️ Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version (16+)
   - Verify all dependencies are in package.json
   - Check build logs in Vercel dashboard

2. **Database Connection Issues**
   - Verify MongoDB Atlas connection string
   - Check IP whitelist in MongoDB Atlas
   - Ensure database user has proper permissions

3. **Email Not Working**
   - Verify Gmail app password
   - Check SMTP settings
   - Test with different email provider

4. **API Routes Not Working**
   - Check vercel.json configuration
   - Verify api/index.js is properly set up
   - Check function logs in Vercel dashboard

### Debugging

1. **Check Logs**
   - Vercel Dashboard → Functions → View logs
   - Check build logs for deployment issues

2. **Test Locally**
   ```bash
   vercel dev
   ```

3. **Environment Variables**
   - Verify all required variables are set
   - Check variable names match exactly

## 📊 Monitoring

### Vercel Analytics

1. Enable Vercel Analytics in dashboard
2. Monitor performance and usage
3. Set up alerts for errors

### Database Monitoring

1. Use MongoDB Atlas monitoring
2. Set up alerts for connection issues
3. Monitor query performance

## 🔄 Updates

To update your deployment:

```bash
# Push changes to GitHub
git add .
git commit -m "Update inventory tracker"
git push origin main

# Vercel will automatically redeploy
```

## 🎉 Success!

Your Inventory Tracker is now live on Vercel! 

**Demo URL**: `https://your-app.vercel.app`

**Features Available**:
- ✅ User authentication
- ✅ Item management
- ✅ Checkout/return system
- ✅ Email notifications
- ✅ Analytics dashboard
- ✅ Mobile responsive

## 📞 Support

If you encounter issues:

1. Check Vercel function logs
2. Verify environment variables
3. Test database connection
4. Check email configuration
5. Review this deployment guide

---

**Your Inventory Tracker is now live on Vercel! 🚀**
