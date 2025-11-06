# PhotoText - Structured Photo Storytelling Document Library

**TypeScript/JavaScript library for photo-rich documents in Imalink**

PhotoText provides a structured document format optimized for creating photo-rich stories, albums, and narratives. All processing happens in the frontend - backend simply stores and serves JSON.

> **Important:** This is a frontend-only library. Backend needs no PhotoText code - just store and return JSON!

## 🎯 Philosophy

- **Frontend-first** - All document processing in browser, backend is just storage
- **Minimal but complete** - Only headings, paragraphs, lists, and image references
- **Type-safe** - Full TypeScript support with validation
- **Format-independent** - Renders to HTML or Markdown
- **Photo-centric** - Designed around Imalink image IDs, not external URLs
- **Diff-friendly** - JSON storage works great with Git

## ✨ Features

- 📝 **Simple structure**: Headings (H1-H6), paragraphs, lists, images
- 🎨 **Inline formatting**: Bold, italic, bold+italic
- 🖼️ **Image references**: Reference images by hash (hothash), not file paths
- 💾 **JSON storage**: Human-readable, versioned, backend-agnostic
- 🔄 **Multiple outputs**: Render to HTML (with CSS) or Markdown
- 🔍 **Type-safe API**: Full TypeScript support
- ✅ **Validated**: Only valid document structures can be created
- 🎛️ **WYSIWYG Editor**: Built-in browser-based editor

## 🚫 What PhotoText is NOT

PhotoText is **not**:
- ❌ A word processor (no tables, complex formatting)
- ❌ A Markdown parser (it generates Markdown, doesn't parse it)
- ❌ A general-purpose document format
- ❌ A replacement for HTML/Markdown in all contexts

PhotoText is **specifically designed** for photo storytelling and albums.

## 📦 Installation

```bash
npm install @imalink/phototext
# or
pnpm add @imalink/phototext
```

## 🚀 Quick Start

### Create a document programmatically

```typescript
import {
    PhotoDocument,
    HeadingBlock,
    ParagraphBlock,
    ImageBlock,
    InlineSpan,
    InlineType
} from '@imalink/phototext';
)

# Create document
doc = PhotoDocument(
    title="Summer Vacation 2024",
    description="Our trip to Italy"
)

# Add heading
doc.blocks.append(
} from '@imalink/phototext';

// Create document
const doc = new PhotoDocument(
    'Summer Vacation 2024',
    'Our trip to Italy'
);

// Add heading
doc.addBlock(
    new HeadingBlock(1, [new InlineSpan('Rome')])
);

// Add paragraph with formatting
doc.addBlock(
    new ParagraphBlock([
        new InlineSpan('We visited the '),
        new InlineSpan('Colosseum', InlineType.BOLD),
        new InlineSpan('!')
    ])
);

// Add image reference (Imalink image ID)
doc.addBlock(
    new ImageBlock('abc123def456...', 'Colosseum at sunset')
);

// Save to JSON
const json = doc.toString();
```

### Load and render

```typescript
// Load from JSON
const doc = PhotoDocument.fromString(jsonString);

// Render to HTML
const html = doc.toHTML({
    includeCSS: true,
    imageUrlResolver: (imageId) => `/api/images/${imageId}`
});

// Insert into page
document.getElementById('content')!.innerHTML = html;

// Or render to Markdown
const markdown = doc.toMarkdown();
```

### Use the WYSIWYG Editor

```typescript
import { PhotoTextEditor } from '@imalink/phototext/editor';

const editor = new PhotoTextEditor({
    container: document.getElementById('editor-container')!,
    document: doc,
    imageUrlResolver: (imageId) => `/api/images/${imageId}/thumbnail`,
    onChange: (document) => {
        // Auto-save to backend
        saveDocument(document.toString());
    },
    onImagePick: async () => {
        // Open your image picker
        return await showImagePicker();
    }
});

// Add editor CSS
const style = document.createElement('style');
style.textContent = PhotoTextEditor.getDefaultCSS();
document.head.appendChild(style);
```

## 🗄️ Backend Storage (Simple!)

Backend only needs to store and serve JSON - no processing required:

```typescript
// Express.js example
app.post('/api/documents', async (req, res) => {
    const { title, description, content } = req.body;
    
    // Optional: Basic validation
    if (!content.version || !Array.isArray(content.blocks)) {
        return res.status(400).json({ error: 'Invalid format' });
    }
    
    // Store as JSON(B)
    await db.query(`
        INSERT INTO documents (title, description, content, user_id)
        VALUES ($1, $2, $3, $4)
    `, [title, description, JSON.stringify(content), userId]);
    
    res.json({ success: true });
});

app.get('/api/documents/:id', async (req, res) => {
    const result = await db.query(`
        SELECT * FROM documents WHERE id = $1
    `, [req.params.id]);
    
    // Just return the JSON - frontend handles everything else
    res.json(result.rows[0]);
});
```

### Database Schema

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content JSONB NOT NULL,  -- Store PhotoDocument JSON
    created_at TIMESTAMP DEFAULT NOW(),
    modified_at TIMESTAMP DEFAULT NOW(),
    user_id UUID REFERENCES users(id)
);

