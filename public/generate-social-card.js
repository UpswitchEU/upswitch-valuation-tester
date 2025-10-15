import fs from 'fs';
import path from 'path';

// Simple HTML to PNG converter using canvas-like approach
// This is a fallback - in production you'd use Puppeteer or similar

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Upswitch Social Card Generator</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        
        body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: #FFFFFF;
            width: 1200px;
            height: 630px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
        }
        
        .card-content {
            text-align: center;
            color: #1F2937;
            z-index: 2;
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            max-width: 1000px;
            padding: 0 60px;
        }
        
        .logo-container {
            display: flex;
            align-items: center;
            gap: 32px;
            margin-bottom: 48px;
        }
        
        .logo-image {
            width: 120px;
            height: 120px;
            object-fit: contain;
            filter: drop-shadow(0 8px 16px rgba(0,0,0,0.08));
        }
        
        .logo-text {
            font-size: 96px;
            font-weight: 800;
            color: #1F2937;
            font-family: 'DM Sans', 'Inter', sans-serif;
            letter-spacing: -0.03em;
            line-height: 0.9;
        }
        
        .tagline {
            font-size: 42px;
            font-weight: 700;
            margin-bottom: 24px;
            color: #374151;
            font-family: 'DM Sans', 'Inter', sans-serif;
            letter-spacing: -0.02em;
            line-height: 1.1;
        }
        
        .description {
            font-size: 28px;
            font-weight: 500;
            color: #6B7280;
            max-width: 900px;
            line-height: 1.3;
            font-family: 'Inter', sans-serif;
            margin-bottom: 32px;
        }
        
        .value-prop {
            font-size: 24px;
            font-weight: 600;
            color: #14B8A6;
            font-family: 'DM Sans', 'Inter', sans-serif;
            letter-spacing: -0.01em;
        }
        
        .background-pattern {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0.03;
            background-image: 
                radial-gradient(circle at 20% 20%, #14B8A6 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, #0F766E 0%, transparent 50%),
                radial-gradient(circle at 50% 50%, #059669 0%, transparent 40%);
        }
        
        .corner-accent {
            position: absolute;
            top: -100px;
            right: -100px;
            width: 300px;
            height: 300px;
            background: linear-gradient(135deg, #14B8A6 0%, #0F766E 100%);
            border-radius: 50%;
            opacity: 0.08;
        }
        
        .corner-accent-2 {
            position: absolute;
            bottom: -80px;
            left: -80px;
            width: 200px;
            height: 200px;
            background: linear-gradient(45deg, #059669 0%, #14B8A6 100%);
            border-radius: 50%;
            opacity: 0.06;
        }
        
        .brand-accent {
            position: absolute;
            top: 60px;
            left: 60px;
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #14B8A6 0%, #0F766E 100%);
            border-radius: 50%;
            opacity: 0.05;
        }
        
        .brand-accent-2 {
            position: absolute;
            bottom: 80px;
            right: 80px;
            width: 60px;
            height: 60px;
            background: linear-gradient(45deg, #059669 0%, #14B8A6 100%);
            border-radius: 50%;
            opacity: 0.04;
        }
        
        .premium-border {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: 4px solid transparent;
            background: linear-gradient(135deg, #14B8A6, #0F766E, #059669) border-box;
            border-radius: 0;
            box-sizing: border-box;
        }
        
        .premium-border::before {
            content: '';
            position: absolute;
            top: 4px;
            left: 4px;
            right: 4px;
            bottom: 4px;
            background: #FFFFFF;
            border-radius: 0;
        }
    </style>
</head>
<body>
    <div class="premium-border"></div>
    <div class="background-pattern"></div>
    <div class="corner-accent"></div>
    <div class="corner-accent-2"></div>
    <div class="brand-accent"></div>
    <div class="brand-accent-2"></div>
    
    <div class="card-content">
        <div class="logo-container">
            <img src="/upswitch_logo.svg" alt="Upswitch Logo" class="logo-image" />
            <div class="logo-text">Upswitch</div>
        </div>
        <div class="tagline">European SME M&A Platform</div>
        <div class="description">Buy, sell, and value businesses across Europe with professional support and secure transactions</div>
        <div class="value-prop">Trusted by 10,000+ European SMEs</div>
    </div>
</body>
</html>`;

// Write the HTML content to a file
fs.writeFileSync('social-card-1200x630.html', htmlContent);

console.log('Social card HTML generated successfully!');
console.log('To generate the PNG, open social-card-1200x630.html in a browser and take a screenshot at 1200x630 resolution.');
console.log('Or use a tool like Puppeteer to automate the screenshot process.');
