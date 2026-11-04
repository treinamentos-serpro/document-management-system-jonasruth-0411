// Seed do servidor backend do Document Management System.
//
// Este arquivo é apenas um ponto de partida mínimo. Ao longo do workshop você
// vai usar o Agent Mode do GitHub Copilot para construir as camadas:
//   - routes/       (definição das rotas)
//   - controllers/  (entrada HTTP e validação)
//   - services/     (regras de negócio)
//   - repositories/ (persistência: arquivos locais + metadados em memória)
//
// Restrição do projeto: uploads são gravados no filesystem local da aplicação
// usando multer com diskStorage. Não utilize provedores externos.

const express = require('express');
const path = require('node:path');
const createDocumentsRepository = require('./repositories/documents.repository');
const createDocumentsService = require('./services/documents.service');
const createDocumentsController = require('./controllers/documents.controller');
const createDocumentsRouter = require('./routes/documents.routes');

const PORT = process.env.PORT || 3000;

function createApp({
  storageDirectory = path.resolve(__dirname, '../storage'),
  owner = process.env.DEFAULT_OWNER || 'default',
} = {}) {
  const app = express();
  const repository = createDocumentsRepository({ storageDirectory });
  const service = createDocumentsService({ repository, owner });
  const controller = createDocumentsController(service);
  const documentsRouter = createDocumentsRouter({ controller, storageDirectory });

  app.use(express.json());
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  app.use(documentsRouter);
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);

    const isMulterError = error.name === 'MulterError';
    const statusCode = isMulterError ? 400 : error.statusCode || 500;
    const code = isMulterError ? 'FILE_REQUIRED' : error.code || 'INTERNAL_ERROR';
    const message = statusCode >= 500 ? 'Ocorreu um erro interno.' : error.message;

    res.status(statusCode).json({ error: { code, message } });
  });

  return app;
}

const app = createApp();

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

app.createApp = createApp;
module.exports = app;
