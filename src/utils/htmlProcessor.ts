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
    
    // DISABLED: We now use global CSS (.valuation-report-preview) to match backend styles exactly.
    // This prevents the injection of generic Tailwind classes that conflict with our Bank-Grade design.
    // Previously used: addReportStyling() - removed to avoid TypeScript errors
    
    // Process links to open in new tabs
    processed = this.processLinks(processed);
    
    // DISABLED: Backend handles table responsiveness/layout.
    // Previously used: addResponsiveTables() - removed to avoid TypeScript errors
    
    return processed;
  }

  /**
   * Process links to open in new tabs
   */
  private static processLinks(html: string): string {
    return html.replace(/<a\s+href=/g, '<a target="_blank" rel="noopener noreferrer" href=');
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
