const { randomUUID } = require('node:crypto');
const fs = require('node:fs/promises');
const express = require('express');
const multer = require('multer');

function createDocumentsRouter({ controller, storageDirectory }) {
  const router = express.Router();
  const storage = multer.diskStorage({
    destination(req, file, callback) {
      fs.mkdir(storageDirectory, { recursive: true })
        .then(() => callback(null, storageDirectory), callback);
    },
    filename(req, file, callback) {
      callback(null, randomUUID());
    },
  });
  const upload = multer({ storage });

  router.post('/upload', upload.single('file'), controller.upload);
  router.get('/documents', controller.list);
  router.get('/documents/:id/download', controller.download);

  return router;
}

module.exports = createDocumentsRouter;
