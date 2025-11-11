/**
 * PhotoText - Structured Photo Storytelling Document Library (TypeScript)
 * 
 * A minimal, type-safe document model for photo storytelling.
 * This is the TypeScript/JavaScript port of the Python phototext library.
 * 
 * Designed for use in Imalink frontend applications.
 */

// ==================== INLINE ELEMENTS ====================

export enum InlineType {
    TEXT = "text",
    BOLD = "bold",
    ITALIC = "italic",
    BOLD_ITALIC = "bold_italic"
}

export interface InlineSpanData {
    text: string;
    style: InlineType;
}

export class InlineSpan {
    text: string;
    style: InlineType;

    constructor(text: string, style: InlineType = InlineType.TEXT) {
        this.text = text;
        this.style = style;
    }

    toJSON(): InlineSpanData {
        return {
            text: this.text,
            style: this.style
        };
    }

    static fromJSON(data: InlineSpanData): InlineSpan {
        return new InlineSpan(data.text, data.style);
    }

    toHTML(): string {
        const escapedText = this.text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

        switch (this.style) {
            case InlineType.BOLD:
                return `<strong>${escapedText}</strong>`;
            case InlineType.ITALIC:
                return `<em>${escapedText}</em>`;
            case InlineType.BOLD_ITALIC:
                return `<strong><em>${escapedText}</em></strong>`;
            default:
                return escapedText;
        }
    }

    toMarkdown(): string {
        switch (this.style) {
            case InlineType.BOLD:
                return `**${this.text}**`;
            case InlineType.ITALIC:
                return `*${this.text}*`;
            case InlineType.BOLD_ITALIC:
                return `***${this.text}***`;
            default:
                return this.text;
        }
    }

    getText(): string {
        return this.text;
    }
}

// ==================== BLOCK ELEMENTS ====================

export enum BlockType {
    HEADING = "heading",
    PARAGRAPH = "paragraph",
    LIST = "list",
    IMAGE = "image"
}

export interface HeadingBlockData {
    type: BlockType.HEADING;
    level: number;
    content: InlineSpanData[];
}

export class HeadingBlock {
    level: number;
    content: InlineSpan[];

    constructor(level: number, content: InlineSpan[] = []) {
        if (level < 1 || level > 6) {
            throw new Error(`Heading level must be 1-6, got ${level}`);
        }
        this.level = level;
        this.content = content;
    }

    toJSON(): HeadingBlockData {
        return {
            type: BlockType.HEADING,
            level: this.level,
            content: this.content.map(span => span.toJSON())
        };
    }

    static fromJSON(data: HeadingBlockData): HeadingBlock {
        return new HeadingBlock(
            data.level,
            data.content.map(s => InlineSpan.fromJSON(s))
        );
    }

    toHTML(): string {
        const contentHTML = this.content.map(span => span.toHTML()).join('');
        return `<h${this.level}>${contentHTML}</h${this.level}>`;
    }

    toMarkdown(): string {
        const contentMD = this.content.map(span => span.toMarkdown()).join('');
        const prefix = '#'.repeat(this.level);
        return `${prefix} ${contentMD}`;
    }

    getText(): string {
        return this.content.map(span => span.getText()).join('');
    }
}

export interface ParagraphBlockData {
    type: BlockType.PARAGRAPH;
    content: InlineSpanData[];
}

export class ParagraphBlock {
    content: InlineSpan[];

    constructor(content: InlineSpan[] = []) {
        this.content = content;
    }

    toJSON(): ParagraphBlockData {
        return {
            type: BlockType.PARAGRAPH,
            content: this.content.map(span => span.toJSON())
        };
    }

    static fromJSON(data: ParagraphBlockData): ParagraphBlock {
        return new ParagraphBlock(
            data.content.map(s => InlineSpan.fromJSON(s))
        );
    }

    toHTML(): string {
        const contentHTML = this.content.map(span => span.toHTML()).join('');
        return `<p>${contentHTML}</p>`;
    }

    toMarkdown(): string {
        return this.content.map(span => span.toMarkdown()).join('');
    }

