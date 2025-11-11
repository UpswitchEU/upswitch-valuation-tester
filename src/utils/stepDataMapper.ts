/**
 * Step Data Mapper
 * 
 * Extracts step-specific calculation results with comprehensive fallback logic.
 * Priority: transparency.calculation_steps → legacy fields → computed values
 * 
 * Phase 4: Data Extraction & Transformation
 */

import type { ValuationResponse } from '../types/valuation';
import { dataExtractionLogger, createPerformanceLogger } from './logger';

/**
 * Get step result data with fallback priority:
 * 1. transparency.calculation_steps[N].key_outputs or .outputs
 * 2. Legacy fields from multiples_valuation, dcf_valuation, etc.
 * 3. Compute from available data
 */

// ============================================================================
// Step 0: Data Quality Assessment
// ============================================================================

export function getStep0DataQualityResult(result: ValuationResponse) {
  const perfLogger = createPerformanceLogger('getStep0DataQualityResult', 'data-extraction');
  dataExtractionLogger.debug('Extracting Step 0 data quality result', { step: 0 });
  
  // Priority 1: transparency.calculation_steps
  const step = result.transparency?.calculation_steps?.find(
    (s) => s.step === 0 || s.step_number === 0
  );
  
  if (step?.key_outputs) {
    dataExtractionLogger.info('Step 0 data extracted from transparency', {
      step: 0,
      dataSource: 'transparency',
      hasQualityScore: !!step.key_outputs.quality_score,
      hasDimensionScores: !!step.key_outputs.dimension_scores,
      dcfEligible: step.key_outputs.dcf_eligible
    });
    perfLogger.end({ dataSource: 'transparency', hasData: true });
    return {
      quality_score: step.key_outputs.quality_score || 0,
      dimension_scores: step.key_outputs.dimension_scores || {
        completeness: 0,
        validity: 0,
        consistency: 0,
        accuracy: 0,
        timeliness: 0
      },
      dcf_eligible: step.key_outputs.dcf_eligible ?? false,
      dcf_exclusion_reason: step.key_outputs.dcf_exclusion_reason,
      multiples_method: step.key_outputs.multiples_method || 'primary',
      warnings: step.key_outputs.warnings || [],
      recommendations: step.key_outputs.recommendations || [],
      quality_level: step.key_outputs.quality_level || 'UNKNOWN'
    };
  }

  // Priority 2: Legacy fields
  dataExtractionLogger.warn('Step 0 data not found in transparency, using legacy fallback', {
    step: 0,
    dataSource: 'legacy',
    fallbackUsed: true,
    hasDcfWeight: result.dcf_weight !== undefined
  });
  perfLogger.end({ dataSource: 'legacy', hasData: false, fallbackUsed: true });
  return {
    quality_score: 0,
    dimension_scores: {
      completeness: 0,
      validity: 0,
      consistency: 0,
      accuracy: 0,
      timeliness: 0
    },
    dcf_eligible: result.dcf_weight > 0,
    dcf_exclusion_reason: result.dcf_exclusion_reason || null,
    multiples_method: result.dcf_weight > 0 ? 'cross_check' : 'primary',
    warnings: [],
    recommendations: [],
    quality_level: 'UNKNOWN'
  };
}

// ============================================================================
// Step 1: Input Validation & Normalization
// ============================================================================

export function getStep1InputResult(result: ValuationResponse) {
  const perfLogger = createPerformanceLogger('getStep1InputResult', 'data-extraction');
  dataExtractionLogger.debug('Extracting Step 1 input result', { step: 1 });
  
  const step = result.transparency?.calculation_steps?.find(
    (s) => s.step === 1 || s.step_number === 1
  );

  if (step?.key_outputs) {
    dataExtractionLogger.info('Step 1 data extracted from transparency', {
      step: 1,
      dataSource: 'transparency',
      hasKeyOutputs: true
    });
    perfLogger.end({ dataSource: 'transparency', hasData: true });
    return step.key_outputs;
  }

  // Fallback to current_year_data
  const currentData = result.current_year_data;
  if (!currentData) {
    dataExtractionLogger.warn('Step 1 data not available, no current_year_data', {
      step: 1,
      dataSource: 'none',
      fallbackUsed: false
    });
    perfLogger.end({ dataSource: 'none', hasData: false });
    return null;
  }

  dataExtractionLogger.info('Step 1 data computed from current_year_data', {
    step: 1,
    dataSource: 'computed',
    hasRevenue: !!currentData.revenue,
    hasEbitda: !!currentData.ebitda
  });
  perfLogger.end({ dataSource: 'computed', hasData: true });
  return {
    revenue: currentData.revenue || 0,
    ebitda: currentData.ebitda || 0,
    ebitda_margin: currentData.ebitda && currentData.revenue 
      ? currentData.ebitda / currentData.revenue 
      : 0,
    weighted_revenue: currentData.revenue,
    weighted_ebitda: currentData.ebitda,
    using_weighted_metrics: false,
    company_name: result.company_name,
    industry: (result as any).industry || (result.transparency as any)?.data_provenance?.industry || 'Unknown',
    country: (result as any).country_code || 'BE',
    num_employees: (result as any).number_of_employees || 0
  };
  }

