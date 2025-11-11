/**
 * Unit tests for PhotoText library
 */

import {
    InlineSpan,
    InlineType,
    HeadingBlock,
    ParagraphBlock,
    ListBlock,
    ImageBlock,
    PhotoDocument,
    BlockType
} from '../phototext';

// ==================== InlineSpan Tests ====================

describe('InlineSpan', () => {
    describe('constructor', () => {
        test('creates plain text span by default', () => {
            const span = new InlineSpan('Hello');
            expect(span.text).toBe('Hello');
            expect(span.style).toBe(InlineType.TEXT);
        });

        test('creates span with specified style', () => {
            const span = new InlineSpan('Bold text', InlineType.BOLD);
            expect(span.text).toBe('Bold text');
            expect(span.style).toBe(InlineType.BOLD);
        });
    });

    describe('toHTML', () => {
        test('renders plain text without tags', () => {
            const span = new InlineSpan('Hello');
            expect(span.toHTML()).toBe('Hello');
        });

        test('renders bold text', () => {
            const span = new InlineSpan('Bold', InlineType.BOLD);
            expect(span.toHTML()).toBe('<strong>Bold</strong>');
        });

        test('renders italic text', () => {
            const span = new InlineSpan('Italic', InlineType.ITALIC);
            expect(span.toHTML()).toBe('<em>Italic</em>');
        });

        test('renders bold italic text', () => {
            const span = new InlineSpan('Bold Italic', InlineType.BOLD_ITALIC);
            expect(span.toHTML()).toBe('<strong><em>Bold Italic</em></strong>');
        });

        test('escapes HTML characters', () => {
            const span = new InlineSpan('<script>alert("xss")</script>');
            expect(span.toHTML()).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
        });

        test('escapes ampersands', () => {
            const span = new InlineSpan('Tom & Jerry');
            expect(span.toHTML()).toBe('Tom &amp; Jerry');
        });
    });

    describe('toMarkdown', () => {
        test('renders plain text as-is', () => {
            const span = new InlineSpan('Hello');
            expect(span.toMarkdown()).toBe('Hello');
        });

        test('renders bold text with **', () => {
            const span = new InlineSpan('Bold', InlineType.BOLD);
            expect(span.toMarkdown()).toBe('**Bold**');
        });

        test('renders italic text with *', () => {
            const span = new InlineSpan('Italic', InlineType.ITALIC);
            expect(span.toMarkdown()).toBe('*Italic*');
        });

        test('renders bold italic text with ***', () => {
            const span = new InlineSpan('Bold Italic', InlineType.BOLD_ITALIC);
            expect(span.toMarkdown()).toBe('***Bold Italic***');
        });
    });

    describe('JSON serialization', () => {
        test('serializes to JSON correctly', () => {
            const span = new InlineSpan('Test', InlineType.BOLD);
            const json = span.toJSON();
            expect(json).toEqual({
                text: 'Test',
                style: InlineType.BOLD
            });
        });

        test('deserializes from JSON correctly', () => {
            const json = { text: 'Test', style: InlineType.ITALIC };
            const span = InlineSpan.fromJSON(json);
            expect(span.text).toBe('Test');
            expect(span.style).toBe(InlineType.ITALIC);
        });

        test('round-trip serialization preserves data', () => {
            const original = new InlineSpan('Hello World', InlineType.BOLD_ITALIC);
            const json = original.toJSON();
            const restored = InlineSpan.fromJSON(json);
            expect(restored.text).toBe(original.text);
            expect(restored.style).toBe(original.style);
        });
    });

    describe('getText', () => {
        test('returns the text content', () => {
            const span = new InlineSpan('Content', InlineType.BOLD);
            expect(span.getText()).toBe('Content');
        });
    });
});

// ==================== HeadingBlock Tests ====================

