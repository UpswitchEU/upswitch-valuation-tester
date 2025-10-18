# OpenAI Fallback - Frontend UX Guide

## 🎯 Overview

When registry searches fail, instead of showing a dead-end error, we offer to search publicly available information using OpenAI. This creates a conversational, non-blocking experience.

---

## 💬 Conversational Flow

### Step 1: Registry Fails
```
User types: "Delhaize"
→ Backend searches registries
→ All sources return 404
→ Backend response:
  {
    "success": false,
    "results": [],
    "fallback_available": true,
    "fallback_type": "openai_public_search"
  }
```

### Step 2: AI Offers Help
```typescript
// EnhancedConversationalChat.tsx

if (!searchResponse.success && searchResponse.fallback_available) {
  const fallbackMessage: ChatMessage = {
    type: 'ai',
    content: `I couldn't find **"${companyName}"** in the official Belgian registry.

**But I can help!** 💡

I can search publicly available information about this company to help estimate your valuation.

**Important:** This won't be official registry data, but it can provide useful estimates.

**Would you like me to:**
• 🔍 Search public sources for "${companyName}"
• 📝 Switch to Manual Input instead?`,
    actions: [
      {
        id: 'search_public',
        label: '🔍 Search Public Sources',
        type: 'primary'
      },
      {
        id: 'manual_input',
        label: '📝 Manual Input',
        type: 'secondary'
      }
    ]
  };
}
```

### Step 3: User Consents
```
User clicks: "🔍 Search Public Sources"
→ Frontend calls: POST /api/registry/search-public
→ Includes user_consented: true
```

### Step 4: AI Searches
```typescript
// Show loading state
addMessage({
  type: 'ai',
  content: '🔍 Searching publicly available information...',
  isLoading: true
});

// Call API
const result = await api.searchPublicSources({
  company_name: companyName,
  country_code: 'BE',
  user_consented: true
});
```

### Step 5: Present Results
```typescript
// Remove loading message
// Show results with transparency

const resultsMessage: ChatMessage = {
  type: 'ai',
  content: `**Found publicly available information:**

📊 **Company:** ${result.company_name}
🏢 **Industry:** ${result.industry}
📍 **Region:** ${result.region}
💰 **Est. Size:** ${result.size_category}
${result.revenue ? `💵 **Est. Revenue:** ~€${result.revenue}` : ''}

⚠️ **Data Source Notice:**
• This is PUBLIC information (not official registry data)
• Data Quality: ${result.data_quality}
• Confidence: ${result.confidence}%

**Next Steps:**
You can review and edit this information before proceeding.

[Review & Edit Data] [Start Over]`,
  actions: [
    {
      id: 'review_data',
      label: '✏️ Review & Edit Data',
      type: 'primary',
      data: result
    },
    {
      id: 'start_over',
      label: '🔄 Start Over',
      type: 'secondary'
    }
  ]
};
```

---

## 🎨 UI Components

### 1. Data Source Badge

```typescript
<DataSourceBadge source={dataSource}>
  {dataSource === 'official_registry' && (
    <Badge variant="success">
      ✓ Official Registry Data
    </Badge>
  )}
  
  {dataSource === 'openai_public_search' && (
    <Badge variant="warning">
      ⚠️ Public Search Results
    </Badge>
  )}
</DataSourceBadge>
```

### 2. Confidence Indicator

```typescript
<FieldWithConfidence>
  <Label>Revenue (2023)</Label>
  <Value>€10,000,000</Value>
  <ConfidenceBar level={result.confidence.revenue} />
  <ConfidenceLabel>
    {result.confidence.revenue}% confidence
    <Tooltip>
      This estimate is based on public reports and market data.
      Please verify and adjust if you have more accurate information.
    </Tooltip>
  </ConfidenceLabel>
</FieldWithConfidence>
```

### 3. Editable Data Review

