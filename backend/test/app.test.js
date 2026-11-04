const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const app = require('../src/app');

// Teste de fumaça: garante que o app Express foi exportado.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('a API permite enviar, listar e baixar documentos', async (t) => {
  const storageDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-test-'));
  const testApp = app.createApp({ storageDirectory, owner: 'test-owner' });
  const server = testApp.listen(0);

  await new Promise((resolve) => server.once('listening', resolve));
  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await fs.rm(storageDirectory, { recursive: true, force: true });
  });

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const formData = new FormData();
  formData.append('file', new Blob(['conteudo de teste']), 'amostra.txt');

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: formData,
  });
  assert.equal(uploadResponse.status, 201);
  const { document } = await uploadResponse.json();
  assert.equal(document.originalName, 'amostra.txt');
  assert.equal(document.size, 17);
  assert.equal(document.owner, 'test-owner');
  assert.equal(Object.hasOwn(document, 'storageName'), false);

  const listResponse = await fetch(`${baseUrl}/documents`);
  assert.equal(listResponse.status, 200);
  assert.deepEqual(await listResponse.json(), { documents: [document] });

  const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`);
  assert.equal(downloadResponse.status, 200);
  assert.equal(await downloadResponse.text(), 'conteudo de teste');
  assert.match(downloadResponse.headers.get('content-disposition'), /amostra\.txt/);

  const invalidIdResponse = await fetch(`${baseUrl}/documents/invalido/download`);
  assert.equal(invalidIdResponse.status, 400);
  assert.equal((await invalidIdResponse.json()).error.code, 'INVALID_DOCUMENT_ID');

  const missingDocumentResponse = await fetch(
    `${baseUrl}/documents/550e8400-e29b-41d4-a716-446655440000/download`,
  );
  assert.equal(missingDocumentResponse.status, 404);
  assert.equal((await missingDocumentResponse.json()).error.code, 'DOCUMENT_NOT_FOUND');

  const emptyFormData = new FormData();
  const missingFileResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: emptyFormData,
  });
  assert.equal(missingFileResponse.status, 400);
  assert.equal((await missingFileResponse.json()).error.code, 'FILE_REQUIRED');
});