describe('HeadingBlock', () => {
    describe('constructor', () => {
        test('creates heading with valid level', () => {
            const heading = new HeadingBlock(2, [new InlineSpan('Title')]);
            expect(heading.level).toBe(2);
            expect(heading.content.length).toBe(1);
        });

        test('throws error for level < 1', () => {
            expect(() => {
                new HeadingBlock(0, [new InlineSpan('Title')]);
            }).toThrow('Heading level must be 1-6');
        });

        test('throws error for level > 6', () => {
            expect(() => {
                new HeadingBlock(7, [new InlineSpan('Title')]);
            }).toThrow('Heading level must be 1-6');
        });

        test('creates heading with empty content', () => {
            const heading = new HeadingBlock(1);
            expect(heading.content).toEqual([]);
        });
    });

    describe('toHTML', () => {
        test('renders H1 correctly', () => {
            const heading = new HeadingBlock(1, [new InlineSpan('Title')]);
            expect(heading.toHTML()).toBe('<h1>Title</h1>');
        });

        test('renders H3 with formatted text', () => {
            const heading = new HeadingBlock(3, [
                new InlineSpan('Bold ', InlineType.BOLD),
                new InlineSpan('Title')
            ]);
            expect(heading.toHTML()).toBe('<h3><strong>Bold </strong>Title</h3>');
        });
    });

    describe('toMarkdown', () => {
        test('renders H1 with single #', () => {
            const heading = new HeadingBlock(1, [new InlineSpan('Title')]);
            expect(heading.toMarkdown()).toBe('# Title');
        });

        test('renders H4 with four #', () => {
            const heading = new HeadingBlock(4, [new InlineSpan('Subtitle')]);
            expect(heading.toMarkdown()).toBe('#### Subtitle');
        });

        test('renders with formatted text', () => {
            const heading = new HeadingBlock(2, [
                new InlineSpan('Important ', InlineType.BOLD),
                new InlineSpan('Heading')
            ]);
            expect(heading.toMarkdown()).toBe('## **Important **Heading');
        });
    });

    describe('JSON serialization', () => {
        test('serializes correctly', () => {
            const heading = new HeadingBlock(2, [new InlineSpan('Test')]);
            const json = heading.toJSON();
            expect(json).toEqual({
                type: BlockType.HEADING,
                level: 2,
                content: [{ text: 'Test', style: InlineType.TEXT }]
            });
        });

        test('deserializes correctly', () => {
            const json = {
                type: BlockType.HEADING as BlockType.HEADING,
                level: 3,
                content: [{ text: 'Test', style: InlineType.BOLD }]
            };
            const heading = HeadingBlock.fromJSON(json);
            expect(heading.level).toBe(3);
            expect(heading.content[0].text).toBe('Test');
            expect(heading.content[0].style).toBe(InlineType.BOLD);
        });
    });

    describe('getText', () => {
        test('returns concatenated text content', () => {
            const heading = new HeadingBlock(1, [
                new InlineSpan('Hello '),
                new InlineSpan('World', InlineType.BOLD)
            ]);
            expect(heading.getText()).toBe('Hello World');
        });
    });
});

// ==================== ParagraphBlock Tests ====================

describe('ParagraphBlock', () => {
    describe('constructor', () => {
        test('creates paragraph with content', () => {
            const para = new ParagraphBlock([new InlineSpan('Text')]);
            expect(para.content.length).toBe(1);
        });

        test('creates empty paragraph', () => {
            const para = new ParagraphBlock();
            expect(para.content).toEqual([]);
        });
    });

    describe('toHTML', () => {
        test('renders simple paragraph', () => {
            const para = new ParagraphBlock([new InlineSpan('Hello')]);
            expect(para.toHTML()).toBe('<p>Hello</p>');
        });

        test('renders paragraph with mixed formatting', () => {
            const para = new ParagraphBlock([
                new InlineSpan('Normal '),
                new InlineSpan('bold', InlineType.BOLD),
                new InlineSpan(' and '),
                new InlineSpan('italic', InlineType.ITALIC)
            ]);
            expect(para.toHTML()).toBe('<p>Normal <strong>bold</strong> and <em>italic</em></p>');
        });
    });

    describe('toMarkdown', () => {
        test('renders simple paragraph', () => {
            const para = new ParagraphBlock([new InlineSpan('Text')]);
            expect(para.toMarkdown()).toBe('Text');
        });

        test('renders with formatting', () => {
            const para = new ParagraphBlock([
                new InlineSpan('Text with '),
                new InlineSpan('bold', InlineType.BOLD)
            ]);
            expect(para.toMarkdown()).toBe('Text with **bold**');
        });
    });

    describe('JSON serialization', () => {
        test('serializes correctly', () => {
            const para = new ParagraphBlock([new InlineSpan('Test')]);
            const json = para.toJSON();
            expect(json).toEqual({
                type: BlockType.PARAGRAPH,
                content: [{ text: 'Test', style: InlineType.TEXT }]
            });
        });

        test('deserializes correctly', () => {
            const json = {
                type: BlockType.PARAGRAPH as BlockType.PARAGRAPH,
                content: [
                    { text: 'Hello ', style: InlineType.TEXT },
                    { text: 'World', style: InlineType.BOLD }
                ]
            };
            const para = ParagraphBlock.fromJSON(json);
            expect(para.content.length).toBe(2);
            expect(para.content[1].style).toBe(InlineType.BOLD);
        });
    });

    describe('getText', () => {
        test('returns concatenated text', () => {
            const para = new ParagraphBlock([
                new InlineSpan('First '),
                new InlineSpan('Second')
            ]);
            expect(para.getText()).toBe('First Second');
        });
    });
});

