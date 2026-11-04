import { useRef, useState } from 'react';

export default function UploadComponent({ onUpload, uploading }) {
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || uploading) return;

    const uploaded = await onUpload(file);
    if (uploaded) {
      setFile(null);
      inputRef.current.value = '';
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label className="file-picker" htmlFor="document-file">
        <span className="file-picker-icon" aria-hidden="true">↑</span>
        <span className="file-picker-copy">
          <strong>{file ? file.name : 'Escolher um arquivo'}</strong>
          <span>{file ? 'Arquivo pronto para envio' : 'Selecione um arquivo do seu dispositivo'}</span>
        </span>
        <span className="browse-label">Procurar</span>
        <input
          ref={inputRef}
          className="visually-hidden"
          id="document-file"
          name="file"
          type="file"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
        />
      </label>
      <button className="primary-button upload-button" type="submit" disabled={!file || uploading}>
        {uploading ? 'Enviando...' : 'Enviar documento'}
        <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}