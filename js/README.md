# PhotoText - Frontend Library for Imalink

**Strukturert dokument-bibliotek for foto-historier i Imalink**

PhotoText er et TypeScript/JavaScript-bibliotek designet for å lagre og vise dokumenter i Imalink-systemet. Det bruker et JSON-basert format som kan lagres i databasen og kombinerer tekst og bilder på en strukturert måte.

## 🎯 Hva er PhotoText?

PhotoText gir deg:
- **JSON-format** - Enkelt å lagre i database
- **Kun Imalink-bilder** - Ingen eksterne linker, kun referanser til bilder i Imalink-databasen
- **HTML-generering** - Generer ferdig HTML for visning i browser
- **WYSIWYG-editor** - Innebygd editor for å redigere dokumenter
- **Type-sikker** - Fullt TypeScript-støtte

## 📦 Installasjon

```bash
npm install @imalink/phototext
```

## 🚀 Grunnleggende bruk

### Opprett et dokument programmatisk

```typescript
import { PhotoDocument, HeadingBlock, ParagraphBlock, ImageBlock, InlineSpan, InlineType } from '@imalink/phototext';

// Opprett et nytt dokument
const doc = new PhotoDocument(
    'Sommerferien 2024',
    'Vår reise til Italia'
);

// Legg til en overskrift
doc.addBlock(
    new HeadingBlock(1, [new InlineSpan('Roma')])
);

// Legg til et avsnitt med formatering
doc.addBlock(
    new ParagraphBlock([
        new InlineSpan('Vi besøkte '),
        new InlineSpan('Colosseum', InlineType.BOLD),
        new InlineSpan('!')
    ])
);

// Legg til en bildereferanse (Imalink image ID)
doc.addBlock(
    new ImageBlock('abc123def456...', 'Colosseum ved solnedgang')
);

// Lagre til JSON (for database)
const json = doc.toString();
```

### Last inn og vis dokument

```typescript
// Last fra JSON
const doc = PhotoDocument.fromString(jsonString);

// Generer HTML for visning
const html = doc.toHTML({
    includeCSS: true,
    imageUrlResolver: (imageId) => `/api/images/${imageId}`
});

// Sett inn i DOM
document.getElementById('content').innerHTML = html;
```

## 🎨 WYSIWYG Editor

PhotoText kommer med en innebygd WYSIWYG-editor:

```typescript
import { PhotoTextEditor } from '@imalink/phototext/editor';

const editor = new PhotoTextEditor({
    container: document.getElementById('editor-container'),
    document: doc, // Valgfritt: eksisterende dokument
    imageUrlResolver: (imageId) => `/api/images/${imageId}`,
    onChange: (document) => {
        // Callback når dokumentet endres
        console.log('Document updated:', document.toString());
    },
    onImagePick: async () => {
        // Åpne Imalink image picker
        const imageId = await showImalinkImagePicker();
        return imageId;
    }
});

// Legg til editor CSS
const style = document.createElement('style');
style.textContent = PhotoTextEditor.getDefaultCSS();
document.head.appendChild(style);

// Hent dokumentet
const currentDoc = editor.getDocument();

// Lagre til JSON
const json = editor.toJSON();
```

## 📋 Dokumentstruktur

Et PhotoText-dokument består av:

### Inline-elementer
- `InlineSpan` - Tekst med formatering (normal, bold, italic, bold+italic)

### Blokk-elementer
- `HeadingBlock` - Overskrifter (H1-H6)
- `ParagraphBlock` - Avsnitt med inline-formatering
- `ListBlock` - Punktlister
- `ImageBlock` - Bildereferanser (kun Imalink image IDs)

### Eksempel JSON-struktur

```json
{
  "version": "1.0",
  "title": "Min reise",
  "description": "En fantastisk reise",
  "created": "2024-11-06T10:00:00.000Z",
  "modified": "2024-11-06T12:00:00.000Z",
  "metadata": {},
  "blocks": [
    {
      "type": "heading",
      "level": 1,
      "content": [
        { "text": "Roma", "style": "text" }
      ]
    },
    {
      "type": "paragraph",
      "content": [
        { "text": "Vi besøkte ", "style": "text" },
        { "text": "Colosseum", "style": "bold" }
      ]
    },
    {
      "type": "image",
      "imageId": "abc123def456...",
      "caption": "Colosseum ved solnedgang"
    }
  ]
}
```

