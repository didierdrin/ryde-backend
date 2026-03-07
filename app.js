require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var swaggerUi = require('swagger-ui-express');
var swaggerSpec = require('./config/swagger');

var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth');
var passengersRouter = require('./routes/passengers');
var driversRouter = require('./routes/drivers');
var tripsRouter = require('./routes/trips');
var paymentsRouter = require('./routes/payments');
var notificationsRouter = require('./routes/notifications');
var ratingsRouter = require('./routes/ratings');
var chatsRouter = require('./routes/chats');

var app = express();

// CORS configuration for Render (and Railway/Vercel frontend)
var allowedOrigins = [
  'https://ryde-web.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001'
];

// Add origins from environment variable
var envOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(function(s) { return s.trim(); })
  .filter(Boolean);
envOrigins.forEach(function(o) {
  if (allowedOrigins.indexOf(o) === -1) allowedOrigins.push(o);
});

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

// Handle preflight requests
app.options('*', cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/', indexRouter);
app.use('/api/auth', authRouter);
app.use('/api/passengers', passengersRouter);
app.use('/api/drivers', driversRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/ratings', ratingsRouter);
app.use('/api/chats', chatsRouter);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Ryde API Documentation'
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // Set CORS headers for error responses
  var origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Return JSON error response for API routes
  if (req.path.startsWith('/api')) {
    return res.status(err.status || 500).json({
      error: err.message,
      ...(req.app.get('env') === 'development' && { stack: err.stack })
    });
  }

  // render the error page for non-API routes
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

// Render: listen when run directly (e.g. start command: node app.js)
if (require.main === module) {
  var PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', function() {
    console.log('Server running on port ' + PORT);
  });
}
