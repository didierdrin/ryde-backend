require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth');
var passengersRouter = require('./routes/passengers');
var driversRouter = require('./routes/drivers');
var tripsRouter = require('./routes/trips');
var paymentsRouter = require('./routes/payments');
var notificationsRouter = require('./routes/notifications');
var ratingsRouter = require('./routes/ratings');

var app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  credentials: true,
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
app.use('/api/notifications', notificationsRouter);
app.use('/api/ratings', ratingsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
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
