const db = require('../utils/db');

const redis = require('../utils/redis');

class AppController {
  static getStatus(req, res) {
    if (db.isAlive && redis.isAlive) {
      res.status(200).json({ redis: true, db: true });
      res.end();
    }
  }

  static async getStats(req, res) {
    const users = await db.nbUsers();
    const files = await db.nbFiles();
    res.status(200).json({ users, files });
    res.end();
  }
}

module.exports = AppController;
