// src/routes/todos.js
// API REST pour les tâches : CRUD + upload d'une pièce jointe dans Blob Storage.

const express = require('express');
const multer = require('multer');
const crypto = require('crypto');

const upload = multer({ storage: multer.memoryStorage() });

module.exports = function todosRouter({ cosmos, blob }) {
  const router = express.Router();
  const { container } = cosmos;
  const { containerClient } = blob;

  // GET /api/todos — liste toutes les tâches
  router.get('/', async (req, res) => {
    try {
      const { resources } = await container.items
        .query('SELECT * FROM c ORDER BY c.createdAt DESC')
        .fetchAll();
      res.json(resources);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/todos — crée une tâche
  router.post('/', async (req, res) => {
    try {
      const { title } = req.body;
      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'title requis' });
      }
      const todo = {
        id: crypto.randomUUID(),
        title: title.trim(),
        done: false,
        attachmentUrl: null,
        createdAt: new Date().toISOString(),
      };
      const { resource } = await container.items.create(todo);
      res.status(201).json(resource);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/todos/:id — met à jour (toggle done ou renomme)
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { resource: existing } = await container.item(id, id).read();
      if (!existing) return res.status(404).json({ error: 'not found' });

      const updated = {
        ...existing,
        title: req.body.title ?? existing.title,
        done: req.body.done ?? existing.done,
      };
      const { resource } = await container.item(id, id).replace(updated);
      res.json(resource);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/todos/:id — supprime
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await container.item(id, id).delete();
      res.status(204).end();
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/todos/:id/attachment — upload un fichier dans Blob Storage
  // et lie l'URL à la tâche dans Cosmos DB.
  router.post('/:id/attachment', upload.single('file'), async (req, res) => {
    try {
      const { id } = req.params;
      if (!req.file) return res.status(400).json({ error: 'fichier requis' });

      // 1. Récupérer la tâche
      const { resource: existing } = await container.item(id, id).read();
      if (!existing) return res.status(404).json({ error: 'not found' });

      // 2. Uploader le blob
      const blobName = `${id}-${Date.now()}-${req.file.originalname}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.uploadData(req.file.buffer, {
        blobHTTPHeaders: { blobContentType: req.file.mimetype },
      });

      // 3. Mettre à jour la tâche avec l'URL publique
      const updated = { ...existing, attachmentUrl: blockBlobClient.url };
      const { resource } = await container.item(id, id).replace(updated);
      res.json(resource);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
