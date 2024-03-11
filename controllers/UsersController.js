const express = require('express');

const router = express.Router();

const db = require('../utils/db');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }
    try {
      const existingUser = await db.userExist(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Already exist' });
      }

      const newUser = await db.createUser(email, password);
      return res.status(201).json({ id: newUser.id, email });
    } catch (error) {
      console.log(error);
    }
  }
}
module.exports = UsersController;
