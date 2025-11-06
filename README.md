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

- 📝 **Document types**: General, Album (images only), Slideshow (single images)
- 🎨 **Inline formatting**: Bold, italic, bold+italic
- 🖼️ **Image collages**: Up to 6 images in auto-layout grids
- 📸 **Cover images**: Optional cover image with hash reference
- 📄 **Metadata**: Title (required), abstract (optional), timestamps
- 💾 **JSON storage**: Human-readable, versioned, backend-agnostic
- 🔄 **Auto-layout**: Automatic grid layouts for 1-6 images
- 🔍 **Type validation**: Each document type has specific constraints
- ✅ **Hash-based images**: Content-addressed storage with SHA256
- 🎛️ **WYSIWYG Editor**: Built-in browser-based editor with live preview

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

### Document Types

PhotoText supports three specialized document types:

- **General** (`general`) - Full-featured documents with text and images
  - Supports: Headings, paragraphs, lists, images, collages
  - Use case: Blog posts, travel stories, reports
  
- **Album** (`album`) - Image-focused documents without free text
  - Supports: Images and collages only (no headings/paragraphs)
  - Use case: Photo galleries, portfolios, collections
  
- **Slideshow** (`slideshow`) - Presentation-style single images
  - Supports: Single images only (no collages, no text blocks)
  - Use case: Presentations, sequential storytelling

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

// Create document with type and metadata
const doc = new PhotoDocument(
    'Summer Vacation 2024',
    'general'  // or 'album' or 'slideshow'
);

// Set optional metadata
doc.abstract = 'Our memorable trip to Italy';
doc.coverImage = {
    hash: 'sha256_a1b2c3d4e5f6...',
    alt: 'Rome skyline at sunset'
};

// Add heading (only in 'general' type)
doc.addBlock(
    new HeadingBlock(1, [new InlineSpan('Rome')])
);

// Add paragraph with formatting (only in 'general' type)
doc.addBlock(
    new ParagraphBlock([
        new InlineSpan('We visited the '),
        new InlineSpan('Colosseum', InlineType.BOLD),
        new InlineSpan('!')
    ])
);

// Add image collage (up to 6 images)
doc.addBlock(
    new ImageBlock({
        images: [
            { imageId: 'img_abc123', alt: 'Colosseum exterior' },
            { imageId: 'img_def456', alt: 'Arena floor' },
            { imageId: 'img_ghi789', alt: 'Underground chambers' },
            { imageId: 'img_jkl012', alt: 'Tourist crowds' }
        ],
        caption: 'Four views of the Colosseum',
        layout: 'auto'  // Automatically calculates grid layout
    })
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
// Express.js example - Create document
app.post('/api/phototext', async (req, res) => {
    const { title, documentType, abstract, coverImage, content } = req.body;
    
    // Validate required fields
    if (!title || !documentType || !content) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate document type
    if (!['general', 'album', 'slideshow'].includes(documentType)) {
        return res.status(400).json({ error: 'Invalid document type' });
    }
    
    // Validate content structure
    if (!content.version || !Array.isArray(content.blocks)) {
        return res.status(400).json({ error: 'Invalid content format' });
    }
    
    // Store in database
    const result = await db.query(`
        INSERT INTO phototext_documents (
            title, 
            document_type, 
            abstract, 
            cover_image_hash,
            cover_image_alt,
            content, 
            user_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, created_at
    `, [
        title,
        documentType,
        abstract || null,
        coverImage?.hash || null,
        coverImage?.alt || null,
        JSON.stringify(content),
        req.user.id
    ]);
    
    res.json({ 
        id: result.rows[0].id,
        created_at: result.rows[0].created_at
    });
});

// Get document
app.get('/api/phototext/:id', async (req, res) => {
    const result = await db.query(`
        SELECT 
            id,
            title,
            document_type,
            abstract,
            cover_image_hash,
            cover_image_alt,
            content,
            created_at,
            modified_at,
            is_published
        FROM phototext_documents 
        WHERE id = $1 AND user_id = $2
    `, [req.params.id, req.user.id]);
    
    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Document not found' });
    }
    
    const doc = result.rows[0];
    
    // Construct response with cover image if present
    const response = {
        id: doc.id,
        title: doc.title,
        documentType: doc.document_type,
        abstract: doc.abstract,
        coverImage: doc.cover_image_hash ? {
            hash: doc.cover_image_hash,
            alt: doc.cover_image_alt
        } : null,
        content: doc.content,
        created_at: doc.created_at,
        modified_at: doc.modified_at,
        is_published: doc.is_published
    };
    
    res.json(response);
});