// ============================================================================
// Step 2: Industry Benchmarking
// ============================================================================

export function getStep2BenchmarkingResult(result: ValuationResponse) {
  const perfLogger = createPerformanceLogger('getStep2BenchmarkingResult', 'data-extraction');
  dataExtractionLogger.debug('Extracting Step 2 benchmarking result', { step: 2 });
  
  const step = result.transparency?.calculation_steps?.find(
    (s) => s.step === 2 || s.step_number === 2
  );

  if (step?.key_outputs) {
    dataExtractionLogger.info('Step 2 data extracted from transparency', {
      step: 2,
      dataSource: 'transparency',
      hasPrimaryMethod: !!step.key_outputs.primary_method
    });
    perfLogger.end({ dataSource: 'transparency', hasData: true });
    return step.key_outputs;
  }

  // Fallback to multiples_valuation legacy fields
  const multiples = result.multiples_valuation;
  if (!multiples) {
    dataExtractionLogger.warn('Step 2 data not available, no multiples_valuation', {
      step: 2,
      dataSource: 'none',
      fallbackUsed: false
    });
    perfLogger.end({ dataSource: 'none', hasData: false });
    return null;
  }

  dataExtractionLogger.info('Step 2 data extracted from legacy multiples_valuation', {
    step: 2,
    dataSource: 'legacy',
    fallbackUsed: true,
    primaryMethod: multiples.primary_multiple_method,
    hasComparables: !!(multiples as any).comparables
  });
  perfLogger.end({ dataSource: 'legacy', hasData: true, fallbackUsed: true });
  return {
    primary_method: multiples.primary_multiple_method === 'ebitda_multiple' 
      ? 'EV/EBITDA' 
      : 'EV/Revenue',
    primary_method_reason: (multiples as any).primary_method_reason || multiples.primary_multiple_reason || 'Standard methodology',
    ev_ebitda_multiple: multiples.ebitda_multiple || 0,
    ev_revenue_multiple: multiples.revenue_multiple || 0,
    p25_ebitda_multiple: multiples.p25_ebitda_multiple || null,
    p50_ebitda_multiple: multiples.ebitda_multiple || null,
    p75_ebitda_multiple: multiples.p75_ebitda_multiple || null,
    p25_revenue_multiple: multiples.p25_revenue_multiple || null,
    p50_revenue_multiple: multiples.revenue_multiple || null,
    p75_revenue_multiple: multiples.p75_revenue_multiple || null,
    comparables_count: (multiples as any).comparables?.length || 0,
    comparables_quality: (multiples as any).comparables?.length > 5 ? 'good' : 'limited',
    data_source: (multiples as any).industry || 'default',
    dcf_eligible: result.dcf_weight > 0,
    recommended_methodology: result.dcf_weight > 0 ? 'HYBRID' : 'MULTIPLES_ONLY'
  };
}

// ============================================================================
// Step 3: Base Enterprise Value
// ============================================================================

