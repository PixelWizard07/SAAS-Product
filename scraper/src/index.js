require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('./logger');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/meeshohub', { maxPoolSize: 5 })
  .then(() => {
    logger.info('Scraper connected to MongoDB');
    require('./workers/syncWorker');
    logger.info('Sync worker started');
  })
  .catch(err => {
    logger.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
