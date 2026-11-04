const { randomUUID } = require('node:crypto');

function toPublicDocument({ storageName, ...document }) {
  return document;
}

function createServiceError(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function createDocumentsService({ repository, owner = process.env.DEFAULT_OWNER || 'default' }) {
  return {
    async upload(file) {
      if (!file) {
        throw createServiceError(400, 'FILE_REQUIRED', 'Envie um arquivo no campo file.');
      }

      const document = {
        id: randomUUID(),
        originalName: file.originalname,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        owner,
        storageName: file.filename,
      };

      try {
        repository.save(document);
      } catch (error) {
        await repository.removeStoredFile(file.filename).catch(() => {});
        throw error;
      }

      return toPublicDocument(document);
    },

    list() {
      return repository.list().map(toPublicDocument);
    },

    getById(id) {
      const document = repository.findById(id);

      if (!document) {
        throw createServiceError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
      }

      return {
        document: toPublicDocument(document),
        filePath: repository.getFilePath(document),
      };
    },
  };
}

module.exports = createDocumentsService;
