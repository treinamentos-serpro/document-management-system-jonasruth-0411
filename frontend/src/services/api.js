async function request(url, options) {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Não foi possível conectar ao servidor.');
  }
}

async function requestJson(url, options) {
  const response = await request(url, options);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Não foi possível concluir a solicitação.');
  }

  return payload;
}

export async function listDocuments({ signal } = {}) {
  const payload = await requestJson('/api/documents', { signal });
  return payload.documents;
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const payload = await requestJson('/api/upload', {
    method: 'POST',
    body: formData,
  });

  return payload.document;
}

export async function downloadDocument(documentMetadata) {
  const response = await request(
    `/api/documents/${encodeURIComponent(documentMetadata.id)}/download`,
  );

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message || 'Não foi possível baixar o documento.');
  }

  const objectUrl = URL.createObjectURL(await response.blob());
  const link = window.document.createElement('a');
  link.href = objectUrl;
  link.download = documentMetadata.originalName || 'documento';
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}