// ==================== ListBlock Tests ====================

describe('ListBlock', () => {
    describe('constructor', () => {
        test('creates list with items', () => {
            const list = new ListBlock([
                [new InlineSpan('Item 1')],
                [new InlineSpan('Item 2')]
            ]);
            expect(list.items.length).toBe(2);
        });

        test('creates empty list', () => {
            const list = new ListBlock();
            expect(list.items).toEqual([]);
        });
    });

    describe('toHTML', () => {
        test('renders simple list', () => {
            const list = new ListBlock([
                [new InlineSpan('First')],
                [new InlineSpan('Second')]
            ]);
            expect(list.toHTML()).toBe('<ul>\n  <li>First</li>\n  <li>Second</li>\n</ul>');
        });

        test('renders list with formatted items', () => {
            const list = new ListBlock([
                [new InlineSpan('Bold ', InlineType.BOLD), new InlineSpan('item')]
            ]);
            expect(list.toHTML()).toBe('<ul>\n  <li><strong>Bold </strong>item</li>\n</ul>');
        });
    });

    describe('toMarkdown', () => {
        test('renders simple list', () => {
            const list = new ListBlock([
                [new InlineSpan('First')],
                [new InlineSpan('Second')]
            ]);
            expect(list.toMarkdown()).toBe('- First\n- Second');
        });

        test('renders with formatted text', () => {
            const list = new ListBlock([
                [new InlineSpan('Item with '), new InlineSpan('bold', InlineType.BOLD)]
            ]);
            expect(list.toMarkdown()).toBe('- Item with **bold**');
        });
    });

    describe('JSON serialization', () => {
        test('serializes correctly', () => {
            const list = new ListBlock([
                [new InlineSpan('Item 1')],
                [new InlineSpan('Item 2')]
            ]);
            const json = list.toJSON();
            expect(json).toEqual({
                type: BlockType.LIST,
                items: [
                    [{ text: 'Item 1', style: InlineType.TEXT }],
                    [{ text: 'Item 2', style: InlineType.TEXT }]
                ]
            });
        });

        test('deserializes correctly', () => {
            const json = {
                type: BlockType.LIST as BlockType.LIST,
                items: [
                    [{ text: 'First', style: InlineType.TEXT }],
                    [{ text: 'Second', style: InlineType.BOLD }]
                ]
            };
            const list = ListBlock.fromJSON(json);
            expect(list.items.length).toBe(2);
            expect(list.items[1][0].style).toBe(InlineType.BOLD);
        });
    });
});

// ==================== ImageBlock Tests ====================

