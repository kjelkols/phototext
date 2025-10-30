# PhotoText Development

## Setup Development Environment

```bash
# Clone repository
git clone https://github.com/yourusername/phototext.git
cd phototext

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install in development mode with dev dependencies
pip install -e ".[dev]"
```

## Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=phototext

# Run specific test file
pytest tests/test_core.py

# Run specific test
pytest tests/test_core.py::TestPhotoDocument::test_save_and_load
```

## Code Quality

### Formatting

```bash
# Format code with Black
black phototext/ tests/ examples/

# Check formatting
black --check phototext/ tests/ examples/
```

### Linting

```bash
# Lint with Ruff
ruff check phototext/ tests/ examples/

# Auto-fix issues
ruff check --fix phototext/ tests/ examples/
```

### Type Checking

```bash
# Type check with mypy
mypy phototext/
```

## Project Structure

```
phototext/
├── phototext/          # Main package
│   ├── __init__.py    # Public API exports
│   └── core.py        # Core document model
├── tests/             # Test suite
│   └── test_core.py   # Core functionality tests
├── examples/          # Example scripts
│   └── basic_usage.py # Basic usage demo
├── pyproject.toml     # Project configuration
├── README.md          # User documentation
├── LICENSE            # MIT License
└── CONTRIBUTING.md    # This file
```

## Release Process

1. Update version in `pyproject.toml` and `phototext/__init__.py`
2. Update `CHANGELOG.md`
3. Run full test suite: `pytest`
4. Tag release: `git tag v0.1.0`
5. Push tag: `git push --tags`
6. Build package: `python -m build`
7. Upload to PyPI: `twine upload dist/*`

## Adding New Features

### Adding New Block Types

1. Create new block class in `phototext/core.py`:
   ```python
   @dataclass
   class NewBlock:
       # ...
       def to_dict(self) -> Dict[str, Any]: ...
       def from_dict(cls, data: Dict[str, Any]) -> 'NewBlock': ...
       def to_html(self) -> str: ...
       def to_markdown(self) -> str: ...
   ```

2. Add to `BlockType` enum
3. Update `PhotoDocument.from_dict()` to handle new type
4. Add tests in `tests/test_core.py`
5. Update documentation

### Adding New Renderers

1. Add new method to block classes: `def to_FORMAT(self) -> str: ...`
2. Add new method to `PhotoDocument`: `def to_FORMAT(self) -> str: ...`
3. Add tests
4. Update documentation

## Coding Standards

- Follow PEP 8
- Use type hints everywhere
- Write docstrings for all public APIs
- Keep functions small and focused
- Write tests for all new features
- Update documentation for user-facing changes

## Questions?

Open an issue on GitHub or start a discussion.

Thank you for contributing! 🎉