// Update document
app.put('/api/phototext/:id', async (req, res) => {
    const { title, abstract, coverImage, content } = req.body;
    
    await db.query(`
        UPDATE phototext_documents
        SET 
            title = $1,
            abstract = $2,
            cover_image_hash = $3,
            cover_image_alt = $4,
            content = $5
        WHERE id = $6 AND user_id = $7
    `, [
        title,
        abstract || null,
        coverImage?.hash || null,
        coverImage?.alt || null,
        JSON.stringify(content),
        req.params.id,
        req.user.id
    ]);
    
    res.json({ success: true });
});

// List documents with filters
app.get('/api/phototext', async (req, res) => {
    const { type, published, limit = 20, offset = 0 } = req.query;
    
    let query = `
        SELECT 
            id,
            title,
            document_type,
            abstract,
            cover_image_hash,
            cover_image_alt,
            created_at,
            modified_at,
            is_published
        FROM phototext_documents
        WHERE user_id = $1
    `;
    
    const params = [req.user.id];
    let paramCount = 1;
    
    if (type) {
        paramCount++;
        query += ` AND document_type = $${paramCount}`;
        params.push(type);
    }
    
    if (published !== undefined) {
        paramCount++;
        query += ` AND is_published = $${paramCount}`;
        params.push(published === 'true');
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    res.json({
        documents: result.rows,
        total: result.rows.length
    });
});
```

### Database Schema

```sql
CREATE TABLE phototext_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Required fields
    title VARCHAR(500) NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('general', 'album', 'slideshow')),
    content JSONB NOT NULL,
    
    -- Optional fields
    abstract TEXT,
    cover_image_hash VARCHAR(71),  -- 'sha256_' + 64 hex chars
    cover_image_alt VARCHAR(500),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Additional fields
    version VARCHAR(10) DEFAULT '1.0',
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_cover_image CHECK (
        (cover_image_hash IS NULL AND cover_image_alt IS NULL) OR
        (cover_image_hash IS NOT NULL AND cover_image_alt IS NOT NULL)
    )
);

-- Indexes for performance
CREATE INDEX idx_phototext_user_id ON phototext_documents(user_id);
CREATE INDEX idx_phototext_document_type ON phototext_documents(document_type);
CREATE INDEX idx_phototext_created_at ON phototext_documents(created_at DESC);
CREATE INDEX idx_phototext_published ON phototext_documents(is_published, published_at DESC) 
    WHERE is_published = TRUE;

-- Full-text search on title and abstract
CREATE INDEX idx_phototext_search ON phototext_documents 
    USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(abstract, '')));

-- JSON indexing for querying document content
CREATE INDEX idx_phototext_content ON phototext_documents USING gin(content);

-- Trigger to update modified_at
CREATE OR REPLACE FUNCTION update_phototext_modified()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modified_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER phototext_modified_trigger
    BEFORE UPDATE ON phototext_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_phototext_modified();
