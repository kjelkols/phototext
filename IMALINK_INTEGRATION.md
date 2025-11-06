# Imalink Integrasjonsguide for PhotoText

Denne guiden viser hvordan du integrerer PhotoText-biblioteket i Imalink frontend-applikasjonen.

> **Viktig:** PhotoText er et **frontend-bibliotek**. Backend lagrer kun JSON-data og trenger ikke PhotoText-biblioteket installert.

## Oversikt

PhotoText gir Imalink følgende funksjoner:
1. **Strukturert dokumentlagring** - JSON-format i database (backend lagrer bare JSON)
2. **Kun interne bildereferanser** - Ingen eksterne URL-er
3. **HTML-rendering** - Ferdig HTML for visning (skjer i frontend)
4. **WYSIWYG-editor** - Enkel redigering for brukere (i browser)

## Arkitektur

```
┌─────────────────────────────────────────┐
│         Imalink Frontend                │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────────────┐  │
│  │   PhotoText Editor Component     │  │
│  │  (Vue/React/Angular wrapper)     │  │
│  └──────────────────────────────────┘  │
│              ↓                          │
│  ┌──────────────────────────────────┐  │
│  │   PhotoTextEditor (core)         │  │
│  │   - Toolbar                      │  │
│  │   - Contenteditable              │  │
│  │   - Event handlers               │  │
│  └──────────────────────────────────┘  │
│              ↓                          │
│  ┌──────────────────────────────────┐  │
│  │   PhotoDocument (model)          │  │
│  │   - Blocks                       │  │
│  │   - JSON serialization           │  │
│  │   - HTML rendering               │  │
│  └──────────────────────────────────┘  │
│              ↓                          │
└──────────────┼──────────────────────────┘
               ↓
┌──────────────┼──────────────────────────┐
│         Imalink Backend                 │
├──────────────────────────────────────────┤
│  Database:                              │
│  - documents (JSON PhotoDocument)       │
│  - images (hothash references)          │
└─────────────────────────────────────────┘
```

## Database Schema

### Documents Table
```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content JSONB NOT NULL,  -- PhotoDocument JSON
    created_at TIMESTAMP DEFAULT NOW(),
    modified_at TIMESTAMP DEFAULT NOW(),
    user_id UUID REFERENCES users(id),
    metadata JSONB
);

-- Index for searching
CREATE INDEX idx_documents_content ON documents USING gin(content);
CREATE INDEX idx_documents_created ON documents(created_at DESC);
```

### Images Table (eksisterende)
```sql
-- Antar at dette allerede eksisterer
CREATE TABLE images (
    id UUID PRIMARY KEY,
    hothash VARCHAR(64) UNIQUE NOT NULL,
    filename VARCHAR(255),
    mime_type VARCHAR(50),
    size BIGINT,
    created_at TIMESTAMP DEFAULT NOW(),
    user_id UUID REFERENCES users(id)
);
```

## Backend API Endpoints

### 1. Dokumenter

#### GET /api/documents
Hent alle dokumenter for bruker
```json
{
  "documents": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "created_at": "timestamp",
      "modified_at": "timestamp",
      "preview": "string"  // First 100 chars of text
    }
  ]
}
```

#### GET /api/documents/:id
Hent et spesifikt dokument
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "content": { /* PhotoDocument JSON */ },
  "created_at": "timestamp",
  "modified_at": "timestamp"
}
```

#### POST /api/documents
Opprett nytt dokument
```json
{
  "title": "string",
  "description": "string",
  "content": { /* PhotoDocument JSON */ }
}
```

#### PUT /api/documents/:id
Oppdater dokument
```json
{
  "title": "string",
  "description": "string",
  "content": { /* PhotoDocument JSON */ }
}
```

#### DELETE /api/documents/:id
Slett dokument

### 2. Bilder

#### GET /api/images
Hent alle bilder for bruker (for image picker)
```json
{
  "images": [
    {
      "id": "uuid",
      "hothash": "string",
      "filename": "string",
      "thumbnail_url": "string",
      "created_at": "timestamp"
    }
  ]
}
```

#### GET /api/images/:hothash
Hent bilde (eksisterende endpoint)

#### POST /api/documents/:id/validate-images (VALGFRI)
Valider at alle bilder i dokumentet eksisterer (kan gjøres i frontend også)
```json
{
  "valid": true,
  "missing_images": []  // Array of missing hothashes
}
```

> **Backend-note:** Backend trenger **ikke** PhotoText-biblioteket. Endepunktene over lagrer og returnerer bare JSON. All prosessering av dokumenter skjer i frontend.

## Frontend Implementasjon

### 1. Vue.js Component

```vue
<template>
  <div class="document-editor">
    <div class="header">
      <input 
        v-model="document.title" 
        placeholder="Dokumenttittel"
        class="title-input"
      />
      <div class="actions">
        <button @click="save" :disabled="saving">
          {{ saving ? 'Lagrer...' : 'Lagre' }}
        </button>
        <button @click="preview">Forhåndsvisning</button>
      </div>
    </div>
    
    <div ref="editorContainer" class="editor-container"></div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { PhotoTextEditor } from '@imalink/phototext/editor';
