# PhotoText - Repo Struktur

Dette repositoriet inneholder PhotoText-biblioteket for Imalink.

## 🎯 Viktig å vite

**PhotoText er et frontend-bibliotek.** Backend lagrer kun JSON og trenger ikke biblioteket installert.

## 📂 Struktur

```
phototext/
├── js/                          # TypeScript/JavaScript implementasjon
│   ├── phototext.ts            # Hovedbibliotek
│   ├── editor.ts               # WYSIWYG-editor
│   ├── package.json
│   └── examples/               # HTML-eksempler
│
├── IMALINK_INTEGRATION.md       # 📖 Start her for integrasjon
├── GETTING_STARTED.md           # 📖 Kom-i-gang guide
├── ARCHITECTURE.md              # 📖 Arkitektur-dokumentasjon
└── README.md                    # 📖 Hovedoversikt
```

## 🚀 Kom i gang

### For Frontend-utvikling
```bash
cd js
npm install
# Åpne examples/editor-demo.html i nettleser
```

### For Backend-utvikling
Backend trenger **ikke** PhotoText-biblioteket!

```typescript
// Bare lagre og returner JSON
app.post('/api/documents', async (req, res) => {
    const { content } = req.body;
    
    // Valgfri enkel validering
    if (!content.version || !Array.isArray(content.blocks)) {
        return res.status(400).json({ error: 'Invalid format' });
    }
    
    await db.query('INSERT INTO documents (content) VALUES ($1)', 
        [JSON.stringify(content)]);
    res.json({ success: true });
});
```

## 📖 Dokumentasjon

1. **Start her:** [IMALINK_INTEGRATION.md](IMALINK_INTEGRATION.md) - Komplett integrasjonsguide
2. **API-bruk:** [README.md](README.md) - API-dokumentasjon og eksempler
3. **Arkitektur:** [ARCHITECTURE.md](ARCHITECTURE.md) - Teknisk oversikt

## 💡 Nøkkelpunkter

- ✅ **Frontend-bibliotek** - All prosessering i browser
- ✅ **JSON-format** - Backend lagrer bare JSON
- ✅ **Kun Imalink-bilder** - Ingen eksterne URL-er
- ✅ **WYSIWYG-editor** - Innebygd editor
- ✅ **Type-sikker** - Full TypeScript-støtte

## 🤝 Bidrag

Se [CONTRIBUTING.md](CONTRIBUTING.md) for retningslinjer.

## 📄 Lisens

MIT - se [LICENSE](LICENSE)
