/**
 * Unit tests for HierarchicalDocument model
 */

import {
    InlineSpan,
    InlineType,
    ParagraphBlock,
    ListBlock,
    ImageBlock,
    HeadingBlock,
    DocumentPart,
    HierarchicalDocument,
    PhotoDocument,
    BlockType
} from '../phototext';

// ==================== DocumentPart Tests ====================

describe('DocumentPart', () => {
    describe('constructor', () => {
        test('creates part with heading', () => {
            const part = new DocumentPart([new InlineSpan('Section')]);
            expect(part.heading.length).toBe(1);
            expect(part.content.length).toBe(0);
            expect(part.subParts.length).toBe(0);
        });

        test('creates empty part', () => {
            const part = new DocumentPart();
            expect(part.heading).toEqual([]);
        });
    });

    describe('level calculation', () => {
        test('root part has level 1', () => {
            const part = new DocumentPart([new InlineSpan('Root')]);
            expect(part.level).toBe(1);
        });

        test('nested part has level 2', () => {
            const root = new DocumentPart([new InlineSpan('Root')]);
            const child = new DocumentPart([new InlineSpan('Child')]);
            root.addSubPart(child);
            expect(child.level).toBe(2);
        });

        test('deeply nested part has correct level', () => {
            const l1 = new DocumentPart([new InlineSpan('L1')]);
            const l2 = new DocumentPart([new InlineSpan('L2')]);
            const l3 = new DocumentPart([new InlineSpan('L3')]);
            const l4 = new DocumentPart([new InlineSpan('L4')]);
            
            l1.addSubPart(l2);
            l2.addSubPart(l3);
            l3.addSubPart(l4);
            
            expect(l1.level).toBe(1);
            expect(l2.level).toBe(2);
            expect(l3.level).toBe(3);
            expect(l4.level).toBe(4);
        });

        test('level capped at 6', () => {
            let part = new DocumentPart([new InlineSpan('L1')]);
            let current = part;
            
            // Create 10 levels deep
            for (let i = 2; i <= 10; i++) {
                const child = new DocumentPart([new InlineSpan(`L${i}`)]);
                current.addSubPart(child);
                current = child;
            }
            
            // Deepest should be capped at level 6
            expect(current.level).toBe(6);
        });
    });

    describe('addContent', () => {
        test('adds paragraph to content', () => {
            const part = new DocumentPart([new InlineSpan('Section')]);
            const para = new ParagraphBlock([new InlineSpan('Text')]);
            part.addContent(para);
            expect(part.content.length).toBe(1);
            expect(part.content[0]).toBe(para);
        });

        test('throws error when adding heading to content', () => {
            const part = new DocumentPart([new InlineSpan('Section')]);
            const heading = new HeadingBlock(2, [new InlineSpan('Bad')]);
            expect(() => part.addContent(heading)).toThrow('Headings not allowed');
        });

        test('allows multiple content blocks', () => {
            const part = new DocumentPart([new InlineSpan('Section')]);
            part.addContent(new ParagraphBlock([new InlineSpan('Para 1')]));
            part.addContent(new ParagraphBlock([new InlineSpan('Para 2')]));
            part.addContent(new ImageBlock('img123'));
            expect(part.content.length).toBe(3);
        });
    });

    describe('addSubPart', () => {
        test('adds sub-part correctly', () => {
            const parent = new DocumentPart([new InlineSpan('Parent')]);
            const child = new DocumentPart([new InlineSpan('Child')]);
            parent.addSubPart(child);
            
            expect(parent.subParts.length).toBe(1);
            expect(parent.subParts[0]).toBe(child);
            expect(child.parent).toBe(parent);
        });

        test('allows multiple sub-parts', () => {
            const parent = new DocumentPart([new InlineSpan('Parent')]);
            parent.addSubPart(new DocumentPart([new InlineSpan('Child 1')]));
            parent.addSubPart(new DocumentPart([new InlineSpan('Child 2')]));
            expect(parent.subParts.length).toBe(2);
        });
    });

    describe('getHeadingText', () => {
        test('returns plain heading text', () => {
            const part = new DocumentPart([new InlineSpan('My Section')]);
            expect(part.getHeadingText()).toBe('My Section');
        });

        test('returns concatenated text with formatting', () => {
            const part = new DocumentPart([
                new InlineSpan('Bold ', InlineType.BOLD),
                new InlineSpan('Section')
            ]);
            expect(part.getHeadingText()).toBe('Bold Section');
        });
    });

    describe('toFlatBlocks', () => {
        test('converts simple part to blocks', () => {
            const part = new DocumentPart([new InlineSpan('Section')]);
            part.addContent(new ParagraphBlock([new InlineSpan('Text')]));
            
            const blocks = part.toFlatBlocks();
            expect(blocks.length).toBe(2);
            expect(blocks[0] instanceof HeadingBlock).toBe(true);
            expect((blocks[0] as HeadingBlock).level).toBe(1);
            expect(blocks[1] instanceof ParagraphBlock).toBe(true);
        });

        test('converts nested parts to correct heading levels', () => {
            const root = new DocumentPart([new InlineSpan('Root')]);
            const child = new DocumentPart([new InlineSpan('Child')]);
            child.addContent(new ParagraphBlock([new InlineSpan('Child text')]));
            root.addSubPart(child);
            
            const blocks = root.toFlatBlocks();
            expect(blocks.length).toBe(3);
            expect((blocks[0] as HeadingBlock).level).toBe(1); // Root
            expect((blocks[1] as HeadingBlock).level).toBe(2); // Child
            expect(blocks[2] instanceof ParagraphBlock).toBe(true);
        });
    });

    describe('find', () => {
        test('finds matching part', () => {
            const part = new DocumentPart([new InlineSpan('Target')]);
            const results = part.find(p => p.getHeadingText() === 'Target');
            expect(results.length).toBe(1);
            expect(results[0]).toBe(part);
        });

        test('finds in nested parts', () => {
            const root = new DocumentPart([new InlineSpan('Root')]);
            const child1 = new DocumentPart([new InlineSpan('Child 1')]);
            const child2 = new DocumentPart([new InlineSpan('Target')]);
            root.addSubPart(child1);
            root.addSubPart(child2);
            
            const results = root.find(p => p.getHeadingText() === 'Target');
            expect(results.length).toBe(1);
            expect(results[0]).toBe(child2);
        });

        test('finds multiple matches', () => {
            const root = new DocumentPart([new InlineSpan('Root')]);
            root.addSubPart(new DocumentPart([new InlineSpan('Match')]));
            root.addSubPart(new DocumentPart([new InlineSpan('Match')]));
            
            const results = root.find(p => p.getHeadingText() === 'Match');
            expect(results.length).toBe(2);
        });
    });

    describe('getImageIds', () => {
        test('returns empty array when no images', () => {
            const part = new DocumentPart([new InlineSpan('Section')]);
            part.addContent(new ParagraphBlock([new InlineSpan('Text')]));
            expect(part.getImageIds()).toEqual([]);
        });

        test('returns image IDs from content', () => {
            const part = new DocumentPart([new InlineSpan('Section')]);
            part.addContent(new ImageBlock('img1'));
            part.addContent(new ImageBlock('img2'));
            expect(part.getImageIds()).toEqual(['img1', 'img2']);
        });

        test('returns image IDs from nested parts', () => {
            const root = new DocumentPart([new InlineSpan('Root')]);
            root.addContent(new ImageBlock('img1'));
            const child = new DocumentPart([new InlineSpan('Child')]);
            child.addContent(new ImageBlock('img2'));
            root.addSubPart(child);
            
            expect(root.getImageIds()).toEqual(['img1', 'img2']);
        });
    });

    describe('JSON serialization', () => {
        test('serializes simple part', () => {
            const part = new DocumentPart([new InlineSpan('Section')]);
            part.addContent(new ParagraphBlock([new InlineSpan('Text')]));
            
            const json = part.toJSON();
            expect(json.heading.length).toBe(1);
            expect(json.content.length).toBe(1);
            expect(json.subParts.length).toBe(0);
        });

        test('deserializes simple part', () => {
            const json = {
                heading: [{ text: 'Section', style: InlineType.TEXT }],
                content: [{
                    type: BlockType.PARAGRAPH as BlockType.PARAGRAPH,
                    content: [{ text: 'Text', style: InlineType.TEXT }]
                }],
                subParts: []
            };
            
            const part = DocumentPart.fromJSON(json);
            expect(part.heading.length).toBe(1);
            expect(part.content.length).toBe(1);
        });

        test('round-trip preserves structure', () => {
            const original = new DocumentPart([new InlineSpan('Root')]);
            original.addContent(new ParagraphBlock([new InlineSpan('Text')]));
            const child = new DocumentPart([new InlineSpan('Child')]);
            child.addContent(new ImageBlock('img123', 'Caption'));
            original.addSubPart(child);
            
            const json = original.toJSON();
            const restored = DocumentPart.fromJSON(json);
            
            expect(restored.heading.length).toBe(original.heading.length);
            expect(restored.content.length).toBe(original.content.length);
            expect(restored.subParts.length).toBe(original.subParts.length);
        });

        test('throws error when deserializing heading in content', () => {
            const json = {
                heading: [{ text: 'Section', style: InlineType.TEXT }],
                content: [{
                    type: 'heading' as any,
                    level: 2,
                    content: [{ text: 'Bad', style: InlineType.TEXT }]
                }],
                subParts: []
            };
            
            expect(() => DocumentPart.fromJSON(json)).toThrow('Headings not allowed');
        });
    });
});