export function getStep3BaseEVResult(result: ValuationResponse) {
  const perfLogger = createPerformanceLogger('getStep3BaseEVResult', 'data-extraction');
  dataExtractionLogger.debug('Extracting Step 3 base EV result', { step: 3 });
  
  const step = result.transparency?.calculation_steps?.find(
    (s) => s.step === 3 || s.step_number === 3
  );

  if (step?.key_outputs) {
    dataExtractionLogger.info('Step 3 data extracted from transparency', {
      step: 3,
      dataSource: 'transparency',
      hasEnterpriseValues: !!(step.key_outputs.enterprise_value_mid)
    });
    perfLogger.end({ dataSource: 'transparency', hasData: true });
    return step.key_outputs;
  }

  // Fallback: compute from multiples
  const multiples = result.multiples_valuation;
  const currentData = result.current_year_data;
  
  if (!multiples || !currentData) {
    dataExtractionLogger.warn('Step 3 data not available, missing multiples or currentData', {
      step: 3,
      dataSource: 'none',
      hasMultiples: !!multiples,
      hasCurrentData: !!currentData,
      fallbackUsed: false
    });
    perfLogger.end({ dataSource: 'none', hasData: false });
    return null;
  }

  const isPrimaryEBITDA = multiples.primary_multiple_method === 'ebitda_multiple';
  const metric_value = isPrimaryEBITDA 
    ? (currentData.ebitda || 0) 
    : (currentData.revenue || 0);
  
  const multiple_low = isPrimaryEBITDA
    ? (multiples.p25_ebitda_multiple || multiples.unadjusted_ebitda_multiple || multiples.ebitda_multiple || 0)
    : (multiples.p25_revenue_multiple || multiples.unadjusted_revenue_multiple || multiples.revenue_multiple || 0);
  
  const multiple_mid = isPrimaryEBITDA
    ? (multiples.unadjusted_ebitda_multiple || multiples.ebitda_multiple || 0)
    : (multiples.unadjusted_revenue_multiple || multiples.revenue_multiple || 0);
  
  const multiple_high = isPrimaryEBITDA
    ? (multiples.p75_ebitda_multiple || multiples.unadjusted_ebitda_multiple || multiples.ebitda_multiple || 0)
    : (multiples.p75_revenue_multiple || multiples.unadjusted_revenue_multiple || multiples.revenue_multiple || 0);

  dataExtractionLogger.info('Step 3 data computed from multiples', {
    step: 3,
    dataSource: 'computed',
    fallbackUsed: true,
    metricUsed: isPrimaryEBITDA ? 'EBITDA' : 'Revenue',
    hasMultiples: !!(multiple_mid > 0)
  });
  perfLogger.end({ dataSource: 'computed', hasData: true, fallbackUsed: true });
  return {
    enterprise_value_low: metric_value * multiple_low,
    enterprise_value_mid: metric_value * multiple_mid,
    enterprise_value_high: metric_value * multiple_high,
    metric_used: isPrimaryEBITDA ? 'EBITDA' : 'Revenue',
    metric_value,
    multiple_low,
    multiple_mid,
    multiple_high,
    multiple_p25: multiple_low,
    multiple_p50: multiple_mid,
    multiple_p75: multiple_high,
    percentile_source: multiples.p25_ebitda_multiple || multiples.p25_revenue_multiple ? 'real' : 'estimated',
    primary_method: isPrimaryEBITDA ? 'EV/EBITDA' : 'EV/Revenue',
    auto_corrected: false
  };
}

// ============================================================================
// Step 4: Owner Concentration Adjustment
// ============================================================================

