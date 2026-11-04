const fs = require('node:fs/promises');
const path = require('node:path');

function createDocumentsRepository({ storageDirectory = path.resolve(__dirname, '../../storage') } = {}) {
  const documents = new Map();

  return {
    save(document) {
      documents.set(document.id, document);
      return document;
    },

    list() {
      return [...documents.values()];
    },

    findById(id) {
      return documents.get(id) || null;
    },

    getFilePath(document) {
      return path.join(storageDirectory, path.basename(document.storageName));
    },

    async removeStoredFile(storageName) {
      await fs.rm(path.join(storageDirectory, path.basename(storageName)), { force: true });
    },
  };
}

module.exports = createDocumentsRepository;