import { PhotoDocument } from '@imalink/phototext';
import { useImalinkStore } from '@/stores/imalink';

export default {
  name: 'DocumentEditor',
  props: {
    documentId: String
  },
  setup(props) {
    const editorContainer = ref(null);
    const document = ref({ title: '', description: '' });
    const saving = ref(false);
    const store = useImalinkStore();
    
    let editor = null;

    onMounted(async () => {
      // Last dokument hvis det eksisterer
      let doc;
      if (props.documentId) {
        const response = await fetch(`/api/documents/${props.documentId}`);
        const data = await response.json();
        doc = PhotoDocument.fromString(JSON.stringify(data.content));
        document.value = data;
      } else {
        doc = new PhotoDocument('Nytt dokument');
      }

      // Opprett editor
      editor = new PhotoTextEditor({
        container: editorContainer.value,
        document: doc,
        imageUrlResolver: (imageId) => `/api/images/${imageId}/thumbnail`,
        onChange: (doc) => {
          // Auto-save eller marker som endret
          document.value.modified = true;
        },
        onImagePick: async () => {
          // Åpne Imalink image picker
          return await store.pickImage();
        }
      });

      // Legg til CSS
      if (!document.getElementById('phototext-editor-css')) {
        const style = document.createElement('style');
        style.id = 'phototext-editor-css';
        style.textContent = PhotoTextEditor.getDefaultCSS();
        document.head.appendChild(style);
      }
    });

    onUnmounted(() => {
      // Cleanup hvis nødvendig
    });

    const save = async () => {
      saving.value = true;
      try {
        const doc = editor.getDocument();
        const content = JSON.parse(doc.toString());

        const payload = {
          title: document.value.title,
          description: document.value.description,
          content: content
        };

        const url = props.documentId 
          ? `/api/documents/${props.documentId}`
          : '/api/documents';
        
        const method = props.documentId ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const data = await response.json();
          store.showNotification('Dokument lagret', 'success');
          if (!props.documentId) {
            // Redirect til edit-siden for det nye dokumentet
            window.location.href = `/documents/${data.id}/edit`;
          }
        }
      } catch (error) {
        store.showNotification('Feil ved lagring: ' + error.message, 'error');
      } finally {
        saving.value = false;
      }
    };

    const preview = () => {
      const doc = editor.getDocument();
      const html = doc.toHTML({
        includeCSS: true,
        imageUrlResolver: (id) => `/api/images/${id}`
      });
      
      // Åpne i nytt vindu
      const win = window.open('', 'Preview');
      win.document.write(html);
    };

    return {
      editorContainer,
      document,
      saving,
      save,
      preview
    };
  }
};
</script>

