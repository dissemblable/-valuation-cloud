// src/config.js
// Charge la configuration depuis Key Vault en prod, ou depuis .env en local.
// DefaultAzureCredential gère les deux cas automatiquement :
//  - en local, il utilise les identifiants de `az login`
//  - sur App Service, il utilise la Managed Identity

const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');

async function loadConfig() {
  const config = {
    // Cosmos DB
    cosmosEndpoint: process.env.COSMOS_ENDPOINT,
    cosmosDatabase: process.env.COSMOS_DATABASE || 'todoapp',
    cosmosContainer: process.env.COSMOS_CONTAINER || 'todos',
    cosmosKey: process.env.COSMOS_KEY, // fallback local

    // Blob Storage
    storageAccountName: process.env.STORAGE_ACCOUNT_NAME,
    blobContainerName: process.env.BLOB_CONTAINER_NAME || 'todo-attachments',
    storageConnectionString: process.env.STORAGE_CONNECTION_STRING, // fallback local

    // Key Vault
    keyVaultName: process.env.KEY_VAULT_NAME,
  };

  // Si un Key Vault est configuré, on récupère le secret depuis Key Vault.
  // Le secret stocké dans Key Vault est la clé primaire Cosmos DB.
  if (config.keyVaultName) {
    try {
      console.log(`🔐 Lecture du secret depuis Key Vault: ${config.keyVaultName}`);
      const credential = new DefaultAzureCredential();
      const vaultUrl = `https://${config.keyVaultName}.vault.azure.net`;
      const secretClient = new SecretClient(vaultUrl, credential);

      const cosmosKeySecret = await secretClient.getSecret('cosmos-primary-key');
      config.cosmosKey = cosmosKeySecret.value;
      console.log('✅ Secret "cosmos-primary-key" récupéré depuis Key Vault');
    } catch (err) {
      console.error('⚠️  Impossible de lire Key Vault:', err.message);
      console.error('   On utilise les variables d\'environnement locales en fallback.');
    }
  } else {
    console.log('ℹ️  KEY_VAULT_NAME non défini — mode local, utilisation du .env');
  }

  // Vérifications minimales
  if (!config.cosmosEndpoint) throw new Error('COSMOS_ENDPOINT manquant');
  if (!config.cosmosKey) throw new Error('COSMOS_KEY manquant (ni en env ni dans Key Vault)');
  if (!config.storageAccountName && !config.storageConnectionString) {
    throw new Error('STORAGE_ACCOUNT_NAME ou STORAGE_CONNECTION_STRING manquant');
  }

  return config;
}

module.exports = { loadConfig };
