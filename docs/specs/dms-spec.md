# Especificação - Document Management System

## 1. Objetivo

Permitir que usuários enviem, consultem e baixem documentos armazenados no filesystem local da aplicação, com metadados mantidos em memória nesta fase.

## 2. Escopo

### Dentro do escopo

- Envio de um documento por requisição.
- Listagem dos metadados de todos os documentos conhecidos pelo processo atual, sem paginação.
- Download de um documento pelo identificador.
- Atribuição informativa de um dono configurado para os documentos.
- Verificação de saúde do backend.

### Fora do escopo

- Armazenamento externo ou em nuvem.
- Persistência de metadados em banco de dados ou recuperação do catálogo após reiniciar o backend.
- Autenticação, autorização e isolamento de documentos entre usuários.
- Versionamento de documentos.
- Limite de tamanho ou lista de tipos de arquivo definidos pela aplicação nesta versão.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve aceitar um arquivo enviado em uma requisição `multipart/form-data` no campo `file`. Uma requisição sem arquivo deve ser rejeitada. |
| RF-02 | O sistema deve gravar o conteúdo do arquivo no filesystem local, em `backend/storage`, usando `multer` com `diskStorage`. |
| RF-03 | Após um upload bem-sucedido, o sistema deve criar e retornar os metadados do documento, incluindo identificador único, nome original, tamanho, data/hora do upload e dono. |
| RF-04 | O sistema deve listar todos os metadados de documentos registrados na memória do processo, sem paginação e sem expor caminhos locais ou nomes internos de armazenamento. |
| RF-05 | O sistema deve localizar e transmitir o conteúdo de um documento pelo identificador. O nome original deve ser sugerido como nome do arquivo baixado. |
| RF-06 | O sistema deve atribuir a cada documento o dono definido por `DEFAULT_OWNER`; se a variável não estiver configurada, deve usar `default`. Esse campo é informativo e não representa autenticação. |
| RF-07 | O sistema deve disponibilizar uma verificação de saúde que retorne o estado do backend. |
| RF-08 | Erros da API devem usar um formato JSON uniforme e não devem expor stack traces, caminhos absolutos ou detalhes internos do filesystem. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos enviados devem permanecer exclusivamente no filesystem local da aplicação, em `backend/storage`, usando `multer.diskStorage`; não devem ser usados provedores ou serviços externos. |
| RNF-02 | Os metadados devem ser mantidos em memória. Ao reiniciar o processo, o catálogo é perdido, mesmo que os arquivos gravados continuem no disco. |
| RNF-03 | A porta HTTP deve ser configurável pela variável de ambiente `PORT`, com padrão `3000`. O dono padrão deve ser configurável por `DEFAULT_OWNER`. |
| RNF-04 | O backend deve seguir Clean Architecture simples: `routes` encaminham para `controllers`, que coordenam `services`, que acessam `repositories`. Camadas internas não devem depender de Express. |
| RNF-05 | O backend deve usar Node.js e Express com CommonJS; o frontend deve usar React, componentes funcionais e Hooks, com Vite e ES modules. A comunicação com o backend deve usar `fetch`. |
| RNF-06 | A implementação deve usar JavaScript sem TypeScript e manter as dependências já previstas no projeto, incluindo `multer` para upload. |
| RNF-07 | A primeira versão não define limite próprio de tamanho nem lista permitida de tipos de arquivo. Qualquer política adicional de ambiente de implantação deve ser documentada separadamente e não alterar silenciosamente este contrato. |
| RNF-08 | O nome recebido do cliente deve ser tratado como metadado, nunca como caminho de gravação. O caminho interno deve ser gerado pela aplicação e não deve ser retornado pela API. |
| RNF-09 | Os testes do backend devem usar o runner nativo `node:test` e cobrir os contratos e falhas observáveis da API. |

## 5. Modelo de dados (metadados do documento)

### Metadados públicos

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador único gerado pelo servidor, no formato UUID. Usado nas rotas de listagem e download. |
| `originalName` | string | Nome do arquivo informado pelo cliente. É exibido como nome sugerido no download, mas não é usado para construir o caminho de armazenamento. |
| `size` | number | Tamanho do conteúdo em bytes, como inteiro não negativo. |
| `uploadedAt` | string | Instante do upload em UTC no formato ISO 8601. |
| `owner` | string | Valor de `DEFAULT_OWNER`, ou `default` quando não configurado. Campo informativo; não valida a identidade do solicitante. |

### Dados internos de persistência

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `storageName` | string | Nome interno gerado pelo servidor para localizar o arquivo em `backend/storage`. Nunca deve ser retornado ao cliente. |

O repositório mantém os metadados em memória e o arquivo correspondente no disco. A perda do processo elimina o catálogo e, nesta versão, não há mecanismo para reconstruí-lo a partir da pasta de armazenamento. A implementação deve evitar deixar arquivo órfão se o registro dos metadados falhar após a gravação.

## 6. Contratos de API

Os caminhos abaixo são os caminhos registrados no backend. Durante o desenvolvimento, o frontend chama os mesmos caminhos com o prefixo `/api`; o proxy do Vite remove esse prefixo antes de encaminhar a requisição ao backend. Por exemplo, `/api/documents` no frontend chega ao backend como `/documents`.

