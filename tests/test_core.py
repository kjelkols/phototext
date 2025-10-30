"""
Comprehensive tests for PhotoText core functionality.
"""
import pytest
import json
import tempfile
from pathlib import Path
from datetime import datetime

from phototext import (
    PhotoDocument,
    HeadingBlock,
    ParagraphBlock,
    ListBlock,
    ImageBlock,
    InlineSpan,
    InlineType,
    BlockType,
)


# ==================== INLINE ELEMENTS TESTS ====================

class TestInlineSpan:
    """Test InlineSpan class"""
    
    def test_create_text_span(self):
        """Test creating plain text span"""
        span = InlineSpan("Hello world")
        assert span.text == "Hello world"
        assert span.style == InlineType.TEXT
    
    def test_create_bold_span(self):
        """Test creating bold span"""
        span = InlineSpan("Bold text", InlineType.BOLD)
        assert span.text == "Bold text"
        assert span.style == InlineType.BOLD
    
    def test_create_italic_span(self):
        """Test creating italic span"""
        span = InlineSpan("Italic text", InlineType.ITALIC)
        assert span.style == InlineType.ITALIC
    
    def test_create_bold_italic_span(self):
        """Test creating bold+italic span"""
        span = InlineSpan("Important", InlineType.BOLD_ITALIC)
        assert span.style == InlineType.BOLD_ITALIC
    
    def test_to_dict(self):
        """Test serialization to dict"""
        span = InlineSpan("Test", InlineType.BOLD)
        data = span.to_dict()
        assert data == {"text": "Test", "style": "bold"}
    
    def test_from_dict(self):
        """Test deserialization from dict"""
        data = {"text": "Test", "style": "italic"}
        span = InlineSpan.from_dict(data)
        assert span.text == "Test"
        assert span.style == InlineType.ITALIC
    
    def test_to_html_text(self):
        """Test HTML rendering for plain text"""
        span = InlineSpan("Hello")
        assert span.to_html() == "Hello"
    
    def test_to_html_bold(self):
        """Test HTML rendering for bold"""
        span = InlineSpan("Bold", InlineType.BOLD)
        assert span.to_html() == "<strong>Bold</strong>"
    
    def test_to_html_italic(self):
        """Test HTML rendering for italic"""
        span = InlineSpan("Italic", InlineType.ITALIC)
        assert span.to_html() == "<em>Italic</em>"
    
    def test_to_html_bold_italic(self):
        """Test HTML rendering for bold+italic"""
        span = InlineSpan("Both", InlineType.BOLD_ITALIC)
        assert span.to_html() == "<strong><em>Both</em></strong>"
    
    def test_to_html_escapes_html(self):
        """Test that HTML special chars are escaped"""
        span = InlineSpan("<script>alert('xss')</script>")
        html = span.to_html()
        assert "<script>" not in html
        assert "&lt;script&gt;" in html
    
    def test_to_markdown_text(self):
        """Test Markdown rendering for plain text"""
        span = InlineSpan("Hello")
        assert span.to_markdown() == "Hello"
    
    def test_to_markdown_bold(self):
        """Test Markdown rendering for bold"""
        span = InlineSpan("Bold", InlineType.BOLD)
        assert span.to_markdown() == "**Bold**"
    
    def test_to_markdown_italic(self):
        """Test Markdown rendering for italic"""
        span = InlineSpan("Italic", InlineType.ITALIC)
        assert span.to_markdown() == "*Italic*"
    
    def test_to_markdown_bold_italic(self):
        """Test Markdown rendering for bold+italic"""
        span = InlineSpan("Both", InlineType.BOLD_ITALIC)
        assert span.to_markdown() == "***Both***"


# ==================== BLOCK ELEMENTS TESTS ====================

