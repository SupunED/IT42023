const path = require('path');
const fs = require('fs');
const { BlobServiceClient } = require('@azure/storage-blob');
const dotenv = require('dotenv');

dotenv.config();

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'booknest-media';

let blobServiceClient = null;
let containerClient = null;

if (connectionString) {
  try {
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    containerClient = blobServiceClient.getContainerClient(containerName);
  } catch (err) {
    console.warn('⚠️ Azure Storage connection string provided but failed to initialize:', err.message);
  }
}

// Local fallback uploads directory
const localUploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(localUploadsDir)) {
  fs.mkdirSync(localUploadsDir, { recursive: true });
}

/**
 * Uploads a file buffer or stream to Azure Blob Storage (or local storage fallback).
 * @param {Buffer} fileBuffer 
 * @param {string} fileName 
 * @param {string} mimeType 
 * @returns {Promise<string>} Public URL of the uploaded image/document
 */
const uploadMedia = async (fileBuffer, fileName, mimeType = 'image/jpeg') => {
  const uniqueName = `${Date.now()}-${fileName.replace(/\s+/g, '-')}`;

  if (containerClient) {
    try {
      await containerClient.createIfNotExists({ access: 'blob' });
      const blockBlobClient = containerClient.getBlockBlobClient(uniqueName);
      await blockBlobClient.uploadData(fileBuffer, {
        blobHTTPHeaders: { blobContentType: mimeType }
      });
      return blockBlobClient.url;
    } catch (azureErr) {
      console.warn('⚠️ Azure Blob upload failed, falling back to local storage:', azureErr.message);
    }
  }

  // Fallback to local file storage
  const filePath = path.join(localUploadsDir, uniqueName);
  fs.writeFileSync(filePath, fileBuffer);
  return `/uploads/${uniqueName}`;
};

module.exports = {
  uploadMedia
};
