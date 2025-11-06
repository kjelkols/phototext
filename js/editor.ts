/**
 * PhotoText WYSIWYG Editor
 * 
 * A simple content-editable based editor for PhotoText documents.
 * Designed for use in Imalink frontend applications.
 */

import {
    PhotoDocument,
    Block,
    HeadingBlock,
    ParagraphBlock,
    ListBlock,
    ImageBlock,
    InlineSpan,
    InlineType,
    RenderOptions
} from './phototext';

export interface EditorOptions {
    /**
     * Container element for the editor
     */
    container: HTMLElement;
    
    /**
     * Initial document (optional)
     */
    document?: PhotoDocument;
    
    /**
     * Function to resolve image IDs to URLs for display
     */
    imageUrlResolver?: (imageId: string) => string;
    
    /**
     * Callback when document changes
     */
    onChange?: (document: PhotoDocument) => void;
    
    /**
     * Function to pick an image from Imalink database
     * Should return a Promise that resolves to the image ID
     */
    onImagePick?: () => Promise<string | null>;
    
    /**
     * Custom CSS class for the editor container
     */
    cssClass?: string;
}

export class PhotoTextEditor {
    private container: HTMLElement;
    private document: PhotoDocument;
    private imageUrlResolver?: (imageId: string) => string;
    private onChange?: (document: PhotoDocument) => void;
    private onImagePick?: () => Promise<string | null>;
    private toolbar: HTMLElement;
    private editorContent: HTMLElement;
    
    constructor(options: EditorOptions) {
        this.container = options.container;
        this.document = options.document || new PhotoDocument('Untitled');
        this.imageUrlResolver = options.imageUrlResolver;
        this.onChange = options.onChange;
        this.onImagePick = options.onImagePick;
        
        this.toolbar = this.createToolbar();
        this.editorContent = this.createEditorContent();
        
        this.container.classList.add(options.cssClass || 'phototext-editor');
        this.container.appendChild(this.toolbar);
        this.container.appendChild(this.editorContent);
        
        this.render();
        this.attachEventListeners();
    }
    
    private createToolbar(): HTMLElement {
        const toolbar = document.createElement('div');
        toolbar.className = 'phototext-toolbar';
        
        const buttons = [
            { icon: 'H1', title: 'Heading 1', action: () => this.insertHeading(1) },
            { icon: 'H2', title: 'Heading 2', action: () => this.insertHeading(2) },
            { icon: 'H3', title: 'Heading 3', action: () => this.insertHeading(3) },
            { icon: '|', title: '', action: null }, // Separator
            { icon: 'B', title: 'Bold', action: () => this.toggleFormat('bold') },
            { icon: 'I', title: 'Italic', action: () => this.toggleFormat('italic') },
            { icon: '|', title: '', action: null },
            { icon: '•', title: 'Bullet List', action: () => this.insertList() },
            { icon: '🖼️', title: 'Insert Image', action: () => this.insertImage() },
            { icon: '|', title: '', action: null },
            { icon: '¶', title: 'Insert Paragraph', action: () => this.insertParagraph() },
        ];
        
        buttons.forEach(btn => {
            if (btn.icon === '|') {
                const separator = document.createElement('span');
                separator.className = 'toolbar-separator';
                separator.textContent = '|';
                toolbar.appendChild(separator);
            } else if (btn.action) {
                const button = document.createElement('button');
                button.className = 'toolbar-button';
                button.textContent = btn.icon;
                button.title = btn.title;
                button.onclick = (e) => {
                    e.preventDefault();
                    btn.action!();
                };
                toolbar.appendChild(button);
            }
        });
        
        return toolbar;
    }
    
    private createEditorContent(): HTMLElement {
        const content = document.createElement('div');
        content.className = 'phototext-editor-content';
        content.contentEditable = 'true';
        return content;
    }
    
    private render(): void {
        this.editorContent.innerHTML = '';
        
        this.document.blocks.forEach((block, index) => {
            const blockEl = this.renderBlock(block, index);
            this.editorContent.appendChild(blockEl);
        });
        
        // Add empty paragraph if document is empty
        if (this.document.blocks.length === 0) {
            this.insertParagraph();
        }
    }
    
