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
var ordersRouter = require('./routes/orders');
var notificationsRouter = require('./routes/notifications');
var ratingsRouter = require('./routes/ratings');
var chatsRouter = require('./routes/chats');
var rentalsRouter = require('./routes/rentals');
var auctionsRouter = require('./routes/auctions');
var mechanicsRouter = require('./routes/mechanics');
var adminRouter = require('./routes/admin');

var app = express();

// CORS configuration for Render (and Railway/Vercel frontend)
function normalizeOriginHeader(origin) {
  if (!origin || typeof origin !== 'string') return '';
  try {
    return new URL(origin).origin;
  } catch (e) {
    return origin.trim();
  }
}

var allowedOrigins = [
  'https://ryde-web.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5172',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5172',
  'http://[::1]:3000',
  'http://[::1]:3001',
  'http://[::1]:5172',
  'https://dashboard.sandbox.irembopay.com',
  'https://dashboard.irembopay.com'
];

// Add origins from environment variable
var envOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(function(s) { return s.trim(); })
  .filter(Boolean);
envOrigins.forEach(function(o) {
  if (allowedOrigins.indexOf(o) === -1) allowedOrigins.push(o);
});

var allowedOriginSet = {};
allowedOrigins.forEach(function(o) {
  allowedOriginSet[normalizeOriginHeader(o)] = true;
});

// Vercel production + preview deploys for this project (ryde-web*.vercel.app)
var vercelRydePattern = /^https:\/\/ryde-web[\w.-]*\.vercel\.app$/i;
// Local dev: CRA (3000/3001), Vite (5172/5173), or any other localhost port
var localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

function isOriginAllowed(origin) {
  if (!origin) return true; // non-browser clients (curl/postman) omit Origin
  var normalized = normalizeOriginHeader(origin);
  if (allowedOriginSet[normalized]) return true;
  if (localhostPattern.test(origin)) return true;
  if (vercelRydePattern.test(origin)) return true;
  if (process.env.NODE_ENV !== 'production') return true;
  return false;
}

var corsOptions = {
  origin: function(origin, callback) {
    return callback(null, isOriginAllowed(origin));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

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
app.use('/api/orders', ordersRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/ratings', ratingsRouter);
app.use('/api/chats', chatsRouter);
app.use('/api/rentals', rentalsRouter);
app.use('/api/auctions', auctionsRouter);
app.use('/api/mechanics', mechanicsRouter);
app.use('/api/admin', adminRouter);

// Backwards-compatible payment checkout URL (some clients may omit `/api`).
// Keep this in sync with routes/payments.js (GET /checkout/:invoiceNumber).
app.get('/payments/checkout/:invoiceNumber', (req, res) => {
  const invoiceNumber = String(req.params.invoiceNumber || '').trim();
  return res.redirect(302, `/api/payments/checkout/${encodeURIComponent(invoiceNumber)}`);
});

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
  if (origin && isOriginAllowed(origin)) {
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