export function getStep4OwnerConcentrationResult(result: ValuationResponse) {
  const perfLogger = createPerformanceLogger('getStep4OwnerConcentrationResult', 'data-extraction');
  dataExtractionLogger.debug('Extracting Step 4 owner concentration result', { step: 4 });
  
  const step = result.transparency?.calculation_steps?.find(
    (s) => s.step === 4 || s.step_number === 4
  );

  if (step?.key_outputs) {
    dataExtractionLogger.info('Step 4 data extracted from transparency', {
      step: 4,
      dataSource: 'transparency',
      hasAdjustment: !!step.key_outputs.adjustment_percentage
    });
    perfLogger.end({ dataSource: 'transparency', hasData: true });
    return step.key_outputs;
  }

  // Fallback to legacy owner_concentration field
  const oc = result.multiples_valuation?.owner_concentration;
  if (!oc) {
    dataExtractionLogger.warn('Step 4 data not available, no owner_concentration', {
      step: 4,
      dataSource: 'none',
      fallbackUsed: false
    });
    perfLogger.end({ dataSource: 'none', hasData: false });
    return null;
  }

  dataExtractionLogger.info('Step 4 data extracted from legacy owner_concentration', {
    step: 4,
    dataSource: 'legacy',
    fallbackUsed: true,
    riskLevel: oc.risk_level,
    hasAdjustment: !!(oc as any).adjustment_percentage || oc.adjustment_factor !== 0
  });
  perfLogger.end({ dataSource: 'legacy', hasData: true, fallbackUsed: true });
  const ocAny = oc as any;
  return {
    enterprise_value_low: ocAny.adjusted_ev_low || 0,
    enterprise_value_mid: ocAny.adjusted_ev || 0,
    enterprise_value_high: ocAny.adjusted_ev_high || 0,
    owner_employee_ratio: oc.ratio || ocAny.owner_employee_ratio || 0,
    risk_level: oc.risk_level || 'LOW',
    adjustment_percentage: ocAny.adjustment_percentage || (oc.adjustment_factor - 1) * 100 || 0,
    number_of_owners: oc.number_of_owners || 0,
    number_of_employees: oc.number_of_employees || 0,
    calibration_type: ocAny.business_type_calibration ? 'industry-specific' : (oc.calibration?.calibration_type || 'standard'),
    business_type_id: oc.calibration?.business_type_id || ocAny.business_type_id || null,
    ev_low_before: ocAny.unadjusted_ev_low || 0,
    ev_mid_before: ocAny.unadjusted_ev || 0,
    ev_high_before: ocAny.unadjusted_ev_high || 0,
    skipped: false
  };
}

// ============================================================================
// Step 5: Size Discount
// ============================================================================

export function getStep5SizeDiscountResult(result: ValuationResponse) {
  const perfLogger = createPerformanceLogger('getStep5SizeDiscountResult', 'data-extraction');
  dataExtractionLogger.debug('Extracting Step 5 size discount result', { step: 5 });
  
  const step = result.transparency?.calculation_steps?.find(
    (s) => s.step === 5 || s.step_number === 5
  );

  if (step?.key_outputs) {
    dataExtractionLogger.info('Step 5 data extracted from transparency', {
      step: 5,
      dataSource: 'transparency',
      hasDiscount: !!step.key_outputs.size_discount_percentage
    });
    perfLogger.end({ dataSource: 'transparency', hasData: true });
    return step.key_outputs;
  }

  // Fallback to small_firm_adjustments
  const sfa = result.small_firm_adjustments;
  if (!sfa?.size_discount) {
    dataExtractionLogger.warn('Step 5 data not available, no size_discount', {
      step: 5,
      dataSource: 'none',
      fallbackUsed: false
    });
    perfLogger.end({ dataSource: 'none', hasData: false });
    return null;
  }

  const sd = sfa.size_discount as any;
  dataExtractionLogger.info('Step 5 data extracted from small_firm_adjustments', {
    step: 5,
    dataSource: 'legacy',
    fallbackUsed: true,
    revenueTier: sd?.revenue_tier,
    hasDiscount: !!sd?.size_discount_percentage
  });
  perfLogger.end({ dataSource: 'legacy', hasData: true, fallbackUsed: true });
  return {
    enterprise_value_low: 0, // Cannot compute without before values
    enterprise_value_mid: 0,
    enterprise_value_high: 0,
    revenue_tier: sd?.revenue_tier || 'Unknown',
    base_discount: sd?.base_discount || 0,
    adjustment_multiplier: sd?.business_type_multiplier || 1.0,
    size_discount_percentage: sd?.size_discount_percentage || 0,
    business_category: sd?.business_category || 'UNKNOWN',
    ev_low_before: 0,
    ev_mid_before: 0,
    ev_high_before: 0
  };
}

// ============================================================================
// Step 6: Liquidity Discount
// ============================================================================

