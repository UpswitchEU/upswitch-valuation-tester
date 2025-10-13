#!/usr/bin/env python3
"""
Simple Mock Conversation API Server
Provides the conversation endpoints that the frontend expects
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional
import uuid
from datetime import datetime

app = FastAPI(title="Mock Valuation Engine", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session storage
sessions: Dict[str, Dict[str, Any]] = {}

# Conversation flow definition
CONVERSATION_FLOW = [
    {
        "step": 0,
        "field": "revenue",
        "input_type": "number",
        "help_text": "Enter your annual revenue in euros",
        "validation": {"min": 10000, "max": 1000000000},
        "ai_message_template": "Hi! I'll help you get a quick business valuation. Let's start with your annual revenue - what was your total revenue last year?"
    },
    {
        "step": 1,
        "field": "ebitda",
        "input_type": "number",
        "help_text": "Enter your EBITDA (earnings before interest, taxes, depreciation, and amortization)",
        "validation": {"min": 0, "max": 500000000},
        "ai_message_template": "Great! Now, what was your EBITDA (earnings before interest, taxes, depreciation, and amortization) last year?"
    },
    {
        "step": 2,
        "field": "employees",
        "input_type": "number",
        "help_text": "How many employees does your company have?",
        "validation": {"min": 1, "max": 10000},
        "ai_message_template": "Thanks! How many employees does your company have?"
    },
    {
        "step": 3,
        "field": "industry",
        "input_type": "text",
        "help_text": "What industry is your company in?",
        "validation": {"min": 2, "max": 100},
        "ai_message_template": "What industry is your company in? (e.g., Technology, Manufacturing, Services)"
    },
    {
        "step": 4,
        "field": "growth_rate",
        "input_type": "number",
        "help_text": "What's your expected annual growth rate?",
        "validation": {"min": -50, "max": 200},
        "ai_message_template": "What's your expected annual growth rate for the next few years? (as a percentage, e.g., 15 for 15%)"
    },
    {
        "step": 5,
        "field": "country",
        "input_type": "text",
        "help_text": "What country is your company based in?",
        "validation": {"min": 2, "max": 50},
        "ai_message_template": "Finally, what country is your company based in?"
    }
]

# Request/Response models
class StartConversationRequest(BaseModel):
    company_id: str

class StartConversationResponse(BaseModel):
    session_id: str
    company_info: Dict[str, Any]
    ai_message: str
    step: int
    next_field: str
    input_type: str
    help_text: str
    validation: Dict[str, int]

class ConversationStepRequest(BaseModel):
    company_id: str
    session_id: str
    step: int
    field: str
    value: float

class ConversationStepResponse(BaseModel):
    complete: bool
    ai_message: str
    step: Optional[int] = None
    next_field: Optional[str] = None
    input_type: Optional[str] = None
    help_text: Optional[str] = None
    validation: Optional[Dict[str, int]] = None
    valuation_result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Mock Valuation Engine",
        "version": "1.0.0",
        "environment": "development",
        "timestamp": datetime.utcnow().isoformat()
    }

# Start conversation endpoint
@app.post("/api/valuation/conversation/start", response_model=StartConversationResponse)
async def start_conversation(request: StartConversationRequest):
    """Start a new conversational valuation session"""
    
    # Create session
    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        "company_id": request.company_id,
        "step": 0,
        "data": {},
        "started_at": datetime.utcnow().isoformat()
    }
    
    # Get first step
    first_step = CONVERSATION_FLOW[0]
    
    return StartConversationResponse(
        session_id=session_id,
        company_info={
            "company_name": "Demo Company",
            "industry": "Technology",
            "country": "Belgium"
        },
        ai_message=first_step["ai_message_template"],
        step=0,
        next_field=first_step["field"],
        input_type=first_step["input_type"],
        help_text=first_step["help_text"],
        validation=first_step["validation"]
    )

# Conversation step endpoint
@app.post("/api/valuation/conversation/step", response_model=ConversationStepResponse)
async def conversation_step(request: ConversationStepRequest):
    """Process a conversation step"""
    
    # Validate session
    if request.session_id not in sessions:
        raise HTTPException(status_code=400, detail="Invalid session_id")
    
    session = sessions[request.session_id]
    session["data"][request.field] = request.value
    session["step"] = request.step + 1
    
    # Check if conversation is complete
    if request.step >= len(CONVERSATION_FLOW) - 1:
        # Generate mock valuation
        revenue = session["data"].get("revenue", 1000000)
        ebitda = session["data"].get("ebitda", revenue * 0.2)
        employees = session["data"].get("employees", 10)
        industry = session["data"].get("industry", "Technology")
        country = session["data"].get("country", "Belgium")
        growth_rate = session["data"].get("growth_rate", 15)
        
        # Simple mock calculation
        valuation = int(revenue * 2.5)
        min_valuation = int(valuation * 0.8)
        max_valuation = int(valuation * 1.2)
        
        valuation_result = {
            "valuation_id": f"val_{int(datetime.utcnow().timestamp())}",
            "equity_value": valuation,
            "valuation_range": {
                "min": min_valuation,
                "max": max_valuation
            },
            "confidence_score": 0.85,
            "methodology": "DCF + Market Multiples",
            "company_name": "Demo Company",
            "revenue": revenue,
            "ebitda": ebitda,
            "employees": employees,
            "industry": industry,
            "country": country,
            "growth_rate": growth_rate
        }
        
        return ConversationStepResponse(
            complete=True,
            ai_message="Perfect! I have all the information I need. Your business valuation is complete.",
            valuation_result=valuation_result
        )
    
    # Get next step
    next_step = CONVERSATION_FLOW[request.step + 1]
    
    return ConversationStepResponse(
        complete=False,
        ai_message=next_step["ai_message_template"],
        step=next_step["step"],
        next_field=next_step["field"],
        input_type=next_step["input_type"],
        help_text=next_step["help_text"],
        validation=next_step["validation"]
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
