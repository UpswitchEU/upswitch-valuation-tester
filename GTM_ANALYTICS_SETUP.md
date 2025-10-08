# 📊 GTM & GA4 Analytics Setup
## Separate Analytics for Valuation Subdomain

**App**: Upswitch Valuation Tester  
**URL**: https://valuation.upswitch.biz  
**Purpose**: Independent analytics tracking for valuation tool  
**Date**: October 8, 2025

---

## 🎯 **Why Separate Analytics?**

The valuation tool has its own GTM container and GA4 property to:
- ✅ **Track performance independently** from main upswitch.biz
- ✅ **Measure conversion rates** specific to valuations
- ✅ **A/B test** valuation UX without affecting main site
- ✅ **Analyze user behavior** in isolated context
- ✅ **Report separately** to stakeholders

---

## 🚀 **Setup Instructions**

### **Step 1: Create Google Tag Manager Container** ✅

1. **Go to**: https://tagmanager.google.com/
2. **Create Account** (if needed)
   - Account Name: `Upswitch`
   - Container Name: `Valuation Tester`
   - Target platform: `Web`
3. **Container ID**: `GTM-TC23VRTQ` ✅ **CONFIGURED**

---

### **Step 2: Create GA4 Property** ✅

1. **Go to**: https://analytics.google.com/
2. **Admin** → **Create Property**
   - Property name: `Upswitch Valuation Tool`
   - Time zone: `Europe/Brussels`
   - Currency: `Euro (EUR)`
3. **Create Data Stream**
   - Platform: `Web`
   - Website URL: `https://valuation.upswitch.biz`
   - Stream name: `Valuation Subdomain`
4. **Measurement ID**: `G-LEDWYXNJHH` ✅ **CONFIGURED**

---

### **Step 3: Configure GTM** ✅

#### **Add GA4 Tag** ✅ **CONFIGURED**

1. **In GTM** → **Tags** → **New**
2. **Tag Configuration**:
   - Tag Type: `Google-tag` (Google Tag) ✅
   - Measurement ID: `G-LEDWYXNJHH` ✅
3. **Triggering**: `Initialization - All Pages` ✅
4. **Status**: Published and Active ✅

#### **Add Custom Events**

Create tags for these events:

| Event Name | Trigger | Description |
|------------|---------|-------------|
| `valuation_started` | Form started | User begins valuation |
| `valuation_completed` | Form submitted | Valuation calculated |
| `valuation_saved` | Save button clicked | User saves valuation |
| `manual_flow_selected` | Manual tab clicked | User chooses manual entry |
| `registry_flow_selected` | Registry tab clicked | User chooses registry lookup |
| `document_uploaded` | File uploaded | User uploads document |
| `results_viewed` | Results displayed | User views results |
| `pdf_downloaded` | Download clicked | User downloads PDF |

**Example Event Tag**:
```
Tag Type: Google Analytics: GA4 Event
Configuration Tag: [Your GA4 Config Tag]
Event Name: valuation_completed
Event Parameters:
  - valuation_method: {{DLV - Valuation Method}}
  - company_country: {{DLV - Company Country}}
  - valuation_value: {{DLV - Valuation Value}}
```

---

### **Step 4: Update index.html**

Replace `GTM-XXXXXXX` with your actual GTM Container ID:

```html
<!-- In index.html, line 10 -->
})(window,document,'script','dataLayer','GTM-XXXXXXX');

<!-- In index.html, line 38 -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
```

**Current file**: `index.html` (already has placeholder)

---

### **Step 5: Deploy & Test**

1. **Publish GTM Container**
   - GTM → Submit → Publish
   
2. **Test with GTM Preview**
   ```
   1. GTM → Preview
   2. Enter: https://valuation.upswitch.biz
   3. Verify tags fire correctly
   ```

3. **Verify in GA4**
   - GA4 → Reports → Realtime
   - Perform test valuation
   - Check events appear

---

## 📊 **Recommended Events**

### **Page View Events** (Automatic)
- ✅ Tracked by default with GA4 Configuration tag

### **Custom Events to Track**

#### **Valuation Flow Events**
```javascript
// Valuation Started
dataLayer.push({
  event: 'valuation_started',
  valuation_method: 'manual', // or 'registry', 'document'
  timestamp: new Date().toISOString()
});

// Valuation Completed
dataLayer.push({
  event: 'valuation_completed',
  valuation_method: 'manual',
  company_country: 'BE',
  valuation_value: 1976000,
  confidence_score: 85,
  duration_seconds: 120
});

// Valuation Saved
dataLayer.push({
  event: 'valuation_saved',
  valuation_id: 'abc-123',
  valuation_value: 1976000
});
```

#### **User Journey Events**
```javascript
// Method Selection
dataLayer.push({
  event: 'flow_selected',
  flow_type: 'manual' // or 'registry', 'document', 'conversational'
});

// Registry Lookup
dataLayer.push({
  event: 'registry_lookup',
  country: 'BE',
  company_number: '0123456789',
  success: true
});

// Document Upload
dataLayer.push({
  event: 'document_uploaded',
  file_type: 'pdf',
  file_size_mb: 2.5
});
```

#### **Engagement Events**
```javascript
// Results Viewed
dataLayer.push({
  event: 'results_viewed',
  valuation_value: 1976000,
  time_to_view: 125 // seconds
});

// Export/Download
dataLayer.push({
  event: 'export_clicked',
  export_type: 'pdf' // or 'json'
});
```

---

## 🎨 **Integration with React**

### **Use the Analytics Hook**

