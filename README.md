# Ryde Backend API

Express.js backend API for the Ryde ride-sharing application with Neon PostgreSQL database.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - The `.env` file is already configured with Neon PostgreSQL connection
   - Update `JWT_SECRET` to a secure random string for production

3. Test database connection:
```bash
npm run test-db
```

4. Run database migrations:
```bash
npm run migrate
```

5. Start the server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

## Database Connection

The backend is configured to use **Neon PostgreSQL**:
- Connection string is in `.env` file
- SSL is required and configured
- Connection pooling is enabled

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile (requires auth)

### Passengers
- `GET /api/passengers/profile` - Get passenger profile
- `PUT /api/passengers/location` - Update location
- `PUT /api/passengers/profile` - Update profile

### Drivers
- `GET /api/drivers/profile` - Get driver profile
- `PUT /api/drivers/location` - Update location
- `PUT /api/drivers/availability` - Toggle availability
- `POST /api/drivers/vehicle` - Register vehicle
- `PUT /api/drivers/vehicle` - Update vehicle

### Trips
- `POST /api/trips` - Request trip (passenger)
- `GET /api/trips/my-trips` - Get user's trips
- `GET /api/trips/available` - Get available trips (driver)
- `GET /api/trips/:tripId` - Get trip details
- `POST /api/trips/:tripId/accept` - Accept trip (driver)
- `POST /api/trips/:tripId/start` - Start trip (driver)
- `POST /api/trips/:tripId/complete` - Complete trip (driver)
- `POST /api/trips/:tripId/cancel` - Cancel trip

### Payments
- `GET /api/payments/trip/:tripId` - Get payment for trip
- `POST /api/payments/:paymentId/complete` - Complete payment

### Notifications
- `GET /api/notifications` - Get notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/:notificationId/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

### Ratings
- `POST /api/ratings` - Create rating
- `GET /api/ratings/trip/:tripId` - Get ratings for trip
- `GET /api/ratings/user/:userId` - Get ratings for user

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

Tokens are automatically stored in localStorage (web) or SharedPreferences (mobile) after login.

## Database Schema

The complete database schema is defined in `migrations/001_create_tables.sql`. Key tables:

- `users` - Core user accounts
- `passengers` - Passenger profiles
- `drivers` - Driver profiles
- `vehicles` - Vehicle information
- `trips` - Trip records
- `payments` - Payment transactions
- `notifications` - User notifications
- `ratings` - Trip ratings
- `documents` - Driver documents
- `subscriptions` - Driver subscriptions
- `administrators` - Admin accounts

## Testing

1. Test database connection:
```bash
npm run test-db
```

2. Test API health:
```bash
curl http://localhost:3000/api/health
```

3. Test registration:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phoneNumber": "+250788123456",
    "password": "password123",
    "userType": "PASSENGER"
  }'
```

4. Test login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## Notes

- The Flutter app uses Firebase Cloud Messaging (FCM) for push notifications
- The Flutter app uses Firebase Storage for file uploads
- All other operations use this REST API backend