```typescript
<PublicDataReview data={publicSearchResult}>
  <Alert type="warning">
    ⚠️ Please review this information carefully.
    This data is from public sources and may not be 100% accurate.
    You can edit any field before proceeding.
  </Alert>
  
  <FormFields>
    <EditableField
      name="company_name"
      value={data.company_name}
      confidence={data.confidence.company_name}
      required
    />
    
    <EditableField
      name="industry"
      value={data.industry}
      confidence={data.confidence.industry}
      options={industryOptions}
    />
    
    <EditableField
      name="revenue"
      value={data.revenue}
      confidence={data.confidence.revenue}
      type="currency"
      help="Approximate annual revenue"
    />
    
    <EditableField
      name="employees"
      value={data.employees}
      confidence={data.confidence.employees}
      type="number"
      help="Approximate employee count"
    />
  </FormFields>
  
  <Actions>
    <Button variant="primary" onClick={proceedWithData}>
      ✅ Looks Good - Proceed to Valuation
    </Button>
    <Button variant="secondary" onClick={editMore}>
      ✏️ Edit More Details
    </Button>
    <Button variant="ghost" onClick={switchToManual}>
      📝 Switch to Manual Input
    </Button>
  </Actions>
</PublicDataReview>
```

---

## 🔐 Safety & Transparency

### 1. Always Show Data Source

Every piece of data should have a clear indicator:

```typescript
// In the right panel (preview)
<DataSourceHeader>
  <Icon source={dataSource} />
  {dataSource === 'official_registry' && (
    <>
      <Title>Official Registry Data</Title>
      <Subtitle>Verified from {registryName}</Subtitle>
      <Badge color="green">✓ Verified</Badge>
    </>
  )}
  
  {dataSource === 'openai_public_search' && (
    <>
      <Title>Public Search Results</Title>
      <Subtitle>From publicly available sources</Subtitle>
      <Badge color="yellow">⚠️ Estimated</Badge>
    </>
  )}
</DataSourceHeader>
```

### 2. Confidence Scores Everywhere

```typescript
// Show confidence for each field
{fields.map(field => (
  <Field key={field.name}>
    <Label>{field.label}</Label>
    <Value>{field.value}</Value>
    <ConfidenceIndicator>
      <ProgressBar value={field.confidence} />
      <Text>{field.confidence}%</Text>
      {field.confidence < 50 && (
        <Warning>Low confidence - please verify</Warning>
      )}
    </ConfidenceIndicator>
  </Field>
))}
```

### 3. Valuation Report Disclaimer

When generating a valuation report using public search data:

```typescript
// Add to Results component
{dataSource === 'openai_public_search' && (
  <Alert variant="warning" className="mb-6">
    <AlertTitle>⚠️ Data Source Notice</AlertTitle>
    <AlertDescription>
      This valuation used publicly available information gathered via AI search,
      not official registry data. The input data was:
      
      • Gathered from public sources (news, reports, market data)
      • Reviewed and confirmed by you
      • Data quality: Estimated (not officially verified)
      
      For valuations requiring official documentation, we recommend:
      • Using verified registry data when available
      • Entering certified financial statements manually
      • Consulting with a professional valuator
    </AlertDescription>
  </Alert>
)}
```

---

## 📱 Mobile Considerations

### Compact Chat Messages
```typescript
// On mobile, use condensed format
<MobileMessage>
  <Icon>💡</Icon>
  <Text>
    Registry search failed. Search public sources instead?
  </Text>
  <Actions vertical>
    <Button>🔍 Search</Button>
    <Button>📝 Manual</Button>
  </Actions>
</MobileMessage>
```

### Touch-Friendly Actions
```typescript
// Larger tap targets
<ActionButton
  minHeight="44px"  // iOS recommended
  padding="12px 24px"
  fontSize="16px"
>
  Search Public Sources
</ActionButton>
```

---

## 🎯 Error Handling

### OpenAI Also Fails

```typescript
try {
  const result = await api.searchPublicSources(...);
} catch (error) {
  // Graceful fallback to manual input
  addMessage({
    type: 'ai',
    content: `I couldn't find enough information about "${companyName}" in public sources either.

**No problem!** Let's switch to Manual Input where you can enter the details directly.

This gives you full control over the data and ensures accuracy.

