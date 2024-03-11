const uid = require('uuid');
const sh1 = require('sha1');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic')) {
      res.status(401).json({ error: 'Unauthorized' });
      res.end();
      return;
    }
    const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
    const email = credentials[0];
    const password = sh1(credentials[1]);
    const user = await dbClient.userExist(email);
    if (!user || user.password !== password) {
      res.status(401).json({ error: 'Unauthorized' });
      res.end();
      return;
    }
    const token = uid.v4();
    const key = `auth_${token}`;
    try {
      await redisClient.set(key, user._id.toString(), 86400);
      res.status(200).json({ token });
      res.end();
      return;
    } catch (error) {
      console.log(error);
    }
  }

  static async getDisconnect(res, req) {
    const token = req.headers.authorization;
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      res.end();
      return;
    }
    const key = `auth_${token}`;
    try {
      const userId = await redisClient.get(key);
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        res.end();
        return;
      }
      await redisClient.del(key);
      res.status(204).send();
      res.end();
      return;
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = AuthController;
