#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║   🚀 Starting Upswitch Valuation Tester (React)           ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "✅ Dependencies installed"
echo ""
echo "🔧 Starting development server..."
echo ""
echo "   React App: http://localhost:3001"
echo "   API Engine: http://localhost:8000"
echo ""
echo "⚠️  Make sure the valuation engine is running:"
echo "   cd ../upswitch-valuation-engine"
echo "   source venv/bin/activate"
echo "   uvicorn src.api.main:app --reload"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

npm run dev
