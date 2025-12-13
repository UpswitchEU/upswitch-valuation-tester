/**
 * File Upload Data Collector
 *
 * Single Responsibility: Handle data collection through file upload and parsing
 * SOLID Principles: SRP, OCP, LSP, ISP, DIP
 *
 * Future-ready collector for extracting data from uploaded files (PDFs, spreadsheets, etc.)
 */

import { ILogger } from '../../../services/container/interfaces/ILogger';
import { ServiceContainer } from '../../../services/container/ServiceContainer';
import {
    CollectionContext,
    DataCollectionMethod,
    DataCollector,
    DataField,
    DataResponse,
    ValidationRule
} from '../../../types/data-collection';

export class FileUploadCollector implements DataCollector {
  private logger: ILogger;

  constructor() {
    this.logger = ServiceContainer.getInstance().resolve<ILogger>('ILogger');
  }

  async collect(field: DataField, context?: CollectionContext): Promise<DataResponse> {
    // For file upload, we return a placeholder that indicates
    // the field can be filled by uploading and parsing a file
    // The actual data collection happens after file processing

    return {
      fieldId: field.id,
      value: undefined, // Will be filled by file parsing
      method: 'file_upload',
      confidence: 0.9, // File parsing is generally reliable but not perfect
      source: 'file_parsing',
      timestamp: new Date(),
      metadata: {
        requiresFileUpload: true,
        supportedFormats: this.getSupportedFormats(field),
        field: field
      }
    };
  }

  validate(field: DataField, value: any): ValidationRule[] {
    const errors: ValidationRule[] = [];

    if (field.required && (value === undefined || value === null || value === '')) {
      errors.push({
        type: 'required',
        message: `Please upload a file to provide ${field.label.toLowerCase()}`,
        severity: 'error'
      });
    }

    return errors;
  }

  async collectMultiple(fields: DataField[], context?: CollectionContext): Promise<DataResponse[]> {
    return Promise.all(fields.map(field => this.collect(field, context)));
  }

  validateMultiple(responses: DataResponse[]): Map<string, ValidationRule[]> {
    const results = new Map<string, ValidationRule[]>();

    for (const response of responses) {
      // Note: In a real implementation, we'd need access to the fields
      // This is a simplified version - the DataCollector handles this
      const errors: ValidationRule[] = [];
      if (errors.length > 0) {
        results.set(response.fieldId, errors);
      }
    }

    return results;
  }

  supportsMethod(method: DataCollectionMethod): boolean {
    return method === 'file_upload';
  }

  getCapabilities(): DataCollectionMethod[] {
    return ['file_upload'];
  }

  // Additional methods specific to file upload
  getSupportedFormats(field: DataField): string[] {
    // Return supported file formats based on field type
    switch (field.type) {
      case 'currency':
      case 'number':
        return ['.xlsx', '.xls', '.csv', '.pdf'];
      case 'text':
      case 'textarea':
        return ['.pdf', '.docx', '.doc', '.txt'];
      default:
        return ['.pdf', '.xlsx', '.xls', '.csv'];
    }
  }

  async parseFile(file: File, field: DataField): Promise<{ value: any; confidence: number; metadata: any }> {
    // Future implementation for file parsing
    // This would integrate with libraries like:
    // - PDF parsing: pdf-parse, pdf2pic
    // - Excel parsing: xlsx, exceljs
    // - OCR for scanned documents: tesseract.js

    this.logger.info('File parsing requested', {
      fieldId: field.id,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    // Placeholder implementation
    return {
      value: undefined,
      confidence: 0,
      metadata: {
        parsingNotImplemented: true,
        fileName: file.name,
        fileType: file.type,
        fieldId: field.id
      }
    };
  }

  validateFile(file: File, field: DataField): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const supportedFormats = this.getSupportedFormats(field);

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      errors.push('File size must be less than 10MB');
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!supportedFormats.includes(fileExtension)) {
      errors.push(`File type not supported. Supported formats: ${supportedFormats.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  getFieldExtractionHints(field: DataField): string[] {
    // Return hints for what to look for in uploaded files
    switch (field.id) {
      case 'revenue':
        return [
          'Look for "Revenue", "Sales", "Turnover" in financial statements',
          'Check income statements or P&L sections',
          'Annual figures are preferred over monthly'
        ];
      case 'ebitda':
        return [
          'Look for "EBITDA", "Operating Profit", "Earnings Before Interest..."',
          'Check income statements',
          'Exclude extraordinary items if possible'
        ];
      case 'number_of_employees':
        return [
          'Look for "Number of Employees", "Headcount", "Staff Count"',
          'Check company overview or HR sections',
          'Full-time equivalents (FTE) preferred'
        ];
      default:
        return [
          `Look for "${field.label}" in the document`,
          'Check tables, headers, and key sections',
          'Use the most recent or relevant figures'
        ];
    }
  }
}