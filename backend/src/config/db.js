const mongoose = require('mongoose');

const connect = async () => {
  const uri = process.env.MONGO_URI;
  let retries = 5;
  while (retries) {
    try {
      await mongoose.connect(uri, { maxPoolSize: 20 });
      console.log('MongoDB connected');
      return;
    } catch (err) {
      retries--;
      console.error(`MongoDB connection failed, retries left: ${retries}`, err.message);
      if (!retries) throw err;
      await new Promise(r => setTimeout(r, 3000));
    }
  }
};

module.exports = { connect };
