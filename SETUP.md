# PayUS Setup Guide

This guide will help you set up the PayUS application on your local machine.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB (v4.4 or higher)
- React Native development environment
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Project Structure

```
payus/
├── backend/          # Node.js API server
├── mobile/           # React Native mobile app
├── docs/            # Documentation
├── README.md        # Project overview
└── SETUP.md         # This file
```

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/payus

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Twilio Configuration (for SMS OTP)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# Email Configuration (for email OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_ROUNDS=12
```

### 3. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Ubuntu/Debian
sudo systemctl start mongod

# On Windows
net start MongoDB
```

### 4. Start the Backend Server

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3000`

## Mobile App Setup

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. iOS Setup (macOS only)

```bash
cd ios
pod install
cd ..
```

### 3. Environment Configuration

Create a `.env` file in the mobile directory:

```env
# API Configuration
API_BASE_URL=http://localhost:3000/api
API_TIMEOUT=10000

# App Configuration
APP_NAME=PayUS
APP_VERSION=1.0.0
```

### 4. Run the Mobile App

#### Android

```bash
# Start Metro bundler
npx react-native start

# In another terminal, run Android app
npx react-native run-android
```

#### iOS (macOS only)

```bash
# Start Metro bundler
npx react-native start

# In another terminal, run iOS app
npx react-native run-ios
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile
- `PUT /api/user/notification-settings` - Update notification settings
- `PUT /api/user/password` - Change password
- `DELETE /api/user/account` - Deactivate account
- `GET /api/user/statistics` - Get user statistics
- `GET /api/user/search` - Search users

### Contacts
- `GET /api/contact` - Get all contacts
- `POST /api/contact` - Add new contact
- `POST /api/contact/import` - Import contacts
- `GET /api/contact/:id` - Get specific contact
- `PUT /api/contact/:id` - Update contact
- `DELETE /api/contact/:id` - Delete contact
- `POST /api/contact/:id/tags` - Add tag to contact
- `DELETE /api/contact/:id/tags/:tag` - Remove tag from contact

### Requests
- `GET /api/request` - Get all requests
- `POST /api/request` - Create new request
- `GET /api/request/:id` - Get specific request
- `PUT /api/request/:id/status` - Update request status
- `POST /api/request/:id/message` - Add message to request
- `DELETE /api/request/:id` - Cancel request
- `GET /api/request/pending/count` - Get pending count

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  password: String (hashed),
  upiId: String,
  profilePicture: String,
  isProfilePublic: Boolean,
  isEmailVerified: Boolean,
  isPhoneVerified: Boolean,
  notificationSettings: {
    email: Boolean,
    sms: Boolean,
    push: Boolean,
    reminderFrequency: String
  },
  totalRequestsSent: Number,
  totalRequestsReceived: Number,
  lastActive: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Contacts Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  name: String,
  phone: String,
  email: String,
  tags: [String],
  source: String,
  payusUserId: ObjectId,
  isActive: Boolean,
  notes: String,
  profilePicture: String,
  lastInteraction: Date,
  totalRequestsSent: Number,
  totalRequestsReceived: Number,
  totalAmountRequested: Number,
  totalAmountReceived: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Requests Collection
```javascript
{
  _id: ObjectId,
  requestId: String,
  type: String,
  creator: ObjectId,
  recipients: [{
    user: ObjectId,
    contact: ObjectId,
    name: String,
    phone: String,
    email: String,
    isPayusUser: Boolean
  }],
  totalAmount: Number,
  individualAmounts: [{
    recipientId: ObjectId,
    amount: Number,
    paidAmount: Number
  }],
  status: String,
  paymentStatus: [{
    recipientId: ObjectId,
    status: String,
    paidAmount: Number,
    paidAt: Date,
    notes: String
  }],
  title: String,
  description: String,
  repaymentDate: Date,
  reminders: [{
    type: String,
    sentAt: Date,
    recipientId: ObjectId
  }],
  messages: [{
    sender: ObjectId,
    message: String,
    isPrivate: Boolean,
    createdAt: Date
  }],
  isPrivate: Boolean,
  visibility: String,
  tags: [String],
  priority: String,
  acceptedAt: Date,
  paidAt: Date,
  cancelledAt: Date,
  rejectedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Features Implemented

### ✅ Completed Features

#### Backend
- [x] User authentication with JWT
- [x] OTP verification (SMS/Email)
- [x] User profile management
- [x] Contact management with tagging
- [x] Request creation and management
- [x] Payment status tracking
- [x] Messaging system
- [x] Notification system
- [x] Statistics and analytics
- [x] Security middleware
- [x] Error handling
- [x] Input validation
- [x] Rate limiting

#### Mobile App
- [x] Authentication screens (Login/Register)
- [x] OTP verification
- [x] Dashboard with statistics
- [x] Navigation setup
- [x] Theme system
- [x] API integration
- [x] Error handling
- [x] Network connectivity check
- [x] Loading states
- [x] Toast notifications

### 🚧 In Progress Features

#### Mobile App
- [ ] Contact management screens
- [ ] Request creation flow
- [ ] Request detail screens
- [ ] Settings screen
- [ ] Profile management
- [ ] Contact import functionality
- [ ] Push notifications
- [ ] Offline support

## Security Considerations

### Backend Security
- ✅ JWT token authentication
- ✅ Password hashing with bcrypt
- ✅ Input validation and sanitization
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ Environment variable protection

### Mobile Security
- ✅ Secure token storage
- ✅ Network security
- ✅ Input validation
- ✅ Error handling
- ✅ Privacy-first approach

## RBI Compliance Notes

The application is designed to comply with RBI regulations:

1. **No Payment Processing**: The app does NOT process payments, charge fees, or facilitate financial transactions
2. **No Interest Calculation**: No interest rates, fees, or financial calculations
3. **No Legal Agreements**: Only informal records for reference
4. **Privacy-First**: Minimal data collection, end-to-end encryption
5. **Social Utility**: Focus on reducing awkwardness, not financial services
6. **External Payments**: All money movement happens outside the app via UPI/wallets

## Troubleshooting

### Common Issues

#### Backend Issues
1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify MongoDB version compatibility

2. **Port Already in Use**
   - Change PORT in `.env`
   - Kill existing process: `lsof -ti:3000 | xargs kill -9`

3. **JWT Secret Error**
   - Set a strong JWT_SECRET in `.env`
   - Restart the server after changes

#### Mobile Issues
1. **Metro Bundler Issues**
   - Clear cache: `npx react-native start --reset-cache`
   - Restart Metro bundler

2. **Android Build Issues**
   - Clean project: `cd android && ./gradlew clean`
   - Rebuild: `npx react-native run-android`

3. **iOS Build Issues**
   - Clean build folder in Xcode
   - Reinstall pods: `cd ios && pod install`

### Development Tips

1. **API Testing**: Use Postman or curl to test API endpoints
2. **Database**: Use MongoDB Compass for database management
3. **Logs**: Check console logs for debugging
4. **Network**: Ensure backend is accessible from mobile device
5. **Environment**: Use different `.env` files for development/production

## Deployment

### Backend Deployment
1. Set up production MongoDB
2. Configure environment variables
3. Use PM2 or similar for process management
4. Set up SSL certificates
5. Configure domain and DNS

### Mobile App Deployment
1. Configure production API URL
2. Build release versions
3. Upload to app stores
4. Configure push notifications
5. Set up crash reporting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the troubleshooting guide