export function getStep6LiquidityDiscountResult(result: ValuationResponse) {
  const perfLogger = createPerformanceLogger('getStep6LiquidityDiscountResult', 'data-extraction');
  dataExtractionLogger.debug('Extracting Step 6 liquidity discount result', { step: 6 });
  
  const step = result.transparency?.calculation_steps?.find(
    (s) => s.step === 6 || s.step_number === 6
  );

  if (step?.key_outputs) {
    dataExtractionLogger.info('Step 6 data extracted from transparency', {
      step: 6,
      dataSource: 'transparency',
      hasDiscount: !!step.key_outputs.total_discount_percentage
    });
    perfLogger.end({ dataSource: 'transparency', hasData: true });
    return step.key_outputs;
  }

  // Fallback to small_firm_adjustments
  const sfa = result.small_firm_adjustments;
  if (!sfa?.liquidity_discount) {
    dataExtractionLogger.warn('Step 6 data not available, no liquidity_discount', {
      step: 6,
      dataSource: 'none',
      fallbackUsed: false
    });
    perfLogger.end({ dataSource: 'none', hasData: false });
    return null;
  }

  const ld = sfa.liquidity_discount as any;
  dataExtractionLogger.info('Step 6 data extracted from small_firm_adjustments', {
    step: 6,
    dataSource: 'legacy',
    fallbackUsed: true,
    hasDiscount: !!ld?.liquidity_discount_percentage
  });
  perfLogger.end({ dataSource: 'legacy', hasData: true, fallbackUsed: true });
  return {
    enterprise_value_low: 0,
    enterprise_value_mid: 0,
    enterprise_value_high: 0,
    base_discount: ld?.base_discount || 0,
    margin_bonus: ld?.adjustments?.margin || 0,
    growth_bonus: ld?.adjustments?.growth || 0,
    recurring_revenue_bonus: ld?.adjustments?.recurring_revenue || 0,
    size_bonus: ld?.adjustments?.size || 0,
    total_discount_percentage: ld?.liquidity_discount_percentage || 0,
    business_category: ld?.business_category || 'UNKNOWN',
    base_step: 5,
    ev_low_before: 0,
    ev_mid_before: 0,
    ev_high_before: 0
  };
}

// ============================================================================
// Step 7: EV to Equity Conversion
// ============================================================================

export function getStep7EVToEquityResult(result: ValuationResponse) {
  const perfLogger = createPerformanceLogger('getStep7EVToEquityResult', 'data-extraction');
  dataExtractionLogger.debug('Extracting Step 7 EV to equity result', { step: 7 });
  
  const step = result.transparency?.calculation_steps?.find(
    (s) => s.step === 7 || s.step_number === 7
  );

  if (step?.key_outputs) {
    dataExtractionLogger.info('Step 7 data extracted from transparency', {
      step: 7,
      dataSource: 'transparency',
      hasEquityValues: !!(step.key_outputs.equity_value_mid)
    });
    perfLogger.end({ dataSource: 'transparency', hasData: true });
    return step.key_outputs;
  }

  // Fallback to multiples_valuation
  const multiples = result.multiples_valuation;
  const currentData = result.current_year_data;
  
  if (!multiples) {
    dataExtractionLogger.warn('Step 7 data not available, no multiples_valuation', {
      step: 7,
      dataSource: 'none',
      fallbackUsed: false
    });
    perfLogger.end({ dataSource: 'none', hasData: false });
    return null;
  }

  const total_debt = currentData?.total_debt || 0;
  const cash = currentData?.cash || 0;
  const net_debt = total_debt - cash;

  dataExtractionLogger.info('Step 7 data computed from multiples and current data', {
    step: 7,
    dataSource: 'computed',
    fallbackUsed: true,
    hasEquityValues: !!(result.equity_value_mid),
    hasNetDebt: net_debt !== 0
  });
  perfLogger.end({ dataSource: 'computed', hasData: true, fallbackUsed: true });
  return {
    equity_value_low: result.equity_value_low,
    equity_value_mid: result.equity_value_mid,
    equity_value_high: result.equity_value_high,
    total_debt,
    cash,
    operating_cash: 0,
    excess_cash: cash,
    net_debt,
    balance_sheet_available: !!currentData,
    ev_source_step: 6,
    exemption_applied: false,
    range_validated: true,
    ev_low: (multiples as any).enterprise_value_low || multiples.enterprise_value || 0,
    ev_mid: multiples.enterprise_value || 0,
    ev_high: (multiples as any).enterprise_value_high || multiples.enterprise_value || 0
  };
}

// ============================================================================
// Step 8: Ownership Adjustment
// ============================================================================

