"""
PhotoText - Structured Photo Storytelling Document Library

A minimal, type-safe document model for photo storytelling.
"""

__version__ = "0.1.0"

from .core import (
    # Document
    PhotoDocument,
    
    # Block elements
    HeadingBlock,
    ParagraphBlock,
    ListBlock,
    ImageBlock,
    BlockElement,
    BlockType,
    
    # Inline elements
    InlineSpan,
    InlineType,
)

__all__ = [
    # Main document class
    "PhotoDocument",
    
    # Block elements
    "HeadingBlock",
    "ParagraphBlock",
    "ListBlock",
    "ImageBlock",
    "BlockElement",
    "BlockType",
    
    # Inline elements
    "InlineSpan",
    "InlineType",
    
    # Version
    "__version__",
]
