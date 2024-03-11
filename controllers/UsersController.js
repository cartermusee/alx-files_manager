const db = require('../utils/db');

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
      const existingUser = await db.userExist(email);
      if (existingUser) {
        res.status(400).json({ error: 'Already exist' });
        res.end();
        return;
      }

      const newUser = await db.createUser(email, password);
      res.status(201).json({ id: newUser.insertedId, email });
      res.end();
      return;
    } catch (error) {
      console.log(error);
    }
  }
}
module.exports = UsersController;
