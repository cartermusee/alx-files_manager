const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const mimeTypes = require('mime-types');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

async function getUserIdFromToken(token) {
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
      name, type, parentId, isPublic, data,
    } = req.body;

    // Validation checks
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (!['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type' });
    }
    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    try {
      const userId = await getUserIdFromToken(token);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if parentId exists and is a folder if provided
      if (parentId) {
        const parentFile = await dbClient.getFileById(parentId);
        if (!parentFile) {
          return res.status(400).json({ error: 'Parent not found' });
        }
        if (parentFile.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' }); // Update error message here
        }
      }

      // Create file in DB
      const newFile = await dbClient.createFile(userId, name, type, parentId, isPublic);

      // If type is file or image, save data to disk
      if (type === 'file' || type === 'image') {
        const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
        const fileName = uuidv4();
        const filePath = `${folderPath}/${fileName}`;

        // Decode Base64 data and write to file
        const fileData = Buffer.from(data, 'base64');
        fs.writeFileSync(filePath, fileData);

        // Update localPath in DB
        await dbClient.updateLocalPath(newFile._id, filePath);
      }

      return res.status(201).json(newFile);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getShow(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    const userId = await getUserIdFromToken(token);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const file = await dbClient.getFileById(fileId);
      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }
      // Check if the file belongs to the user
      if (file.userId !== userId) {
        return res.status(404).json({ error: 'Forbidden' });
      }
      return res.status(200).json(file);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const parentId = req.query.parentId || '0';
    const page = parseInt(req.query.page, 20) || 0;
    const userId = await getUserIdFromToken(token);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const files = await dbClient.getFilesByParentId(userId, parentId, page, 20);
      return res.status(200).json(files);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async putPublish(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    const userId = await getUserIdFromToken(token);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const file = await dbClient.getFileById(fileId);
      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }
      // Check if the file belongs to the user
      if (file.userId !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Update isPublic to true
      await dbClient.updateIsPublic(fileId, true);

      // Return the updated file document
      return res.status(200).json(file);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async putUnpublish(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    const userId = await getUserIdFromToken(token);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const file = await dbClient.getFileById(fileId);
      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }
      // Check if the file belongs to the user
      if (file.userId !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Update isPublic to false
      await dbClient.updateIsPublic(fileId, false);

      // Return the updated file document
      return res.status(200).json(file);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getFile(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    const userId = await getUserIdFromToken(token);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const file = await dbClient.getFileById(fileId);
      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      // Check if the file is public or the user is the owner
      if (!file.isPublic && file.userId !== userId) {
        return res.status(404).json({ error: 'Not found' });
      }

      // Check if the file is a folder
      if (file.type === 'folder') {
        return res.status(400).json({ error: "A folder doesn't have content" });
      }

      // Check if the file exists locally
      if (!fs.existsSync(file.localPath)) {
        return res.status(404).json({ error: 'Not found' });
      }

      // Get the MIME type of the file
      const mimeType = mimeTypes.lookup(file.name) || 'application/octet-stream';

      // Read and send the file content
      const fileContent = fs.readFileSync(file.localPath);
      res.set('Content-Type', mimeType);
      res.send(fileContent);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = FilesController;
