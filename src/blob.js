// src/blob.js
// Initialise le client Blob Storage.
// En prod : on utilise la Managed Identity (DefaultAzureCredential)
// En local : on peut utiliser une connection string depuis .env

const { BlobServiceClient } = require('@azure/storage-blob');
const { DefaultAzureCredential } = require('@azure/identity');

async function initBlob(config) {
  let blobServiceClient;

  if (config.storageConnectionString) {
    // Mode local — connection string
    console.log('📦 Blob Storage: mode connection string (local)');
    blobServiceClient = BlobServiceClient.fromConnectionString(
      config.storageConnectionString
    );
  } else {
    // Mode prod — Managed Identity
    console.log('📦 Blob Storage: mode Managed Identity (Azure)');
    const url = `https://${config.storageAccountName}.blob.core.windows.net`;
    blobServiceClient = new BlobServiceClient(url, new DefaultAzureCredential());
  }

  // Créer le container s'il n'existe pas (accès blob public pour simplifier la démo)
  const containerClient = blobServiceClient.getContainerClient(config.blobContainerName);
  await containerClient.createIfNotExists({ access: 'blob' });

  return { blobServiceClient, containerClient };
}

module.exports = { initBlob };