describe('ImageBlock', () => {
    describe('constructor', () => {
        test('creates image with ID only', () => {
            const img = new ImageBlock('abc123');
            expect(img.imageId).toBe('abc123');
            expect(img.caption).toBeUndefined();
            expect(img.alt).toBeUndefined();
        });

        test('creates image with caption and alt', () => {
            const img = new ImageBlock('abc123', 'My caption', 'Alt text');
            expect(img.imageId).toBe('abc123');
            expect(img.caption).toBe('My caption');
            expect(img.alt).toBe('Alt text');
        });
    });

    describe('toHTML', () => {
        test('renders simple image without resolver', () => {
            const img = new ImageBlock('abc123');
            const html = img.toHTML();
            expect(html).toContain('src="#abc123"');
            expect(html).toContain('data-image-id="abc123"');
        });

        test('renders image with URL resolver', () => {
            const img = new ImageBlock('abc123');
            const resolver = (id: string) => `/api/images/${id}`;
            const html = img.toHTML(resolver);
            expect(html).toContain('src="/api/images/abc123"');
        });

        test('renders image with caption in figure', () => {
            const img = new ImageBlock('abc123', 'My photo');
            const html = img.toHTML();
            expect(html).toContain('<figure>');
            expect(html).toContain('<figcaption>My photo</figcaption>');
            expect(html).toContain('</figure>');
        });

        test('uses caption as alt if no alt provided', () => {
            const img = new ImageBlock('abc123', 'My caption');
            const html = img.toHTML();
            expect(html).toContain('alt="My caption"');
        });

        test('uses alt text when provided', () => {
            const img = new ImageBlock('abc123', 'Caption', 'Alt text');
            const html = img.toHTML();
            expect(html).toContain('alt="Alt text"');
        });
    });

    describe('toMarkdown', () => {
        test('renders with imalink: prefix', () => {
            const img = new ImageBlock('abc123');
            expect(img.toMarkdown()).toBe('![](imalink:abc123)');
        });

        test('includes alt text', () => {
            const img = new ImageBlock('abc123', 'Caption', 'Alt text');
            expect(img.toMarkdown()).toBe('![Alt text](imalink:abc123)');
        });

        test('uses caption as alt if no alt provided', () => {
            const img = new ImageBlock('abc123', 'My caption');
            expect(img.toMarkdown()).toBe('![My caption](imalink:abc123)');
        });
    });

    describe('JSON serialization', () => {
        test('serializes minimal image', () => {
            const img = new ImageBlock('abc123');
            const json = img.toJSON();
            expect(json).toEqual({
                type: BlockType.IMAGE,
                imageId: 'abc123',
                caption: undefined,
                alt: undefined
            });
        });

        test('serializes full image', () => {
            const img = new ImageBlock('abc123', 'Caption', 'Alt');
            const json = img.toJSON();
            expect(json).toEqual({
                type: BlockType.IMAGE,
                imageId: 'abc123',
                caption: 'Caption',
                alt: 'Alt'
            });
        });

        test('deserializes correctly', () => {
            const json = {
                type: BlockType.IMAGE as BlockType.IMAGE,
                imageId: 'xyz789',
                caption: 'Test caption',
                alt: 'Test alt'
            };
            const img = ImageBlock.fromJSON(json);
            expect(img.imageId).toBe('xyz789');
            expect(img.caption).toBe('Test caption');
            expect(img.alt).toBe('Test alt');
        });
    });
});

// ==================== PhotoDocument Tests ====================