```

### Content JSONB Structure

The `content` column stores the PhotoText document structure:

```json
{
  "version": "1.0",
  "documentType": "general",
  "title": "Summer Vacation 2024",
  "abstract": "Our memorable trip to Italy",
  "coverImage": {
    "hash": "sha256_a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
    "alt": "Rome skyline at sunset"
  },
  "created": "2024-07-15T10:30:00Z",
  "modified": "2024-07-20T14:22:00Z",
  "metadata": {
    "duration": 5000,
    "transition": "fade"
  },
  "blocks": [
    {
      "type": "heading",
      "level": 1,
      "content": [
        {"text": "Rome", "style": "text"}
      ]
    },
    {
      "type": "paragraph",
      "content": [
        {"text": "We visited the ", "style": "text"},
        {"text": "Colosseum", "style": "bold"},
        {"text": "!", "style": "text"}
      ]
    },
    {
      "type": "image",
      "images": [
        {
          "imageId": "img_abc123",
          "alt": "Colosseum exterior"
        },
        {
          "imageId": "img_def456",
          "alt": "Arena floor"
        }
      ],
      "caption": "Two views of the Colosseum",
      "layout": "auto"
    }
  ]
}
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
├── version: string (e.g., "1.0")
├── documentType: "general" | "album" | "slideshow"
├── title: string (required)
├── abstract: string (optional)
├── coverImage: { hash: string, alt: string } (optional)
├── created: ISO8601 timestamp
├── modified: ISO8601 timestamp
├── metadata: object (type-specific settings)
└── blocks: Block[]
    ├── HeadingBlock (H1-H6) - only in 'general'
    │   ├── type: "heading"
    │   ├── level: 1-6
    │   └── content: InlineSpan[]
    ├── ParagraphBlock - only in 'general'
    │   ├── type: "paragraph"
    │   └── content: InlineSpan[]
    ├── ListBlock - only in 'general'
    │   ├── type: "list"
    │   └── items: InlineSpan[][]
    └── ImageBlock - all types
        ├── type: "image"
        ├── images: Array<{ imageId: string, alt: string }>
        ├── caption: string
        └── layout: "auto"
