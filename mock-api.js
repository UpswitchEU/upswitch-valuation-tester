const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock conversation flow data
const CONVERSATION_FLOW = [
  {
    step: 0,
    field: "revenue",
    inputType: "number",
    helpText: "Enter your annual revenue in euros",
    validation: { min: 10000, max: 1000000000 },
    aiMessageTemplate: "Hi! I'll help you get a quick business valuation. Let's start with your annual revenue - what was your total revenue last year?"
  },
  {
    step: 1,
    field: "ebitda",
    inputType: "number", 
    helpText: "Enter your EBITDA (earnings before interest, taxes, depreciation, and amortization)",
    validation: { min: 0, max: 500000000 },
    aiMessageTemplate: "Great! Now, what was your EBITDA (earnings before interest, taxes, depreciation, and amortization) last year?"
  },
  {
    step: 2,
    field: "employees",
    inputType: "number",
    helpText: "How many employees does your company have?",
    validation: { min: 1, max: 10000 },
    aiMessageTemplate: "Thanks! How many employees does your company have?"
  },
  {
    step: 3,
    field: "industry",
    inputType: "text",
    helpText: "What industry is your company in?",
    validation: { min: 2, max: 100 },
    aiMessageTemplate: "What industry is your company in? (e.g., Technology, Manufacturing, Services)"
  },
  {
    step: 4,
    field: "growth_rate",
    inputType: "number",
    helpText: "What's your expected annual growth rate?",
    validation: { min: -50, max: 200 },
    aiMessageTemplate: "What's your expected annual growth rate for the next few years? (as a percentage, e.g., 15 for 15%)"
  },
  {
    step: 5,
    field: "country",
    inputType: "text",
    helpText: "What country is your company based in?",
    validation: { min: 2, max: 50 },
    aiMessageTemplate: "Finally, what country is your company based in?"
  }
];

// In-memory session storage
const sessions = {};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Mock Valuation Engine',
    version: '1.0.0',
    environment: 'development',
    timestamp: new Date().toISOString()
  });
});

// Start conversation endpoint
app.post('/api/valuation/conversation/start', (req, res) => {
  const { company_id } = req.body;
  
  if (!company_id) {
    return res.status(400).json({
      error: 'company_id is required'
    });
  }

  // Create session
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessions[sessionId] = {
    company_id,
    step: 0,
    data: {},
    started_at: new Date().toISOString()
  };

  const firstStep = CONVERSATION_FLOW[0];
  
  res.json({
    session_id: sessionId,
    company_info: {
      company_name: "Demo Company",
      industry: "Technology",
      country: "Belgium"
    },
    ai_message: firstStep.aiMessageTemplate,
    step: 0,
    next_field: firstStep.field,
    input_type: firstStep.inputType,
    help_text: firstStep.helpText,
    validation: firstStep.validation
  });
});

// Conversation step endpoint
app.post('/api/valuation/conversation/step', (req, res) => {
  const { session_id, step, field, value } = req.body;
  
  if (!session_id || !sessions[session_id]) {
    return res.status(400).json({
      error: 'Invalid session_id'
    });
  }

  const session = sessions[session_id];
  session.data[field] = value;
  session.step = step + 1;

  // Check if conversation is complete
  if (step >= CONVERSATION_FLOW.length - 1) {
    // Calculate mock valuation
    const revenue = session.data.revenue || 1000000;
    const ebitda = session.data.ebitda || 200000;
    const employees = session.data.employees || 10;
    
    // Simple mock calculation
    const valuation = Math.round(revenue * 2.5 + ebitda * 8);
    const minValuation = Math.round(valuation * 0.8);
    const maxValuation = Math.round(valuation * 1.2);
    
    const valuationResult = {
      valuation_id: `val_${Date.now()}`,
      equity_value: valuation,
      valuation_range: {
        min: minValuation,
        max: maxValuation
      },
      confidence_score: 0.85,
      methodology: "DCF + Market Multiples",
      company_name: "Demo Company",
      revenue: revenue,
      ebitda: ebitda,
      employees: employees,
      industry: session.data.industry || "Technology",
      country: session.data.country || "Belgium"
    };

    return res.json({
      complete: true,
      ai_message: `Perfect! I have all the information I need. Your business valuation is complete.`,
      valuation_result: valuationResult
    });
  }

  // Get next step
  const nextStep = CONVERSATION_FLOW[step + 1];
  
  res.json({
    complete: false,
    ai_message: nextStep.aiMessageTemplate,
    step: step + 1,
    next_field: nextStep.field,
    input_type: nextStep.inputType,
    help_text: nextStep.helpText,
    validation: nextStep.validation
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mock Valuation Engine running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Conversation API: http://localhost:${PORT}/api/valuation/conversation/start`);
});
