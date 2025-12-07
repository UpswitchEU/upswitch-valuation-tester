export interface LoadingStep {
  text: string;
  subtext: string;
}

// Accurate loading steps based on the actual 12-step calculation process
export const GENERATION_STEPS: LoadingStep[] = [
  { 
    text: "Assessing data quality...", 
    subtext: "Evaluating completeness, validity, and consistency across 5 dimensions" 
  },
  { 
    text: "Validating financial metrics...", 
    subtext: "Extracting revenue, EBITDA, and business profile data" 
  },
  { 
    text: "Consulting academic frameworks...", 
    subtext: "Referencing Koller, Damodaran & IVS 2017 standards" 
  },
  { 
    text: "Selecting valuation methodology...", 
    subtext: "Determining DCF vs. Market Multiples eligibility for SMEs" 
  },
  { 
    text: "Benchmarking against comparables...", 
    subtext: "Analyzing industry multiples from real market transactions" 
  },
  { 
    text: "Calibrating SME risk factors...", 
    subtext: "Assessing owner dependency, size discount, and liquidity" 
  },
  { 
    text: "Synthesizing final valuation...", 
    subtext: "Generating Big 4-grade professional report with Belgian compliance" 
  }
];

export const INITIALIZATION_STEPS: LoadingStep[] = [
  {
    text: "Connecting to secure cloud...",
    subtext: "Establishing encrypted connection to Upswitch servers"
  },
  {
    text: "Initializing valuation engine...",
    subtext: "Loading financial modeling tools and market data"
  },
  {
    text: "Preparing workspace...",
    subtext: "Setting up your secure valuation environment"
  }
];