class TestHeadingBlock:
    """Test HeadingBlock class"""
    
    def test_create_h1(self):
        """Test creating H1 heading"""
        heading = HeadingBlock(1, [InlineSpan("Title")])
        assert heading.level == 1
        assert len(heading.content) == 1
    
    def test_create_h6(self):
        """Test creating H6 heading"""
        heading = HeadingBlock(6, [InlineSpan("Subtitle")])
        assert heading.level == 6
    
    def test_invalid_level_too_low(self):
        """Test that level < 1 raises ValueError"""
        with pytest.raises(ValueError):
            HeadingBlock(0, [InlineSpan("Bad")])
    
    def test_invalid_level_too_high(self):
        """Test that level > 6 raises ValueError"""
        with pytest.raises(ValueError):
            HeadingBlock(7, [InlineSpan("Bad")])
    
    def test_to_dict(self):
        """Test serialization"""
        heading = HeadingBlock(2, [InlineSpan("Test")])
        data = heading.to_dict()
        assert data["type"] == "heading"
        assert data["level"] == 2
        assert len(data["content"]) == 1
    
    def test_from_dict(self):
        """Test deserialization"""
        data = {
            "type": "heading",
            "level": 3,
            "content": [{"text": "Test", "style": "text"}]
        }
        heading = HeadingBlock.from_dict(data)
        assert heading.level == 3
        assert heading.content[0].text == "Test"
    
    def test_to_html(self):
        """Test HTML rendering"""
        heading = HeadingBlock(2, [InlineSpan("Title")])
        assert heading.to_html() == "<h2>Title</h2>"
    
    def test_to_html_with_formatting(self):
        """Test HTML rendering with inline formatting"""
        heading = HeadingBlock(1, [
            InlineSpan("My "),
            InlineSpan("Bold", InlineType.BOLD),
            InlineSpan(" Title")
        ])
        html = heading.to_html()
        assert "<h1>My <strong>Bold</strong> Title</h1>" == html
    
    def test_to_markdown(self):
        """Test Markdown rendering"""
        heading = HeadingBlock(2, [InlineSpan("Title")])
        assert heading.to_markdown() == "## Title"
    
    def test_get_text(self):
        """Test extracting plain text"""
        heading = HeadingBlock(1, [
            InlineSpan("My "),
            InlineSpan("Bold", InlineType.BOLD),
            InlineSpan(" Title")
        ])
        assert heading.get_text() == "My Bold Title"


class TestParagraphBlock:
    """Test ParagraphBlock class"""
    
    def test_create_paragraph(self):
        """Test creating paragraph"""
        para = ParagraphBlock([InlineSpan("Hello world")])
        assert len(para.content) == 1
    
    def test_empty_paragraph(self):
        """Test creating empty paragraph"""
        para = ParagraphBlock()
        assert len(para.content) == 0
    
    def test_to_dict(self):
        """Test serialization"""
        para = ParagraphBlock([InlineSpan("Test")])
        data = para.to_dict()
        assert data["type"] == "paragraph"
        assert len(data["content"]) == 1
    
    def test_from_dict(self):
        """Test deserialization"""
        data = {
            "type": "paragraph",
            "content": [{"text": "Test", "style": "text"}]
        }
        para = ParagraphBlock.from_dict(data)
        assert len(para.content) == 1
    
    def test_to_html(self):
        """Test HTML rendering"""
        para = ParagraphBlock([InlineSpan("Hello")])
        assert para.to_html() == "<p>Hello</p>"
    
    def test_to_html_with_formatting(self):
        """Test HTML rendering with formatting"""
        para = ParagraphBlock([
            InlineSpan("This is "),
            InlineSpan("bold", InlineType.BOLD),
            InlineSpan(" text.")
        ])
        assert para.to_html() == "<p>This is <strong>bold</strong> text.</p>"
    
    def test_to_markdown(self):
        """Test Markdown rendering"""
        para = ParagraphBlock([InlineSpan("Hello")])
        assert para.to_markdown() == "Hello"
    
    def test_get_text(self):
        """Test extracting plain text"""
        para = ParagraphBlock([
            InlineSpan("This is "),
            InlineSpan("formatted", InlineType.ITALIC),
            InlineSpan(" text.")
        ])
        assert para.get_text() == "This is formatted text."