[Switch to Manual Input]`,
    actions: [
      {
        id: 'switch_to_manual',
        label: '📝 Switch to Manual Input',
        type: 'primary',
        navigateTo: '/manual'
      }
    ]
  });
}
```

### Rate Limit Hit

```typescript
if (error.status === 429) {
  addMessage({
    type: 'ai',
    content: `You've reached the hourly limit for public searches (10/hour).

This limit helps us keep the service free and prevents abuse.

**Options:**
• Wait ${error.retry_after} minutes and try again
• Switch to Manual Input (no limits)
• Use official registry data when available

[Switch to Manual Input] [Try Again Later]`
  });
}
```

---

## 📊 Analytics

Track these events:

```typescript
// When fallback is offered
analytics.track('fallback_offered', {
  company_name: companyName,
  registry_tried: ['KBO', 'data.gov.be'],
  fallback_type: 'openai_public_search'
});

// When user accepts
analytics.track('fallback_accepted', {
  company_name: companyName,
  user_consented: true
});

// When user rejects
analytics.track('fallback_rejected', {
  company_name: companyName,
  chose_manual: true
});

// When data is reviewed
analytics.track('fallback_data_reviewed', {
  company_name: companyName,
  confidence: result.average_confidence,
  fields_edited: editedFields.length
});

// When proceeding to valuation
analytics.track('fallback_valuation_started', {
  company_name: companyName,
  data_source: 'openai_public_search',
  confidence: result.average_confidence
});
```

---

## ✅ Implementation Checklist

### Backend API
- [ ] `POST /api/registry/search-public` endpoint ready
- [ ] Returns `fallback_available: true` when registries fail
- [ ] Includes confidence scores
- [ ] Rate limiting implemented

### Frontend Components
- [ ] Update `EnhancedConversationalChat.tsx`:
  - [ ] Detect `fallback_available` flag
  - [ ] Show conversational offer message
  - [ ] Add action buttons (Search / Manual)
- [ ] Create `PublicDataReview.tsx` component
- [ ] Add `DataSourceBadge` component
- [ ] Add `ConfidenceIndicator` component
- [ ] Update `Results.tsx` with disclaimers

### UX Polish
- [ ] Add loading states
- [ ] Error handling for all scenarios
- [ ] Mobile-responsive layouts
- [ ] Accessibility (ARIA labels)
- [ ] Keyboard navigation

### Testing
- [ ] Test with known company (should find data)
- [ ] Test with obscure company (lower confidence)
- [ ] Test with fake company (graceful error)
- [ ] Test rate limiting
- [ ] Test on mobile devices
- [ ] Test with screen readers

---

## 🚀 Go-Live Plan

1. **Deploy Backend First**
   - Set `ENABLE_OPENAI_FALLBACK=false` initially
   - Test endpoints manually
   - Enable for internal testing only

2. **Deploy Frontend**
   - Feature flag: `REACT_APP_ENABLE_OPENAI_FALLBACK`
   - Test thoroughly in staging
   - Monitor error logs

3. **Gradual Rollout**
   - Week 1: 10% of users
   - Week 2: 50% of users
   - Week 3: 100% of users

4. **Monitor**
   - Conversion rates
   - OpenAI costs
   - User feedback
   - Error rates
   - Confidence accuracy

---

## 📞 Support

If users have questions about public search data:

**FAQ Entry:**
```
Q: What is "Public Search Results"?
A: When we can't find your company in official registries,
   we can search publicly available information (news, reports,
   market data) to help estimate your valuation. You'll always
   review and confirm this data before proceeding.

Q: How accurate is public search data?
A: We show confidence scores for each piece of data. Higher
   confidence (80%+) is more reliable. You can edit any field
   if you have more accurate information.

Q: Should I use public search or manual input?
A: Public search is faster and can provide good estimates.
   Manual input gives you full control and is best when you
   have exact financial statements.
```

---

**This is a production-ready UX design! 🎉**

See backend docs: `/apps/upswitch-valuation-engine/docs/architecture/OPENAI_FALLBACK_STRATEGY.md`