// ==================== HierarchicalDocument Tests ====================

describe('HierarchicalDocument', () => {
    describe('constructor', () => {
        test('creates document with title', () => {
            const doc = new HierarchicalDocument('My Doc');
            expect(doc.title).toBe('My Doc');
            expect(doc.parts).toEqual([]);
        });

        test('creates document with metadata', () => {
            const doc = new HierarchicalDocument('My Doc', 'Description', { author: 'John' });
            expect(doc.description).toBe('Description');
            expect(doc.metadata.author).toBe('John');
        });
    });

    describe('addPart', () => {
        test('adds part to document', () => {
            const doc = new HierarchicalDocument('Doc');
            const part = new DocumentPart([new InlineSpan('Section')]);
            doc.addPart(part);
            expect(doc.parts.length).toBe(1);
        });

        test('updates modified timestamp', (done) => {
            const doc = new HierarchicalDocument('Doc');
            const initial = doc.modified.getTime();
            
            setTimeout(() => {
                doc.addPart(new DocumentPart([new InlineSpan('Section')]));
                expect(doc.modified.getTime()).toBeGreaterThan(initial);
                done();
            }, 10);
        });
    });

    describe('conversion to PhotoDocument', () => {
        test('converts simple hierarchical doc', () => {
            const hierDoc = new HierarchicalDocument('Test');
            const part = new DocumentPart([new InlineSpan('Section')]);
            part.addContent(new ParagraphBlock([new InlineSpan('Text')]));
            hierDoc.addPart(part);
            
            const photoDoc = hierDoc.toPhotoDocument();
            expect(photoDoc.title).toBe('Test');
            expect(photoDoc.blocks.length).toBe(2);
            expect(photoDoc.blocks[0] instanceof HeadingBlock).toBe(true);
            expect(photoDoc.blocks[1] instanceof ParagraphBlock).toBe(true);
        });

        test('preserves metadata and timestamps', () => {
            const hierDoc = new HierarchicalDocument('Test', 'Desc', { author: 'Jane' });
            const photoDoc = hierDoc.toPhotoDocument();
            
            expect(photoDoc.description).toBe('Desc');
            expect(photoDoc.metadata.author).toBe('Jane');
            expect(photoDoc.created).toEqual(hierDoc.created);
        });

        test('flattens nested structure correctly', () => {
            const hierDoc = new HierarchicalDocument('Test');
            const root = new DocumentPart([new InlineSpan('L1')]);
            root.addContent(new ParagraphBlock([new InlineSpan('L1 text')]));
            
            const child = new DocumentPart([new InlineSpan('L2')]);
            child.addContent(new ParagraphBlock([new InlineSpan('L2 text')]));
            root.addSubPart(child);
            
            hierDoc.addPart(root);
            const photoDoc = hierDoc.toPhotoDocument();
            
            expect(photoDoc.blocks.length).toBe(4);
            expect((photoDoc.blocks[0] as HeadingBlock).level).toBe(1);
            expect((photoDoc.blocks[2] as HeadingBlock).level).toBe(2);
        });
    });

    describe('conversion from PhotoDocument', () => {
        test('converts simple flat document', () => {
            const photoDoc = new PhotoDocument('Test');
            photoDoc.addBlock(new HeadingBlock(1, [new InlineSpan('Section')]));
            photoDoc.addBlock(new ParagraphBlock([new InlineSpan('Text')]));
            
            const hierDoc = HierarchicalDocument.fromPhotoDocument(photoDoc);
            expect(hierDoc.parts.length).toBe(1);
            expect(hierDoc.parts[0].heading[0].text).toBe('Section');
            expect(hierDoc.parts[0].content.length).toBe(1);
        });

        test('creates nested structure from heading levels', () => {
            const photoDoc = new PhotoDocument('Test');
            photoDoc.addBlock(new HeadingBlock(1, [new InlineSpan('L1')]));
            photoDoc.addBlock(new ParagraphBlock([new InlineSpan('L1 text')]));
            photoDoc.addBlock(new HeadingBlock(2, [new InlineSpan('L2')]));
            photoDoc.addBlock(new ParagraphBlock([new InlineSpan('L2 text')]));
            
            const hierDoc = HierarchicalDocument.fromPhotoDocument(photoDoc);
            expect(hierDoc.parts.length).toBe(1);
            expect(hierDoc.parts[0].subParts.length).toBe(1);
            expect(hierDoc.parts[0].subParts[0].heading[0].text).toBe('L2');
        });

        test('handles multiple top-level sections', () => {
            const photoDoc = new PhotoDocument('Test');
            photoDoc.addBlock(new HeadingBlock(1, [new InlineSpan('Section 1')]));
            photoDoc.addBlock(new ParagraphBlock([new InlineSpan('Text 1')]));
            photoDoc.addBlock(new HeadingBlock(1, [new InlineSpan('Section 2')]));
            photoDoc.addBlock(new ParagraphBlock([new InlineSpan('Text 2')]));
            
            const hierDoc = HierarchicalDocument.fromPhotoDocument(photoDoc);
            expect(hierDoc.parts.length).toBe(2);
        });

        test('handles complex nesting', () => {
            const photoDoc = new PhotoDocument('Test');
            photoDoc.addBlock(new HeadingBlock(1, [new InlineSpan('H1')]));
            photoDoc.addBlock(new HeadingBlock(2, [new InlineSpan('H2a')]));
            photoDoc.addBlock(new ParagraphBlock([new InlineSpan('Text')]));
            photoDoc.addBlock(new HeadingBlock(2, [new InlineSpan('H2b')]));
            photoDoc.addBlock(new HeadingBlock(3, [new InlineSpan('H3')]));
            
            const hierDoc = HierarchicalDocument.fromPhotoDocument(photoDoc);
            expect(hierDoc.parts.length).toBe(1);
            expect(hierDoc.parts[0].subParts.length).toBe(2); // H2a, H2b
            expect(hierDoc.parts[0].subParts[1].subParts.length).toBe(1); // H3
        });

        test('handles content before first heading', () => {
            const photoDoc = new PhotoDocument('Test');
            photoDoc.addBlock(new ParagraphBlock([new InlineSpan('Intro text')]));
            photoDoc.addBlock(new HeadingBlock(1, [new InlineSpan('Section')]));
            
            const hierDoc = HierarchicalDocument.fromPhotoDocument(photoDoc);
            expect(hierDoc.parts.length).toBe(2);
            expect(hierDoc.parts[0].getHeadingText()).toBe('(Untitled)');
            expect(hierDoc.parts[0].content.length).toBe(1);
        });

        test('preserves metadata', () => {
            const photoDoc = new PhotoDocument('Test', 'Desc', { author: 'John' });
            const hierDoc = HierarchicalDocument.fromPhotoDocument(photoDoc);
            
            expect(hierDoc.description).toBe('Desc');
            expect(hierDoc.metadata.author).toBe('John');
        });
    });

    describe('round-trip conversion', () => {
        test('photo → hierarchical → photo preserves structure', () => {
            const original = new PhotoDocument('Test');
            original.addBlock(new HeadingBlock(1, [new InlineSpan('Section 1')]));
            original.addBlock(new ParagraphBlock([new InlineSpan('Text 1')]));
            original.addBlock(new HeadingBlock(2, [new InlineSpan('Subsection')]));
            original.addBlock(new ImageBlock('img123', 'Caption'));
            original.addBlock(new HeadingBlock(1, [new InlineSpan('Section 2')]));
            
            const hierDoc = HierarchicalDocument.fromPhotoDocument(original);
            const restored = hierDoc.toPhotoDocument();
            
            expect(restored.blocks.length).toBe(original.blocks.length);
            expect(restored.title).toBe(original.title);
        });
    });

    describe('getImageIds', () => {
        test('returns empty array when no images', () => {
            const doc = new HierarchicalDocument('Test');
            const part = new DocumentPart([new InlineSpan('Section')]);
            part.addContent(new ParagraphBlock([new InlineSpan('Text')]));
            doc.addPart(part);
            
            expect(doc.getImageIds()).toEqual([]);
        });

        test('returns image IDs from all parts', () => {
            const doc = new HierarchicalDocument('Test');
            const part1 = new DocumentPart([new InlineSpan('Section 1')]);
            part1.addContent(new ImageBlock('img1'));
            const part2 = new DocumentPart([new InlineSpan('Section 2')]);
            part2.addContent(new ImageBlock('img2'));
            doc.addPart(part1);
            doc.addPart(part2);
            
            expect(doc.getImageIds()).toEqual(['img1', 'img2']);
        });
    });

    describe('validateImageIds', () => {
        test('returns empty when all valid', () => {
            const doc = new HierarchicalDocument('Test');
            const part = new DocumentPart([new InlineSpan('Section')]);
            part.addContent(new ImageBlock('img1'));
            doc.addPart(part);
            
            const valid = new Set(['img1', 'img2']);
            expect(doc.validateImageIds(valid)).toEqual([]);
        });

        test('returns missing IDs', () => {
            const doc = new HierarchicalDocument('Test');
            const part = new DocumentPart([new InlineSpan('Section')]);
            part.addContent(new ImageBlock('img1'));
            part.addContent(new ImageBlock('img2'));
            doc.addPart(part);
            
            const valid = new Set(['img1']);
            expect(doc.validateImageIds(valid)).toEqual(['img2']);
        });
    });

    describe('generateTOC', () => {
        test('generates table of contents', () => {
            const doc = new HierarchicalDocument('Test');
            const root = new DocumentPart([new InlineSpan('Chapter 1')]);
            const child = new DocumentPart([new InlineSpan('Section 1.1')]);
            root.addSubPart(child);
            doc.addPart(root);
            
            const toc = doc.generateTOC();
            expect(toc.length).toBe(2);
            expect(toc[0].title).toBe('Chapter 1');
            expect(toc[0].level).toBe(1);
            expect(toc[1].title).toBe('Section 1.1');
            expect(toc[1].level).toBe(2);
        });

        test('handles complex structure', () => {
            const doc = new HierarchicalDocument('Test');
            const c1 = new DocumentPart([new InlineSpan('Chapter 1')]);
            const c1s1 = new DocumentPart([new InlineSpan('Section 1.1')]);
            const c1s2 = new DocumentPart([new InlineSpan('Section 1.2')]);
            c1.addSubPart(c1s1);
            c1.addSubPart(c1s2);
            
            const c2 = new DocumentPart([new InlineSpan('Chapter 2')]);
            
            doc.addPart(c1);
            doc.addPart(c2);
            
            const toc = doc.generateTOC();
            expect(toc.length).toBe(4);
        });
    });

    describe('JSON serialization', () => {
        test('serializes and deserializes', () => {
            const original = new HierarchicalDocument('Test', 'Desc');
            const part = new DocumentPart([new InlineSpan('Section')]);
            part.addContent(new ParagraphBlock([new InlineSpan('Text')]));
            original.addPart(part);
            
            const json = original.toJSON();
            const restored = HierarchicalDocument.fromJSON(json);
            
            expect(restored.title).toBe(original.title);
            expect(restored.parts.length).toBe(original.parts.length);
        });

        test('toString and fromString work', () => {
            const doc = new HierarchicalDocument('Test');
            const part = new DocumentPart([new InlineSpan('Section')]);
            doc.addPart(part);
            
            const jsonString = doc.toString();
            const restored = HierarchicalDocument.fromString(jsonString);
            
            expect(restored.title).toBe(doc.title);
            expect(restored.parts.length).toBe(1);
        });
    });

    describe('HTML rendering', () => {
        test('renders with section tags', () => {
            const doc = new HierarchicalDocument('Test');
            const part = new DocumentPart([new InlineSpan('Section')]);
            part.addContent(new ParagraphBlock([new InlineSpan('Text')]));
            doc.addPart(part);
            
            const html = doc.toHTML();
            expect(html).toContain('<section');
            expect(html).toContain('<h1>Section</h1>');
            expect(html).toContain('<p>Text</p>');
        });

        test('renders nested structure', () => {
            const doc = new HierarchicalDocument('Test');
            const root = new DocumentPart([new InlineSpan('L1')]);
            const child = new DocumentPart([new InlineSpan('L2')]);
            root.addSubPart(child);
            doc.addPart(root);
            
            const html = doc.toHTML();
            expect(html).toContain('<h1>L1</h1>');
            expect(html).toContain('<h2>L2</h2>');
        });
    });

    describe('Markdown rendering', () => {
        test('renders with correct heading levels', () => {
            const doc = new HierarchicalDocument('Test');
            const part = new DocumentPart([new InlineSpan('Section')]);
            part.addContent(new ParagraphBlock([new InlineSpan('Text')]));
            doc.addPart(part);
            
            const md = doc.toMarkdown();
            expect(md).toContain('# Section');
            expect(md).toContain('Text');
        });

        test('renders nested structure', () => {
            const doc = new HierarchicalDocument('Test');
            const root = new DocumentPart([new InlineSpan('L1')]);
            const child = new DocumentPart([new InlineSpan('L2')]);
            child.addContent(new ParagraphBlock([new InlineSpan('Child text')]));
            root.addSubPart(child);
            doc.addPart(root);
            
            const md = doc.toMarkdown();
            expect(md).toContain('# L1');
            expect(md).toContain('## L2');
            expect(md).toContain('Child text');
        });
    });
});
