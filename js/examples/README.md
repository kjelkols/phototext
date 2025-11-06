# PhotoText JavaScript/TypeScript Eksempler

Denne mappen inneholder eksempler på hvordan du bruker PhotoText-biblioteket i frontend-applikasjoner.

## Filer

### 1. basic-usage.html
Grunnleggende bruk av PhotoText-biblioteket. Viser hvordan du:
- Oppretter dokumenter programmatisk
- Legger til forskjellige blokk-typer
- Konverterer til JSON
- Viser HTML-output

**Åpne i nettleser:**
```bash
# Fra js/examples/ mappen
open basic-usage.html
# eller
firefox basic-usage.html
```

### 2. editor-demo.html
Interaktiv demo av WYSIWYG-editoren. Viser:
- Live editor med toolbar
- Sanntids JSON-output
- Lagring og lasting av dokumenter
- Eksport til HTML

**Åpne i nettleser:**
```bash
open editor-demo.html
```

### 3. imalink-integration.html (kommer snart)
Fullstendig integrasjon med Imalink-systemet. Viser:
- Kobling til Imalink database
- Bildevalg fra database
- Validering av bildereferanser
- Lagring i database

## Bruk i ditt eget prosjekt

### Med npm/pnpm

```bash
npm install @imalink/phototext
```

```typescript
import { PhotoDocument, HeadingBlock, ParagraphBlock, InlineSpan } from '@imalink/phototext';
import { PhotoTextEditor } from '@imalink/phototext/editor';

// Opprett dokument
const doc = new PhotoDocument('Min tittel');
doc.addBlock(new HeadingBlock(1, [new InlineSpan('Velkommen')]));

// Opprett editor
const editor = new PhotoTextEditor({
    container: document.getElementById('editor'),
    document: doc,
    onChange: (doc) => console.log('Changed:', doc.toString())
});
```

### Direkte i HTML (for testing)

Se eksemplene i denne mappen for hvordan du kan bruke biblioteket direkte i HTML uten build-verktøy (kun for testing/utvikling).

## Funksjoner demonstrert

- ✅ Oppretting av dokumenter
- ✅ Formatering (bold, italic, kombinert)
- ✅ Overskrifter (H1-H6)
- ✅ Avsnitt
- ✅ Bilder med caption
- ✅ JSON serialisering
- ✅ HTML rendering
- ✅ WYSIWYG editing
- ✅ Lagring og lasting

## Neste steg

1. Åpne eksemplene i nettleseren
2. Eksperimenter med editoren
3. Se på JSON-outputen
4. Integrer i ditt eget prosjekt

## Ressurser

- [PhotoText README](../README.md)
- [TypeScript dokumentasjon](../phototext.ts)
- [Editor dokumentasjon](../editor.ts)
