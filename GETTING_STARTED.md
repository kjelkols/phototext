# PhotoText for Imalink - Oppsummering

## Hva er levert

PhotoText er et **frontend-bibliotek** (TypeScript/JavaScript) for å lage og redigere strukturerte dokumenter med bilder. Backend lagrer kun JSON - ingen prosessering nødvendig.

## 📁 Filstruktur

```
phototext/
├── README.md                    # Hovedoversikt
├── IMALINK_INTEGRATION.md       # Komplett integrasjonsguide
├── ARCHITECTURE.md              # Arkitektur-dokumentasjon
└── js/                          # JavaScript/TypeScript-bibliotek
    ├── README.md               # JavaScript-dokumentasjon
    ├── package.json            # NPM-konfigurasjon
    ├── tsconfig.json           # TypeScript-konfigurasjon
    ├── phototext.ts            # Hovedbibliotek
    ├── editor.ts               # WYSIWYG-editor
    └── examples/               # Eksempler
        ├── README.md
        ├── basic-usage.html    # Grunnleggende bruk
        └── editor-demo.html    # Editor-demo
```

## ✨ Hovedfunksjoner

### 1. Strukturert Dokumentformat
- **JSON-basert** - Enkelt å lagre i database
- **Type-sikkert** - Både Python og TypeScript
- **Validerbart** - Kun gyldige strukturer tillatt

### 2. Bildereferanser
- **Kun Imalink-bilder** - Ingen eksterne URL-er
- **Hothash-basert** - Refererer til bilder via hash
- **Validerbart** - Sjekk at bilder eksisterer

### 3. HTML-rendering
- **Innebygd CSS** - Pen standard-styling
- **Konfigurerbar** - Tilpass utseende
- **Image URL Resolver** - Fleksibel bildevisning

### 4. WYSIWYG-editor
- **ContentEditable-basert** - Moderne web-teknologi
- **Toolbar** - Enkel formatering
- **Live preview** - Se resultatet direkte
- **Bildeintegrasjon** - Velg bilder fra Imalink

## 🚀 Kom i gang

### For Frontend-utvikling

1. **Installer biblioteket:**
   ```bash
   cd js
   npm install
   ```

2. **Åpne eksempler:**
   ```bash
   cd js/examples
   # Åpne basic-usage.html eller editor-demo.html i nettleser
   firefox basic-usage.html
   ```

3. **Integrer i Vue.js:**
   - Se `IMALINK_INTEGRATION.md` for komplett Vue.js-eksempel
   - Implementer image picker
   - Koble til backend API

### For Backend-utvikling

Backend trenger **ikke** PhotoText-biblioteket. Backend lagrer bare JSON!

1. **Opprett database-tabell:**
   ```sql
   CREATE TABLE documents (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       title VARCHAR(255) NOT NULL,
       description TEXT,
       content JSONB NOT NULL,  -- PhotoDocument JSON fra frontend
       created_at TIMESTAMP DEFAULT NOW(),
       modified_at TIMESTAMP DEFAULT NOW(),
       user_id UUID REFERENCES users(id)
   );
   ```

2. **Implementer enkle API-endpoints:**
   ```typescript
   // GET /api/documents/:id - Bare returner JSON
   app.get('/api/documents/:id', async (req, res) => {
       const result = await db.query(
           'SELECT * FROM documents WHERE id = $1',
           [req.params.id]
       );
       res.json(result.rows[0]); // Frontenden håndterer alt annet
   });

   // POST /api/documents - Bare lagre JSON
   app.post('/api/documents', async (req, res) => {
       const { title, description, content } = req.body;
       
       // Valgfri enkel validering
       if (!content.version || !Array.isArray(content.blocks)) {
           return res.status(400).json({ error: 'Invalid format' });
       }
       
       await db.query(
           'INSERT INTO documents (title, description, content, user_id) VALUES ($1, $2, $3, $4)',
           [title, description, JSON.stringify(content), userId]
       );
       res.json({ success: true });
   });
   ```

**Det er alt!** Backend trenger ikke installere eller bruke PhotoText-biblioteket.

## 📋 JSON-format eksempel

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

- ✅ **Ingen eksterne URL-er** - Kun Imalink image IDs
- ✅ **HTML escaping** - Automatisk
- ✅ **Input validering** - Server-side og client-side
- ✅ **Autorisation** - Sjekk brukerrettigheter på bilder

## 🎯 Neste steg

1. **Test eksemplene** - Åpne HTML-filene i `js/examples/`
2. **Les integrasjonsguiden** - `IMALINK_INTEGRATION.md`
3. **Implementer backend** - API-endpoints i Node.js/Express
4. **Lag Vue-komponenter** - Editor og viewer
5. **Integrer med Imalink** - Database og bildesystem

## 📚 Dokumentasjon

- [Hovedoversikt](README.md)
- [JavaScript README](js/README.md)
- [Imalink Integrasjonsguide](IMALINK_INTEGRATION.md)
- [Eksempler README](js/examples/README.md)

## 💡 Tips

1. **Start enkelt** - Begynn med basic-usage.html eksemplet
2. **Test editoren** - Åpne editor-demo.html og eksperimenter
3. **Se på JSON-output** - Forstå datastrukturen
4. **Implementer image picker** - Essensielt for Imalink-integrasjon
5. **Valider bildereferanser** - Før visning

## 🤔 Spørsmål?

- Se eksemplene i `js/examples/`
- Les integrasjonsguiden i `IMALINK_INTEGRATION.md`
- Sjekk kildekoden i `js/phototext.ts` og `js/editor.ts`

## 🎉 Ferdig!

PhotoText er nå klar til bruk i Imalink. Biblioteket gir deg:
- Strukturert dokumentlagring
- WYSIWYG-editor
- HTML-rendering
- Type-sikker API
- Kun Imalink-bildereferanser

Lykke til med integrasjonen! 🚀
