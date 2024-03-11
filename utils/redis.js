const { createClient } = require('redis');

class RedisClient {
  constructor() {
    this.client = createClient();
    this.client.on('error', (err) => {
      console.log(err);
    });
  }

  isAlive() {
    const con = this.client.on('connect', () => {});
    if (con) {
      return true;
    }
    return false;
  }

  async get(stringKey) {
    return new Promise((resolve, reject) => {
      this.client.get(stringKey, (err, reply) => {
        if (!err) {
          resolve(reply);
        }
        reject(err);
      });
    });
  }

  async set(stringKey, value, duration) {
    return new Promise((resolve, reject) => {
      this.client.set(stringKey, value, 'EX', duration, (err, reply) => {
        if (!err) {
          resolve(reply);
        }
        reject(err);
      });
    });
  }

  async del(stringKey) {
    return new Promise((resolve, reject) => {
      this.client.del(stringKey, (err, reply) => {
        if (!err) {
          resolve(reply);
        }
        reject(err);
      });
    });
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
