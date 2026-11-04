import DownloadButton from './DownloadButton.jsx';

function formatSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) {
    return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(size / 1024)} KB`;
  }
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(size / (1024 * 1024))} MB`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function DocumentList({ documents, loading, error, onRetry }) {
  return (
    <section className="document-section" aria-labelledby="documents-title">
      <div className="section-heading list-heading">
        <div>
          <span className="section-index">02</span>
          <h2 id="documents-title">Arquivos enviados</h2>
        </div>
        {!loading && !error && <span className="list-total">{documents.length} no total</span>}
      </div>

      {loading ? (
        <p className="list-feedback" role="status">Carregando documentos...</p>
      ) : error ? (
        <div className="list-feedback list-error" role="alert">
          <p>{error}</p>
          <button className="text-button" type="button" onClick={onRetry}>Tentar novamente</button>
        </div>
      ) : documents.length === 0 ? (
        <div className="empty-state">
          <span className="empty-mark" aria-hidden="true">—</span>
          <h3>Nenhum documento ainda</h3>
          <p>Os arquivos enviados aparecerão nesta lista.</p>
        </div>
      ) : (
        <ul className="document-list">
          {documents.map((document) => (
            <li className="document-row" key={document.id}>
              <span className="document-type" aria-hidden="true">DOC</span>
              <div className="document-info">
                <span className="document-name" title={document.originalName}>{document.originalName}</span>
                <span className="document-details">
                  {formatSize(document.size)} <span aria-hidden="true">·</span> {formatDate(document.uploadedAt)}
                </span>
              </div>
              <span className="document-owner">{document.owner}</span>
              <DownloadButton document={document} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}