### Formato de erro

Respostas de erro JSON devem seguir este formato:

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Documento não encontrado."
  }
}
```

`code` é estável para uso pelo cliente; `message` é uma mensagem segura para apresentação. O backend não deve incluir stack trace ou caminho local.

### GET /health

Verificação operacional já prevista no seed do backend.

- Entrada: nenhuma.
- Sucesso: `200 application/json`.
- Corpo:

```json
{
  "status": "ok"
}
```

### POST /upload

Envia um arquivo e cria os metadados correspondentes.

- Entrada: `multipart/form-data`, com um arquivo no campo `file`.
- O dono não é recebido na requisição; é atribuído via `DEFAULT_OWNER`.
- Sucesso: `201 application/json`.
- Corpo:

```json
{
  "document": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "originalName": "relatorio.pdf",
    "size": 24576,
    "uploadedAt": "2026-11-04T12:00:00.000Z",
    "owner": "default"
  }
}
```

- Erros: `400 FILE_REQUIRED` para arquivo ausente ou requisição multipart inválida; `500 INTERNAL_ERROR` para falha inesperada de gravação ou registro.
- O caminho e o nome interno de armazenamento não fazem parte da resposta.

### GET /documents

Lista os documentos registrados na memória do processo.

- Entrada: nenhuma. A primeira versão não aceita parâmetros de paginação ou filtro.
- Sucesso: `200 application/json`.
- Corpo:

```json
{
  "documents": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "originalName": "relatorio.pdf",
      "size": 24576,
      "uploadedAt": "2026-11-04T12:00:00.000Z",
      "owner": "default"
    }
  ]
}
```

- Quando não houver documentos, retornar `200` com `{"documents": []}`.
- Erros: `500 INTERNAL_ERROR` para falha inesperada ao consultar o catálogo.

### GET /documents/:id/download

Baixa o conteúdo binário de um documento.

- Entrada: `id` UUID na URL.
- Sucesso: `200` com o conteúdo do arquivo e `Content-Disposition: attachment`, sugerindo `originalName` como nome do download. O caminho no filesystem nunca é exposto.
- Erros: `400 INVALID_DOCUMENT_ID` para identificador em formato inválido; `404 DOCUMENT_NOT_FOUND` quando não houver metadados para o identificador; `500 INTERNAL_ERROR` para falha de leitura do arquivo registrado.

### Regras comuns

- Todas as respostas de erro funcionais devem usar o formato JSON definido acima, exceto quando a conexão estiver comprometida por uma falha de transporte.
- Esta versão não especifica códigos para limites de upload, pois não define limite próprio de tamanho nem whitelist de tipos.
- As rotas funcionais são `/upload`, `/documents` e `/documents/:id/download`. O prefixo `/api` pertence ao proxy de desenvolvimento do frontend, não aos caminhos do backend.

## 7. Decisões arquiteturais

- Backend em Clean Architecture simples, com dependências no sentido `routes -> controllers -> services -> repositories`.
- `routes` declaram os caminhos e encaminham as requisições; `controllers` tratam entrada, validação básica e resposta HTTP; `services` aplicam as regras; `repositories` mantêm metadados em memória e acessam os arquivos locais.
- A configuração de upload usa `multer` com `diskStorage`; a pasta `backend/storage` deve existir ou ser criada pela aplicação antes de gravar arquivos.
- O nome interno de armazenamento é gerado pelo servidor e não depende do nome original fornecido pelo cliente.
- O frontend usa React com componentes funcionais e Hooks, organizado em `components/`, `pages/` e `services/`. A camada de serviços chama a API por `fetch` usando `/api` no ambiente Vite.
- Não há autenticação nesta versão. `owner` é atribuído pelo servidor e não concede isolamento ou autorização por usuário.
- Não há banco de dados, armazenamento externo, versionamento, paginação nem política própria de limite ou tipo de arquivo nesta fase.

## 8. Plano de execução

As etapas abaixo descrevem marcos futuros do produto. Esta especificação não executa nem detalha alterações em arquivos de backend ou frontend.

1. **Fundação e configuração:** confirmar contratos, configuração por ambiente, criação segura da pasta local de armazenamento e verificação de saúde.
2. **Persistência local e regras de negócio:** definir o modelo interno, geração de identificadores, gravação via `multer.diskStorage`, catálogo em memória, atribuição do dono e comportamento em caso de falha.
3. **API de documentos:** implementar e validar upload, listagem e download conforme os status, formatos e erros desta especificação.
4. **Experiência de uso no frontend:** oferecer envio de arquivo, visualização da lista, estados vazios e de erro, e ação para baixar cada documento, consumindo a API pelo proxy `/api`.
5. **Integração e testes:** validar o fluxo completo entre interface e backend, incluindo falhas de upload/leitura, identificadores inexistentes, preservação do nome de download e não exposição de caminhos internos.
6. **Revisão de limites operacionais:** avaliar separadamente se a implantação precisa de limites de upload ou restrições de tipo e atualizar os requisitos e contratos antes de introduzi-los.