class TestListBlock:
    """Test ListBlock class"""
    
    def test_create_list(self):
        """Test creating list"""
        lst = ListBlock([
            [InlineSpan("Item 1")],
            [InlineSpan("Item 2")]
        ])
        assert len(lst.items) == 2
    
    def test_empty_list(self):
        """Test creating empty list"""
        lst = ListBlock()
        assert len(lst.items) == 0
    
    def test_to_dict(self):
        """Test serialization"""
        lst = ListBlock([[InlineSpan("Item")]])
        data = lst.to_dict()
        assert data["type"] == "list"
        assert len(data["items"]) == 1
    
    def test_from_dict(self):
        """Test deserialization"""
        data = {
            "type": "list",
            "items": [
                [{"text": "Item 1", "style": "text"}],
                [{"text": "Item 2", "style": "text"}]
            ]
        }
        lst = ListBlock.from_dict(data)
        assert len(lst.items) == 2
    
    def test_to_html(self):
        """Test HTML rendering"""
        lst = ListBlock([
            [InlineSpan("Item 1")],
            [InlineSpan("Item 2")]
        ])
        html = lst.to_html()
        assert html == "<ul><li>Item 1</li><li>Item 2</li></ul>"
    
    def test_to_html_with_formatting(self):
        """Test HTML rendering with formatting"""
        lst = ListBlock([
            [InlineSpan("Item with "), InlineSpan("bold", InlineType.BOLD)]
        ])
        html = lst.to_html()
        assert "<li>Item with <strong>bold</strong></li>" in html
    
    def test_to_markdown(self):
        """Test Markdown rendering"""
        lst = ListBlock([
            [InlineSpan("Item 1")],
            [InlineSpan("Item 2")]
        ])
        md = lst.to_markdown()
        assert md == "- Item 1\n- Item 2"
    
    def test_get_text(self):
        """Test extracting plain text"""
        lst = ListBlock([
            [InlineSpan("Item 1")],
            [InlineSpan("Item 2")]
        ])
        text = lst.get_text()
        assert "- Item 1" in text
        assert "- Item 2" in text


class TestImageBlock:
    """Test ImageBlock class"""
    
    def test_create_image(self):
        """Test creating image block"""
        img = ImageBlock("abc123", "Alt text")
        assert img.hothash == "abc123"
        assert img.alt_text == "Alt text"
    
    def test_create_image_no_alt(self):
        """Test creating image without alt text"""
        img = ImageBlock("abc123")
        assert img.hothash == "abc123"
        assert img.alt_text == ""
    
    def test_to_dict(self):
        """Test serialization"""
        img = ImageBlock("abc123", "Test")
        data = img.to_dict()
        assert data["type"] == "image"
        assert data["hothash"] == "abc123"
        assert data["alt_text"] == "Test"
    
    def test_from_dict(self):
        """Test deserialization"""
        data = {
            "type": "image",
            "hothash": "abc123",
            "alt_text": "Test"
        }
        img = ImageBlock.from_dict(data)
        assert img.hothash == "abc123"
        assert img.alt_text == "Test"
    
    def test_to_html(self):
        """Test HTML rendering"""
        img = ImageBlock("abc123", "Alt")
        html = img.to_html()
        assert 'src="hothash://abc123"' in html
        assert 'alt="Alt"' in html
    
    def test_to_html_escapes_alt(self):
        """Test that alt text is escaped"""
        img = ImageBlock("abc123", 'Test "quotes"')
        html = img.to_html()
        assert '&quot;' in html
    
    def test_to_markdown(self):
        """Test Markdown rendering"""
        img = ImageBlock("abc123", "Alt")
        md = img.to_markdown()
        assert md == "![Alt](hothash:abc123)"


# ==================== DOCUMENT TESTS ====================