export function getStep8OwnershipAdjustmentResult(result: ValuationResponse) {
  const perfLogger = createPerformanceLogger('getStep8OwnershipAdjustmentResult', 'data-extraction');
  dataExtractionLogger.debug('Extracting Step 8 ownership adjustment result', { step: 8 });
  
  const step = result.transparency?.calculation_steps?.find(
    (s) => s.step === 8 || s.step_number === 8
  );

  if (step?.key_outputs) {
    dataExtractionLogger.info('Step 8 data extracted from transparency', {
      step: 8,
      dataSource: 'transparency',
      hasAdjustment: !!step.key_outputs.adjustment_percentage
    });
    perfLogger.end({ dataSource: 'transparency', hasData: true });
    return step.key_outputs;
  }

  // Fallback: check for ownership_adjustments
  const oa = (result.multiples_valuation as any)?.ownership_adjustments;
  
  if (!oa || oa.shares_for_sale_percentage === 100) {
    dataExtractionLogger.info('Step 8 skipped (100% ownership sale)', {
      step: 8,
      dataSource: 'computed',
      skipped: true,
      ownershipPercentage: 100
    });
    perfLogger.end({ dataSource: 'computed', hasData: true, skipped: true });
    return {
      equity_value_low: result.equity_value_low,
      equity_value_mid: result.equity_value_mid,
      equity_value_high: result.equity_value_high,
      ownership_percentage: 100,
      adjustment_type: 'none',
      adjustment_percentage: 0,
      equity_low_before: result.equity_value_low,
      equity_mid_before: result.equity_value_mid,
      equity_high_before: result.equity_value_high,
      skipped: true
    };
  }

  dataExtractionLogger.info('Step 8 data extracted from ownership_adjustments', {
    step: 8,
    dataSource: 'legacy',
    fallbackUsed: true,
    ownershipPercentage: oa.shares_for_sale_percentage,
    adjustmentType: oa.adjustment_type
  });
  perfLogger.end({ dataSource: 'legacy', hasData: true, fallbackUsed: true });
  return {
    equity_value_low: oa.adjusted_equity_low || result.equity_value_low,
    equity_value_mid: oa.adjusted_equity || result.equity_value_mid,
    equity_value_high: oa.adjusted_equity_high || result.equity_value_high,
    ownership_percentage: oa.shares_for_sale_percentage || 100,
    adjustment_type: oa.adjustment_type || 'none',
    adjustment_percentage: oa.adjustment_percentage || 0,
    equity_low_before: oa.equity_before_adjustment_low || result.equity_value_low,
    equity_mid_before: oa.equity_before_adjustment || result.equity_value_mid,
    equity_high_before: oa.equity_before_adjustment_high || result.equity_value_high,
    skipped: false
  };
}

// ============================================================================
// Step 9: Confidence Score
// ============================================================================

export function getStep9ConfidenceScoreResult(result: ValuationResponse) {
  const perfLogger = createPerformanceLogger('getStep9ConfidenceScoreResult', 'data-extraction');
  dataExtractionLogger.debug('Extracting Step 9 confidence score result', { step: 9 });
  
  const step = result.transparency?.calculation_steps?.find(
    (s) => s.step === 9 || s.step_number === 9
  );

  if (step?.key_outputs) {
    dataExtractionLogger.info('Step 9 data extracted from transparency', {
      step: 9,
      dataSource: 'transparency',
      hasConfidenceScore: !!step.key_outputs.overall_confidence_score
    });
    perfLogger.end({ dataSource: 'transparency', hasData: true });
    return step.key_outputs;
  }

  // Fallback to transparency.confidence_breakdown
  const cb = result.transparency?.confidence_breakdown;
  
  if (!cb) {
    dataExtractionLogger.warn('Step 9 data not available, no confidence_breakdown', {
      step: 9,
      dataSource: 'computed',
      fallbackUsed: true,
      usingTopLevelScore: !!result.confidence_score
    });
    perfLogger.end({ dataSource: 'computed', hasData: false, fallbackUsed: true });
    return {
      overall_confidence_score: result.confidence_score || 0,
      confidence_level: result.overall_confidence || 'MEDIUM',
      factor_scores: {
        data_quality: 0,
        historical_data: 0,
        methodology_agreement: 0,
        industry_benchmarks: 0,
        company_profile: 0,
        market_conditions: 0,
        geographic_data: 0,
        business_model_clarity: 0
      }
    };
  }

  dataExtractionLogger.info('Step 9 data extracted from confidence_breakdown', {
    step: 9,
    dataSource: 'legacy',
    fallbackUsed: true,
    hasOverallScore: !!cb.overall_score,
    hasFactorScores: Object.keys(cb).length > 0
  });
  perfLogger.end({ dataSource: 'legacy', hasData: true, fallbackUsed: true });
  return {
    overall_confidence_score: cb.overall_score || result.confidence_score || 0,
    confidence_level: result.overall_confidence || 'MEDIUM',
    factor_scores: {
      data_quality: cb.data_quality || 0,
      historical_data: cb.historical_data || 0,
      methodology_agreement: cb.methodology_agreement || 0,
      industry_benchmarks: cb.industry_benchmarks || 0,
      company_profile: cb.company_profile || 0,
      market_conditions: cb.market_conditions || 0,
      geographic_data: cb.geographic_data || 0,
      business_model_clarity: cb.business_model_clarity || 0
    }
  };
}

