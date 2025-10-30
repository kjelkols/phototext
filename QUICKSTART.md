# PhotoText - Quick Start Guide

## 📦 Instalert som standalone bibliotek!

PhotoText-konseptet er nå ekstrahert til et eget, isolert bibliotek i:

```
/home/kjell/git_prosjekt/phototext/
```

Dette biblioteket kan brukes uavhengig av ImaLink-applikasjonen.

## 🚀 Bruk av biblioteket

### Installation (development mode)

```bash
cd /home/kjell/git_prosjekt/phototext
pip install -e .
```

### Quick Example

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
doc = PhotoDocument(title="My Story")

# Add content
doc.blocks.append(HeadingBlock(1, [InlineSpan("Chapter 1")]))
doc.blocks.append(ParagraphBlock([
    InlineSpan("This is "),
    InlineSpan("bold", InlineType.BOLD),
    InlineSpan(" text.")
]))
doc.blocks.append(ImageBlock("abc123hash", "My photo"))

# Save
doc.save("story.phototext")

# Render
html = doc.to_html()
markdown = doc.to_markdown()
```

## 📁 Filstruktur

```
phototext/
├── phototext/          # Main package
│   ├── __init__.py    # Public API
│   └── core.py        # Document model (507 lines)
├── tests/             # Test suite (68 tests, 100% pass)
│   └── test_core.py   # Comprehensive tests
├── examples/          # Example scripts
│   └── basic_usage.py # Demo script
├── pyproject.toml     # Package configuration
├── README.md          # Full documentation
├── LICENSE            # MIT License
├── CONTRIBUTING.md    # Development guide
├── CHANGELOG.md       # Version history
└── .gitignore         # Git ignore rules
```

## ✅ Status

**FERDIG og klar til bruk!**

- ✅ 507 linjer ren Python-kode
- ✅ 68 tester (alle passed)
- ✅ JSON serialization
- ✅ HTML rendering med CSS
- ✅ Markdown rendering
- ✅ Type-safe API (dataclasses)
- ✅ Full dokumentasjon
- ✅ Eksempel-script

## 🧪 Test

```bash
cd /home/kjell/git_prosjekt/phototext

# Run tests
pytest

# Run example
python examples/basic_usage.py
```

## 📖 Dokumentasjon

Se `/home/kjell/git_prosjekt/phototext/README.md` for full dokumentasjon.

## 🔗 Integrasjon med ImaLink

For å bruke PhotoText i ImaLink-frontend:

```python
# In imalink-qt-frontend
import sys
sys.path.insert(0, '/home/kjell/git_prosjekt/phototext')

from phototext import PhotoDocument, ImageBlock
# ...
```

Eller installer som pakke:

```bash
cd /home/kjell/git_prosjekt/imalink-qt-frontend
pip install -e ../phototext
```

## 🎯 Neste steg

Konseptet er klart for:
1. **Testing i ImaLink** - Integrer PhotoDocument i UI
2. **Qt Viewer** - Lag widget som viser dokumenter
3. **Qt Editor** - Lag editor med toolbar
4. **PyPI Release** - Publiser som public package

---

**Made with ❤️ for photo storytelling**