class TestPhotoDocument:
    """Test PhotoDocument class"""
    
    def test_create_empty_document(self):
        """Test creating empty document"""
        doc = PhotoDocument(title="Test")
        assert doc.title == "Test"
        assert doc.description == ""
        assert len(doc.blocks) == 0
    
    def test_create_document_with_blocks(self):
        """Test creating document with blocks"""
        doc = PhotoDocument(
            title="Test",
            blocks=[
                HeadingBlock(1, [InlineSpan("Title")]),
                ParagraphBlock([InlineSpan("Text")])
            ]
        )
        assert len(doc.blocks) == 2
    
    def test_display_name_from_title(self):
        """Test display name defaults to title"""
        doc = PhotoDocument(title="My Document")
        assert doc.display_name == "My Document"
    
    def test_display_name_from_filepath(self):
        """Test display name from filepath"""
        doc = PhotoDocument(title="Test", filepath="/path/to/document.phototext")
        assert doc.display_name == "document"
    
    def test_get_referenced_hothashes_empty(self):
        """Test getting hothashes from document without images"""
        doc = PhotoDocument(
            title="Test",
            blocks=[HeadingBlock(1, [InlineSpan("Title")])]
        )
        hothashes = doc.get_referenced_hothashes()
        assert len(hothashes) == 0
    
    def test_get_referenced_hothashes(self):
        """Test getting hothashes from document with images"""
        doc = PhotoDocument(
            title="Test",
            blocks=[
                ImageBlock("hash1", "Image 1"),
                ParagraphBlock([InlineSpan("Text")]),
                ImageBlock("hash2", "Image 2")
            ]
        )
        hothashes = doc.get_referenced_hothashes()
        assert len(hothashes) == 2
        assert "hash1" in hothashes
        assert "hash2" in hothashes
    
    def test_count_images(self):
        """Test counting images"""
        doc = PhotoDocument(
            title="Test",
            blocks=[
                ImageBlock("hash1", "Image 1"),
                ParagraphBlock([InlineSpan("Text")]),
                ImageBlock("hash2", "Image 2"),
                HeadingBlock(1, [InlineSpan("Title")])
            ]
        )
        assert doc.count_images() == 2
    
    def test_count_words(self):
        """Test counting words"""
        doc = PhotoDocument(
            title="Test",
            blocks=[
                HeadingBlock(1, [InlineSpan("Two Words")]),
                ParagraphBlock([InlineSpan("This has four words")]),
                ImageBlock("hash1", "Image")  # Should not count
            ]
        )
        # "Two Words" (2) + "This has four words" (4) = 6
        assert doc.count_words() == 6
    
    def test_to_dict(self):
        """Test serialization"""
        doc = PhotoDocument(
            title="Test",
            description="Description",
            blocks=[HeadingBlock(1, [InlineSpan("Title")])]
        )
        data = doc.to_dict()
        assert data["version"] == "1.0"
        assert data["title"] == "Test"
        assert data["description"] == "Description"
        assert len(data["blocks"]) == 1
        assert "created" in data
        assert "modified" in data
    
    def test_from_dict(self):
        """Test deserialization"""
        data = {
            "version": "1.0",
            "title": "Test",
            "description": "Desc",
            "created": "2024-01-01T10:00:00",
            "modified": "2024-01-02T12:00:00",
            "blocks": [
                {
                    "type": "heading",
                    "level": 1,
                    "content": [{"text": "Title", "style": "text"}]
                }
            ]
        }
        doc = PhotoDocument.from_dict(data)
        assert doc.title == "Test"
        assert doc.description == "Desc"
        assert len(doc.blocks) == 1
        assert isinstance(doc.blocks[0], HeadingBlock)
    
    def test_from_dict_unsupported_version(self):
        """Test loading unsupported version raises error"""
        data = {
            "version": "2.0",
            "title": "Test",
            "created": "2024-01-01T10:00:00",
            "modified": "2024-01-02T12:00:00",
            "blocks": []
        }
        with pytest.raises(ValueError, match="Unsupported"):
            PhotoDocument.from_dict(data)
    
    def test_save_and_load(self):
        """Test saving and loading document"""
        # Create document
        doc = PhotoDocument(
            title="Test Document",
            description="A test",
            blocks=[
                HeadingBlock(1, [InlineSpan("Title")]),
                ParagraphBlock([InlineSpan("Content")]),
                ImageBlock("abc123", "Image")
            ]
        )
        
        # Save to temp file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.phototext', delete=False) as f:
            temp_path = f.name
        
        try:
            doc.save(temp_path)
            
            # Load back
            loaded = PhotoDocument.load(temp_path)
            
            assert loaded.title == "Test Document"
            assert loaded.description == "A test"
            assert len(loaded.blocks) == 3
            assert loaded.filepath == temp_path
            assert loaded.is_modified == False
        finally:
            Path(temp_path).unlink(missing_ok=True)
    
    def test_to_html(self):
        """Test HTML rendering"""
        doc = PhotoDocument(
            title="Test",
            blocks=[
                HeadingBlock(1, [InlineSpan("Title")]),
                ParagraphBlock([InlineSpan("Text")])
            ]
        )
        html = doc.to_html(include_css=False)
        assert '<h1>Title</h1>' in html
        assert '<p>Text</p>' in html
        assert 'photo-document' in html
    
    def test_to_html_with_css(self):
        """Test HTML rendering with CSS"""
        doc = PhotoDocument(title="Test", blocks=[])
        html = doc.to_html(include_css=True)
        assert '<style>' in html
        assert '.photo-document' in html
    
    def test_to_markdown(self):
        """Test Markdown rendering"""
        doc = PhotoDocument(
            title="Test",
            blocks=[
                HeadingBlock(1, [InlineSpan("Title")]),
                ParagraphBlock([InlineSpan("Text")]),
                ImageBlock("abc123", "Image")
            ]
        )
        md = doc.to_markdown()
        assert '# Title' in md
        assert 'Text' in md
        assert '![Image](hothash:abc123)' in md
    
    def test_str_representation(self):
        """Test string representation"""
        doc = PhotoDocument(
            title="My Doc",
            blocks=[
                HeadingBlock(1, [InlineSpan("Title")]),
                ImageBlock("abc", "img")
            ]
        )
        s = str(doc)
        assert "My Doc" in s
        assert "2 blocks" in s
        assert "1 images" in s
    
    def test_is_modified_flag(self):
        """Test is_modified flag"""
        doc = PhotoDocument(title="Test")
        assert doc.is_modified == False
        
        doc.blocks.append(HeadingBlock(1, [InlineSpan("New")]))
        # Note: is_modified must be set manually by user
        doc.is_modified = True
        assert doc.is_modified == True
    
    def test_modified_timestamp_updates_on_save(self):
        """Test that modified timestamp updates when saving"""
        doc = PhotoDocument(title="Test")
        original_modified = doc.modified
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.phototext', delete=False) as f:
            temp_path = f.name
        
        try:
            import time
            time.sleep(0.01)  # Ensure time difference
            doc.save(temp_path)
            
            assert doc.modified > original_modified
        finally:
            Path(temp_path).unlink(missing_ok=True)