    getText(): string {
        return this.content.map(span => span.getText()).join('');
    }
}

export interface ListBlockData {
    type: BlockType.LIST;
    items: InlineSpanData[][];
}

export class ListBlock {
    items: InlineSpan[][];

    constructor(items: InlineSpan[][] = []) {
        this.items = items;
    }

    toJSON(): ListBlockData {
        return {
            type: BlockType.LIST,
            items: this.items.map(item => item.map(span => span.toJSON()))
        };
    }

    static fromJSON(data: ListBlockData): ListBlock {
        return new ListBlock(
            data.items.map(item => item.map(s => InlineSpan.fromJSON(s)))
        );
    }

    toHTML(): string {
        const itemsHTML = this.items
            .map(item => {
                const contentHTML = item.map(span => span.toHTML()).join('');
                return `  <li>${contentHTML}</li>`;
            })
            .join('\n');
        return `<ul>\n${itemsHTML}\n</ul>`;
    }

    toMarkdown(): string {
        return this.items
            .map(item => {
                const contentMD = item.map(span => span.toMarkdown()).join('');
                return `- ${contentMD}`;
            })
            .join('\n');
    }
}

export interface ImageBlockData {
    type: BlockType.IMAGE;
    imageId: string;
    caption?: string;
    alt?: string;
}

/**
 * Image reference block.
 * 
 * Uses imageId to reference images in Imalink database.
 * Does NOT support external URLs.
 */
export class ImageBlock {
    imageId: string;  // Imalink database image ID (hothash)
    caption?: string;
    alt?: string;

    constructor(imageId: string, caption?: string, alt?: string) {
        this.imageId = imageId;
        this.caption = caption;
        this.alt = alt;
    }

    toJSON(): ImageBlockData {
        return {
            type: BlockType.IMAGE,
            imageId: this.imageId,
            caption: this.caption,
            alt: this.alt
        };
    }

    static fromJSON(data: ImageBlockData): ImageBlock {
        return new ImageBlock(data.imageId, data.caption, data.alt);
    }

    /**
     * Convert to HTML.
     * @param imageUrlResolver - Function to resolve imageId to actual URL
     */
    toHTML(imageUrlResolver?: (imageId: string) => string): string {
        const url = imageUrlResolver ? imageUrlResolver(this.imageId) : `#${this.imageId}`;
        const altText = this.alt || this.caption || '';
        const imgTag = `<img src="${url}" alt="${altText}" data-image-id="${this.imageId}">`;
        
        if (this.caption) {
            return `<figure>\n  ${imgTag}\n  <figcaption>${this.caption}</figcaption>\n</figure>`;
        }
        return imgTag;
    }

    toMarkdown(): string {
        const altText = this.alt || this.caption || '';
        return `![${altText}](imalink:${this.imageId})`;
    }
}

export type Block = HeadingBlock | ParagraphBlock | ListBlock | ImageBlock;
export type BlockData = HeadingBlockData | ParagraphBlockData | ListBlockData | ImageBlockData;

// ==================== DOCUMENT ====================

export interface PhotoDocumentData {
    version: string;
    title: string;
    description?: string;
    created?: string;
    modified?: string;
    metadata: Record<string, any>;
    blocks: BlockData[];
}

export interface RenderOptions {
    includeCSS?: boolean;
    cssClass?: string;
    imageUrlResolver?: (imageId: string) => string;
}

export class PhotoDocument {
    static readonly VERSION = "1.0";
    
    title: string;
    description?: string;
    created: Date;
    modified: Date;
    metadata: Record<string, any>;
    blocks: Block[];

    constructor(
        title: string,
        description?: string,
        metadata: Record<string, any> = {}
    ) {
        this.title = title;
        this.description = description;
        this.created = new Date();
        this.modified = new Date();
        this.metadata = metadata;
        this.blocks = [];
    }

    addBlock(block: Block): void {
        this.blocks.push(block);
        this.modified = new Date();
    }