```typescript
// In your components
import { useAnalytics } from '@/hooks/useAnalytics';

function ValuationForm() {
  const { trackEvent } = useAnalytics();

  const handleSubmit = async () => {
    // Track valuation started
    trackEvent('valuation_started', {
      valuation_method: 'manual'
    });

    // Calculate valuation...
    const result = await calculateValuation();

    // Track valuation completed
    trackEvent('valuation_completed', {
      valuation_method: 'manual',
      valuation_value: result.value,
      confidence_score: result.confidence
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### **Update Analytics Hook**

File: `src/hooks/useAnalytics.ts`

```typescript
export const useAnalytics = () => {
  const trackEvent = useCallback((eventName: string, params?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: eventName,
        ...params,
        timestamp: new Date().toISOString()
      });
      console.log('[Analytics]', eventName, params);
    }
  }, []);

  const trackPageView = useCallback((pagePath: string, pageTitle: string) => {
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'page_view',
        page_path: pagePath,
        page_title: pageTitle
      });
    }
  }, []);

  return { trackEvent, trackPageView };
};
```

---

## 📈 **Key Metrics to Monitor**

### **Conversion Funnel**
1. **Page Views** → Homepage visits
2. **Valuation Started** → Form engagement
3. **Valuation Completed** → Successfully calculated
4. **Valuation Saved** → Data persistence
5. **Export/Share** → User takes action

**Target Conversion Rate**: 60% (Started → Completed)

### **Performance Metrics**
- **Time to First Valuation**: Target < 2 minutes
- **Form Abandonment Rate**: Target < 30%
- **Error Rate**: Target < 5%
- **Average Session Duration**: Track improvement

### **User Behavior**
- **Preferred Method**: Manual vs Registry vs Document
- **Country Distribution**: Which markets use tool most
- **Valuation Value Distribution**: Typical business sizes
- **Return User Rate**: Track engagement

---

## 🎯 **GA4 Reports to Create**

### **1. Valuation Funnel Report**
```
Exploration → Funnel
Steps:
  1. page_view (homepage)
  2. valuation_started
  3. valuation_completed
  4. valuation_saved
```

### **2. Method Performance Report**
```
Exploration → Free Form
Dimension: flow_type
Metrics: 
  - Event count (valuation_completed)
  - Conversion rate
  - Average duration
```

### **3. User Journey Report**
```
Exploration → Path Analysis
Starting point: page_view
Ending point: valuation_saved
```

---

## 🔧 **Environment-Specific Tracking**

### **Development**
```javascript
// Don't send to GA in development
if (import.meta.env.MODE === 'development') {
  console.log('[Analytics - DEV]', eventName, params);
  return;
}
```

### **Staging**
- Use separate GTM container: `GTM-STAGING`
- Use separate GA4 property: `Valuation Tool - Staging`

### **Production**
- Use production GTM container: `GTM-PROD`
- Use production GA4 property: `Valuation Tool`

---

## ✅ **Setup Checklist**

### **GTM Setup**
- [ ] Create GTM account/container
- [ ] Get GTM Container ID
- [ ] Add GA4 Configuration tag
- [ ] Create custom event tags
- [ ] Set up triggers
- [ ] Test in Preview mode
- [ ] Publish container

### **GA4 Setup**
- [ ] Create GA4 property
- [ ] Create data stream
- [ ] Get Measurement ID
- [ ] Configure enhanced measurement
- [ ] Set up custom events
- [ ] Create conversion events
- [ ] Build custom reports

### **Code Implementation**
- [ ] Update `index.html` with GTM ID
- [ ] Implement `dataLayer.push()` events
- [ ] Update analytics hook
- [ ] Add event tracking to components
- [ ] Test events fire correctly

### **Verification**
- [ ] GTM Preview shows tags firing
- [ ] GA4 Realtime shows events
- [ ] Custom events appear in GA4
- [ ] Conversion tracking works
- [ ] Reports populate correctly

---

## 🚨 **Important Notes**

### **GDPR Compliance**
- ⚠️ Add cookie consent banner
- ⚠️ Allow users to opt-out
- ⚠️ Include privacy policy link
- ⚠️ Anonymize IP addresses in GA4

### **Data Privacy**
- ❌ Never send PII (personally identifiable information)
- ❌ Never send actual company names
- ❌ Never send financial details
- ✅ Use anonymized IDs
- ✅ Use aggregate values

### **Performance**
- ✅ GTM loads asynchronously
- ✅ Doesn't block page render
- ✅ Use dataLayer for events
- ✅ Batch events when possible

---

## 📞 **Support & Resources**

### **Documentation**
- **GTM**: https://support.google.com/tagmanager
- **GA4**: https://support.google.com/analytics
- **dataLayer**: https://developers.google.com/tag-manager/devguide

### **Testing Tools**
- **GTM Preview**: Built into GTM
- **GA Debugger**: Chrome extension
- **Tag Assistant**: Chrome extension

---

## 🎉 **Summary**

**What We Added**:
- ✅ GTM container integration
- ✅ GA4 tracking setup
- ✅ Custom event framework
- ✅ Analytics React hook
- ✅ Separate tracking from main site

**Benefits**:
- ✅ Independent performance monitoring
- ✅ Conversion funnel tracking
- ✅ A/B testing capability
- ✅ User behavior insights
- ✅ Data-driven optimization

**Next Steps**:
1. Create GTM container (get ID)
2. Create GA4 property (get measurement ID)
3. Update `index.html` with your GTM ID
4. Configure tags in GTM
5. Test and verify
6. Monitor and optimize

---

**Setup Time**: ~2 hours  
**Status**: Ready to implement  
**Priority**: HIGH (for production launch)

**Last Updated**: October 8, 2025