    private renderBlock(block: Block, index: number): HTMLElement {
        const wrapper = document.createElement('div');
        wrapper.className = 'phototext-block';
        wrapper.dataset.blockIndex = index.toString();
        
        if (block instanceof HeadingBlock) {
            const heading = document.createElement(`h${block.level}`) as HTMLHeadingElement;
            heading.contentEditable = 'true';
            heading.textContent = block.getText();
            wrapper.appendChild(heading);
        } else if (block instanceof ParagraphBlock) {
            const p = document.createElement('p');
            p.contentEditable = 'true';
            p.innerHTML = block.content.map(span => span.toHTML()).join('');
            wrapper.appendChild(p);
        } else if (block instanceof ListBlock) {
            const ul = document.createElement('ul');
            ul.contentEditable = 'true';
            block.items.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = item.map(span => span.toHTML()).join('');
                ul.appendChild(li);
            });
            wrapper.appendChild(ul);
        } else if (block instanceof ImageBlock) {
            const figure = document.createElement('figure');
            figure.className = 'phototext-image-block';
            figure.contentEditable = 'false';
            
            const img = document.createElement('img');
            img.src = this.imageUrlResolver ? this.imageUrlResolver(block.imageId) : `#${block.imageId}`;
            img.alt = block.alt || block.caption || '';
            img.dataset.imageId = block.imageId;
            
            const caption = document.createElement('figcaption');
            caption.contentEditable = 'true';
            caption.textContent = block.caption || '';
            caption.dataset.placeholder = 'Add caption...';
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-image-btn';
            removeBtn.textContent = '×';
            removeBtn.title = 'Remove image';
            removeBtn.onclick = () => this.removeBlock(index);
            
            figure.appendChild(img);
            figure.appendChild(caption);
            figure.appendChild(removeBtn);
            wrapper.appendChild(figure);
        }
        
        return wrapper;
    }
    
    private attachEventListeners(): void {
        // Listen for input changes
        this.editorContent.addEventListener('input', () => {
            this.updateDocument();
        });
        
        // Listen for keyboard shortcuts
        this.editorContent.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'b') {
                    e.preventDefault();
                    this.toggleFormat('bold');
                } else if (e.key === 'i') {
                    e.preventDefault();
                    this.toggleFormat('italic');
                }
            }
        });
    }
    
    private updateDocument(): void {
        const blocks: Block[] = [];
        const blockElements = this.editorContent.querySelectorAll('.phototext-block');
        
        blockElements.forEach((blockEl) => {
            const child = blockEl.firstElementChild;
            
            if (!child) return;
            
            if (child.tagName.match(/^H[1-6]$/)) {
                const level = parseInt(child.tagName[1]);
                const text = child.textContent || '';
                blocks.push(new HeadingBlock(level, [new InlineSpan(text)]));
            } else if (child.tagName === 'P') {
                const spans = this.parseInlineSpans(child as HTMLElement);
                blocks.push(new ParagraphBlock(spans));
            } else if (child.tagName === 'UL') {
                const items: InlineSpan[][] = [];
                child.querySelectorAll('li').forEach(li => {
                    items.push(this.parseInlineSpans(li as HTMLElement));
                });
                blocks.push(new ListBlock(items));
            } else if (child.tagName === 'FIGURE') {
                const img = child.querySelector('img');
                const caption = child.querySelector('figcaption');
                if (img && img.dataset.imageId) {
                    blocks.push(new ImageBlock(
                        img.dataset.imageId,
                        caption?.textContent || undefined,
                        img.alt || undefined
                    ));
                }
            }
        });
        
        this.document.blocks = blocks;
        this.document.modified = new Date();
        
        if (this.onChange) {
            this.onChange(this.document);
        }
    }
    
    private parseInlineSpans(element: HTMLElement): InlineSpan[] {
        const spans: InlineSpan[] = [];
        
        const traverse = (node: Node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent || '';
                if (text) {
                    spans.push(new InlineSpan(text, InlineType.TEXT));
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement;
                const text = el.textContent || '';
                
                if (el.tagName === 'STRONG') {
                    if (el.querySelector('em')) {
                        spans.push(new InlineSpan(text, InlineType.BOLD_ITALIC));
                    } else {
                        spans.push(new InlineSpan(text, InlineType.BOLD));
                    }
                } else if (el.tagName === 'EM') {
                    if (el.querySelector('strong')) {
                        spans.push(new InlineSpan(text, InlineType.BOLD_ITALIC));
                    } else {
                        spans.push(new InlineSpan(text, InlineType.ITALIC));
                    }
                } else {
                    // Traverse children
                    node.childNodes.forEach(child => traverse(child));
                }
            }
        };
        
        element.childNodes.forEach(child => traverse(child));
        
        // Merge consecutive text spans
        const merged: InlineSpan[] = [];
        spans.forEach(span => {
            const last = merged[merged.length - 1];
            if (last && last.style === span.style) {
                last.text += span.text;
            } else {
                merged.push(span);
            }
        });
        
        return merged.length > 0 ? merged : [new InlineSpan('')];
    }
    
    private insertHeading(level: number): void {
        const heading = new HeadingBlock(level, [new InlineSpan('New Heading')]);
        this.document.addBlock(heading);
        this.render();
        
        if (this.onChange) {
            this.onChange(this.document);
        }
    }
    
    private insertParagraph(): void {
        const paragraph = new ParagraphBlock([new InlineSpan('')]);
        this.document.addBlock(paragraph);
        this.render();
        
        if (this.onChange) {
            this.onChange(this.document);
        }
    }
    
    private insertList(): void {
        const list = new ListBlock([[new InlineSpan('List item')]]);
        this.document.addBlock(list);
        this.render();
        
        if (this.onChange) {
            this.onChange(this.document);
        }
    }
    
    private async insertImage(): Promise<void> {
        if (!this.onImagePick) {
            alert('Image picker not configured');
            return;
        }
        
        const imageId = await this.onImagePick();
        if (imageId) {
            const image = new ImageBlock(imageId);
            this.document.addBlock(image);
            this.render();
            
            if (this.onChange) {
                this.onChange(this.document);
            }
        }
    }
    
    private removeBlock(index: number): void {
        this.document.blocks.splice(index, 1);
        this.render();
        
        if (this.onChange) {
            this.onChange(this.document);
        }
    }
    
    private toggleFormat(format: 'bold' | 'italic'): void {
        document.execCommand(format, false);
    }
    
    /**
     * Get the current document
     */
    getDocument(): PhotoDocument {
        this.updateDocument();
        return this.document;
    }
    
    /**
     * Set a new document
     */
    setDocument(document: PhotoDocument): void {
        this.document = document;
        this.render();
    }
    
    /**
     * Export document to JSON
     */
    toJSON(): string {
        this.updateDocument();
        return this.document.toString();
    }
    
    /**
     * Load document from JSON
     */
    fromJSON(json: string): void {
        this.document = PhotoDocument.fromString(json);
        this.render();
    }
    
    /**
     * Get default editor CSS
     */
    static getDefaultCSS(): string {
        return `
.phototext-editor {
    border: 1px solid #ddd;
    border-radius: 4px;
    background: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.phototext-toolbar {
    display: flex;
    gap: 4px;
    padding: 8px;
    border-bottom: 1px solid #ddd;
    background: #f5f5f5;
    flex-wrap: wrap;
}

.toolbar-button {
    padding: 6px 12px;
    border: 1px solid #ccc;
    background: white;
    cursor: pointer;
    border-radius: 3px;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.2s;
}

.toolbar-button:hover {
    background: #e9e9e9;
    border-color: #999;
}

.toolbar-button:active {
    background: #ddd;
}

.toolbar-separator {
    color: #ccc;
    padding: 0 4px;
    user-select: none;
}

.phototext-editor-content {
    padding: 20px;
    min-height: 400px;
    outline: none;
    line-height: 1.6;
}

.phototext-editor-content h1,
.phototext-editor-content h2,
.phototext-editor-content h3,
.phototext-editor-content h4,
.phototext-editor-content h5,
.phototext-editor-content h6 {
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    font-weight: 600;
}

.phototext-editor-content h1 { font-size: 2em; }
.phototext-editor-content h2 { font-size: 1.5em; }
.phototext-editor-content h3 { font-size: 1.25em; }

.phototext-editor-content p {
    margin: 1em 0;
}

.phototext-editor-content ul {
    margin: 1em 0;
    padding-left: 2em;
}

.phototext-editor-content li {
    margin: 0.5em 0;
}

.phototext-block {
    position: relative;
}

.phototext-image-block {
    position: relative;
    margin: 2em 0;
    text-align: center;
}

.phototext-image-block img {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
}

.phototext-image-block figcaption {
    margin-top: 0.5em;
    font-size: 0.9em;
    color: #666;
    font-style: italic;
}

.phototext-image-block figcaption:empty:before {
    content: attr(data-placeholder);
    color: #999;
}

.remove-image-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: none;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s;
}

.phototext-image-block:hover .remove-image-btn {
    opacity: 1;
}

.remove-image-btn:hover {
    background: rgba(0, 0, 0, 0.8);
}
`;
    }
}
