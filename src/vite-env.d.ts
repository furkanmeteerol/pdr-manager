/// <reference types="vite/client" />

declare module '*?url' {
  const src: string;
  export default src;
}

declare module 'word-extractor' {
  export default class WordExtractor {
    extract(documentPathOrBuffer: string | Buffer): Promise<any>;
  }
}

declare module 'pdfjs-dist/legacy/build/pdf.mjs' {
  export * from 'pdfjs-dist';
}
