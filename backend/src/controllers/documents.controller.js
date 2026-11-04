const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function createDocumentsController(service) {
  return {
    async upload(req, res, next) {
      try {
        const document = await service.upload(req.file);
        res.status(201).json({ document });
      } catch (error) {
        next(error);
      }
    },

    list(req, res, next) {
      try {
        res.status(200).json({ documents: service.list() });
      } catch (error) {
        next(error);
      }
    },

    download(req, res, next) {
      if (!UUID_PATTERN.test(req.params.id)) {
        res.status(400).json({
          error: {
            code: 'INVALID_DOCUMENT_ID',
            message: 'O identificador do documento é inválido.',
          },
        });
        return;
      }

      try {
        const { document, filePath } = service.getById(req.params.id);
        res.download(filePath, document.originalName, (error) => {
          if (error) next(error);
        });
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = createDocumentsController;
