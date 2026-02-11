const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ryde API Documentation',
      version: '1.0.0',
      description: 'REST API documentation for Ryde ride-sharing application',
      contact: {
        name: 'Ryde API Support',
        email: 'support@ryde.rw'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://ryde-backend-production.up.railway.app',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from login endpoint'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'Unique user identifier',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            name: {
              type: 'string',
              description: 'User full name',
              example: 'John Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john.doe@example.com'
            },
            phoneNumber: {
              type: 'string',
              description: 'User phone number',
              example: '+250788123456'
            },
            userType: {
              type: 'string',
              enum: ['PASSENGER', 'DRIVER', 'ADMIN'],
              description: 'User role type'
            },
            registrationDate: {
              type: 'string',
              format: 'date-time',
              description: 'Account registration date'
            },
            isActive: {
              type: 'boolean',
              description: 'Account activation status',
              example: true
            }
          }
        },
        Trip: {
          type: 'object',
          properties: {
            tripId: {
              type: 'string',
              description: 'Unique trip identifier'
            },
            passengerId: {
              type: 'string',
              description: 'Passenger identifier'
            },
            driverId: {
              type: 'string',
              description: 'Driver identifier',
              nullable: true
            },
            pickupLatitude: {
              type: 'number',
              format: 'float',
              description: 'Pickup location latitude'
            },
            pickupLongitude: {
              type: 'number',
              format: 'float',
              description: 'Pickup location longitude'
            },
            pickupAddress: {
              type: 'string',
              description: 'Pickup address'
            },
            destinationLatitude: {
              type: 'number',
              format: 'float',
              description: 'Destination latitude'
            },
            destinationLongitude: {
              type: 'number',
              format: 'float',
              description: 'Destination longitude'
            },
            destinationAddress: {
              type: 'string',
              description: 'Destination address'
            },
            distance: {
              type: 'number',
              format: 'float',
              description: 'Trip distance in kilometers'
            },
            fare: {
              type: 'number',
              format: 'float',
              description: 'Trip fare in RWF'
            },
            status: {
              type: 'string',
              enum: ['REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
              description: 'Trip status'
            },
            requestTime: {
              type: 'string',
              format: 'date-time',
              description: 'Trip request time'
            }
          }
        },
        Payment: {
          type: 'object',
          properties: {
            paymentId: {
              type: 'string',
              description: 'Unique payment identifier'
            },
            tripId: {
              type: 'string',
              description: 'Associated trip identifier'
            },
            amount: {
              type: 'number',
              format: 'float',
              description: 'Payment amount in RWF'
            },
            paymentMethod: {
              type: 'string',
              enum: ['MTN_MOMO', 'AIRTEL_MONEY', 'CASH'],
              description: 'Payment method'
            },
            paymentStatus: {
              type: 'string',
              enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
              description: 'Payment status'
            },
            transactionRef: {
              type: 'string',
              description: 'Transaction reference',
              nullable: true
            },
            commission: {
              type: 'number',
              format: 'float',
              description: 'Platform commission'
            },
            driverEarnings: {
              type: 'number',
              format: 'float',
              description: 'Driver net earnings'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Success message'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication endpoints'
      },
      {
        name: 'Passengers',
        description: 'Passenger profile and operations'
      },
      {
        name: 'Drivers',
        description: 'Driver profile and operations'
      },
      {
        name: 'Trips',
        description: 'Trip management endpoints'
      },
      {
        name: 'Payments',
        description: 'Payment processing endpoints'
      },
      {
        name: 'Notifications',
        description: 'Notification management endpoints'
      },
      {
        name: 'Ratings',
        description: 'Rating and review endpoints'
      }
    ]
  },
  apis: ['./routes/*.js', './app.js'] // Path to the API files
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
