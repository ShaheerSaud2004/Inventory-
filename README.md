# 🏪 Inventory Tracker System

A comprehensive inventory management system with checkout tracking, email notifications, and advanced analytics. Built with Node.js, Express, MongoDB, and React.

## ✨ Features

### 🔐 **Authentication & Authorization**
- User registration and login
- Role-based access control (Admin, Manager, User)
- JWT token authentication
- Password management
- User profile management

### 📦 **Item Management**
- Add, edit, delete items
- Item categorization and tagging
- SKU and barcode support
- QR code generation
- Location tracking (building, floor, room, shelf)
- Bulk import/export
- Image upload support
- Maintenance scheduling

### 🔄 **Transaction Management**
- Checkout items with purpose tracking
- Return tracking with condition assessment
- Approval workflow for restricted items
- Extension requests
- Overdue tracking and penalties
- Transaction history and audit trail

### 📧 **Email Notifications**
- Checkout confirmations
- Return reminders
- Overdue alerts
- Approval requests
- System notifications
- Customizable email templates

### 📊 **Analytics & Reporting**
- Dashboard with key metrics
- Usage analytics and trends
- User activity tracking
- Item utilization reports
- Overdue item tracking
- Export capabilities (JSON, CSV)

### 👥 **User Management**
- User roles and permissions
- Department organization
- User activity monitoring
- Permission management

### 🔔 **Notifications System**
- Real-time notifications
- Email, SMS, and in-app notifications
- Notification preferences
- Priority levels

### 📱 **Mobile Responsive**
- Works on all devices
- Touch-friendly interface
- Mobile-optimized workflows

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd InventoryTracker
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/inventory_tracker
   
   # JWT Secret
   JWT_SECRET=your_super_secret_jwt_key_here
   
   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password_here
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

   This will start both the backend server (port 5000) and frontend (port 3000).

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

## 🎯 Demo Credentials

- **Admin**: admin@example.com / admin123
- **Manager**: manager@example.com / manager123  
- **User**: user@example.com / user123

## 📁 Project Structure

```
InventoryTracker/
├── server/                 # Backend (Node.js/Express)
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── utils/             # Utility functions
│   └── index.js           # Server entry point
├── client/                # Frontend (React)
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── services/      # API services
│   │   └── App.js         # App component
│   └── public/            # Static files
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Items
- `GET /api/items` - Get all items
- `POST /api/items` - Create item
- `GET /api/items/:id` - Get item by ID
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

### Transactions
- `GET /api/transactions` - Get transactions
- `POST /api/transactions/checkout` - Checkout items
- `POST /api/transactions/:id/return` - Return items
- `POST /api/transactions/:id/approve` - Approve transaction

### Analytics
- `GET /api/analytics/dashboard` - Dashboard data
- `GET /api/analytics/transactions` - Transaction analytics
- `GET /api/analytics/items` - Item analytics

## 🛠️ Development

### Backend Development
```bash
cd server
npm run dev
```

### Frontend Development
```bash
cd client
npm start
```

### Database Seeding
```bash
cd server
npm run seed
```

## 🚀 Deployment

### Environment Variables
Make sure to set all required environment variables in production:

```env
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
EMAIL_HOST=your_smtp_host
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
```

### Build for Production
```bash
# Build frontend
cd client
npm run build

# Start production server
cd ../server
npm start
```

## 📋 Additional Features to Implement

Here are more features you can add to enhance the system:

### 🔍 **Advanced Search & Filtering**
- Full-text search across items
- Advanced filtering options
- Saved search queries
- Search history

### 📷 **Barcode & QR Code Integration**
- Barcode scanning with camera
- Mobile barcode scanner
- Bulk barcode generation
- Barcode printing

### 📅 **Calendar Integration**
- Return date calendar view
- Maintenance scheduling
- Event notifications
- Google Calendar sync

### 📊 **Advanced Analytics**
- Predictive analytics
- Usage forecasting
- Cost analysis
- ROI tracking

### 🔄 **Workflow Automation**
- Automated approval workflows
- Smart notifications
- Auto-return reminders
- Escalation procedures

### 📱 **Mobile App**
- React Native mobile app
- Offline capabilities
- Push notifications
- Camera integration

### 🔗 **Integrations**
- ERP system integration
- Accounting software sync
- Third-party APIs
- Webhook support

### 🛡️ **Security Enhancements**
- Two-factor authentication
- Audit logging
- Data encryption
- Backup automation

### 📈 **Reporting**
- Custom report builder
- Scheduled reports
- PDF generation
- Email reports

### 🎨 **UI/UX Improvements**
- Dark mode
- Custom themes
- Drag & drop interfaces
- Keyboard shortcuts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

---

**Built with ❤️ using Node.js, Express, MongoDB, and React**
