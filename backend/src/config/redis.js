const Redis = require('ioredis');

let client;

const getClient = () => {
  if (!client) {
    client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
    client.on('error', err => console.error('Redis error:', err.message));
  }
  return client;
};

module.exports = { getClient };
