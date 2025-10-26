import React from 'react';
import { Code, Copy } from 'lucide-react';
import type { ValuationResponse } from '../types/valuation';

interface HTMLViewProps {
  result: ValuationResponse | null;
}

export const HTMLView: React.FC<HTMLViewProps> = ({ result }) => {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Code className="w-16 h-16 text-zinc-400 mb-4" />
        <p className="text-zinc-500">No valuation data available</p>
      </div>
    );
  }

  // Generate HTML from result
  const htmlContent = generateHTMLReport(result);

  const handleCopyHTML = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy HTML:', err);
    }
  };

  return (
    <div className="h-full flex flex-col bg-zinc-900">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="text-white font-medium">HTML Report</h3>
        <button
          onClick={handleCopyHTML}
          className="px-3 py-1.5 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 flex items-center gap-2 transition-colors"
        >
          <Copy className="w-4 h-4" />
          Copy HTML
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono">
          {htmlContent}
        </pre>
      </div>
    </div>
  );
};

function generateHTMLReport(result: ValuationResponse): string {
  const formatCurrency = (value: number | undefined) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number | undefined) => {
    if (!value) return 'N/A';
    return `${value.toFixed(1)}%`;
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Valuation Report - ${result.company_name || 'Company'}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f8f9fa;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 30px;
      text-align: center;
    }
    .company-name {
      font-size: 2.5em;
      font-weight: 700;
      margin: 0 0 10px 0;
    }
    .company-details {
      font-size: 1.1em;
      opacity: 0.9;
      margin: 0;
    }
    .valuation-range {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      margin-bottom: 30px;
    }
    .range-title {
      font-size: 1.5em;
      font-weight: 600;
      margin-bottom: 20px;
      color: #2d3748;
    }
    .range-values {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }
    .range-item {
      text-align: center;
      padding: 20px;
      border-radius: 8px;
    }
    .range-item.low {
      background: #fed7d7;
      border-left: 4px solid #e53e3e;
    }
    .range-item.mid {
      background: #c6f6d5;
      border-left: 4px solid #38a169;
    }
    .range-item.high {
      background: #bee3f8;
      border-left: 4px solid #3182ce;
    }
    .range-label {
      font-size: 0.9em;
      font-weight: 600;
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .range-value {
      font-size: 1.8em;
      font-weight: 700;
      color: #2d3748;
    }
    .methodology {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      margin-bottom: 30px;
    }
    .methodology-title {
      font-size: 1.5em;
      font-weight: 600;
      margin-bottom: 20px;
      color: #2d3748;
    }
    .method-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .method-item:last-child {
      border-bottom: none;
    }
    .method-name {
      font-weight: 500;
      color: #4a5568;
    }
    .method-value {
      font-weight: 600;
      color: #2d3748;
    }
    .confidence-score {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      margin-bottom: 30px;
    }
    .confidence-title {
      font-size: 1.5em;
      font-weight: 600;
      margin-bottom: 20px;
      color: #2d3748;
    }
    .confidence-value {
      font-size: 2em;
      font-weight: 700;
      color: #38a169;
      text-align: center;
      margin-bottom: 10px;
    }
    .confidence-description {
      text-align: center;
      color: #718096;
      font-size: 0.9em;
    }
    .footer {
      text-align: center;
      color: #718096;
      font-size: 0.9em;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
    @media (max-width: 768px) {
      body {
        padding: 10px;
      }
      .company-name {
        font-size: 2em;
      }
      .range-values {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="company-name">${result.company_name || 'Company'}</h1>
    <p class="company-details">
      Industry • Belgium • Founded N/A
    </p>
  </div>

  <div class="valuation-range">
    <h2 class="range-title">Valuation Range</h2>
    <div class="range-values">
      <div class="range-item low">
        <div class="range-label">Low Estimate</div>
        <div class="range-value">${formatCurrency(result.equity_value_low || 0)}</div>
      </div>
      <div class="range-item mid">
        <div class="range-label">Mid-Point Estimate</div>
        <div class="range-value">${formatCurrency(result.equity_value_mid || 0)}</div>
      </div>
      <div class="range-item high">
        <div class="range-label">High Estimate</div>
        <div class="range-value">${formatCurrency(result.equity_value_high || 0)}</div>
      </div>
    </div>
  </div>

  <div class="methodology">
    <h2 class="methodology-title">Valuation Methodology</h2>
    <div class="method-item">
      <span class="method-name">DCF Weight</span>
      <span class="method-value">${formatPercent((result.dcf_weight || 0) * 100)}</span>
    </div>
    <div class="method-item">
      <span class="method-name">Multiples Weight</span>
      <span class="method-value">${formatPercent((result.multiples_weight || 0) * 100)}</span>
    </div>
    <div class="method-item">
      <span class="method-name">DCF Value</span>
      <span class="method-value">${formatCurrency(result.dcf_valuation?.equity_value)}</span>
    </div>
    <div class="method-item">
      <span class="method-name">Multiples Value</span>
      <span class="method-value">${formatCurrency(result.multiples_valuation?.ev_ebitda_valuation)}</span>
    </div>
  </div>

  <div class="confidence-score">
    <h2 class="confidence-title">Confidence Score</h2>
    <div class="confidence-value">${formatPercent(result.confidence_score)}</div>
    <div class="confidence-description">
      Based on data quality, methodology agreement, and industry benchmarks
    </div>
  </div>

  <div class="footer">
    <p>Generated by UpSwitch Valuation Engine</p>
    <p>Report ID: ${result.valuation_id || 'N/A'} • Generated: ${new Date().toLocaleDateString()}</p>
  </div>
</body>
</html>`;
}
