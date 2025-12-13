"use strict";exports.id=887,exports.ids=[887],exports.modules={12887:(e,t,n)=>{n.d(t,{DownloadService:()=>i});var r=n(60659),a=n(41092);n(33741);class o{static extractCSS(e){let t;let n=/<style(?:\s+[^>]*)?>([\s\S]*?)<\/style>/gi,r="",a=e;for(;null!==(t=n.exec(e));)r+=t[1]+"\n",a=a.replace(t[0],"");return{css:r.trim(),html:a}}static sanitize(e){let t;if(!e||"string"!=typeof e)return"";let n="",r=e,o=!1;try{let t=this.extractCSS(e);n=t.css,r=t.html,o=n.length>0}catch(t){r=e,o=!1}try{t=a.default.sanitize(r,{ALLOWED_TAGS:["h1","h2","h3","h4","h5","h6","p","div","span","strong","em","b","i","u","ul","ol","li","br","hr","table","thead","tbody","tr","th","td","a","img","blockquote","pre","code","section","article","header","footer","style"],ALLOWED_ATTR:["class","id","style","href","src","alt","title","colspan","rowspan","align","valign","type","media"],ALLOW_DATA_ATTR:!0,ALLOW_UNKNOWN_PROTOCOLS:!1,FORCE_BODY:!0,KEEP_CONTENT:!0})}catch(e){return""}return"string"!=typeof t?"":o&&n.length>0&&!(t.includes("<style>")||t.includes("<style "))?`<style>${n}</style>${t}`:t}static process(e){if(!e)return"";let t=this.sanitize(e);return this.processLinks(t)}static processLinks(e){return e.replace(/<a\s+href=/g,'<a target="_blank" rel="noopener noreferrer" href=')}static extractSections(e){if(!e||"string"!=typeof e)return[];try{let t=new DOMParser().parseFromString(e,"text/html").querySelectorAll("h2, h3, h4");return Array.from(t).map((e,t)=>({id:`section-${t}`,title:e.textContent||"",level:parseInt(e.tagName.charAt(1),10)||2}))}catch(e){return[]}}static isSafe(e){return!e||this.sanitize(e)===e}}class i{static async downloadHTML(e,t={format:"html"}){let n=t.filename||`valuation-report-${Date.now()}.html`,r=new Blob([this.generateStandaloneHTML(e,t)],{type:"text/html"}),a=URL.createObjectURL(r),o=document.createElement("a");o.href=a,o.download=n,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(a)}static async downloadPDF(e,t={format:"pdf"}){try{let r=await n.e(378).then(n.t.bind(n,11378,23)),a=t.filename||`valuation-report-${Date.now()}.pdf`,i=this.generateStandaloneHTML(e,t),l=document.createElement("div");l.innerHTML=o.sanitize(i),l.style.position="absolute",l.style.left="-9999px",document.body.appendChild(l),await r.default().set({margin:[.5,.5,.5,.5],filename:a,image:{type:"jpeg",quality:.98},html2canvas:{scale:2,useCORS:!0,letterRendering:!0},jsPDF:{unit:"in",format:"a4",orientation:"portrait"}}).from(l).save(),document.body.removeChild(l)}catch(n){generalLogger.error("PDF generation failed",{error:n}),await this.downloadHTML(e,{...t,format:"html"})}}static generateStandaloneHTML(e,t){let n=new Date().toLocaleDateString(),r=e.companyName||"Company",a=e.valuationAmount?e.valuationAmount.toLocaleString():"N/A",i=e.method||"DCF Analysis",l=e.confidenceScore?Math.round(100*e.confidenceScore):"N/A";return`
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
        <div class="subtitle">${r} • ${n}</div>
    </div>
    
    <div class="container">
        <div class="summary-grid">
            <div class="summary-card">
                <h3>Valuation Amount</h3>
                <div class="value">$${a}</div>
            </div>
            <div class="summary-card">
                <h3>Method</h3>
                <div class="value">${i}</div>
            </div>
            <div class="summary-card">
                <h3>Confidence</h3>
                <div class="value">${l}%</div>
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
                    <span class="metric-value">${n}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Confidence Score</span>
                    <span class="metric-value">${l}%</span>
                </div>
            </div>
        </div>
        
        ${e.htmlContent?`
        <div class="content-section">
            <h2>Detailed Analysis</h2>
            <div style="margin-top: 1rem;">
                ${o.sanitize(e.htmlContent)}
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
</html>`}static async downloadAccountantViewPDF(e,t){let n=performance.now(),a=`pdf_${Date.now()}_${Math.random().toString(36).substr(2,9)}`;try{generalLogger.info("[DownloadService] PDF download initiated",{downloadId:a,company_name:e.company_name,timestamp:new Date().toISOString(),hasSignal:!!t?.signal,hasProgressCallback:!!t?.onProgress});let o=t?.filename||this.getDefaultFilename(e.company_name,"pdf");generalLogger.debug("[DownloadService] PDF filename determined",{downloadId:a,filename:o,company_name:e.company_name}),t?.onProgress&&(t.onProgress(0),generalLogger.debug("[DownloadService] Progress callback initialized",{downloadId:a,progress:0}));let i=performance.now();generalLogger.debug("[DownloadService] Calling backend API for PDF generation",{downloadId:a,company_name:e.company_name,endpoint:"/api/valuations/pdf/accountant-view"});let l=await r.T.downloadAccountantViewPDF(e,{signal:t?.signal,onProgress:n=>{t?.onProgress&&t.onProgress(n),generalLogger.debug("[DownloadService] PDF download progress",{downloadId:a,progress:n,company_name:e.company_name})}}),s=performance.now()-i;generalLogger.debug("[DownloadService] Backend API call completed",{downloadId:a,company_name:e.company_name,pdfSize:l.size,pdfSizeKB:Math.round(l.size/1024),apiCallDurationMs:Math.round(s),contentType:l.type||"application/pdf"}),t?.onProgress&&(t.onProgress(100),generalLogger.debug("[DownloadService] Progress set to 100%",{downloadId:a}));let c=performance.now();generalLogger.debug("[DownloadService] Initiating browser download",{downloadId:a,filename:o,pdfSize:l.size});let d=URL.createObjectURL(l),m=document.createElement("a");m.href=d,m.download=o,document.body.appendChild(m),m.click(),document.body.removeChild(m),URL.revokeObjectURL(d);let u=performance.now()-c,p=performance.now()-n;generalLogger.info("[DownloadService] PDF download completed successfully",{downloadId:a,filename:o,pdfSize:l.size,pdfSizeKB:Math.round(l.size/1024),downloadDurationMs:Math.round(u),totalDurationMs:Math.round(p),company_name:e.company_name,timestamp:new Date().toISOString()})}catch(o){let t=performance.now()-n,r={downloadId:a,company_name:e.company_name,error:o instanceof Error?o.message:"Unknown error",errorType:o instanceof Error?o.constructor.name:typeof o,durationMs:Math.round(t),timestamp:new Date().toISOString()};if(generalLogger.error("[DownloadService] PDF download failed",r),o instanceof Error&&o.stack&&generalLogger.error("[DownloadService] Error stack trace",{downloadId:a,stack:o.stack}),o instanceof Error)throw Error(`Failed to download PDF: ${o.message}`);throw Error("Failed to download PDF: Unknown error")}}static getDefaultFilename(e,t="html"){let n=new Date().toISOString().split("T")[0],r=e?e.replace(/[^a-zA-Z0-9]/g,"-").toLowerCase():"company";return`${r}-valuation-${n}.${t}`}}},41092:(e,t,n)=>{n.r(t),n.d(t,{default:()=>en});/*! @license DOMPurify 3.3.0 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.3.0/LICENSE */let{entries:r,setPrototypeOf:a,isFrozen:o,getPrototypeOf:i,getOwnPropertyDescriptor:l}=Object,{freeze:s,seal:c,create:d}=Object,{apply:m,construct:u}="undefined"!=typeof Reflect&&Reflect;s||(s=function(e){return e}),c||(c=function(e){return e}),m||(m=function(e,t){for(var n=arguments.length,r=Array(n>2?n-2:0),a=2;a<n;a++)r[a-2]=arguments[a];return e.apply(t,r)}),u||(u=function(e){for(var t=arguments.length,n=Array(t>1?t-1:0),r=1;r<t;r++)n[r-1]=arguments[r];return new e(...n)});let p=x(Array.prototype.forEach),f=x(Array.prototype.lastIndexOf),g=x(Array.prototype.pop),h=x(Array.prototype.push),y=x(Array.prototype.splice),b=x(String.prototype.toLowerCase),T=x(String.prototype.toString),v=x(String.prototype.match),w=x(String.prototype.replace),S=x(String.prototype.indexOf),A=x(String.prototype.trim),E=x(Object.prototype.hasOwnProperty),_=x(RegExp.prototype.test),D=(Z=TypeError,function(){for(var e=arguments.length,t=Array(e),n=0;n<e;n++)t[n]=arguments[n];return u(Z,t)});function x(e){return function(t){t instanceof RegExp&&(t.lastIndex=0);for(var n=arguments.length,r=Array(n>1?n-1:0),a=1;a<n;a++)r[a-1]=arguments[a];return m(e,t,r)}}function N(e,t){let n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:b;a&&a(e,null);let r=t.length;for(;r--;){let a=t[r];if("string"==typeof a){let e=n(a);e!==a&&(o(t)||(t[r]=e),a=e)}e[a]=!0}return e}function L(e){let t=d(null);for(let[n,a]of r(e))E(e,n)&&(Array.isArray(a)?t[n]=function(e){for(let t=0;t<e.length;t++)E(e,t)||(e[t]=null);return e}(a):a&&"object"==typeof a&&a.constructor===Object?t[n]=L(a):t[n]=a);return t}function k(e,t){for(;null!==e;){let n=l(e,t);if(n){if(n.get)return x(n.get);if("function"==typeof n.value)return x(n.value)}e=i(e)}return function(){return null}}let C=s(["a","abbr","acronym","address","area","article","aside","audio","b","bdi","bdo","big","blink","blockquote","body","br","button","canvas","caption","center","cite","code","col","colgroup","content","data","datalist","dd","decorator","del","details","dfn","dialog","dir","div","dl","dt","element","em","fieldset","figcaption","figure","font","footer","form","h1","h2","h3","h4","h5","h6","head","header","hgroup","hr","html","i","img","input","ins","kbd","label","legend","li","main","map","mark","marquee","menu","menuitem","meter","nav","nobr","ol","optgroup","option","output","p","picture","pre","progress","q","rp","rt","ruby","s","samp","search","section","select","shadow","slot","small","source","spacer","span","strike","strong","style","sub","summary","sup","table","tbody","td","template","textarea","tfoot","th","thead","time","tr","track","tt","u","ul","var","video","wbr"]),R=s(["svg","a","altglyph","altglyphdef","altglyphitem","animatecolor","animatemotion","animatetransform","circle","clippath","defs","desc","ellipse","enterkeyhint","exportparts","filter","font","g","glyph","glyphref","hkern","image","inputmode","line","lineargradient","marker","mask","metadata","mpath","part","path","pattern","polygon","polyline","radialgradient","rect","stop","style","switch","symbol","text","textpath","title","tref","tspan","view","vkern"]),O=s(["feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feDistantLight","feDropShadow","feFlood","feFuncA","feFuncB","feFuncG","feFuncR","feGaussianBlur","feImage","feMerge","feMergeNode","feMorphology","feOffset","fePointLight","feSpecularLighting","feSpotLight","feTile","feTurbulence"]),M=s(["animate","color-profile","cursor","discard","font-face","font-face-format","font-face-name","font-face-src","font-face-uri","foreignobject","hatch","hatchpath","mesh","meshgradient","meshpatch","meshrow","missing-glyph","script","set","solidcolor","unknown","use"]),I=s(["math","menclose","merror","mfenced","mfrac","mglyph","mi","mlabeledtr","mmultiscripts","mn","mo","mover","mpadded","mphantom","mroot","mrow","ms","mspace","msqrt","mstyle","msub","msup","msubsup","mtable","mtd","mtext","mtr","munder","munderover","mprescripts"]),P=s(["maction","maligngroup","malignmark","mlongdiv","mscarries","mscarry","msgroup","mstack","msline","msrow","semantics","annotation","annotation-xml","mprescripts","none"]),U=s(["#text"]),z=s(["accept","action","align","alt","autocapitalize","autocomplete","autopictureinpicture","autoplay","background","bgcolor","border","capture","cellpadding","cellspacing","checked","cite","class","clear","color","cols","colspan","controls","controlslist","coords","crossorigin","datetime","decoding","default","dir","disabled","disablepictureinpicture","disableremoteplayback","download","draggable","enctype","enterkeyhint","exportparts","face","for","headers","height","hidden","high","href","hreflang","id","inert","inputmode","integrity","ismap","kind","label","lang","list","loading","loop","low","max","maxlength","media","method","min","minlength","multiple","muted","name","nonce","noshade","novalidate","nowrap","open","optimum","part","pattern","placeholder","playsinline","popover","popovertarget","popovertargetaction","poster","preload","pubdate","radiogroup","readonly","rel","required","rev","reversed","role","rows","rowspan","spellcheck","scope","selected","shape","size","sizes","slot","span","srclang","start","src","srcset","step","style","summary","tabindex","title","translate","type","usemap","valign","value","width","wrap","xmlns","slot"]),F=s(["accent-height","accumulate","additive","alignment-baseline","amplitude","ascent","attributename","attributetype","azimuth","basefrequency","baseline-shift","begin","bias","by","class","clip","clippathunits","clip-path","clip-rule","color","color-interpolation","color-interpolation-filters","color-profile","color-rendering","cx","cy","d","dx","dy","diffuseconstant","direction","display","divisor","dur","edgemode","elevation","end","exponent","fill","fill-opacity","fill-rule","filter","filterunits","flood-color","flood-opacity","font-family","font-size","font-size-adjust","font-stretch","font-style","font-variant","font-weight","fx","fy","g1","g2","glyph-name","glyphref","gradientunits","gradienttransform","height","href","id","image-rendering","in","in2","intercept","k","k1","k2","k3","k4","kerning","keypoints","keysplines","keytimes","lang","lengthadjust","letter-spacing","kernelmatrix","kernelunitlength","lighting-color","local","marker-end","marker-mid","marker-start","markerheight","markerunits","markerwidth","maskcontentunits","maskunits","max","mask","mask-type","media","method","mode","min","name","numoctaves","offset","operator","opacity","order","orient","orientation","origin","overflow","paint-order","path","pathlength","patterncontentunits","patterntransform","patternunits","points","preservealpha","preserveaspectratio","primitiveunits","r","rx","ry","radius","refx","refy","repeatcount","repeatdur","restart","result","rotate","scale","seed","shape-rendering","slope","specularconstant","specularexponent","spreadmethod","startoffset","stddeviation","stitchtiles","stop-color","stop-opacity","stroke-dasharray","stroke-dashoffset","stroke-linecap","stroke-linejoin","stroke-miterlimit","stroke-opacity","stroke","stroke-width","style","surfacescale","systemlanguage","tabindex","tablevalues","targetx","targety","transform","transform-origin","text-anchor","text-decoration","text-rendering","textlength","type","u1","u2","unicode","values","viewbox","visibility","version","vert-adv-y","vert-origin-x","vert-origin-y","width","word-spacing","wrap","writing-mode","xchannelselector","ychannelselector","x","x1","x2","xmlns","y","y1","y2","z","zoomandpan"]),H=s(["accent","accentunder","align","bevelled","close","columnsalign","columnlines","columnspan","denomalign","depth","dir","display","displaystyle","encoding","fence","frame","height","href","id","largeop","length","linethickness","lspace","lquote","mathbackground","mathcolor","mathsize","mathvariant","maxsize","minsize","movablelimits","notation","numalign","open","rowalign","rowlines","rowspacing","rowspan","rspace","rquote","scriptlevel","scriptminsize","scriptsizemultiplier","selection","separator","separators","stretchy","subscriptshift","supscriptshift","symmetric","voffset","width","xmlns"]),W=s(["xlink:href","xml:id","xlink:title","xml:space","xmlns:xlink"]),$=c(/\{\{[\w\W]*|[\w\W]*\}\}/gm),B=c(/<%[\w\W]*|[\w\W]*%>/gm),G=c(/\$\{[\w\W]*/gm),j=c(/^data-[\-\w.\u00B7-\uFFFF]+$/),Y=c(/^aria-[\-\w]+$/),q=c(/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i),V=c(/^(?:\w+script|data):/i),K=c(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g),X=c(/^html$/i);var Z,J=Object.freeze({__proto__:null,ARIA_ATTR:Y,ATTR_WHITESPACE:K,CUSTOM_ELEMENT:c(/^[a-z][.\w]*(-[.\w]+)+$/i),DATA_ATTR:j,DOCTYPE_NAME:X,ERB_EXPR:B,IS_ALLOWED_URI:q,IS_SCRIPT_OR_DATA:V,MUSTACHE_EXPR:$,TMPLIT_EXPR:G});let Q={element:1,text:3,progressingInstruction:7,comment:8,document:9},ee=function(e,t){if("object"!=typeof e||"function"!=typeof e.createPolicy)return null;let n=null,r="data-tt-policy-suffix";t&&t.hasAttribute(r)&&(n=t.getAttribute(r));let a="dompurify"+(n?"#"+n:"");try{return e.createPolicy(a,{createHTML:e=>e,createScriptURL:e=>e})}catch(e){return console.warn("TrustedTypes policy "+a+" could not be created."),null}},et=function(){return{afterSanitizeAttributes:[],afterSanitizeElements:[],afterSanitizeShadowDOM:[],beforeSanitizeAttributes:[],beforeSanitizeElements:[],beforeSanitizeShadowDOM:[],uponSanitizeAttribute:[],uponSanitizeElement:[],uponSanitizeShadowNode:[]}};var en=function e(){let t,n=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"undefined"==typeof window?null:window,a=t=>e(t);if(a.version="3.3.0",a.removed=[],!n||!n.document||n.document.nodeType!==Q.document||!n.Element)return a.isSupported=!1,a;let{document:o}=n,i=o,l=i.currentScript,{DocumentFragment:c,HTMLTemplateElement:m,Node:u,Element:x,NodeFilter:$,NamedNodeMap:B=n.NamedNodeMap||n.MozNamedAttrMap,HTMLFormElement:G,DOMParser:j,trustedTypes:Y}=n,V=x.prototype,K=k(V,"cloneNode"),Z=k(V,"remove"),en=k(V,"nextSibling"),er=k(V,"childNodes"),ea=k(V,"parentNode");if("function"==typeof m){let e=o.createElement("template");e.content&&e.content.ownerDocument&&(o=e.content.ownerDocument)}let eo="",{implementation:ei,createNodeIterator:el,createDocumentFragment:es,getElementsByTagName:ec}=o,{importNode:ed}=i,em=et();a.isSupported="function"==typeof r&&"function"==typeof ea&&ei&&void 0!==ei.createHTMLDocument;let{MUSTACHE_EXPR:eu,ERB_EXPR:ep,TMPLIT_EXPR:ef,DATA_ATTR:eg,ARIA_ATTR:eh,IS_SCRIPT_OR_DATA:ey,ATTR_WHITESPACE:eb,CUSTOM_ELEMENT:eT}=J,{IS_ALLOWED_URI:ev}=J,ew=null,eS=N({},[...C,...R,...O,...I,...U]),eA=null,eE=N({},[...z,...F,...H,...W]),e_=Object.seal(d(null,{tagNameCheck:{writable:!0,configurable:!1,enumerable:!0,value:null},attributeNameCheck:{writable:!0,configurable:!1,enumerable:!0,value:null},allowCustomizedBuiltInElements:{writable:!0,configurable:!1,enumerable:!0,value:!1}})),eD=null,ex=null,eN=Object.seal(d(null,{tagCheck:{writable:!0,configurable:!1,enumerable:!0,value:null},attributeCheck:{writable:!0,configurable:!1,enumerable:!0,value:null}})),eL=!0,ek=!0,eC=!1,eR=!0,eO=!1,eM=!0,eI=!1,eP=!1,eU=!1,ez=!1,eF=!1,eH=!1,eW=!0,e$=!1,eB=!0,eG=!1,ej={},eY=null,eq=N({},["annotation-xml","audio","colgroup","desc","foreignobject","head","iframe","math","mi","mn","mo","ms","mtext","noembed","noframes","noscript","plaintext","script","style","svg","template","thead","title","video","xmp"]),eV=null,eK=N({},["audio","video","img","source","image","track"]),eX=null,eZ=N({},["alt","class","for","id","label","name","pattern","placeholder","role","summary","title","value","style","xmlns"]),eJ="http://www.w3.org/1998/Math/MathML",eQ="http://www.w3.org/2000/svg",e0="http://www.w3.org/1999/xhtml",e1=e0,e2=!1,e3=null,e8=N({},[eJ,eQ,e0],T),e9=N({},["mi","mo","mn","ms","mtext"]),e5=N({},["annotation-xml"]),e4=N({},["title","style","font","a","script"]),e6=null,e7=["application/xhtml+xml","text/html"],te=null,tt=null,tn=o.createElement("form"),tr=function(e){return e instanceof RegExp||e instanceof Function},ta=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};if(!tt||tt!==e){if(e&&"object"==typeof e||(e={}),e=L(e),te="application/xhtml+xml"===(e6=-1===e7.indexOf(e.PARSER_MEDIA_TYPE)?"text/html":e.PARSER_MEDIA_TYPE)?T:b,ew=E(e,"ALLOWED_TAGS")?N({},e.ALLOWED_TAGS,te):eS,eA=E(e,"ALLOWED_ATTR")?N({},e.ALLOWED_ATTR,te):eE,e3=E(e,"ALLOWED_NAMESPACES")?N({},e.ALLOWED_NAMESPACES,T):e8,eX=E(e,"ADD_URI_SAFE_ATTR")?N(L(eZ),e.ADD_URI_SAFE_ATTR,te):eZ,eV=E(e,"ADD_DATA_URI_TAGS")?N(L(eK),e.ADD_DATA_URI_TAGS,te):eK,eY=E(e,"FORBID_CONTENTS")?N({},e.FORBID_CONTENTS,te):eq,eD=E(e,"FORBID_TAGS")?N({},e.FORBID_TAGS,te):L({}),ex=E(e,"FORBID_ATTR")?N({},e.FORBID_ATTR,te):L({}),ej=!!E(e,"USE_PROFILES")&&e.USE_PROFILES,eL=!1!==e.ALLOW_ARIA_ATTR,ek=!1!==e.ALLOW_DATA_ATTR,eC=e.ALLOW_UNKNOWN_PROTOCOLS||!1,eR=!1!==e.ALLOW_SELF_CLOSE_IN_ATTR,eO=e.SAFE_FOR_TEMPLATES||!1,eM=!1!==e.SAFE_FOR_XML,eI=e.WHOLE_DOCUMENT||!1,ez=e.RETURN_DOM||!1,eF=e.RETURN_DOM_FRAGMENT||!1,eH=e.RETURN_TRUSTED_TYPE||!1,eU=e.FORCE_BODY||!1,eW=!1!==e.SANITIZE_DOM,e$=e.SANITIZE_NAMED_PROPS||!1,eB=!1!==e.KEEP_CONTENT,eG=e.IN_PLACE||!1,ev=e.ALLOWED_URI_REGEXP||q,e1=e.NAMESPACE||e0,e9=e.MATHML_TEXT_INTEGRATION_POINTS||e9,e5=e.HTML_INTEGRATION_POINTS||e5,e_=e.CUSTOM_ELEMENT_HANDLING||{},e.CUSTOM_ELEMENT_HANDLING&&tr(e.CUSTOM_ELEMENT_HANDLING.tagNameCheck)&&(e_.tagNameCheck=e.CUSTOM_ELEMENT_HANDLING.tagNameCheck),e.CUSTOM_ELEMENT_HANDLING&&tr(e.CUSTOM_ELEMENT_HANDLING.attributeNameCheck)&&(e_.attributeNameCheck=e.CUSTOM_ELEMENT_HANDLING.attributeNameCheck),e.CUSTOM_ELEMENT_HANDLING&&"boolean"==typeof e.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements&&(e_.allowCustomizedBuiltInElements=e.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements),eO&&(ek=!1),eF&&(ez=!0),ej&&(ew=N({},U),eA=[],!0===ej.html&&(N(ew,C),N(eA,z)),!0===ej.svg&&(N(ew,R),N(eA,F),N(eA,W)),!0===ej.svgFilters&&(N(ew,O),N(eA,F),N(eA,W)),!0===ej.mathMl&&(N(ew,I),N(eA,H),N(eA,W))),e.ADD_TAGS&&("function"==typeof e.ADD_TAGS?eN.tagCheck=e.ADD_TAGS:(ew===eS&&(ew=L(ew)),N(ew,e.ADD_TAGS,te))),e.ADD_ATTR&&("function"==typeof e.ADD_ATTR?eN.attributeCheck=e.ADD_ATTR:(eA===eE&&(eA=L(eA)),N(eA,e.ADD_ATTR,te))),e.ADD_URI_SAFE_ATTR&&N(eX,e.ADD_URI_SAFE_ATTR,te),e.FORBID_CONTENTS&&(eY===eq&&(eY=L(eY)),N(eY,e.FORBID_CONTENTS,te)),eB&&(ew["#text"]=!0),eI&&N(ew,["html","head","body"]),ew.table&&(N(ew,["tbody"]),delete eD.tbody),e.TRUSTED_TYPES_POLICY){if("function"!=typeof e.TRUSTED_TYPES_POLICY.createHTML)throw D('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');if("function"!=typeof e.TRUSTED_TYPES_POLICY.createScriptURL)throw D('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');eo=(t=e.TRUSTED_TYPES_POLICY).createHTML("")}else void 0===t&&(t=ee(Y,l)),null!==t&&"string"==typeof eo&&(eo=t.createHTML(""));s&&s(e),tt=e}},to=N({},[...R,...O,...M]),ti=N({},[...I,...P]),tl=function(e){let t=ea(e);t&&t.tagName||(t={namespaceURI:e1,tagName:"template"});let n=b(e.tagName),r=b(t.tagName);return!!e3[e.namespaceURI]&&(e.namespaceURI===eQ?t.namespaceURI===e0?"svg"===n:t.namespaceURI===eJ?"svg"===n&&("annotation-xml"===r||e9[r]):!!to[n]:e.namespaceURI===eJ?t.namespaceURI===e0?"math"===n:t.namespaceURI===eQ?"math"===n&&e5[r]:!!ti[n]:e.namespaceURI===e0?(t.namespaceURI!==eQ||!!e5[r])&&(t.namespaceURI!==eJ||!!e9[r])&&!ti[n]&&(e4[n]||!to[n]):"application/xhtml+xml"===e6&&!!e3[e.namespaceURI])},ts=function(e){h(a.removed,{element:e});try{ea(e).removeChild(e)}catch(t){Z(e)}},tc=function(e,t){try{h(a.removed,{attribute:t.getAttributeNode(e),from:t})}catch(e){h(a.removed,{attribute:null,from:t})}if(t.removeAttribute(e),"is"===e){if(ez||eF)try{ts(t)}catch(e){}else try{t.setAttribute(e,"")}catch(e){}}},td=function(e){let n=null,r=null;if(eU)e="<remove></remove>"+e;else{let t=v(e,/^[\r\n\t ]+/);r=t&&t[0]}"application/xhtml+xml"===e6&&e1===e0&&(e='<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>'+e+"</body></html>");let a=t?t.createHTML(e):e;if(e1===e0)try{n=new j().parseFromString(a,e6)}catch(e){}if(!n||!n.documentElement){n=ei.createDocument(e1,"template",null);try{n.documentElement.innerHTML=e2?eo:a}catch(e){}}let i=n.body||n.documentElement;return(e&&r&&i.insertBefore(o.createTextNode(r),i.childNodes[0]||null),e1===e0)?ec.call(n,eI?"html":"body")[0]:eI?n.documentElement:i},tm=function(e){return el.call(e.ownerDocument||e,e,$.SHOW_ELEMENT|$.SHOW_COMMENT|$.SHOW_TEXT|$.SHOW_PROCESSING_INSTRUCTION|$.SHOW_CDATA_SECTION,null)},tu=function(e){return e instanceof G&&("string"!=typeof e.nodeName||"string"!=typeof e.textContent||"function"!=typeof e.removeChild||!(e.attributes instanceof B)||"function"!=typeof e.removeAttribute||"function"!=typeof e.setAttribute||"string"!=typeof e.namespaceURI||"function"!=typeof e.insertBefore||"function"!=typeof e.hasChildNodes)},tp=function(e){return"function"==typeof u&&e instanceof u};function tf(e,t,n){p(e,e=>{e.call(a,t,n,tt)})}let tg=function(e){let t=null;if(tf(em.beforeSanitizeElements,e,null),tu(e))return ts(e),!0;let n=te(e.nodeName);if(tf(em.uponSanitizeElement,e,{tagName:n,allowedTags:ew}),eM&&e.hasChildNodes()&&!tp(e.firstElementChild)&&_(/<[/\w!]/g,e.innerHTML)&&_(/<[/\w!]/g,e.textContent)||e.nodeType===Q.progressingInstruction||eM&&e.nodeType===Q.comment&&_(/<[/\w]/g,e.data))return ts(e),!0;if(!(eN.tagCheck instanceof Function&&eN.tagCheck(n))&&(!ew[n]||eD[n])){if(!eD[n]&&ty(n)&&(e_.tagNameCheck instanceof RegExp&&_(e_.tagNameCheck,n)||e_.tagNameCheck instanceof Function&&e_.tagNameCheck(n)))return!1;if(eB&&!eY[n]){let t=ea(e)||e.parentNode,n=er(e)||e.childNodes;if(n&&t){let r=n.length;for(let a=r-1;a>=0;--a){let r=K(n[a],!0);r.__removalCount=(e.__removalCount||0)+1,t.insertBefore(r,en(e))}}}return ts(e),!0}return e instanceof x&&!tl(e)||("noscript"===n||"noembed"===n||"noframes"===n)&&_(/<\/no(script|embed|frames)/i,e.innerHTML)?(ts(e),!0):(eO&&e.nodeType===Q.text&&(t=e.textContent,p([eu,ep,ef],e=>{t=w(t,e," ")}),e.textContent!==t&&(h(a.removed,{element:e.cloneNode()}),e.textContent=t)),tf(em.afterSanitizeElements,e,null),!1)},th=function(e,t,n){if(eW&&("id"===t||"name"===t)&&(n in o||n in tn))return!1;if(ek&&!ex[t]&&_(eg,t));else if(eL&&_(eh,t));else if(eN.attributeCheck instanceof Function&&eN.attributeCheck(t,e));else if(!eA[t]||ex[t]){if(!(ty(e)&&(e_.tagNameCheck instanceof RegExp&&_(e_.tagNameCheck,e)||e_.tagNameCheck instanceof Function&&e_.tagNameCheck(e))&&(e_.attributeNameCheck instanceof RegExp&&_(e_.attributeNameCheck,t)||e_.attributeNameCheck instanceof Function&&e_.attributeNameCheck(t,e))||"is"===t&&e_.allowCustomizedBuiltInElements&&(e_.tagNameCheck instanceof RegExp&&_(e_.tagNameCheck,n)||e_.tagNameCheck instanceof Function&&e_.tagNameCheck(n))))return!1}else if(eX[t]);else if(_(ev,w(n,eb,"")));else if(("src"===t||"xlink:href"===t||"href"===t)&&"script"!==e&&0===S(n,"data:")&&eV[e]);else if(eC&&!_(ey,w(n,eb,"")));else if(n)return!1;return!0},ty=function(e){return"annotation-xml"!==e&&v(e,eT)},tb=function(e){tf(em.beforeSanitizeAttributes,e,null);let{attributes:n}=e;if(!n||tu(e))return;let r={attrName:"",attrValue:"",keepAttr:!0,allowedAttributes:eA,forceKeepAttr:void 0},o=n.length;for(;o--;){let{name:i,namespaceURI:l,value:s}=n[o],c=te(i),d="value"===i?s:A(s);if(r.attrName=c,r.attrValue=d,r.keepAttr=!0,r.forceKeepAttr=void 0,tf(em.uponSanitizeAttribute,e,r),d=r.attrValue,e$&&("id"===c||"name"===c)&&(tc(i,e),d="user-content-"+d),eM&&_(/((--!?|])>)|<\/(style|title|textarea)/i,d)||"attributename"===c&&v(d,"href")){tc(i,e);continue}if(r.forceKeepAttr)continue;if(!r.keepAttr||!eR&&_(/\/>/i,d)){tc(i,e);continue}eO&&p([eu,ep,ef],e=>{d=w(d,e," ")});let m=te(e.nodeName);if(!th(m,c,d)){tc(i,e);continue}if(t&&"object"==typeof Y&&"function"==typeof Y.getAttributeType){if(l);else switch(Y.getAttributeType(m,c)){case"TrustedHTML":d=t.createHTML(d);break;case"TrustedScriptURL":d=t.createScriptURL(d)}}if(d!==s)try{l?e.setAttributeNS(l,i,d):e.setAttribute(i,d),tu(e)?ts(e):g(a.removed)}catch(t){tc(i,e)}}tf(em.afterSanitizeAttributes,e,null)},tT=function e(t){let n=null,r=tm(t);for(tf(em.beforeSanitizeShadowDOM,t,null);n=r.nextNode();)tf(em.uponSanitizeShadowNode,n,null),tg(n),tb(n),n.content instanceof c&&e(n.content);tf(em.afterSanitizeShadowDOM,t,null)};return a.sanitize=function(e){let n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},r=null,o=null,l=null,s=null;if((e2=!e)&&(e="<!-->"),"string"!=typeof e&&!tp(e)){if("function"==typeof e.toString){if("string"!=typeof(e=e.toString()))throw D("dirty is not a string, aborting")}else throw D("toString is not a function")}if(!a.isSupported)return e;if(eP||ta(n),a.removed=[],"string"==typeof e&&(eG=!1),eG){if(e.nodeName){let t=te(e.nodeName);if(!ew[t]||eD[t])throw D("root node is forbidden and cannot be sanitized in-place")}}else if(e instanceof u)(o=(r=td("<!---->")).ownerDocument.importNode(e,!0)).nodeType===Q.element&&"BODY"===o.nodeName?r=o:"HTML"===o.nodeName?r=o:r.appendChild(o);else{if(!ez&&!eO&&!eI&&-1===e.indexOf("<"))return t&&eH?t.createHTML(e):e;if(!(r=td(e)))return ez?null:eH?eo:""}r&&eU&&ts(r.firstChild);let d=tm(eG?e:r);for(;l=d.nextNode();)tg(l),tb(l),l.content instanceof c&&tT(l.content);if(eG)return e;if(ez){if(eF)for(s=es.call(r.ownerDocument);r.firstChild;)s.appendChild(r.firstChild);else s=r;return(eA.shadowroot||eA.shadowrootmode)&&(s=ed.call(i,s,!0)),s}let m=eI?r.outerHTML:r.innerHTML;return eI&&ew["!doctype"]&&r.ownerDocument&&r.ownerDocument.doctype&&r.ownerDocument.doctype.name&&_(X,r.ownerDocument.doctype.name)&&(m="<!DOCTYPE "+r.ownerDocument.doctype.name+">\n"+m),eO&&p([eu,ep,ef],e=>{m=w(m,e," ")}),t&&eH?t.createHTML(m):m},a.setConfig=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};ta(e),eP=!0},a.clearConfig=function(){tt=null,eP=!1},a.isValidAttribute=function(e,t,n){return tt||ta({}),th(te(e),te(t),n)},a.addHook=function(e,t){"function"==typeof t&&h(em[e],t)},a.removeHook=function(e,t){if(void 0!==t){let n=f(em[e],t);return -1===n?void 0:y(em[e],n,1)[0]}return g(em[e])},a.removeHooks=function(e){em[e]=[]},a.removeAllHooks=function(){em=et()},a}()}};