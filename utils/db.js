const { MongoClient, ObjectId } = require('mongodb');
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

  async getUserById(userId) {
    const user = await this.client.db(this.database).collection('users').find({ _id: ObjectId(userId) }).toArray();
    if (!user.length) {
      return null;
    }
    return user[0];
  }

  async createFile(userId, name, type, parentId, isPublic, localPath) {
    try {
      const fileData = {
        userId,
        name,
        type,
        parentId,
        isPublic,
        localPath,
      };

      const newFile = await this.client.db(this.database).collection('files').insertOne(fileData);
      return newFile.ops[0];
    } catch (error) {
      console.error('Error creating file:', error);
      throw error;
    }
  }

  async getFileById(fileId) {
    try {
      const file = await this.client.db(this.database).collection('files').findOne({ _id: ObjectId(fileId) });
      return file;
    } catch (error) {
      console.error('Error fetching file by id:', error);
      throw error;
    }
  }

  async updateLocalPath(fileId, localPath) {
    await this.client.db(this.database).collection('files').updateOne(
      { _id: ObjectId(fileId) },
      { $set: { localPath } }
    );
  }

  async getFilesByParentId(userId, parentId, page, pageSize) {
    try {
      let query = { userId };
      if (parentId) {
        query.parentId = parentId;
      } else {
        query.parentId = '0'; // Assuming root directory has parentId '0'
      }
  
      const files = await this.client
        .db(this.database)
        .collection('files')
        .find(query)
        .skip(page * pageSize)
        .limit(pageSize)
        .toArray();
        
      return files;
    } catch (error) {
      throw new Error(`Error fetching files by parentId: ${error.message}`);
    }
  }
  
  static async updateIsPublic(fileId, isPublic) {
    try {
      const result = await this.client.db(this.database).collection('files')
        .updateOne(
          { _id: fileId },
          { $set: { isPublic: isPublic } }
        );
      if (result.modifiedCount === 0) {
        throw new Error('File not found or not updated');
      }
      return result;
    } catch (error) {
      throw new Error(`Error updating isPublic: ${error.message}`);
    }
  }
  
}

const dbClient = new DBClient();
module.exports = dbClient;