<style scoped>
.document-editor {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title-input {
  font-size: 24px;
  font-weight: 600;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 8px 0;
  flex: 1;
  margin-right: 20px;
}

.title-input:focus {
  outline: none;
  border-bottom-color: #007bff;
}

.actions button {
  margin-left: 10px;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  background: #007bff;
  color: white;
  cursor: pointer;
}

.actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
```

### 2. Image Picker (Vuex/Pinia Store)

```typescript
// stores/imalink.ts
import { defineStore } from 'pinia';

export const useImalinkStore = defineStore('imalink', {
  state: () => ({
    images: [],
    showImagePicker: false,
    imagePickerResolve: null
  }),

  actions: {
    async loadImages() {
      const response = await fetch('/api/images');
      const data = await response.json();
      this.images = data.images;
    },

    async pickImage(): Promise<string | null> {
      await this.loadImages();
      
      return new Promise((resolve) => {
        this.showImagePicker = true;
        this.imagePickerResolve = resolve;
      });
    },

    selectImage(imageId: string) {
      if (this.imagePickerResolve) {
        this.imagePickerResolve(imageId);
        this.imagePickerResolve = null;
      }
      this.showImagePicker = false;
    },

    cancelImagePicker() {
      if (this.imagePickerResolve) {
        this.imagePickerResolve(null);
        this.imagePickerResolve = null;
      }
      this.showImagePicker = false;
    }
  }
});
```

### 3. Image Picker Component

```vue
<template>
  <dialog :open="store.showImagePicker" class="image-picker-modal">
    <div class="modal-content">
      <h2>Velg bilde</h2>
      
      <div class="image-grid">
        <div 
          v-for="image in store.images" 
          :key="image.id"
          class="image-item"
          @click="selectImage(image)"
        >
          <img :src="image.thumbnail_url" :alt="image.filename" />
          <div class="image-info">{{ image.filename }}</div>
        </div>
      </div>

      <div class="modal-actions">
        <button @click="store.cancelImagePicker()">Avbryt</button>
      </div>
    </div>
  </dialog>
</template>

<script>
import { useImalinkStore } from '@/stores/imalink';

export default {
  setup() {
    const store = useImalinkStore();

    const selectImage = (image) => {
      store.selectImage(image.hothash);
    };

    return { store, selectImage };
  }
};
</script>

<style scoped>
.image-picker-modal {
  border: none;
  border-radius: 8px;
  padding: 0;
  max-width: 80vw;
  max-height: 80vh;
}

.modal-content {
  padding: 20px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
  margin: 20px 0;
  max-height: 60vh;
  overflow-y: auto;
}

.image-item {
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 4px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.image-item:hover {
  border-color: #007bff;
}

.image-item img {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.image-info {
  padding: 8px;
  font-size: 12px;
  text-align: center;
  background: #f5f5f5;
}

.modal-actions {
  text-align: right;
  padding-top: 15px;
  border-top: 1px solid #ddd;
}
</style>
```

## Backend Implementasjon (Node.js/Express)

> **Viktig:** Backend trenger **IKKE** PhotoText-biblioteket installert! Bare lagre og serve JSON.

```typescript
// routes/documents.ts
import express from 'express';

const router = express.Router();

// List documents
router.get('/api/documents', async (req, res) => {
  const userId = req.user.id;
  
  const documents = await db.query(`
    SELECT id, title, description, created_at, modified_at
    FROM documents
    WHERE user_id = $1
    ORDER BY modified_at DESC
  `, [userId]);

  res.json({ documents: documents.rows });
});

// Get document - bare returner JSON
router.get('/api/documents/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const result = await db.query(`
    SELECT * FROM documents
    WHERE id = $1 AND user_id = $2
  `, [id, userId]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Document not found' });
  }

  // Bare returner JSON - frontend håndterer alt annet
  res.json(result.rows[0]);
});

// Create document - bare lagre JSON
router.post('/api/documents', async (req, res) => {
  const { title, description, content } = req.body;
  const userId = req.user.id;

  // Enkel validering (valgfri)
  if (!content.version || !Array.isArray(content.blocks)) {
    return res.status(400).json({ error: 'Invalid document format' });
  }

  const result = await db.query(`
    INSERT INTO documents (id, title, description, content, user_id)
    VALUES (gen_random_uuid(), $1, $2, $3, $4)
    RETURNING *
  `, [title, description, JSON.stringify(content), userId]);

  res.json(result.rows[0]);
});

// Update document - bare oppdater JSON
router.put('/api/documents/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, content } = req.body;
  const userId = req.user.id;

  // Enkel validering (valgfri)
  if (!content.version || !Array.isArray(content.blocks)) {
    return res.status(400).json({ error: 'Invalid document format' });
  }

  const result = await db.query(`
    UPDATE documents
    SET title = $1, description = $2, content = $3, modified_at = NOW()
    WHERE id = $4 AND user_id = $5
    RETURNING *
  `, [title, description, JSON.stringify(content), id, userId]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Document not found' });
  }

  res.json(result.rows[0]);
});

// Validate images in document
router.post('/api/documents/:id/validate-images', async (req, res) => {
  const { id } = req.params;
// Validate images in document (VALGFRI - kan også gjøres i frontend)
router.post('/api/documents/:id/validate-images', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const docResult = await db.query(`
    SELECT content FROM documents
    WHERE id = $1 AND user_id = $2
  `, [id, userId]);

  if (docResult.rows.length === 0) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const content = docResult.rows[0].content;
  
  // Ekstraher image IDs manuelt (uten PhotoText-bibliotek)
  const imageIds = [];
  for (const block of content.blocks) {
    if (block.type === 'image' && block.imageId) {
      imageIds.push(block.imageId);
    }
  }

  if (imageIds.length === 0) {
    return res.json({ valid: true, missing_images: [] });
  }

  const imagesResult = await db.query(`
    SELECT hothash FROM images
    WHERE hothash = ANY($1) AND user_id = $2
  `, [imageIds, userId]);

  const foundIds = new Set(imagesResult.rows.map(r => r.hothash));
  const missingIds = imageIds.filter(id => !foundIds.has(id));

  res.json({
    valid: missingIds.length === 0,
    missing_images: missingIds
  });
});

export default router;
```

## Sikkerhet

### 1. Valider input (uten PhotoText-bibliotek)
```typescript
// Validate PhotoDocument structure
function isValidPhotoDocument(obj: any): boolean {
  if (!obj.version || !obj.title || !Array.isArray(obj.blocks)) {
    return false;
  }
  
  // Validate each block
  for (const block of obj.blocks) {
    if (!block.type || !['heading', 'paragraph', 'list', 'image'].includes(block.type)) {
      return false;
    }
    
    // For images, ensure no external URLs
    if (block.type === 'image') {
      if (!block.imageId || block.imageId.startsWith('http')) {
        return false;
      }
    }
  }
  
  return true;
}
```

### 2. Sanitize HTML output (i frontend)
HTML-output fra PhotoText er allerede sanitized, men du kan dobbeltsjekke i frontend:
```typescript
import DOMPurify from 'dompurify';

const html = doc.toHTML(imageUrlResolver);
const cleanHTML = DOMPurify.sanitize(html);
```

> **Backend trenger ikke:** Backend lagrer bare JSON, så ingen HTML-sanitering nødvendig der.

### 3. Autoriser bildetilgang
```typescript
// Sjekk at bruker har tilgang til bilde
router.get('/api/images/:hothash', async (req, res) => {
  const { hothash } = req.params;
  const userId = req.user.id;

  const result = await db.query(`
    SELECT * FROM images
    WHERE hothash = $1 AND user_id = $2
  `, [hothash, userId]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Image not found' });
  }

  // Serve image...
});
```

## Testing

```typescript
// tests/phototext.test.ts
import { PhotoDocument, HeadingBlock, ImageBlock, InlineSpan } from '@imalink/phototext';

describe('PhotoDocument', () => {
  test('should create document with blocks', () => {
    const doc = new PhotoDocument('Test');
    doc.addBlock(new HeadingBlock(1, [new InlineSpan('Hello')]));
    
    expect(doc.blocks.length).toBe(1);
    expect(doc.title).toBe('Test');
  });

  test('should validate image IDs', () => {
    const doc = new PhotoDocument('Test');
    doc.addBlock(new ImageBlock('img1'));
    doc.addBlock(new ImageBlock('img2'));

    const validIds = new Set(['img1']);
    const missing = doc.validateImageIds(validIds);
    
    expect(missing).toEqual(['img2']);
  });

  test('should serialize to JSON', () => {
    const doc = new PhotoDocument('Test');
    const json = doc.toString();
    const parsed = PhotoDocument.fromString(json);
    
    expect(parsed.title).toBe('Test');
  });
});
```

## Oppsummering

PhotoText gir Imalink:
- ✅ Strukturert dokumentlagring i JSON
- ✅ Kun interne bildereferanser (hothash)
- ✅ WYSIWYG-editor for enkel redigering (i browser)
- ✅ HTML-rendering for visning (i frontend)
- ✅ Type-sikker API (TypeScript)
- ✅ Validering av bildereferanser (i frontend)

**Backend:** Bare enkle CRUD-endpoints som lagrer/returnerer JSON. Ingen PhotoText-bibliotek nødvendig!

Start med:
1. Implementer enkle backend API-endpoints (se eksempler over)
2. Lag Vue.js-komponenten med PhotoTextEditor
3. Integrer med eksisterende Imalink image picker
4. Test med eksempelfilene i `js/examples/`
