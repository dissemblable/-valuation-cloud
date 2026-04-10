// src/cosmos.js
// Initialise la connexion à Cosmos DB et crée la base / container si besoin.

const { CosmosClient } = require('@azure/cosmos');

async function initCosmos(config) {
  const client = new CosmosClient({
    endpoint: config.cosmosEndpoint,
    key: config.cosmosKey,
  });

  // Créer la base si elle n'existe pas
  const { database } = await client.databases.createIfNotExists({
    id: config.cosmosDatabase,
  });

  // Créer le container si il n'existe pas
  // PartitionKey = /id  →  simple et suffisant pour un TODO
  const { container } = await database.containers.createIfNotExists({
    id: config.cosmosContainer,
    partitionKey: { paths: ['/id'] },
  });

  return { client, database, container };
}

module.exports = { initCosmos };
