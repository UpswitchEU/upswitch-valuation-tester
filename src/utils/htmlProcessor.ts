import DOMPurify from 'dompurify';

/**
 * HTML Processor for sanitizing and processing HTML content
 * Based on Ilara Mercury's processedHtml approach
 */
export class HTMLProcessor {
  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  static sanitize(htmlContent: string): string {
    if (!htmlContent) return '';
    
    return DOMPurify.sanitize(htmlContent, {
      // Allow common HTML tags for reports
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'div', 'span', 'strong', 'em', 'b', 'i', 'u',
        'ul', 'ol', 'li', 'br', 'hr',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'a', 'img', 'blockquote', 'pre', 'code',
        'section', 'article', 'header', 'footer'
      ],
      // Allow common attributes
      ALLOWED_ATTR: [
        'class', 'id', 'style', 'href', 'src', 'alt', 'title',
        'colspan', 'rowspan', 'align', 'valign'
      ],
      // Allow data attributes for custom functionality
      ALLOW_DATA_ATTR: true,
      // Keep relative URLs
      ALLOW_UNKNOWN_PROTOCOLS: false
    });
  }

  /**
   * Process HTML content with additional enhancements
   */
  static process(htmlContent: string): string {
    if (!htmlContent) return '';
    
    // First sanitize the content
    let processed = this.sanitize(htmlContent);
    
    // Add custom styling classes
    processed = this.addReportStyling(processed);
    
    // Process links to open in new tabs
    processed = this.processLinks(processed);
    
    // Add responsive table classes
    processed = this.addResponsiveTables(processed);
    
    return processed;
  }

  /**
   * Add report-specific styling classes
   */
  private static addReportStyling(html: string): string {
    // Add prose classes for better typography
    return html
      .replace(/<h1/g, '<h1 class="text-2xl font-bold text-gray-900 mb-4"')
      .replace(/<h2/g, '<h2 class="text-xl font-semibold text-gray-800 mb-3"')
      .replace(/<h3/g, '<h3 class="text-lg font-medium text-gray-700 mb-2"')
      .replace(/<p/g, '<p class="text-gray-600 mb-3 leading-relaxed"')
      .replace(/<ul/g, '<ul class="list-disc list-inside mb-4 space-y-1"')
      .replace(/<ol/g, '<ol class="list-decimal list-inside mb-4 space-y-1"')
      .replace(/<li/g, '<li class="text-gray-600"')
      .replace(/<table/g, '<table class="w-full border-collapse border border-gray-300 mb-4"')
      .replace(/<th/g, '<th class="border border-gray-300 px-4 py-2 bg-gray-50 font-semibold text-left"')
      .replace(/<td/g, '<td class="border border-gray-300 px-4 py-2"');
  }

  /**
   * Process links to open in new tabs
   */
  private static processLinks(html: string): string {
    return html.replace(/<a\s+href=/g, '<a target="_blank" rel="noopener noreferrer" href=');
  }

  /**
   * Add responsive table classes
   */
  private static addResponsiveTables(html: string): string {
    return html.replace(/<table/g, '<div class="overflow-x-auto"><table class="w-full border-collapse border border-gray-300 mb-4"');
  }

  /**
   * Extract sections from HTML for table of contents
   */
  static extractSections(htmlContent: string): Array<{id: string, title: string, level: number}> {
    if (!htmlContent) return [];
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const headings = doc.querySelectorAll('h2, h3, h4');
    
    return Array.from(headings).map((h, idx) => ({
      id: `section-${idx}`,
      title: h.textContent || '',
      level: parseInt(h.tagName.charAt(1))
    }));
  }

  /**
   * Check if HTML content is safe to render
   */
  static isSafe(htmlContent: string): boolean {
    if (!htmlContent) return true;
    
    const sanitized = this.sanitize(htmlContent);
    return sanitized === htmlContent;
  }
}
