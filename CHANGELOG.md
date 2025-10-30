# Changelog

All notable changes to PhotoText will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Qt viewer widget
- Qt editor widget with toolbar
- Drag-drop image insertion
- Export to PDF
- Export to EPUB
- Ordered lists support
- Nested lists support

## [0.1.0] - 2025-10-30

### Added
- Initial release
- Core document model (`PhotoDocument`)
- Block elements: `HeadingBlock`, `ParagraphBlock`, `ListBlock`, `ImageBlock`
- Inline formatting: `InlineSpan` with TEXT, BOLD, ITALIC, BOLD_ITALIC
- JSON serialization (save/load)
- HTML rendering with CSS
- Markdown rendering
- Type-safe Python API with dataclasses
- Comprehensive test suite
- Basic usage examples
- Documentation

### Design Decisions
- Chose JSON over Markdown for internal storage (type-safe, validatable)
- Limited to minimal feature set (no tables, code blocks, complex formatting)
- Photo-centric design with hothash references instead of file paths
- Separate model from rendering (can output to multiple formats)

[Unreleased]: https://github.com/yourusername/phototext/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/yourusername/phototext/releases/tag/v0.1.0
