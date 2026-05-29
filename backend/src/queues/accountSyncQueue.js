const { Queue } = require('bullmq');
const { getClient } = require('../config/redis');

let queue;

const getQueue = () => {
  if (!queue) {
    queue = new Queue('account-sync', { connection: getClient() });
  }
  return queue;
};

const addSyncJob = (data, opts = {}) => {
  return getQueue().add('sync', data, {
    jobId: `sync-${data.accountId}-${Date.now()}`,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    ...opts,
  });
};

module.exports = { getQueue, addSyncJob };
