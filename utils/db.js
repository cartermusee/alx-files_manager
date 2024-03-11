const { MongoClient } = require('mongodb');
const sha1 = require('sha1');

class DBClient {
  constructor() {
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || 27017;
    this.database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${this.host}:${this.port}/${this.database}`;

    this.connected = false;
    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.client.connect()
      .then(() => {
        this.connected = true;
      })
      .catch((err) => console.log(err));
  }

  isAlive() {
    return this.connected;
  }

  async nbUsers() {
    const users = this.client.db(this.database).collection('users').countDocuments();
    return users;
  }

  async nbFiles() {
    const files = await this.client.db(this.database).collection('files').countDocuments();
    return files;
  }

  async createUser(email, password) {
    const hashpwd = sha1(password);
    const user = await this.client.db(this.database).collection('users').insertOne({ email, password: hashpwd });
    return user;
  }

  async userExist(email) {
    const user = await this.client.db(this.database).collection('users').find({ email }).toArray();
    return user[0];
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