-- Optional: Index for searching
CREATE INDEX idx_documents_content ON documents USING gin(content);
```

## 📋 Document Structure

### Query document

```typescript
// Metadata
console.log(`Title: ${doc.title}`);
console.log(`Blocks: ${doc.blocks.length}`);

// Get all image references
const imageIds = doc.getImageIds();
console.log(`Referenced images: ${imageIds}`);

// Validate images exist
const validIds = new Set(['img1', 'img2']);
const missingIds = doc.validateImageIds(validIds);
if (missingIds.length > 0) {
    console.warn('Missing images:', missingIds);
}
```

## 📐 Document Structure

```
PhotoDocument
├── title: string
├── description: string
├── created: Date
├── modified: Date
└── blocks: Block[]
    ├── HeadingBlock (H1-H6)
    │   └── content: InlineSpan[]
    ├── ParagraphBlock
    │   └── content: InlineSpan[]
    ├── ListBlock
    │   └── items: InlineSpan[][]
    └── ImageBlock
        ├── imageId: string (hothash reference)
        ├── caption: string
        └── alt: string
```

### Block Elements

- **HeadingBlock** - Headings (H1 through H6)
- **ParagraphBlock** - Text paragraphs with inline formatting
- **ListBlock** - Unordered (bullet) lists
- **ImageBlock** - Image references via Imalink image ID (hothash)

### Inline Elements

- **InlineSpan** - Text with optional styling:
  - `InlineType.TEXT` - Plain text
  - `InlineType.BOLD` - **Bold**
  - `InlineType.ITALIC` - *Italic*
  - `InlineType.BOLD_ITALIC` - ***Bold and italic***

## 💾 File Format

PhotoText documents are stored as JSON with `.phototext` extension:

```json
{
  "version": "1.0",
  "title": "Summer Vacation 2024",
  "description": "Our trip to Italy",
  "created": "2024-07-15T10:30:00",
  "modified": "2024-07-20T14:22:00",
  "blocks": [
    {
      "type": "heading",
      "level": 1,
      "content": [
        {"text": "Rome", "style": "text"}
      ]
    },
    {
      "type": "image",
      "hothash": "abc123def456...",
      "alt_text": "Colosseum"
    },
    {
      "type": "paragraph",
      "content": [
        {"text": "We visited the ", "style": "text"},
        {"text": "Colosseum", "style": "bold"},
        {"text": "!", "style": "text"}
      ]
    }
  ]
}
```

## 🎨 Rendering Examples

### HTML Output

```html
<div class="phototext-document">
  <h1>Rome</h1>
  <p>We visited the <strong>Colosseum</strong>!</p>
  <figure>
    <img src="/api/images/abc123def456..." alt="Colosseum at sunset">
    <figcaption>Colosseum at sunset</figcaption>
  </figure>
</div>
```

### Markdown Output

```markdown
# Rome

We visited the **Colosseum**!

![Colosseum at sunset](imalink:abc123def456...)
```

## 🖼️ Image References (Imalink IDs)

PhotoText uses **hothashes** instead of file paths or URLs. A hothash is a unique identifier for an image.

**Why hothashes?**
- ✅ Images can be stored anywhere (database, cloud, file system)
- ✅ No broken links if files move
- ✅ Documents stay small (just references, not image data)
- ✅ Same image can be referenced multiple times without duplication

**Custom image loading:**
When rendering, you provide a function to resolve image IDs to actual URLs:

```typescript
// Resolve Imalink image IDs to URLs
const imageUrlResolver = (imageId: string) => `/api/images/${imageId}`;

// Render with custom resolver
const html = doc.toHTML({ imageUrlResolver });
```

## 🔧 API Reference

See [API.md](API.md) for complete API documentation.

## 🧪 Testing

```bash
# Run tests (JavaScript)
cd js && npm test
```

## 📖 Examples

Se `js/examples/` directory for:
- `basic-usage.html` - Simple document creation in browser
- `editor-demo.html` - Interactive WYSIWYG editor demo
- Full integration guide in `IMALINK_INTEGRATION.md`

## 🎯 Imalink Integration

PhotoText is designed specifically for use with Imalink. See [IMALINK_INTEGRATION.md](IMALINK_INTEGRATION.md) for:
- Complete integration guide
- Database schema
- API endpoints
- Vue.js component examples
- Security best practices

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

## 📄 License

MIT License - see [LICENSE](LICENSE) file.

## 🛣️ Roadmap

- [x] TypeScript/JavaScript implementation
- [x] WYSIWYG editor
- [x] Imalink integration guide
- [ ] React/Angular editor components
- [ ] Advanced formatting options (within minimal philosophy)
- [ ] Drag-drop image insertion in editor
- [ ] Export to PDF
- [ ] Ordered lists support
- [ ] Nested lists support

## 🙏 Acknowledgments

Built for the Imalink photo management system.

---

**Made with ❤️ for photo storytelling**
