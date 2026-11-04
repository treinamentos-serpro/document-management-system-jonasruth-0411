import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { listDocuments, uploadDocument } from './services/api.js';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  async function refreshDocuments(signal) {
    setIsLoading(true);
    setListError('');

    try {
      setDocuments(await listDocuments({ signal }));
    } catch (error) {
      if (error.name !== 'AbortError') {
        setListError(error.message || 'Não foi possível carregar os documentos.');
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    refreshDocuments(controller.signal);
    return () => controller.abort();
  }, []);

  async function handleUpload(file) {
    setIsUploading(true);
    setActionError('');
    setSuccessMessage('');

    try {
      await uploadDocument(file);
      setSuccessMessage('Documento enviado com sucesso.');
      await refreshDocuments();
      return true;
    } catch (error) {
      setActionError(error.message || 'Não foi possível enviar o documento.');
      return false;
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="DMS, início">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span className="brand-name">DMS<span> / Arquivos</span></span>
        </a>
        <span className="topbar-status"><span aria-hidden="true" /> Armazenamento local</span>
      </header>

      <main className="main-content">
        <section className="page-heading" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">BIBLIOTECA</p>
            <h1 id="page-title">Seus documentos</h1>
            <p className="page-description">Arquivos enviados para este espaço.</p>
          </div>
          <div className="document-count" aria-label={`${documents.length} documentos`}>
            <span className="count-number">{documents.length}</span>
            <span className="count-label">itens</span>
          </div>
        </section>

        <div className="workspace-grid">
          <section className="upload-panel" aria-labelledby="upload-title">
            <div className="section-heading">
              <span className="section-index">01</span>
              <h2 id="upload-title">Adicionar arquivo</h2>
            </div>
            <UploadComponent onUpload={handleUpload} uploading={isUploading} />
            {actionError && <p className="status-message error-message" role="alert">{actionError}</p>}
            {successMessage && <p className="status-message success-message" role="status">{successMessage}</p>}
          </section>

          <DocumentList
            documents={documents}
            loading={isLoading}
            error={listError}
            onRetry={() => refreshDocuments()}
          />
        </div>
      </main>

      <footer className="page-footer">
        <span>Document Management System</span>
        <span>Arquivos armazenados neste servidor</span>
      </footer>
    </div>
  );
}
