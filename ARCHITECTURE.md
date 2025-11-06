# PhotoText Arkitektur

## Oversikt

PhotoText er et frontend TypeScript/JavaScript-bibliotek basert på JSON-format:

```
┌─────────────────────────────────────────────────────────┐
│                   PhotoText System                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │         TypeScript/JavaScript Frontend          │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ - PhotoDocument (model)                         │  │
│  │ - Block classes (HeadingBlock, etc.)            │  │
│  │ - InlineSpan (formatting)                       │  │
│  │ - HTML renderer                                 │  │
│  │ - Markdown generator                            │  │
│  │ - WYSIWYG Editor                                │  │
│  └────────────────────┬─────────────────────────────┘  │
│                       │                                │
│                ┌──────▼──────┐                         │
│                │ JSON Format │                         │
│                └──────┬──────┘                         │
│                       │                                │
└───────────────────────┼────────────────────────────────┘
                        │
            ┌───────────▼────────────┐
            │   Backend (Storage)    │
            │   - Store JSON         │
            │   - Serve JSON         │
            │   (No PhotoText lib)   │
            └────────────────────────┘
```

## Datamodell

### Hierarki

```
PhotoDocument
├── metadata (title, description, timestamps)
└── blocks[]
    ├── HeadingBlock
    │   ├── level (1-6)
    │   └── content: InlineSpan[]
    ├── ParagraphBlock
    │   └── content: InlineSpan[]
    ├── ListBlock
    │   └── items: InlineSpan[][]
    └── ImageBlock
        ├── imageId (hothash)
        ├── caption
        └── alt
```

### InlineSpan

```
InlineSpan
├── text: string
└── style: InlineType
    ├── TEXT
    ├── BOLD
    ├── ITALIC
    └── BOLD_ITALIC
```

## JSON Schema (forenklet)

```json
{
  "version": "1.0",
  "title": "string",
  "description": "string?",
  "created": "ISO8601 timestamp",
  "modified": "ISO8601 timestamp",
  "metadata": {},
  "blocks": [
    {
      "type": "heading" | "paragraph" | "list" | "image",
      // Type-spesifikke felter
    }
  ]
}
```

## Rendering Pipeline

### HTML Rendering

```
PhotoDocument
    ↓
blocks.map(block => block.toHTML())
    ↓
Join med newlines
    ↓
Wrap i <div class="phototext-document">
    ↓
Optionally: prepend CSS
    ↓
Return HTML string
```

### Markdown Rendering

```
PhotoDocument
    ↓
blocks.map(block => block.toMarkdown())
    ↓
Join med double newlines
    ↓
Return Markdown string
```

## Editor Arkitektur

```
┌─────────────────────────────────────────┐
│        PhotoTextEditor                  │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────┐     │
│  │  Toolbar                      │     │
│  │  - Format buttons             │     │
│  │  - Insert blocks              │     │
│  │  - Image picker               │     │
│  └───────────────────────────────┘     │
│                                         │
│  ┌───────────────────────────────┐     │
│  │  Content Area                 │     │
│  │  (contenteditable div)        │     │
│  │                               │     │
│  │  [H1] Heading                 │     │
│  │  [P]  Paragraph with **bold** │     │
│  │  [IMG] Image with caption     │     │
│  │                               │     │
│  └───────────────────────────────┘     │
│                                         │
│  Events:                                │
│  - input → updateDocument()             │
│  - toolbar clicks → insertBlock()       │
│  - onChange → callback(document)        │
│                                         │
└─────────────────────────────────────────┘
```

## Dataflyt i Imalink

### Lagre Dokument

```
User edits in PhotoTextEditor
    ↓
onChange callback fires
    ↓
editor.getDocument() → PhotoDocument
    ↓
document.toString() → JSON string
    ↓
POST /api/documents
    ↓
Validate PhotoDocument format
    ↓
Store in PostgreSQL (JSONB)
```

### Laste Dokument

```
GET /api/documents/:id
    ↓
Fetch JSONB from PostgreSQL
    ↓
Return JSON to frontend
    ↓
PhotoDocument.fromString(json)
    ↓
new PhotoTextEditor({ document })
    ↓
Render in editor
```

### Vise Dokument (read-only)

```
GET /api/documents/:id
    ↓
Fetch JSONB from PostgreSQL
    ↓
PhotoDocument.fromString(json)
    ↓
document.toHTML({ imageUrlResolver })
    ↓
Insert into DOM
```

## Bildeflyt

### Sette inn bilde

```
User clicks "Insert Image" in toolbar
    ↓
onImagePick() callback fires
    ↓
Open Imalink Image Picker modal
    ↓
GET /api/images → list of user's images
    ↓
User selects image
    ↓
Return image.hothash
    ↓
new ImageBlock(hothash, caption)
    ↓
Add to document.blocks
```

