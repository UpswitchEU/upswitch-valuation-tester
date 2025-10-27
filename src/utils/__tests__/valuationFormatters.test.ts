/**
 * Valuation Formatters Tests
 * 
 * Tests for dual format display utilities
 */

import { calculateOwnerDependencyMultipleImpact } from '../valuationFormatters';

describe('calculateOwnerDependencyMultipleImpact', () => {
  it('should calculate multiple impact correctly for positive EBITDA', () => {
    const result = calculateOwnerDependencyMultipleImpact(
      1400000, // pre-adjustment
      1120000, // post-adjustment (-20%)
      350000   // EBITDA
    );
    
    expect(result.percentageFormat).toBe('-20.0%');
    expect(result.multipleFormat).toBe('-0.8x');
    expect(result.baseMultiple).toBe(4.0);
    expect(result.adjustedMultiple).toBe(3.2);
    expect(result.multipleImpact).toBe(-0.8);
    expect(result.isApplicable).toBe(true);
  });
  
  it('should handle negative EBITDA gracefully', () => {
    const result = calculateOwnerDependencyMultipleImpact(
      1000000,
      800000,
      -50000  // negative EBITDA
    );
    
    expect(result.percentageFormat).toBe('-20.0%');
    expect(result.multipleFormat).toBe('N/A');
    expect(result.baseMultiple).toBe(0);
    expect(result.adjustedMultiple).toBe(0);
    expect(result.multipleImpact).toBe(0);
    expect(result.isApplicable).toBe(false);
  });
  
  it('should handle zero EBITDA gracefully', () => {
    const result = calculateOwnerDependencyMultipleImpact(
      1000000,
      800000,
      0  // zero EBITDA
    );
    
    expect(result.percentageFormat).toBe('-20.0%');
    expect(result.multipleFormat).toBe('N/A');
    expect(result.isApplicable).toBe(false);
  });
  
  it('should handle positive adjustments correctly', () => {
    const result = calculateOwnerDependencyMultipleImpact(
      1000000, // pre-adjustment
      1200000, // post-adjustment (+20%)
      300000   // EBITDA
    );
    
    expect(result.percentageFormat).toBe('+20.0%');
    expect(result.multipleFormat).toBe('+0.7x'); // 4.0 - 3.3 = 0.7
    expect(result.baseMultiple).toBe(3.3);
    expect(result.adjustedMultiple).toBe(4.0);
    expect(result.multipleImpact).toBe(0.7);
    expect(result.isApplicable).toBe(true);
  });
  
  it('should round values correctly', () => {
    const result = calculateOwnerDependencyMultipleImpact(
      1000000,
      950000, // -5%
      333333   // Results in 3.000x and 2.850x
    );
    
    expect(result.percentageFormat).toBe('-5.0%');
    expect(result.multipleFormat).toBe('-0.2x');
    expect(result.baseMultiple).toBe(3.0);
    expect(result.adjustedMultiple).toBe(2.9);
    expect(result.multipleImpact).toBe(-0.2); // 2.9 - 3.0 = -0.1, but rounded to -0.2
  });
  
  it('should handle very small adjustments', () => {
    const result = calculateOwnerDependencyMultipleImpact(
      1000000,
      999000, // -0.1%
      500000   // EBITDA
    );
    
    expect(result.percentageFormat).toBe('-0.1%');
    expect(result.multipleFormat).toBe('-0.0x'); // Very small negative impact
    expect(result.baseMultiple).toBe(2.0);
    expect(result.adjustedMultiple).toBe(2.0);
    expect(result.multipleImpact).toBe(-0.0); // Very small negative impact
  });
});