```

### Document Type Constraints

| Type | Allowed Blocks | Collages | Max Images/Block |
|------|----------------|----------|------------------|
| **general** | heading, paragraph, list, image | ✅ Yes | 6 |
| **album** | image only | ✅ Yes | 6 |
| **slideshow** | image only | ❌ No | 1 |

### Image Layout Rules

When `layout: "auto"`, the grid is automatically calculated:

- **1 image**: Full width, auto height (max 500px)
- **2 images**: Side-by-side (2 columns)
- **3 images**: 3-column grid
- **4 images**: 2x2 grid (2 columns)
- **5-6 images**: 3-column grid

CSS classes: `.layout-1` through `.layout-6`

### Block Elements

- **HeadingBlock** - Headings (H1 through H6) - *general only*
- **ParagraphBlock** - Text paragraphs with inline formatting - *general only*
- **ListBlock** - Unordered (bullet) lists - *general only*
- **ImageBlock** - Image references with collage support - *all types*
  - Single image or collage (up to 6 images)
  - Optional caption (plain text)
  - Auto-layout grid system
  - Individual alt-text per image

### Inline Elements

- **InlineSpan** - Text with optional styling:
  - `InlineType.TEXT` - Plain text
  - `InlineType.BOLD` - **Bold**
  - `InlineType.ITALIC` - *Italic*
  - `InlineType.BOLD_ITALIC` - ***Bold and italic***

## 💾 File Format

PhotoText documents are stored as JSON:

```json
{
  "version": "1.0",
  "documentType": "general",
  "title": "Summer Vacation 2024",
  "abstract": "Our memorable trip to Italy",
  "coverImage": {
    "hash": "sha256_a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
    "alt": "Rome skyline at sunset"
  },
  "created": "2024-07-15T10:30:00.000Z",
  "modified": "2024-07-20T14:22:00.000Z",
  "metadata": {},
  "blocks": [
    {
      "type": "heading",
      "level": 1,
      "content": [
        {"text": "Rome", "style": "text"}
      ]
    },
    {
      "type": "paragraph",
      "content": [
        {"text": "We visited the ", "style": "text"},
        {"text": "Colosseum", "style": "bold"},
        {"text": "!", "style": "text"}
      ]
    },
    {
      "type": "image",
      "images": [
        {
          "imageId": "img_abc123",
          "alt": "Colosseum exterior"
        },
        {
          "imageId": "img_def456",
          "alt": "Arena floor"
        }
      ],
      "caption": "Two views of the Colosseum",
      "layout": "auto"
    }
  ]
}
```

### Album Document Example

```json
{
  "version": "1.0",
  "documentType": "album",
  "title": "Beach Photoshoot 2024",
  "abstract": "Professional portrait session",
  "coverImage": {
    "hash": "sha256_fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
    "alt": "Main portrait"
  },
  "created": "2024-08-01T12:00:00.000Z",
  "modified": "2024-08-01T15:30:00.000Z",
  "metadata": {},
  "blocks": [
    {
      "type": "image",
      "images": [
        {"imageId": "img_001", "alt": "Portrait 1"},
        {"imageId": "img_002", "alt": "Portrait 2"},
        {"imageId": "img_003", "alt": "Portrait 3"},
        {"imageId": "img_004", "alt": "Portrait 4"},
        {"imageId": "img_005", "alt": "Portrait 5"},
        {"imageId": "img_006", "alt": "Portrait 6"}
      ],
      "caption": "Beach portrait collection",
      "layout": "auto"
    }
  ]
}
```

### Slideshow Document Example

```json
{
  "version": "1.0",
  "documentType": "slideshow",
  "title": "Q3 2024 Presentation",
  "created": "2024-09-01T09:00:00.000Z",
  "modified": "2024-09-01T10:00:00.000Z",
  "metadata": {
    "duration": 5000,
    "transition": "fade"
  },
  "blocks": [
    {
      "type": "image",
      "images": [
        {"imageId": "slide_001", "alt": "Introduction"}
      ],
      "caption": "Welcome to Q3 Review",
      "layout": "auto"
    },
    {
      "type": "image",
      "images": [
        {"imageId": "slide_002", "alt": "Key metrics"}
      ],
      "caption": "Performance Overview",
      "layout": "auto"
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

## 🖼️ Image References (Hash-based)

PhotoText uses **SHA256 hashes** instead of file paths or URLs. A hash is a unique, content-based identifier for an image.

**Why hashes (hothash)?**
- ✅ **Content-addressed** - Same image = same hash, automatic deduplication
- ✅ **Integrity verification** - Detect if image has been modified
- ✅ **Location-independent** - Images can be stored anywhere
- ✅ **No broken links** - Hash never changes even if storage location does
- ✅ **Efficient storage** - Multiple documents can reference same image

**Hash format:**
```
sha256_[64 hexadecimal characters]
```

Example:
```
sha256_a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

**Custom image loading:**
When rendering, you provide a function to resolve hashes to actual URLs:

```typescript
// Resolve image hashes to URLs
const imageUrlResolver = (imageId: string) => `/api/images/${imageId}`;

// Render with custom resolver
const html = doc.toHTML({ imageUrlResolver });
```

### Cover Image

Documents can have an optional cover image:

```typescript
doc.coverImage = {
    hash: 'sha256_a1b2c3d4e5f6...',
    alt: 'Descriptive text'
};
```

Cover images are stored separately in the database for easy querying and thumbnail generation.

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
- [x] WYSIWYG editor with live preview
- [x] Document types (General, Album, Slideshow)
- [x] Image collages with auto-layout
- [x] Cover image support
- [x] Hash-based image references (SHA256)
- [x] Complete database schema
- [ ] Backend validation library
- [ ] React/Vue/Angular editor components
- [ ] Drag-drop image reordering in collages
- [ ] Export to PDF
- [ ] Full-text search API
- [ ] Image optimization recommendations
- [ ] Ordered lists support
- [ ] Nested lists support
- [ ] Video block support

## 🙏 Acknowledgments

Built for the Imalink photo management system.

---

**Made with ❤️ for photo storytelling**