### Validere bildereferanser

```
document.getImageIds() → ["hash1", "hash2", ...]
    ↓
POST /api/documents/:id/validate-images
    ↓
SELECT hothash FROM images WHERE hothash IN (...)
    ↓
Compare found vs requested
    ↓
Return missing IDs
    ↓
Show warning if missing
```

### Vise bilder

```
document.toHTML({ imageUrlResolver })
    ↓
For each ImageBlock:
    imageUrlResolver(imageId) → URL
    ↓
    <img src="/api/images/{imageId}/thumbnail">
    ↓
GET /api/images/{imageId}/thumbnail
    ↓
Check authorization (user owns image)
    ↓
Return image file
```

## Sikkerhetslag

### Input Validering

```
Frontend:
    PhotoDocument class validates structure
    ↓
Backend:
    PhotoDocument.fromJSON() throws on invalid
    ↓
    Additional checks:
    - No external URLs in imageId
    - Valid block types
    - Valid inline styles
```

### Autorisation

```
All API calls:
    Check user authentication
    ↓
    Verify user owns resource
    ↓
    For images: verify user owns image
    ↓
    For documents: verify user owns document
```

### HTML Sanitization

```
User input (contenteditable)
    ↓
Parse to InlineSpan objects
    ↓
toHTML() with built-in escaping
    ↓
Optional: DOMPurify.sanitize()
    ↓
Safe HTML output
```

## Database Schema

### documents table

```sql
documents
├── id (UUID, PK)
├── title (VARCHAR)
├── description (TEXT)
├── content (JSONB)          ← PhotoDocument JSON
├── created_at (TIMESTAMP)
├── modified_at (TIMESTAMP)
├── user_id (UUID, FK)
└── metadata (JSONB)
```

### images table

```sql
images
├── id (UUID, PK)
├── hothash (VARCHAR, UNIQUE) ← Referenced by ImageBlock
├── filename (VARCHAR)
├── mime_type (VARCHAR)
├── size (BIGINT)
├── created_at (TIMESTAMP)
└── user_id (UUID, FK)
```

### Relasjon

```
documents.content.blocks[].imageId
    ↓
    references
    ↓
images.hothash
```

## Ytelse

### Caching

- **Images**: Cache bildeutdata (thumbnails)
- **Documents**: Cache rendered HTML (invalider ved endring)
- **JSON**: JSONB i PostgreSQL er effektivt indeksert

### Optimalisering

```
Frontend:
    - Debounce onChange callbacks (300ms)
    - Lazy load images (intersection observer)
    - Virtual scrolling for large documents

Backend:
    - Index på user_id og created_at
    - GIN index på JSONB content
    - Image CDN for static files
```

## Testing Strategi

### Unit Tests

```typescript
// phototext.test.ts
describe('PhotoDocument', () => {
  test('creates document with blocks', () => {
    const doc = new PhotoDocument('Test');
    doc.addBlock(new HeadingBlock(1, [new InlineSpan('Hello')]));
    expect(doc.blocks.length).toBe(1);
  });
});
```

### Integration Tests

```
Backend:
    - API endpoint tests
    - Database operations
    - Image validation

Frontend:
    - Editor functionality
    - Document rendering
    - Image picker integration
```

### E2E Tests

```
Cypress/Playwright:
    - Create document flow
    - Edit document flow
    - Insert image flow
    - Save and reload flow
```

## Skalerbarhet

### Horisontell Skalering

- Stateless API (no session storage)
- Database connection pooling
- Image storage på CDN/S3

### Vertikal Skalering

- JSONB effektivt i PostgreSQL
- Minimal minnebruk i frontend
- Lazy loading av bilder

## Fremtidige Utvidelser

### Mulige forbedringer

1. **Samarbeid** - Real-time collaborative editing
2. **Versjonering** - Document history/versions
3. **Mal-system** - Document templates
4. **Import/Export** - Word/PDF konvertering
5. **Avansert formatering** - Mer komplekse layouts (innenfor minimal-filosofi)

### Arkitektur for samarbeid

```
PhotoDocument
    ↓
    Operational Transform / CRDT
    ↓
WebSocket server
    ↓
Broadcast changes to all editors
```

## Oppsummering

PhotoText-arkitekturen er:
- ✅ **Enkel** - Minimal, fokusert funksjonalitet
- ✅ **Type-sikker** - Validering på alle nivåer
- ✅ **Frontend-first** - All prosessering i browser
- ✅ **Skalerbar** - JSON-basert, cachebar
- ✅ **Sikker** - Ingen eksterne referanser, god validering
- ✅ **Vedlikeholdbar** - Klar kodestruktur, god testing

Perfekt for Imalink sitt behov for å lagre og vise foto-rike dokumenter! 🎉