describe('PhotoDocument', () => {
    describe('constructor', () => {
        test('creates document with title only', () => {
            const doc = new PhotoDocument('Test Doc');
            expect(doc.title).toBe('Test Doc');
            expect(doc.description).toBeUndefined();
            expect(doc.blocks).toEqual([]);
            expect(doc.metadata).toEqual({});
        });

        test('creates document with description', () => {
            const doc = new PhotoDocument('Title', 'Description');
            expect(doc.title).toBe('Title');
            expect(doc.description).toBe('Description');
        });

        test('creates document with metadata', () => {
            const doc = new PhotoDocument('Title', undefined, { author: 'John' });
            expect(doc.metadata.author).toBe('John');
        });

        test('sets created and modified timestamps', () => {
            const before = new Date();
            const doc = new PhotoDocument('Test');
            const after = new Date();
            
            expect(doc.created.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(doc.created.getTime()).toBeLessThanOrEqual(after.getTime());
            expect(doc.modified.getTime()).toBeGreaterThanOrEqual(before.getTime());
        });
    });

    describe('addBlock', () => {
        test('adds block to document', () => {
            const doc = new PhotoDocument('Test');
            const block = new ParagraphBlock([new InlineSpan('Text')]);
            doc.addBlock(block);
            expect(doc.blocks.length).toBe(1);
            expect(doc.blocks[0]).toBe(block);
        });

        test('updates modified timestamp when adding block', (done) => {
            const doc = new PhotoDocument('Test');
            const initialModified = doc.modified.getTime();
            
            setTimeout(() => {
                doc.addBlock(new ParagraphBlock([new InlineSpan('Text')]));
                expect(doc.modified.getTime()).toBeGreaterThan(initialModified);
                done();
            }, 10);
        });
    });

    describe('toHTML', () => {
        test('renders empty document', () => {
            const doc = new PhotoDocument('Empty');
            const html = doc.toHTML();
            expect(html).toContain('<div class="phototext-document">');
            expect(html).toContain('</div>');
        });

        test('renders document with blocks', () => {
            const doc = new PhotoDocument('Test');
            doc.addBlock(new HeadingBlock(1, [new InlineSpan('Title')]));
            doc.addBlock(new ParagraphBlock([new InlineSpan('Text')]));
            
            const html = doc.toHTML();
            expect(html).toContain('<h1>Title</h1>');
            expect(html).toContain('<p>Text</p>');
        });

        test('includes CSS when requested', () => {
            const doc = new PhotoDocument('Test');
            const html = doc.toHTML({ includeCSS: true });
            expect(html).toContain('<style>');
            expect(html).toContain('.phototext-document');
        });

        test('uses custom CSS class', () => {
            const doc = new PhotoDocument('Test');
            const html = doc.toHTML({ cssClass: 'custom-class' });
            expect(html).toContain('class="custom-class"');
        });

        test('passes imageUrlResolver to ImageBlocks', () => {
            const doc = new PhotoDocument('Test');
            doc.addBlock(new ImageBlock('abc123'));
            
            const resolver = (id: string) => `/images/${id}`;
            const html = doc.toHTML({ imageUrlResolver: resolver });
            expect(html).toContain('src="/images/abc123"');
        });
    });

    describe('toMarkdown', () => {
        test('renders empty document', () => {
            const doc = new PhotoDocument('Empty');
            expect(doc.toMarkdown()).toBe('');
        });

        test('renders document with blocks separated by double newlines', () => {
            const doc = new PhotoDocument('Test');
            doc.addBlock(new HeadingBlock(1, [new InlineSpan('Title')]));
            doc.addBlock(new ParagraphBlock([new InlineSpan('Text')]));
            
            const md = doc.toMarkdown();
            expect(md).toBe('# Title\n\nText');
        });

        test('renders all block types', () => {
            const doc = new PhotoDocument('Test');
            doc.addBlock(new HeadingBlock(2, [new InlineSpan('Heading')]));
            doc.addBlock(new ParagraphBlock([new InlineSpan('Para')]));
            doc.addBlock(new ListBlock([[new InlineSpan('Item')]]));
            doc.addBlock(new ImageBlock('abc123', 'Photo'));
            
            const md = doc.toMarkdown();
            expect(md).toContain('## Heading');
            expect(md).toContain('Para');
            expect(md).toContain('- Item');
            expect(md).toContain('![Photo](imalink:abc123)');
        });
    });

    describe('JSON serialization', () => {
        test('serializes document correctly', () => {
            const doc = new PhotoDocument('Test', 'Description', { author: 'John' });
            doc.addBlock(new ParagraphBlock([new InlineSpan('Text')]));
            
            const json = doc.toJSON();
            expect(json.version).toBe('1.0');
            expect(json.title).toBe('Test');
            expect(json.description).toBe('Description');
            expect(json.metadata.author).toBe('John');
            expect(json.blocks.length).toBe(1);
            expect(json.blocks[0].type).toBe(BlockType.PARAGRAPH);
        });

        test('includes timestamps in ISO format', () => {
            const doc = new PhotoDocument('Test');
            const json = doc.toJSON();
            
            expect(json.created).toBeDefined();
            expect(json.modified).toBeDefined();
            expect(() => new Date(json.created!)).not.toThrow();
            expect(() => new Date(json.modified!)).not.toThrow();
        });

        test('deserializes document correctly', () => {
            const json = {
                version: '1.0',
                title: 'Test',
                description: 'Desc',
                created: '2024-01-01T00:00:00.000Z',
                modified: '2024-01-02T00:00:00.000Z',
                metadata: { author: 'Jane' },
                blocks: [
                    {
                        type: BlockType.PARAGRAPH as BlockType.PARAGRAPH,
                        content: [{ text: 'Hello', style: InlineType.TEXT }]
                    }
                ]
            };
            
            const doc = PhotoDocument.fromJSON(json);
            expect(doc.title).toBe('Test');
            expect(doc.description).toBe('Desc');
            expect(doc.metadata.author).toBe('Jane');
            expect(doc.blocks.length).toBe(1);
            expect(doc.blocks[0] instanceof ParagraphBlock).toBe(true);
        });

        test('round-trip serialization preserves data', () => {
            const original = new PhotoDocument('Original', 'Test doc');
            original.addBlock(new HeadingBlock(1, [new InlineSpan('Title')]));
            original.addBlock(new ParagraphBlock([
                new InlineSpan('Bold ', InlineType.BOLD),
                new InlineSpan('text')
            ]));
            original.addBlock(new ImageBlock('img123', 'Caption'));
            
            const json = original.toJSON();
            const restored = PhotoDocument.fromJSON(json);
            
            expect(restored.title).toBe(original.title);
            expect(restored.description).toBe(original.description);
            expect(restored.blocks.length).toBe(original.blocks.length);
        });

        test('toString and fromString work correctly', () => {
            const doc = new PhotoDocument('Test');
            doc.addBlock(new ParagraphBlock([new InlineSpan('Text')]));
            
            const jsonString = doc.toString();
            expect(() => JSON.parse(jsonString)).not.toThrow();
            
            const restored = PhotoDocument.fromString(jsonString);
            expect(restored.title).toBe('Test');
            expect(restored.blocks.length).toBe(1);
        });
    });

    describe('getImageIds', () => {
        test('returns empty array for document without images', () => {
            const doc = new PhotoDocument('Test');
            doc.addBlock(new ParagraphBlock([new InlineSpan('Text')]));
            expect(doc.getImageIds()).toEqual([]);
        });

        test('returns image IDs from ImageBlocks', () => {
            const doc = new PhotoDocument('Test');
            doc.addBlock(new ImageBlock('img1'));
            doc.addBlock(new ParagraphBlock([new InlineSpan('Text')]));
            doc.addBlock(new ImageBlock('img2'));
            
            const ids = doc.getImageIds();
            expect(ids).toEqual(['img1', 'img2']);
        });
    });

    describe('validateImageIds', () => {
        test('returns empty array when all images are valid', () => {
            const doc = new PhotoDocument('Test');
            doc.addBlock(new ImageBlock('img1'));
            doc.addBlock(new ImageBlock('img2'));
            
            const validIds = new Set(['img1', 'img2', 'img3']);
            expect(doc.validateImageIds(validIds)).toEqual([]);
        });

        test('returns missing image IDs', () => {
            const doc = new PhotoDocument('Test');
            doc.addBlock(new ImageBlock('img1'));
            doc.addBlock(new ImageBlock('img2'));
            doc.addBlock(new ImageBlock('img3'));
            
            const validIds = new Set(['img1']);
            const missing = doc.validateImageIds(validIds);
            expect(missing).toEqual(['img2', 'img3']);
        });
    });

    describe('block type deserialization', () => {
        test('deserializes HeadingBlock', () => {
            const json = {
                version: '1.0',
                title: 'Test',
                metadata: {},
                blocks: [
                    {
                        type: BlockType.HEADING as BlockType.HEADING,
                        level: 2,
                        content: [{ text: 'Test', style: InlineType.TEXT }]
                    }
                ]
            };
            const doc = PhotoDocument.fromJSON(json);
            expect(doc.blocks[0] instanceof HeadingBlock).toBe(true);
        });

        test('deserializes ListBlock', () => {
            const json = {
                version: '1.0',
                title: 'Test',
                metadata: {},
                blocks: [
                    {
                        type: BlockType.LIST as BlockType.LIST,
                        items: [[{ text: 'Item', style: InlineType.TEXT }]]
                    }
                ]
            };
            const doc = PhotoDocument.fromJSON(json);
            expect(doc.blocks[0] instanceof ListBlock).toBe(true);
        });

        test('deserializes ImageBlock', () => {
            const json = {
                version: '1.0',
                title: 'Test',
                metadata: {},
                blocks: [
                    {
                        type: BlockType.IMAGE as BlockType.IMAGE,
                        imageId: 'img123',
                        caption: 'Test'
                    }
                ]
            };
            const doc = PhotoDocument.fromJSON(json);
            expect(doc.blocks[0] instanceof ImageBlock).toBe(true);
        });

        test('throws error for unknown block type', () => {
            const json: any = {
                version: '1.0',
                title: 'Test',
                metadata: {},
                blocks: [
                    {
                        type: 'unknown_type',
                        data: 'test'
                    }
                ]
            };
            expect(() => PhotoDocument.fromJSON(json)).toThrow('Unknown block type');
        });
    });
});