// ============================================================================
// Step 10: Range Methodology
// ============================================================================

export function getStep10RangeMethodologyResult(result: ValuationResponse) {
  const perfLogger = createPerformanceLogger('getStep10RangeMethodologyResult', 'data-extraction');
  dataExtractionLogger.debug('Extracting Step 10 range methodology result', { step: 10 });
  
  const step = result.transparency?.calculation_steps?.find(
    (s) => s.step === 10 || s.step_number === 10
  );

  if (step?.key_outputs) {
    dataExtractionLogger.info('Step 10 data extracted from transparency', {
      step: 10,
      dataSource: 'transparency',
      hasMethodology: !!step.key_outputs.methodology
    });
    perfLogger.end({ dataSource: 'transparency', hasData: true });
    return step.key_outputs;
  }

  // Fallback to transparency.range_methodology
  const rm = result.transparency?.range_methodology;
  
  if (!rm) {
    dataExtractionLogger.warn('Step 10 data not available, no range_methodology', {
      step: 10,
      dataSource: 'computed',
      fallbackUsed: true,
      usingTopLevelValues: true
    });
    perfLogger.end({ dataSource: 'computed', hasData: false, fallbackUsed: true });
    return {
      valuation_low: result.equity_value_low,
      valuation_mid: result.equity_value_mid,
      valuation_high: result.equity_value_high,
      methodology: result.range_methodology || 'Unknown',
      confidence_level: result.overall_confidence || 'MEDIUM',
      base_spread: 0.18,
      total_spread: 0.18,
      step7_equity_value_mid: result.equity_value_mid,
      value_preservation_validated: true
    };
  }

  dataExtractionLogger.info('Step 10 data extracted from range_methodology', {
    step: 10,
    dataSource: 'legacy',
    fallbackUsed: true,
    methodology: result.range_methodology,
    hasAsymmetricAdjustment: !!rm.asymmetric_adjustment
  });
  perfLogger.end({ dataSource: 'legacy', hasData: true, fallbackUsed: true });
  return {
    valuation_low: rm.low_value || result.equity_value_low,
    valuation_mid: rm.mid_point || result.equity_value_mid,
    valuation_high: rm.high_value || result.equity_value_high,
    methodology: result.range_methodology || 'Unknown',
    confidence_level: rm.confidence_level || result.overall_confidence || 'MEDIUM',
    base_spread: rm.base_spread || 0.18,
    asymmetric_adjustment: rm.asymmetric_adjustment || false,
    downside_factor: rm.downside_factor || 1.0,
    upside_factor: rm.upside_factor || 1.0,
    total_spread: rm.base_spread || 0.18,
    step7_equity_value_mid: rm.mid_point || result.equity_value_mid,
    value_preservation_validated: true
  };
}

// ============================================================================
// Step 11: Final Valuation Synthesis
// ============================================================================