    toJSON(): PhotoDocumentData {
        return {
            version: PhotoDocument.VERSION,
            title: this.title,
            description: this.description,
            created: this.created.toISOString(),
            modified: this.modified.toISOString(),
            metadata: this.metadata,
            blocks: this.blocks.map(block => block.toJSON())
        };
    }

    static fromJSON(data: PhotoDocumentData): PhotoDocument {
        const doc = new PhotoDocument(data.title, data.description, data.metadata);
        doc.created = data.created ? new Date(data.created) : new Date();
        doc.modified = data.modified ? new Date(data.modified) : new Date();
        
        doc.blocks = data.blocks.map(blockData => {
            switch (blockData.type) {
                case BlockType.HEADING:
                    return HeadingBlock.fromJSON(blockData as HeadingBlockData);
                case BlockType.PARAGRAPH:
                    return ParagraphBlock.fromJSON(blockData as ParagraphBlockData);
                case BlockType.LIST:
                    return ListBlock.fromJSON(blockData as ListBlockData);
                case BlockType.IMAGE:
                    return ImageBlock.fromJSON(blockData as ImageBlockData);
                default:
                    throw new Error(`Unknown block type: ${(blockData as any).type}`);
            }
        });
        
        return doc;
    }

    toHTML(options: RenderOptions = {}): string {
        const {
            includeCSS = false,
            cssClass = 'phototext-document',
            imageUrlResolver
        } = options;

        const blocksHTML = this.blocks.map(block => {
            if (block instanceof ImageBlock) {
                return block.toHTML(imageUrlResolver);
            }
            return block.toHTML();
        }).join('\n');

        let html = `<div class="${cssClass}">\n${blocksHTML}\n</div>`;

        if (includeCSS) {
            html = this.getDefaultCSS() + '\n' + html;
        }

        return html;
    }

    toMarkdown(): string {
        return this.blocks.map(block => block.toMarkdown()).join('\n\n');
    }

    getDefaultCSS(): string {
        return `<style>
.phototext-document {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    line-height: 1.6;
    color: #333;
}

.phototext-document h1,
.phototext-document h2,
.phototext-document h3,
.phototext-document h4,
.phototext-document h5,
.phototext-document h6 {
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    font-weight: 600;
    line-height: 1.25;
}

.phototext-document h1 { font-size: 2em; }
.phototext-document h2 { font-size: 1.5em; }
.phototext-document h3 { font-size: 1.25em; }
.phototext-document h4 { font-size: 1em; }
.phototext-document h5 { font-size: 0.875em; }
.phototext-document h6 { font-size: 0.85em; color: #666; }

.phototext-document p {
    margin: 1em 0;
}

.phototext-document ul {
    margin: 1em 0;
    padding-left: 2em;
}

.phototext-document li {
    margin: 0.5em 0;
}

.phototext-document img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 1.5em 0;
}

.phototext-document figure {
    margin: 2em 0;
}

.phototext-document figcaption {
    margin-top: 0.5em;
    font-size: 0.9em;
    color: #666;
    font-style: italic;
    text-align: center;
}

.phototext-document strong {
    font-weight: 600;
}

.phototext-document em {
    font-style: italic;
}
</style>`;
    }

    /**
     * Save document to JSON string
     */
    toString(): string {
        return JSON.stringify(this.toJSON(), null, 2);
    }

    /**
     * Load document from JSON string
     */
    static fromString(json: string): PhotoDocument {
        const data = JSON.parse(json);
        return PhotoDocument.fromJSON(data);
    }

    /**
     * Get list of all image IDs referenced in the document
     */
    getImageIds(): string[] {
        const imageIds: string[] = [];
        for (const block of this.blocks) {
            if (block instanceof ImageBlock) {
                imageIds.push(block.imageId);
            }
        }
        return imageIds;
    }

    /**
     * Validate that all image IDs exist in the provided set
     */
    validateImageIds(validIds: Set<string>): string[] {
        const missingIds: string[] = [];
        const imageIds = this.getImageIds();
        
        for (const imageId of imageIds) {
            if (!validIds.has(imageId)) {
                missingIds.push(imageId);
            }
        }
        
        return missingIds;
    }
}
