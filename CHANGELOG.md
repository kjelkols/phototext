# Changelog

All notable changes to PhotoText will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- React/Angular editor components
- Drag-drop image insertion
- Export to PDF
- Ordered lists support
- Nested lists support

## [1.0.0] - 2025-11-06

### Changed
- **BREAKING:** Removed Python implementation - PhotoText is now frontend-only
- Backend only stores/serves JSON - no processing required
- Simplified architecture - all document processing in browser
- Updated documentation to reflect frontend-first approach

### Added
- TypeScript/JavaScript implementation
- WYSIWYG editor component
- Full Imalink integration guide
- Interactive HTML examples
- Complete API documentation

## [0.1.0] - 2025-10-30

### Added
- Initial release with Python implementation
- Core document model
- Block elements: HeadingBlock, ParagraphBlock, ListBlock, ImageBlock
- Inline formatting: InlineSpan with TEXT, BOLD, ITALIC, BOLD_ITALIC
- JSON serialization
- HTML rendering with CSS
- Markdown rendering

### Design Decisions
- Chose JSON over Markdown for internal storage (type-safe, validatable)
- Limited to minimal feature set (no tables, code blocks, complex formatting)
- Photo-centric design with hothash/image ID references
- Separate model from rendering

[Unreleased]: https://github.com/kjelkols/phototext/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/kjelkols/phototext/releases/tag/v1.0.0
[0.1.0]: https://github.com/kjelkols/phototext/releases/tag/v0.1.0
