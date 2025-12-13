/**
 * @package @upswitch/data-collection
 *
 * Field Renderer Component - Renders data collection fields based on method.
 */

import React from 'react';
import type { DataCollectionMethod, FieldRendererProps } from '../types';

// Import collection method specific renderers
import { ManualFormFieldRenderer } from '../renderers/ManualFormFieldRenderer';
import { ConversationalFieldRenderer } from '../renderers/ConversationalFieldRenderer';
import { SuggestionFieldRenderer } from '../renderers/SuggestionFieldRenderer';
import { FuzzySearchFieldRenderer } from '../renderers/FuzzySearchFieldRenderer';
import { FileUploadFieldRenderer } from '../renderers/FileUploadFieldRenderer';

/**
 * FieldRenderer component that delegates to method-specific renderers.
 * Follows Strategy pattern for different field rendering approaches.
 */
export const FieldRenderer: React.FC<FieldRendererProps> = (props) => {
  const { context } = props;

  // Determine which renderer to use based on collection method
  const getRenderer = (method: DataCollectionMethod) => {
    switch (method) {
      case 'manual_form':
        return ManualFormFieldRenderer;
      case 'conversational':
        return ConversationalFieldRenderer;
      case 'suggestion':
        return SuggestionFieldRenderer;
      case 'fuzzy_search':
        return FuzzySearchFieldRenderer;
      case 'file_upload':
        return FileUploadFieldRenderer;
      default:
        return ManualFormFieldRenderer; // Fallback
    }
  };

  const Renderer = getRenderer(context.method);

  return <Renderer {...props} />;
};

// Export individual renderers for direct use if needed
export { ManualFormFieldRenderer } from '../renderers/ManualFormFieldRenderer';
export { ConversationalFieldRenderer } from '../renderers/ConversationalFieldRenderer';
export { SuggestionFieldRenderer } from '../renderers/SuggestionFieldRenderer';
export { FuzzySearchFieldRenderer } from '../renderers/FuzzySearchFieldRenderer';
export { FileUploadFieldRenderer } from '../renderers/FileUploadFieldRenderer';