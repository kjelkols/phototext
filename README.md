# PhotoText - Structured Photo Storytelling Document Library

**A minimal, type-safe document model for photo storytelling.**

PhotoText provides a structured document format optimized for creating photo-rich stories, albums, and narratives. Unlike Markdown or HTML, PhotoText uses a JSON-based internal representation that's easy to validate, manipulate programmatically, and render to multiple output formats.

## 🎯 Philosophy

- **Minimal but complete** - Only heading, paragraphs, lists, and image references
- **Type-safe** - Python dataclasses with validation
- **Format-independent** - Internal model renders to HTML, Markdown, or Qt widgets
- **Photo-centric** - Designed around image references (hothashes), not URLs
- **Diff-friendly** - JSON storage works great with Git

## ✨ Features

- 📝 **Simple structure**: Headings (H1-H6), paragraphs, lists, images
- 🎨 **Inline formatting**: Bold, italic, bold+italic
- 🖼️ **Image references**: Reference images by hash (hothash), not file paths
- 💾 **JSON storage**: Human-readable, versioned, cross-platform
- 🔄 **Multiple outputs**: Render to HTML (with CSS), Markdown, or Qt widgets
- 🔍 **Type-safe API**: Python dataclasses with full type hints
- ✅ **Validated**: Only valid document structures can be created

## 🚫 What PhotoText is NOT

PhotoText is **not**:
- ❌ A word processor (no tables, complex formatting)
- ❌ A Markdown parser (it generates Markdown, doesn't parse it)
- ❌ A general-purpose document format
- ❌ A replacement for HTML/Markdown in all contexts

PhotoText is **specifically designed** for photo storytelling and albums.

## 📦 Installation

```bash
pip install phototext
```

Or for development:

```bash
git clone https://github.com/yourusername/phototext.git
cd phototext
pip install -e .
```

## 🚀 Quick Start

### Create a document programmatically

```python
from phototext import (
    PhotoDocument,
    HeadingBlock,
    ParagraphBlock,
    ImageBlock,
    InlineSpan,
    InlineType
)

# Create document
doc = PhotoDocument(
    title="Summer Vacation 2024",
    description="Our trip to Italy"
)

# Add heading
doc.blocks.append(
    HeadingBlock(1, [InlineSpan("Rome")])
)

# Add paragraph with formatting
doc.blocks.append(
    ParagraphBlock([
        InlineSpan("We visited the "),
        InlineSpan("Colosseum", InlineType.BOLD),
        InlineSpan("!")
    ])
)

# Add image reference
doc.blocks.append(
    ImageBlock("abc123def456...", "Colosseum at sunset")
)

# Save to JSON
doc.save("vacation.phototext")
```

### Load and render

```python
# Load from file
doc = PhotoDocument.load("vacation.phototext")

# Render to HTML
html = doc.to_html(include_css=True)
with open("vacation.html", "w") as f:
    f.write(html)

# Render to Markdown
markdown = doc.to_markdown()
with open("vacation.md", "w") as f:
    f.write(markdown)
```

### Query document

```python
# Metadata
print(f"Title: {doc.title}")
print(f"Words: {doc.count_words()}")
print(f"Images: {doc.count_images()}")

# Get all image references
hothashes = doc.get_referenced_hothashes()
print(f"Referenced images: {hothashes}")
```

## 📐 Document Structure

```
PhotoDocument
├── title: str
├── description: str
├── created: datetime
├── modified: datetime
└── blocks: List[BlockElement]
    ├── HeadingBlock (H1-H6)
    │   └── content: List[InlineSpan]
    ├── ParagraphBlock
    │   └── content: List[InlineSpan]
    ├── ListBlock
    │   └── items: List[List[InlineSpan]]
    └── ImageBlock
        ├── hothash: str (image reference)
        └── alt_text: str
```

### Block Elements

- **HeadingBlock** - Headings (H1 through H6)
- **ParagraphBlock** - Text paragraphs with inline formatting
- **ListBlock** - Unordered (bullet) lists
- **ImageBlock** - Image references via hothash

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
<div class="photo-document">
  <h1>Rome</h1>
  <img src="hothash://abc123def456..." alt="Colosseum" />
  <p>We visited the <strong>Colosseum</strong>!</p>
</div>
```

### Markdown Output

```markdown
# Rome

![Colosseum](hothash:abc123def456...)

We visited the **Colosseum**!
```

## 🖼️ Image References (Hothashes)

PhotoText uses **hothashes** instead of file paths or URLs. A hothash is a unique identifier for an image.

**Why hothashes?**
- ✅ Images can be stored anywhere (database, cloud, file system)
- ✅ No broken links if files move
- ✅ Documents stay small (just references, not image data)
- ✅ Same image can be referenced multiple times without duplication

**Custom image loading:**
When rendering, you provide a function to resolve hothashes to actual images:

```python
def load_image(hothash: str) -> bytes:
    # Your custom logic here
    return api.get_image(hothash)

# In Qt viewer
viewer = PhotoDocumentViewer(doc, image_loader=load_image)
```

## 🔧 API Reference

See [API.md](API.md) for complete API documentation.

## 🧪 Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=phototext
```

## 📖 Examples

See `examples/` directory for:
- `basic_usage.py` - Simple document creation
- `html_export.py` - Rendering to HTML
- `qt_viewer.py` - Qt-based document viewer (requires PySide6)

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

## 📄 License

MIT License - see [LICENSE](LICENSE) file.

## 🛣️ Roadmap

- [ ] Qt viewer widget
- [ ] Qt editor widget with toolbar
- [ ] Drag-drop image insertion
- [ ] Export to PDF
- [ ] Export to EPUB
- [ ] Ordered lists support
- [ ] Nested lists support
- [ ] Image captions
- [ ] Custom CSS themes

## 🙏 Acknowledgments

Built for the [ImaLink](https://github.com/yourusername/imalink) photo management system.

---

**Made with ❤️ for photo storytelling**
