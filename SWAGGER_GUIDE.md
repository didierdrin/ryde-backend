# Swagger API Documentation Guide

## Accessing Swagger UI

Once the server is running, access the Swagger documentation at:

**Local Development:**
```
http://localhost:3000/api-docs
```

**Production:**
```
https://ryde-backend-production.up.railway.app/api-docs
```

## Features

- **Interactive API Testing**: Test all endpoints directly from the browser
- **Authentication**: Use the "Authorize" button to add your JWT token
- **Schema Definitions**: View request/response schemas for all endpoints
- **Try It Out**: Execute API calls and see responses in real-time

## Using Swagger UI

### 1. Authentication

1. Click the **"Authorize"** button at the top right
2. Enter your JWT token (obtained from `/api/auth/login`)
3. Click **"Authorize"**
4. All protected endpoints will now use this token

### 2. Testing Endpoints

1. Expand any endpoint section
2. Click **"Try it out"**
3. Fill in the required parameters/request body
4. Click **"Execute"**
5. View the response below

### 3. Response Codes

- **200/201**: Success
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (invalid/missing token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **500**: Server Error

## API Endpoints Documented

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile

### Passengers
- `GET /api/passengers/profile` - Get passenger profile
- `PUT /api/passengers/location` - Update location
- `PUT /api/passengers/profile` - Update profile

### Drivers
- `GET /api/drivers/profile` - Get driver profile
- `PUT /api/drivers/location` - Update location
- `PUT /api/drivers/availability` - Toggle availability
- `PUT /api/drivers/profile` - Update profile
- `POST /api/drivers/vehicle` - Register vehicle
- `PUT /api/drivers/vehicle` - Update vehicle

### Trips
- `POST /api/trips` - Request trip
- `GET /api/trips/my-trips` - Get user's trips
- `GET /api/trips/available` - Get available trips (driver)
- `GET /api/trips/{tripId}` - Get trip details
- `POST /api/trips/{tripId}/accept` - Accept trip
- `POST /api/trips/{tripId}/start` - Start trip
- `POST /api/trips/{tripId}/complete` - Complete trip
- `POST /api/trips/{tripId}/cancel` - Cancel trip

### Payments
- `GET /api/payments/trip/{tripId}` - Get payment for trip
- `POST /api/payments/{paymentId}/complete` - Complete payment

### Notifications
- `GET /api/notifications` - Get notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/{notificationId}/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

### Ratings
- `POST /api/ratings` - Create rating
- `GET /api/ratings/trip/{tripId}` - Get ratings for trip
- `GET /api/ratings/user/{userId}` - Get ratings for user

## Updating Documentation

Documentation is generated from JSDoc comments in route files. To update:

1. Edit the route file (e.g., `routes/auth.js`)
2. Update the `@swagger` JSDoc comments
3. Restart the server
4. Refresh Swagger UI

## Exporting Documentation

You can export the OpenAPI specification:

```bash
# Get the JSON spec
curl http://localhost:3000/api-docs/swagger.json > swagger.json

# Or access it directly in browser
http://localhost:3000/api-docs/swagger.json
```

This JSON can be imported into:
- Postman
- Insomnia
- Other API testing tools
- API documentation generators
