const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      res.end();
      return;
    }
    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      res.end();
      return;
    }

    try {
      const existingUser = await dbClient.userExist(email);
      if (existingUser) {
        res.status(400).json({ error: 'Already exist' });
        res.end();
        return;
      }
      const newUser = await dbClient.createUser(email, password);
      res.status(201).json({ id: newUser.insertedId, email });
      res.end();
      return;
    } catch (error) {
      console.log(error);
    }
  }

  static async getMe(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const key = `auth_${token}`;

    try {
      const userId = await redisClient.get(key);
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        res.end();
        return;
      }

      const user = await dbClient.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: 'Unauthorized db' });
      }
      const { email, _id } = user;
      return res.status(200).json({ id: _id , email});
    } catch (error) {
      console.log(error);
    }
  }
}
module.exports = UsersController;
