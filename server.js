// server.js — point d'entrée de l'application
require('dotenv').config();

const express = require('express');
const path = require('path');
const { loadConfig } = require('./src/config');
const { initCosmos } = require('./src/cosmos');
const { initBlob } = require('./src/blob');
const todosRouter = require('./src/routes/todos');

async function main() {
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  // 1. Charger la configuration (Key Vault en prod, .env en local)
  console.log('⏳ Chargement de la configuration...');
  const config = await loadConfig();
  console.log('✅ Configuration chargée');

  // 2. Initialiser Cosmos DB (crée la base et le container si besoin)
  console.log('⏳ Initialisation de Cosmos DB...');
  const cosmos = await initCosmos(config);
  console.log('✅ Cosmos DB prêt');

  // 3. Initialiser Blob Storage (crée le container si besoin)
  console.log('⏳ Initialisation de Blob Storage...');
  const blob = await initBlob(config);
  console.log('✅ Blob Storage prêt');

  // 4. Injecter les clients dans les routes
  app.use('/api/todos', todosRouter({ cosmos, blob }));

  // 5. Endpoint de santé (utile pour App Service)
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      slot: process.env.WEBSITE_SLOT_NAME || 'local',
      timestamp: new Date().toISOString(),
    });
  });

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`🚀 App démarrée sur http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error('❌ Erreur fatale au démarrage:', err);
  process.exit(1);
});
