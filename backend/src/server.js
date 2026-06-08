require('dotenv').config();
const { connect } = require('./config/db');
const app = require('./app');
const { startAutoSync } = require('./jobs/autoSync');
const { startAutoLabel } = require('./jobs/autoLabel');

const PORT = process.env.PORT || 5000;

connect()
  .then(() => {
    global.dbConnected = true;
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`MeeshoHub backend running on port ${PORT}`));
    startAutoSync();
    startAutoLabel();
  })
  .catch(err => {
    console.warn('⚠️  MongoDB unavailable:', err.message);
    global.dbConnected = false;
    app.listen(PORT, () => console.log(`MeeshoHub backend running on port ${PORT} (no DB)`));
  });
