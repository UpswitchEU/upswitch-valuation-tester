import { serviceLogger } from '../utils/logger'

export interface ProcessedFile {
  id: string
  file: File
  status: 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  extractedData?: {
    revenue: number
    ebitda: number
    company_name: string
    confidence: number
  }
  error?: string
}

export interface UploadResult {
  success: boolean
  extractedData?: {
    revenue: number
    ebitda: number
    company_name: string
    confidence: number
  }
  error?: string
}

export class FileProcessingService {
  async processFiles(files: File[]): Promise<ProcessedFile[]> {
    serviceLogger.info('Starting file processing', { fileCount: files.length })

    const processedFiles: ProcessedFile[] = files.map((file) => ({
      id: `${Date.now()}_${file.name}`,
      file,
      status: 'uploading',
      progress: 0,
    }))

    // Process each file
    for (const processedFile of processedFiles) {
      try {
        await this.processFile(processedFile)
      } catch (error) {
        serviceLogger.error('File processing failed', {
          fileId: processedFile.id,
          fileName: processedFile.file.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        })

        processedFile.status = 'error'
        processedFile.error = 'Failed to process file'
      }
    }

    serviceLogger.info('File processing completed', {
      totalFiles: processedFiles.length,
      successfulFiles: processedFiles.filter((f) => f.status === 'completed').length,
    })

    return processedFiles
  }

  private async processFile(processedFile: ProcessedFile): Promise<void> {
    // Document parsing endpoint not available in backend yet
    // This is a Phase 2 feature - mark as error for now
    serviceLogger.warn('Document parsing not yet implemented in backend', {
      fileId: processedFile.id,
      fileName: processedFile.file.name,
    })

    processedFile.status = 'error'
    processedFile.progress = 0
    processedFile.error = 'Document parsing is not yet available. Please enter data manually.'
  }

  async uploadFile(file: File, onProgress: (progress: number) => void): Promise<UploadResult> {
    serviceLogger.info('Starting file upload', { fileName: file.name, fileSize: file.size })

    // Document upload endpoint not available in backend yet
    // This is a Phase 2 feature
    serviceLogger.warn('Document upload not yet implemented in backend', {
      fileName: file.name,
    })

    return {
      success: false,
      error: 'Document upload is not yet available. Please enter data manually.',
    }
  }
}

export const fileProcessingService = new FileProcessingService()
