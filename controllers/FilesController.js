const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

async function getUserIdByToken(token) {
  try {
    const userId = await redisClient.get(`auth_${token}`);
    return userId;
  } catch (error) {
    console.log(error);
    return null;
  }
}

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing or invalid type' });
    }

    if ((type !== 'folder' && !data) || (type === 'folder' && data)) {
      return res.status(400).json({ error: 'Invalid data for the given type' });
    }

    try {
      const userId = await getUserIdByToken(token);

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (parentId !== 0) {
        const parentFile = await dbClient.getFileById(parentId);
        if (!parentFile) {
          return res.status(400).json({ error: 'Parent not found' });
        }
        if (parentFile.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }

      let localPath = '';

      if (type !== 'folder') {
        const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }

        const fileUUID = uuidv4();
        localPath = `${folderPath}/${fileUUID}`;

        // Save the file content to local path
        const fileBuffer = Buffer.from(data, 'base64');
        fs.writeFileSync(localPath, fileBuffer);
      }

      const newFile = await dbClient.createFile(userId, name, type, parentId, isPublic, localPath);
      return res.status(201).json(newFile);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = FilesController;