# ==================== INTEGRATION TESTS ====================

class TestIntegration:
    """Integration tests for complete workflows"""
    
    def test_complete_document_workflow(self):
        """Test creating, saving, loading, and rendering a complete document"""
        # Create complex document
        doc = PhotoDocument(
            title="Vacation 2024",
            description="Our summer trip"
        )
        
        doc.blocks.extend([
            HeadingBlock(1, [InlineSpan("Our "), InlineSpan("Amazing", InlineType.ITALIC), InlineSpan(" Vacation")]),
            ParagraphBlock([InlineSpan("We went to "), InlineSpan("Italy", InlineType.BOLD)]),
            ImageBlock("img1", "Rome"),
            HeadingBlock(2, [InlineSpan("Rome")]),
            ListBlock([
                [InlineSpan("Colosseum")],
                [InlineSpan("Vatican - "), InlineSpan("stunning", InlineType.ITALIC)]
            ]),
            ImageBlock("img2", "Colosseum"),
        ])
        
        # Save to file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.phototext', delete=False) as f:
            temp_path = f.name
        
        try:
            doc.save(temp_path)
            
            # Verify file exists and is valid JSON
            assert Path(temp_path).exists()
            with open(temp_path, 'r') as f:
                data = json.load(f)
            assert data["title"] == "Vacation 2024"
            
            # Load back
            loaded = PhotoDocument.load(temp_path)
            assert loaded.title == "Vacation 2024"
            assert loaded.count_images() == 2
            assert len(loaded.get_referenced_hothashes()) == 2
            
            # Render to HTML
            html = loaded.to_html()
            assert "<h1>" in html
            assert "<img" in html
            assert "hothash://img1" in html
            
            # Render to Markdown
            md = loaded.to_markdown()
            assert "# Our *Amazing* Vacation" in md
            assert "**Italy**" in md
            assert "![Rome](hothash:img1)" in md
            
        finally:
            Path(temp_path).unlink(missing_ok=True)
    
    def test_roundtrip_preserves_data(self):
        """Test that save/load roundtrip preserves all data"""
        original = PhotoDocument(
            title="Test Title",
            description="Test Description",
            blocks=[
                HeadingBlock(2, [InlineSpan("H2")]),
                ParagraphBlock([InlineSpan("Para")]),
                ListBlock([[InlineSpan("Item")]]),
                ImageBlock("hash123", "alt text")
            ]
        )
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.phototext', delete=False) as f:
            temp_path = f.name
        
        try:
            original.save(temp_path)
            loaded = PhotoDocument.load(temp_path)
            
            # Compare structure
            assert loaded.title == original.title
            assert loaded.description == original.description
            assert len(loaded.blocks) == len(original.blocks)
            
            # Compare block types
            for orig_block, load_block in zip(original.blocks, loaded.blocks):
                assert type(orig_block) == type(load_block)
                
                if isinstance(orig_block, ImageBlock):
                    assert load_block.hothash == orig_block.hothash
                    assert load_block.alt_text == orig_block.alt_text
        
        finally:
            Path(temp_path).unlink(missing_ok=True)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
