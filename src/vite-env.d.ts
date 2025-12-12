/// <reference types="vite/client" />

declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | number[] | { top?: number; right?: number; bottom?: number; left?: number };
    filename?: string;
    image?: { type?: string; quality?: number };
    html2canvas?: any;
    jsPDF?: any;
  }

  interface Html2Pdf {
    set(options: Html2PdfOptions): Html2Pdf;
    output(type: string): Promise<any>;
    outputPdf(): Promise<Blob>;
    save(): Promise<void>;
    from(element: HTMLElement | string): Html2Pdf;
  }

  function html2pdf(): Html2Pdf;
  function html2pdf(element?: HTMLElement | string, options?: Html2PdfOptions): Html2Pdf;

  export = html2pdf;
}