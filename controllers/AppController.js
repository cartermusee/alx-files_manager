const db = require('../utils/db');

const redis = require('../utils/redis');

class AppController {
  static getStatus(req, res) {
    if (db.isAlive && redis.isAlive) {
      res.status(200).json({ redis: true, db: true });
    }
  }

  static getStats(req, res) {
    if (db.isAlive && redis.isAlive) {
      res.status(200).json({ users: 12, files: 1231 });
    }
  }
}

module.exports = AppController;
