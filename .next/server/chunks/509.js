"use strict";exports.id=509,exports.ids=[509],exports.modules={75509:(e,t,a)=>{a.d(t,{DownloadService:()=>o});var r=a(5044),n=a(81524);class o{static async downloadHTML(e,t={format:"html"}){let a=t.filename||`valuation-report-${Date.now()}.html`,r=new Blob([this.generateStandaloneHTML(e,t)],{type:"text/html"}),n=URL.createObjectURL(r),o=document.createElement("a");o.href=n,o.download=a,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(n)}static async downloadPDF(e,t={format:"pdf"}){try{let r=await a.e(378).then(a.t.bind(a,11378,23)),o=t.filename||`valuation-report-${Date.now()}.pdf`,i=this.generateStandaloneHTML(e,t),s=document.createElement("div");s.innerHTML=n.C.sanitize(i),s.style.position="absolute",s.style.left="-9999px",document.body.appendChild(s),await r.default().set({margin:[.5,.5,.5,.5],filename:o,image:{type:"jpeg",quality:.98},html2canvas:{scale:2,useCORS:!0,letterRendering:!0},jsPDF:{unit:"in",format:"a4",orientation:"portrait"}}).from(s).save(),document.body.removeChild(s)}catch(a){generalLogger.error("PDF generation failed",{error:a}),await this.downloadHTML(e,{...t,format:"html"})}}static generateStandaloneHTML(e,t){let a=new Date().toLocaleDateString(),r=e.companyName||"Company",o=e.valuationAmount?e.valuationAmount.toLocaleString():"N/A",i=e.method||"DCF Analysis",s=e.confidenceScore?Math.round(100*e.confidenceScore):"N/A";return`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Valuation Report - ${r}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
        }
        
        .header {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            color: white;
            padding: 2rem;
            text-align: center;
            margin-bottom: 2rem;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            font-weight: 700;
        }
        
        .header .subtitle {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 2rem;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .summary-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 1.5rem;
            text-align: center;
        }
        
        .summary-card h3 {
            color: #64748b;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.5rem;
        }
        
        .summary-card .value {
            font-size: 2rem;
            font-weight: 700;
            color: #1e293b;
        }
        
        .content-section {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 2rem;
            margin-bottom: 2rem;
        }
        
        .content-section h2 {
            color: #1e293b;
            font-size: 1.5rem;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #3b82f6;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
        }
        
        .metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem;
            background: #f1f5f9;
            border-radius: 6px;
        }
        
        .metric-label {
            color: #64748b;
            font-weight: 500;
        }
        
        .metric-value {
            color: #1e293b;
            font-weight: 600;
        }
        
        .confidence-bar {
            width: 100%;
            height: 8px;
            background: #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 0.5rem;
        }
        
        .confidence-fill {
            height: 100%;
            background: linear-gradient(90deg, #3b82f6, #8b5cf6);
            border-radius: 4px;
            transition: width 0.3s ease;
        }
        
        .footer {
            margin-top: 3rem;
            padding: 2rem;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #64748b;
        }
        
        .branding {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            margin-top: 1rem;
        }
        
        .branding .logo {
            width: 24px;
            height: 24px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            border-radius: 4px;
        }
        
        @media print {
            .header {
                background: #1e293b !important;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            
            .summary-card {
                border: 1px solid #e2e8f0 !important;
            }
            
            .content-section {
                border: 1px solid #e2e8f0 !important;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Valuation Report</h1>
        <div class="subtitle">${r} • ${a}</div>
    </div>
    
    <div class="container">
        <div class="summary-grid">
            <div class="summary-card">
                <h3>Valuation Amount</h3>
                <div class="value">$${o}</div>
            </div>
            <div class="summary-card">
                <h3>Method</h3>
                <div class="value">${i}</div>
            </div>
            <div class="summary-card">
                <h3>Confidence</h3>
                <div class="value">${s}%</div>
            </div>
        </div>
        
        <div class="content-section">
            <h2>Valuation Details</h2>
            <div class="metrics-grid">
                <div class="metric">
                    <span class="metric-label">Company</span>
                    <span class="metric-value">${r}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Method</span>
                    <span class="metric-value">${i}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Date</span>
                    <span class="metric-value">${a}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Confidence Score</span>
                    <span class="metric-value">${s}%</span>
                </div>
            </div>
        </div>
        
        ${e.htmlContent?`
        <div class="content-section">
            <h2>Detailed Analysis</h2>
            <div style="margin-top: 1rem;">
                ${n.C.sanitize(e.htmlContent)}
            </div>
        </div>
        `:""}
    </div>
    
    <div class="footer">
        <p>Generated by Upswitch Valuation Engine</p>
        <div class="branding">
            <div class="logo"></div>
            <span>Upswitch</span>
        </div>
    </div>
</body>
</html>`}static async downloadAccountantViewPDF(e,t){let a=performance.now(),n=`pdf_${Date.now()}_${Math.random().toString(36).substr(2,9)}`;try{generalLogger.info("[DownloadService] PDF download initiated",{downloadId:n,company_name:e.company_name,timestamp:new Date().toISOString(),hasSignal:!!t?.signal,hasProgressCallback:!!t?.onProgress});let o=t?.filename||this.getDefaultFilename(e.company_name,"pdf");generalLogger.debug("[DownloadService] PDF filename determined",{downloadId:n,filename:o,company_name:e.company_name}),t?.onProgress&&(t.onProgress(0),generalLogger.debug("[DownloadService] Progress callback initialized",{downloadId:n,progress:0}));let i=performance.now();generalLogger.debug("[DownloadService] Calling backend API for PDF generation",{downloadId:n,company_name:e.company_name,endpoint:"/api/valuations/pdf/accountant-view"});let s=await r.T.downloadAccountantViewPDF(e,{signal:t?.signal,onProgress:a=>{t?.onProgress&&t.onProgress(a),generalLogger.debug("[DownloadService] PDF download progress",{downloadId:n,progress:a,company_name:e.company_name})}}),l=performance.now()-i;generalLogger.debug("[DownloadService] Backend API call completed",{downloadId:n,company_name:e.company_name,pdfSize:s.size,pdfSizeKB:Math.round(s.size/1024),apiCallDurationMs:Math.round(l),contentType:s.type||"application/pdf"}),t?.onProgress&&(t.onProgress(100),generalLogger.debug("[DownloadService] Progress set to 100%",{downloadId:n}));let d=performance.now();generalLogger.debug("[DownloadService] Initiating browser download",{downloadId:n,filename:o,pdfSize:s.size});let c=URL.createObjectURL(s),m=document.createElement("a");m.href=c,m.download=o,document.body.appendChild(m),m.click(),document.body.removeChild(m),URL.revokeObjectURL(c);let p=performance.now()-d,g=performance.now()-a;generalLogger.info("[DownloadService] PDF download completed successfully",{downloadId:n,filename:o,pdfSize:s.size,pdfSizeKB:Math.round(s.size/1024),downloadDurationMs:Math.round(p),totalDurationMs:Math.round(g),company_name:e.company_name,timestamp:new Date().toISOString()})}catch(o){let t=performance.now()-a,r={downloadId:n,company_name:e.company_name,error:o instanceof Error?o.message:"Unknown error",errorType:o instanceof Error?o.constructor.name:typeof o,durationMs:Math.round(t),timestamp:new Date().toISOString()};if(generalLogger.error("[DownloadService] PDF download failed",r),o instanceof Error&&o.stack&&generalLogger.error("[DownloadService] Error stack trace",{downloadId:n,stack:o.stack}),o instanceof Error)throw Error(`Failed to download PDF: ${o.message}`);throw Error("Failed to download PDF: Unknown error")}}static getDefaultFilename(e,t="html"){let a=new Date().toISOString().split("T")[0],r=e?e.replace(/[^a-zA-Z0-9]/g,"-").toLowerCase():"company";return`${r}-valuation-${a}.${t}`}}},81524:(e,t,a)=>{a.d(t,{C:()=>n});var r=a(41092);a(33741);class n{static extractCSS(e){let t;let a=/<style(?:\s+[^>]*)?>([\s\S]*?)<\/style>/gi,r="",n=e;for(;null!==(t=a.exec(e));)r+=t[1]+"\n",n=n.replace(t[0],"");return{css:r.trim(),html:n}}static sanitize(e){let t;if(!e||"string"!=typeof e)return"";let a="",n=e,o=!1;try{let t=this.extractCSS(e);a=t.css,n=t.html,o=a.length>0}catch(t){n=e,o=!1}try{t=r.default.sanitize(n,{ALLOWED_TAGS:["h1","h2","h3","h4","h5","h6","p","div","span","strong","em","b","i","u","ul","ol","li","br","hr","table","thead","tbody","tr","th","td","a","img","blockquote","pre","code","section","article","header","footer","style"],ALLOWED_ATTR:["class","id","style","href","src","alt","title","colspan","rowspan","align","valign","type","media"],ALLOW_DATA_ATTR:!0,ALLOW_UNKNOWN_PROTOCOLS:!1,FORCE_BODY:!0,KEEP_CONTENT:!0})}catch(e){return""}return"string"!=typeof t?"":o&&a.length>0&&!(t.includes("<style>")||t.includes("<style "))?`<style>${a}</style>${t}`:t}static process(e){if(!e)return"";let t=this.sanitize(e);return this.processLinks(t)}static processLinks(e){return e.replace(/<a\s+href=/g,'<a target="_blank" rel="noopener noreferrer" href=')}static extractSections(e){if(!e||"string"!=typeof e)return[];try{let t=new DOMParser().parseFromString(e,"text/html").querySelectorAll("h2, h3, h4");return Array.from(t).map((e,t)=>({id:`section-${t}`,title:e.textContent||"",level:parseInt(e.tagName.charAt(1),10)||2}))}catch(e){return[]}}static isSafe(e){return!e||this.sanitize(e)===e}}}};