require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const { connect } = require('./config/db');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://meeshohub-frontend.vercel.app',
  'https://saas-product.vercel.app',
  'https://saas-product-frontend.vercel.app',
];

// Strict Helmet config
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'no-referrer' },
}));

app.use(cors({
  origin: (origin, cb) => cb(null, !origin || allowedOrigins.some(o => origin === o || (o.includes('*') && origin.endsWith(o.replace('*', ''))))),
  credentials: true,
}));

// Body size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Security middleware
app.use(mongoSanitize()); // prevent NoSQL injection via req.body/$operators
app.use(xss());           // strip XSS from body/query
app.use(hpp());           // prevent HTTP parameter pollution

app.use(morgan('dev'));

// Global rate limit
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests, please try again later.' } }));

// Strict rate limit for auth endpoints
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many login attempts, please try again later.' } });
app.use('/api/v1/auth', authLimiter);

// Strict rate limit for bulk data endpoints
const bulkLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });
app.use('/api/v1/orders/bulk', bulkLimiter);
app.use('/api/v1/returns/bulk', bulkLimiter);
app.use('/api/v1/products/bulk', bulkLimiter);
app.use('/api/v1/payments/bulk', bulkLimiter);

app.use('/api/v1', routes);
app.get('/health', (req, res) => res.json({ status: 'ok', db: global.dbConnected ? 'connected' : 'disconnected' }));
app.use(errorHandler);

// Connect to MongoDB (once, cached across serverless invocations)
let dbPromise = null;
const ensureDB = () => {
  if (!dbPromise) {
    dbPromise = connect()
      .then(() => {
        global.dbConnected = true;
        console.log('✅ MongoDB connected');
      })
      .catch(err => {
        console.warn('⚠️  MongoDB unavailable:', err.message);
        global.dbConnected = false;
        dbPromise = null; // allow retry next invocation
      });
  }
  return dbPromise;
};

// Ensure DB is connected before handling requests
app.use((req, res, next) => {
  ensureDB().then(() => next()).catch(() => next());
});

// Trigger initial connection
ensureDB();

module.exports = app;