## 🔒 Sikkerhet

PhotoText er designet for Imalink og har følgende sikkerhetsegenskaper:

- ✅ **Ingen eksterne URL-er** - Kun Imalink image IDs
- ✅ **HTML escaping** - Automatisk escaping av brukerinput
- ✅ **Validering** - Kun tillatte blokk-typer

## 🛠️ API Referanse

### PhotoDocument

```typescript
class PhotoDocument {
    constructor(title: string, description?: string, metadata?: Record<string, any>)
    addBlock(block: Block): void
    toHTML(options?: RenderOptions): string
    toMarkdown(): string
    toString(): string  // Export to JSON
    static fromString(json: string): PhotoDocument
    getImageIds(): string[]
    validateImageIds(validIds: Set<string>): string[]
}
```

### Block-typer

```typescript
class HeadingBlock {
    constructor(level: number, content: InlineSpan[])
}

class ParagraphBlock {
    constructor(content: InlineSpan[])
}

class ListBlock {
    constructor(items: InlineSpan[][])
}

class ImageBlock {
    constructor(imageId: string, caption?: string, alt?: string)
}
```

### InlineSpan

```typescript
class InlineSpan {
    constructor(text: string, style?: InlineType)
}

enum InlineType {
    TEXT = "text",
    BOLD = "bold",
    ITALIC = "italic",
    BOLD_ITALIC = "bold_italic"
}
```

## 💡 Integrasjon med Imalink

### Lagre i database

```typescript
// Opprett dokument
const doc = new PhotoDocument('Mitt dokument');
// ... legg til innhold

// Konverter til JSON for lagring
const jsonData = doc.toString();

// Lagre i database
await db.documents.insert({
    id: '...',
    title: doc.title,
    content: jsonData,
    created: doc.created,
    modified: doc.modified
});
```

### Validere bildereferanser

```typescript
// Hent alle image IDs fra dokumentet
const imageIds = doc.getImageIds();

// Hent gyldige IDs fra databasen
const validIds = new Set(await db.images.getAllIds());

// Valider
const missingIds = doc.validateImageIds(validIds);
if (missingIds.length > 0) {
    console.warn('Missing images:', missingIds);
}
```

### Image URL Resolver

```typescript
function imalinkImageUrlResolver(imageId: string): string {
    // For thumbnails
    return `/api/images/${imageId}/thumbnail`;
    
    // For full size
    return `/api/images/${imageId}/full`;
    
    // Med auth token
    return `/api/images/${imageId}?token=${getAuthToken()}`;
}

const html = doc.toHTML({
    imageUrlResolver: imalinkImageUrlResolver
});
```

## 🎯 Best Practices

1. **Bruk image URL resolver** - Sørg for at bilder vises korrekt
2. **Valider image IDs** - Sjekk at alle bilder eksisterer før visning
3. **Lagre ofte** - Bruk onChange callback i editoren
4. **Versjonering** - Lagre modified timestamp for endringssporing
5. **Metadata** - Bruk metadata-feltet for tilleggsinformasjon

## 📝 Eksempler

Se `examples/` mappen for flere eksempler:
- `basic-usage.html` - Grunnleggende bruk
- `editor-integration.html` - Editor-integrasjon
- `imalink-integration.html` - Komplett Imalink-integrasjon

## 🔧 TypeScript Support

PhotoText er skrevet i TypeScript og kommer med full type-definisjon:

```typescript
import type { 
    PhotoDocument, 
    Block, 
    InlineSpan, 
    RenderOptions 
} from '@imalink/phototext';
```

## 📄 Lisens

MIT

## 🤝 Bidrag

Se [CONTRIBUTING.md](../CONTRIBUTING.md) for retningslinjer.
