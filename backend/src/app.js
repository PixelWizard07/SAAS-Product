require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
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

app.use(helmet());
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false }));

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
