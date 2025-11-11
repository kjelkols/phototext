## PhotoText — Copilot instructions

These notes help an AI coding agent be productive in this repo. They focus on the real, discoverable structure and commands (not generic advice).

1) Big picture
- PhotoText is a frontend-first TypeScript library for photo-centric documents. All document processing happens in the browser; backends only store and return JSON. See `ARCHITECTURE.md` and `README.md`.
- Source code lives in `js/` (TypeScript). The library exports a runtime in `dist/` after building (`js/package.json` → `main: dist/phototext.js`).

2) Key concepts and patterns you should follow
- **Two document models:** PhotoDocument (flat) and HierarchicalDocument (nested sections). Both share the same Block types and validation rules.
- **PhotoDocument** (flat): top-level fields (version, title, metadata, blocks[]). Block types: `heading`, `paragraph`, `list`, `image`. Flexible, allows any heading levels.
- **HierarchicalDocument** (structured): DocumentPart tree where each part has a heading, content blocks, and optional subParts. Heading levels auto-calculated from nesting depth (max 6 levels). Enforces semantic structure.
- **Shared constraints:** Max 6 heading levels, Imalink image IDs only (no external URLs), HTML escaping (including quotes for XSS protection).
- Image references are Imalink image IDs (hothash). NEVER convert these to external URLs in the core model — use an `imageUrlResolver(imageId)` when rendering (`PhotoDocument.toHTML`, `ImageBlock.toHTML`).
- Editor is `js/editor.ts`: contenteditable UI that serializes/deserializes to the PhotoDocument model. Image insertion flows call `onImagePick()` and expect a single imageId string.
- Inline formatting is represented by `InlineSpan` and `InlineType` enums (text/bold/italic/bold_italic). The editor parses STRONG/EM tags into these types (see `parseInlineSpans`).
- **Conversion:** Use `HierarchicalDocument.fromPhotoDocument()` and `hierarchicalDoc.toPhotoDocument()` to convert between formats. Both directions preserve all content.

3) Build / test / dev workflows (explicit)
- To install dependencies for development (root workspace uses a js workspace):
  - From repo root: `npm run install` (this runs `cd js && npm install`).
- Build the library:
  - From repo root: `npm run build` (runs `cd js && npm run build` → `tsc`).
- Local dev watch (TS incremental build):
  - From repo root: `npm run dev` (runs `cd js && npm run watch`).
- Tests and lint:
  - `npm test` (delegates to `js` - `jest`), and `cd js && npm run lint` runs eslint on `src`.
- Examples: open files in `js/examples/` (e.g. `editor-demo.html`) directly in a browser for manual QA.

4) Project-specific conventions to preserve
- Keep TypeScript source under `js/` and compile to `dist/`. The published package expects `dist/phototext.js` and `.d.ts` files.
- Keep all image IDs as Imalink-style hashes (do not accept or emit external URLs in `ImageBlock.toJSON` or `toMarkdown`). When adding helper functions, prefer `imageUrlResolver` injection for URL conversion.
- **Heading level constraints:** Both PhotoDocument and HierarchicalDocument enforce max 6 heading levels (H1-H6). HierarchicalDocument automatically caps depth at 6.
- **Structural integrity:** HierarchicalDocument enforces that each DocumentPart must have a heading. Content blocks (paragraphs, lists, images) cannot contain nested headings.
- Editor DOM ↔ model mapping: the editor relies on specific DOM structures and `data-image-id` attributes on <img> elements. Changes to DOM structure must preserve `parseInlineSpans()` and `updateDocument()` behavior.

5) Safe edit checklist for contributors / agents
- If changing serialization, update `PhotoDocument.toJSON`, `fromJSON` and `js/README.md` examples.
- If changing editor HTML, update `parseInlineSpans`, `renderBlock`, and tests in `js` (Jest). Manual check: open `js/examples/editor-demo.html` to verify editor behavior.
- If adding public API surface, keep `package.json` `main` and `types` accurate (point to `dist/*`).

6) Quick lookup references (examples you can open right now)
- Model & renderer: `js/phototext.ts`
- WYSIWYG editor: `js/editor.ts`
- npm workspace & scripts: `package.json` and `js/package.json`
- Examples: `js/examples/editor-demo.html`, `js/examples/basic-usage.html`
- Architecture overview: `ARCHITECTURE.md`

7) When in doubt
- Prefer preserving backward-compatible JSON shape. Backends expect stored JSON; changing field names will break consumers.
- Ask for a test (unit or example) that demonstrates the change. For UI changes, include an updated example HTML that demonstrates the new behavior.

If anything here is unclear or you'd like more coverage (examples of common edits, test snippets, or policies for publishing), tell me which section to expand.