export function getStep11FinalValuationResult(result: ValuationResponse) {
  const perfLogger = createPerformanceLogger('getStep11FinalValuationResult', 'data-extraction');
  dataExtractionLogger.debug('Extracting Step 11 final valuation result', { step: 11 });
  
  const step = result.transparency?.calculation_steps?.find(
    (s) => s.step === 11 || s.step_number === 11
  );

  if (step?.key_outputs) {
    dataExtractionLogger.info('Step 11 data extracted from transparency', {
      step: 11,
      dataSource: 'transparency',
      hasValuationRange: !!(step.key_outputs.valuation_mid)
    });
    perfLogger.end({ dataSource: 'transparency', hasData: true });
    return step.key_outputs;
  }

  // Use top-level fields
  dataExtractionLogger.info('Step 11 data extracted from top-level fields', {
    step: 11,
    dataSource: 'computed',
    fallbackUsed: true,
    hasValuationRange: !!(result.equity_value_mid),
    hasAcademicSources: !!(result.transparency?.academic_sources?.length)
  });
  perfLogger.end({ dataSource: 'computed', hasData: true, fallbackUsed: true });
  return {
    valuation_low: result.equity_value_low,
    valuation_mid: result.equity_value_mid,
    valuation_high: result.equity_value_high,
    confidence_score: result.confidence_score,
    methodology_statement: result.methodology_notes || result.valuation_summary,
    academic_sources: result.transparency?.academic_sources || [],
    professional_review_ready: result.transparency?.professional_review_ready || null,
    value_chain_validated: true
  };
}

// ============================================================================
// Generic Step Result Extractor
// ============================================================================

/**
 * Get step result data by step number with automatic fallback to mapper
 */
export function getStepResultData(
  result: ValuationResponse,
  stepNumber: number
): any {
  dataExtractionLogger.debug('Getting step result data', { 
    step: stepNumber,
    hasTransparency: !!result.transparency,
    hasModularSystem: !!result.modular_system
  });
  
  try {
    let stepResult: any;
    switch (stepNumber) {
      case 0:
        stepResult = getStep0DataQualityResult(result);
        break;
      case 1:
        stepResult = getStep1InputResult(result);
        break;
      case 2:
        stepResult = getStep2BenchmarkingResult(result);
        break;
      case 3:
        stepResult = getStep3BaseEVResult(result);
        break;
      case 4:
        stepResult = getStep4OwnerConcentrationResult(result);
        break;
      case 5:
        stepResult = getStep5SizeDiscountResult(result);
        break;
      case 6:
        stepResult = getStep6LiquidityDiscountResult(result);
        break;
      case 7:
        stepResult = getStep7EVToEquityResult(result);
        break;
      case 8:
        stepResult = getStep8OwnershipAdjustmentResult(result);
        break;
      case 9:
        stepResult = getStep9ConfidenceScoreResult(result);
        break;
      case 10:
        stepResult = getStep10RangeMethodologyResult(result);
        break;
      case 11:
        stepResult = getStep11FinalValuationResult(result);
        break;
      default:
        dataExtractionLogger.warn('Invalid step number requested', { step: stepNumber });
        return null;
    }
    
    dataExtractionLogger.debug('Step result data retrieved', {
      step: stepNumber,
      hasResult: !!stepResult,
      resultType: typeof stepResult
    });
    
    return stepResult;
  } catch (error) {
    dataExtractionLogger.error('Error extracting step result data', {
      step: stepNumber
    }, error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Get step inputs from transparency data
 */
export function getStepInputs(
  result: ValuationResponse,
  stepNumber: number
): Record<string, any> | null {
  const step = result.transparency?.calculation_steps?.find(
    (s) => s.step === stepNumber || s.step_number === stepNumber
  );
  return step?.inputs || null;
}

/**
 * Get step outputs from transparency data
 */
export function getStepOutputs(
  result: ValuationResponse,
  stepNumber: number
): Record<string, any> | null {
  const step = result.transparency?.calculation_steps?.find(
    (s) => s.step === stepNumber || s.step_number === stepNumber
  );
  return step?.outputs || step?.key_outputs || null;
}

/**
 * Get step formula from transparency data
 */
export function getStepFormula(
  result: ValuationResponse,
  stepNumber: number
): string | null {
  const step = result.transparency?.calculation_steps?.find(
    (s) => s.step === stepNumber || s.step_number === stepNumber
  );
  return step?.formula || null;
}

/**
 * Get step explanation from transparency data
 */
export function getStepExplanation(
  result: ValuationResponse,
  stepNumber: number
): string | null {
  const step = result.transparency?.calculation_steps?.find(
    (s) => s.step === stepNumber || s.step_number === stepNumber
  );
  return step?.explanation || step?.methodology_note || null;
}

/**
 * Format execution time in milliseconds to human-readable format
 */
export function formatExecutionTime(ms: number): string {
  if (ms < 1) {
    return '< 1ms';
  } else if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  } else {
  return `${(ms / 1000).toFixed(2)}s`;
}
}
