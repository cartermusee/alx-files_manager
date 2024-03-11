const uid = require('uuid');
const sh1 = require('sha1');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const encodedCredentials = authHeader.split(' ')[1];
    const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString('utf-8');
    const [email, password] = decodedCredentials.split(':');

    try {
      const user = await dbClient.userExist(email);
      if (!user || user.password !== sh1(password)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const token = uid.v4();
      const key = `auth_${token}`;
      await redisClient.set(key, user._id.toString(), 86400);
      return res.status(200).json({ token });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      res.status(401).json({ error: 'Unauthorized he' });
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
