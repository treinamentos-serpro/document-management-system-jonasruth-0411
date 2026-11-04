import { useState } from 'react';
import { downloadDocument } from '../services/api.js';

export default function DownloadButton({ document }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    setDownloading(true);
    setError('');

    try {
      await downloadDocument(document);
    } catch (downloadError) {
      setError(downloadError.message || 'Não foi possível baixar o arquivo.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="download-action">
      <button className="download-button" type="button" onClick={handleDownload} disabled={downloading}>
        <span aria-hidden="true">↓</span> {downloading ? 'Baixando...' : 'Baixar'}
      </button>
      {error && <span className="download-error" role="alert">{error}</span>}
    </div>
  );
}