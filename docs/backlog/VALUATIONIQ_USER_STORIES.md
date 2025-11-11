# ValuationIQ™ Frontend Implementation - User Stories

**Version**: 1.0  
**Date**: January 2025  
**Status**: Ready for Linear Import  
**Format**: Linear-Compatible User Stories

---

## How to Use This Document

This document contains user stories organized by phase and feature, ready for import into Linear. Each story includes:
- **Title**: Clear, actionable title
- **Description**: Detailed description with context
- **Acceptance Criteria**: Specific, testable criteria
- **Labels**: Phase, Feature, Priority
- **Estimate**: Story points (1-8)
- **Dependencies**: Related stories

**Import Format**: Copy stories into Linear using their import feature or create manually.

---

## Phase 1: Foundation UI (Q1 2026)

### Feature: EBITDA Normalization UI

#### Story 1.1.1: Normalization Overview Component
**Title**: Display EBITDA Normalization Overview in Results

**Description**:
As a user, I want to see a comprehensive overview of EBITDA normalization adjustments so that I understand how my reported EBITDA was adjusted to reflect true operating performance.

**Acceptance Criteria**:
- [ ] Normalization overview component displays reported EBITDA, normalized EBITDA, and total adjustment
- [ ] Component shows adjustment percentage (positive or negative)
- [ ] Visual bridge diagram connects reported → normalized EBITDA
- [ ] Component is integrated into Results.tsx
- [ ] Component is responsive and accessible (WCAG 2.1 AA)
- [ ] Component renders in <100ms

**Labels**: `phase-1`, `ebitda-normalization`, `p0-critical`, `ui-component`

**Estimate**: 5 points

**Dependencies**: Backend normalization API must be available

---

#### Story 1.1.2: Normalization Bridge Visualization
**Title**: Create Visual Bridge Showing Reported → Normalized EBITDA Flow

**Description**:
As a user, I want to see a visual bridge diagram showing how reported EBITDA flows to normalized EBITDA so that I can quickly understand the adjustment impact.

**Acceptance Criteria**:
- [ ] Bridge component displays reported EBITDA at top
- [ ] Shows adjustment amount and percentage in middle (with up/down arrow)
- [ ] Displays normalized EBITDA at bottom
- [ ] Uses color coding (green for positive, red for negative)
- [ ] Includes icons (TrendingUp/TrendingDown)
- [ ] Responsive design works on mobile
- [ ] Accessible with proper ARIA labels

**Labels**: `phase-1`, `ebitda-normalization`, `p0-critical`, `visualization`

**Estimate**: 3 points

**Dependencies**: Story 1.1.1

---

#### Story 1.1.3: Adjustment Breakdown by Category
**Title**: Display All 12 Adjustment Categories with Expandable Details

**Description**:
As a user, I want to see a breakdown of all adjustment categories applied to my EBITDA so that I understand each specific adjustment and its impact.

**Acceptance Criteria**:
- [ ] Component displays list of all 12 adjustment categories
- [ ] Each category shows: name, amount, type (add-back/subtraction), confidence score
- [ ] Categories are expandable to show detailed explanations
- [ ] Visual indicators distinguish add-backs (green) from subtractions (red)
- [ ] Total adjustment is displayed at bottom
- [ ] Component is scrollable for long lists
- [ ] Mobile-responsive design

**Labels**: `phase-1`, `ebitda-normalization`, `p0-critical`, `ui-component`

**Estimate**: 8 points

**Dependencies**: Story 1.1.1

---

#### Story 1.1.4: Market Rate Comparison Display
**Title**: Show Market Rate Comparisons for Adjustments

**Description**:
As a user, I want to see market rate comparisons for adjustments (e.g., owner compensation, rent) so that I understand how market rates were determined.

**Acceptance Criteria**:
- [ ] Component displays market rate comparisons for relevant adjustments
- [ ] Shows: current rate, market rate, difference, data source
- [ ] Includes confidence indicators for market rate accuracy
- [ ] Displays geographic and industry context
- [ ] Expandable sections for detailed market data
- [ ] Professional presentation matching Big 4 quality

**Labels**: `phase-1`, `ebitda-normalization`, `p0-critical`, `ui-component`

**Estimate**: 5 points

**Dependencies**: Story 1.1.3

---

#### Story 1.1.5: Confidence Scores Visualization
**Title**: Display Confidence Scores for Normalization Adjustments

**Description**:
As a user, I want to see confidence scores for normalization adjustments so that I understand the reliability of each adjustment.

**Acceptance Criteria**:
- [ ] Component displays overall normalization confidence score (0-100%)
- [ ] Shows individual confidence scores for each adjustment
- [ ] Uses visual indicators (progress bars, color coding)
- [ ] Includes explanation of confidence factors
- [ ] Displays data quality indicators
- [ ] Accessible with proper ARIA labels

**Labels**: `phase-1`, `ebitda-normalization`, `p0-critical`, `visualization`

**Estimate**: 3 points

**Dependencies**: Story 1.1.3

---

#### Story 1.1.6: Individual Adjustment Category Components
**Title**: Create Components for Each of 12 Adjustment Categories

**Description**:
As a developer, I need individual components for each adjustment category so that we can display detailed information for each type of adjustment.

**Acceptance Criteria**:
- [ ] Components created for all 12 categories:
  - Owner Compensation Adjustment
  - Related Party Rent Adjustment
  - Personal Expense Add-backs
  - Unpaid Family Labor
  - One-Time Expense Add-backs
  - Below-Market Salary Adjustments
  - Above-Market Rent Adjustments
  - Non-Recurring Revenue Adjustments
  - Working Capital Normalization
  - Capital Expenditure Normalization
  - Discretionary Expense Adjustments
  - Tax Optimization Adjustments
- [ ] Each component displays category-specific information
- [ ] Consistent design pattern across all components
- [ ] Reusable and maintainable code

**Labels**: `phase-1`, `ebitda-normalization`, `p0-critical`, `ui-component`

**Estimate**: 13 points (1 point per category + 1 for shared patterns)

**Dependencies**: Story 1.1.3

---

#### Story 1.1.7: Normalization Integration in Info Tab
**Title**: Add Normalization Section to Info Tab

**Description**:
As a user, I want to see normalization details in the Info tab so that I can access detailed normalization information alongside other calculation details.

**Acceptance Criteria**:
- [ ] Normalization section added to Info Tab
- [ ] Displays normalization overview
- [ ] Links to detailed adjustment breakdown
- [ ] Consistent with existing Info Tab design
- [ ] Accessible navigation

**Labels**: `phase-1`, `ebitda-normalization`, `p0-critical`, `integration`

**Estimate**: 2 points

**Dependencies**: Story 1.1.1, Story 1.1.3

---

### Feature: World-Class Report UI

#### Story 1.2.1: World-Class Report Orchestrator Component
**Title**: Create Main Report Component with 6-Section Structure

**Description**:
As a user, I want to view a comprehensive 6-section valuation report so that I have a professional, Big 4-level analysis of my business valuation.

**Acceptance Criteria**:
- [ ] Report component displays 6 sections:
  1. Executive Summary (2-3 pages)
  2. Company and Market Overview (3-5 pages)
  3. Financial Analysis (5-8 pages)
  4. Valuation Methodologies (4-6 pages)
  5. Valuation Conclusion (2-3 pages)
  6. Appendices (variable)
- [ ] Sections are navigable via table of contents
- [ ] Professional design matching Big 4 quality
- [ ] Responsive layout for different screen sizes
- [ ] Print-optimized styling

**Labels**: `phase-1`, `world-class-reports`, `p0-critical`, `ui-component`

**Estimate**: 8 points

**Dependencies**: Backend report generation API

---

#### Story 1.2.2: Report Cover Page Component
**Title**: Create Professional Report Cover Page

**Description**:
As a user, I want to see a professional cover page on my valuation report so that it looks credible and trustworthy.

**Acceptance Criteria**:
- [ ] Cover page displays company name, logo
- [ ] Shows valuation date
- [ ] Displays valuation range prominently
- [ ] Includes "Prepared by Upswitch" branding
- [ ] Confidentiality notice
- [ ] Professional typography and layout
- [ ] Print-ready design

**Labels**: `phase-1`, `world-class-reports`, `p0-critical`, `ui-component`

**Estimate**: 3 points

**Dependencies**: Story 1.2.1

---

#### Story 1.2.3: Executive Summary Section Component
**Title**: Create Executive Summary Section (2-3 pages)

**Description**:
As a user, I want to see an executive summary of my valuation so that I can quickly understand key findings without reading the full report.

**Acceptance Criteria**:
- [ ] Section displays:
  - Business overview (1 paragraph)
  - Financial highlights (1 paragraph)
  - Valuation conclusion (1 paragraph)
  - Key value drivers (3-5 bullet points)
  - Key risk factors (3-5 bullet points)
  - Recommendations (2-3 bullet points)
- [ ] Large, prominent valuation range display
- [ ] Key metrics dashboard
- [ ] Professional presentation
- [ ] 2-3 pages in length

**Labels**: `phase-1`, `world-class-reports`, `p0-critical`, `ui-component`

**Estimate**: 5 points

**Dependencies**: Story 1.2.1

---

#### Story 1.2.4: Company and Market Overview Section
**Title**: Create Company and Market Overview Section (3-5 pages)

**Description**:
As a user, I want to see comprehensive company and market information so that I understand the business context for my valuation.

**Acceptance Criteria**:
- [ ] Section displays:
  - Company description
  - Market position
  - Industry analysis
  - Growth prospects
  - Business strategy
- [ ] Includes visual elements (charts, diagrams)
- [ ] Professional presentation
- [ ] 3-5 pages in length

**Labels**: `phase-1`, `world-class-reports`, `p0-critical`, `ui-component`

**Estimate**: 5 points

**Dependencies**: Story 1.2.1

---

#### Story 1.2.5: Financial Analysis Section
**Title**: Create Financial Analysis Section (5-8 pages)

**Description**:
As a user, I want to see detailed financial analysis including normalization so that I understand the financial basis for my valuation.

**Acceptance Criteria**:
- [ ] Section displays:
  - Historical financial performance (3-5 years)
  - EBITDA normalization (detailed breakdown)
  - Financial health assessment
  - Key financial metrics
  - Financial projections (if available)
- [ ] Includes charts and graphs
- [ ] Normalization bridge visualization
- [ ] Professional presentation
- [ ] 5-8 pages in length

**Labels**: `phase-1`, `world-class-reports`, `p0-critical`, `ui-component`

**Estimate**: 8 points

**Dependencies**: Story 1.2.1, Story 1.1.1

---

#### Story 1.2.6: Valuation Methodologies Section
**Title**: Create Valuation Methodologies Section (4-6 pages)

**Description**:
As a user, I want to see detailed explanation of valuation methodologies used so that I understand how my valuation was calculated.

**Acceptance Criteria**:
- [ ] Section displays:
  - Methodology overview
  - EBITDA Multiples method (detailed)
  - DCF method (if used)
  - Asset-Based method (if used)
  - Comparable transactions (if used)
  - Method synthesis
- [ ] Includes calculation details
- [ ] Professional presentation
- [ ] 4-6 pages in length

**Labels**: `phase-1`, `world-class-reports`, `p0-critical`, `ui-component`

**Estimate**: 5 points

**Dependencies**: Story 1.2.1

---

#### Story 1.2.7: Valuation Conclusion Section
**Title**: Create Valuation Conclusion Section (2-3 pages)

**Description**:
As a user, I want to see a clear valuation conclusion with recommendations so that I know the final valuation and next steps.

**Acceptance Criteria**:
- [ ] Section displays:
  - Final valuation (range and midpoint)
  - Valuation rationale
  - Sensitivity analysis
  - Recommendations
  - Limitations and qualifications
- [ ] Large, prominent valuation display
- [ ] Professional presentation
- [ ] 2-3 pages in length

**Labels**: `phase-1`, `world-class-reports`, `p0-critical`, `ui-component`

**Estimate**: 5 points

**Dependencies**: Story 1.2.1

---

#### Story 1.2.8: Appendices Section
**Title**: Create Appendices Section

**Description**:
As a user, I want to see supporting documentation in appendices so that I have complete information for my valuation.

**Acceptance Criteria**:
- [ ] Section displays:
  - Financial statements (3-5 years)
  - EBITDA normalization details
  - Valuation calculations
  - Market research
  - Comparable transactions
  - Glossary
- [ ] Organized and navigable
- [ ] Professional presentation

**Labels**: `phase-1`, `world-class-reports`, `p0-critical`, `ui-component`

**Estimate**: 5 points

**Dependencies**: Story 1.2.1

---

#### Story 1.2.9: Report Table of Contents Navigation
**Title**: Create Table of Contents with Section Navigation

**Description**:
As a user, I want to navigate between report sections easily so that I can jump to specific parts of the report.

**Acceptance Criteria**:
- [ ] Table of contents displays all 6 sections
- [ ] Clickable navigation to each section
- [ ] Current section highlighted
- [ ] Smooth scroll to sections
- [ ] Sticky navigation (optional)
- [ ] Mobile-responsive

**Labels**: `phase-1`, `world-class-reports`, `p0-critical`, `navigation`

**Estimate**: 3 points

**Dependencies**: Story 1.2.1

---

#### Story 1.2.10: PDF Export Functionality
**Title**: Implement PDF Export for World-Class Reports

**Description**:
As a user, I want to export my valuation report as a PDF so that I can share it with advisors, buyers, or save it for records.

**Acceptance Criteria**:
- [ ] PDF export button in report view
- [ ] Generates PDF with all 6 sections
- [ ] Professional formatting (A4 size, proper margins)
- [ ] Includes cover page
- [ ] Table of contents in PDF
- [ ] Charts and graphs included
- [ ] File naming: `Valuation_Report_[CompanyName]_[Date].pdf`
- [ ] Export completes in <10 seconds

**Labels**: `phase-1`, `world-class-reports`, `p0-critical`, `export`

**Estimate**: 5 points

**Dependencies**: Story 1.2.1

---

#### Story 1.2.11: Replace Progressive Report with World-Class Format
**Title**: Migrate from 5-Phase Preview to 6-Section World-Class Format

**Description**:
As a developer, I need to replace the existing 5-phase progressive preview with the new 6-section world-class format while maintaining real-time streaming.

**Acceptance Criteria**:
- [ ] Maintains real-time SSE streaming
- [ ] Replaces 5-phase preview with 6-section format
- [ ] Backward compatible with existing API
- [ ] No breaking changes to user experience
- [ ] Performance maintained (<8s generation time)

**Labels**: `phase-1`, `world-class-reports`, `p0-critical`, `migration`

**Estimate**: 8 points

**Dependencies**: Story 1.2.1

---

### Feature: Owner Profiling UI Integration

#### Story 1.3.1: Owner Profiling Form Component
**Title**: Create Owner Profiling Form for Dependency Assessment

**Description**:
As a user, I want to provide information about my role in the business so that the valuation can account for owner dependency and transferability risk.

**Acceptance Criteria**:
- [ ] Form collects:
  - Hours worked per week (0-168)
  - Primary tasks (multi-select)
  - Delegation capability (1-10 scale with slider)
  - Succession plan (yes/no checkbox)
  - Succession details (optional textarea)
- [ ] Real-time validation
- [ ] Help text and guidance for each field
- [ ] Visual feedback (dependency indicators)
- [ ] Responsive design
- [ ] Accessible form controls

**Labels**: `phase-1`, `owner-profiling`, `p1-high`, `form`

**Estimate**: 5 points

**Dependencies**: Backend owner profiling API

---

#### Story 1.3.2: Dependency Assessment Visualization
**Title**: Display Owner Dependency Score and Impact

**Description**:
As a user, I want to see how my owner profile affects the valuation so that I understand the impact of owner dependency.

**Acceptance Criteria**:
- [ ] Displays dependency score (0-1 scale)
- [ ] Shows adjustment percentage applied to valuation
- [ ] Visual indicator (low/moderate/high dependency)
- [ ] Explanation of dependency factors
- [ ] Impact on final valuation displayed
- [ ] Professional presentation

**Labels**: `phase-1`, `owner-profiling`, `p1-high`, `visualization`

**Estimate**: 3 points

**Dependencies**: Story 1.3.1

---

#### Story 1.3.3: Transferability Risk Display
**Title**: Show Transferability Risk Assessment

**Description**:
As a user, I want to see transferability risk assessment so that I understand how easily the business can be transferred to a new owner.

**Acceptance Criteria**:
- [ ] Displays transferability risk level (low/moderate/high)
- [ ] Shows risk factors
- [ ] Visual risk indicator
- [ ] Recommendations for risk mitigation
- [ ] Professional presentation

**Labels**: `phase-1`, `owner-profiling`, `p1-high`, `visualization`

**Estimate**: 3 points

**Dependencies**: Story 1.3.1

---

#### Story 1.3.4: Succession Readiness Display
**Title**: Display Succession Readiness Assessment

**Description**:
As a user, I want to see succession readiness assessment so that I understand how prepared the business is for ownership transfer.

**Acceptance Criteria**:
- [ ] Displays succession readiness score
- [ ] Shows readiness factors
- [ ] Visual readiness indicator
- [ ] Recommendations for improvement
- [ ] Professional presentation

**Labels**: `phase-1`, `owner-profiling`, `p1-high`, `visualization`

**Estimate**: 3 points

**Dependencies**: Story 1.3.1

---

#### Story 1.3.5: Owner Profiling Integration in AI-Assisted Flow
**Title**: Add Owner Profiling Step to Conversational Flow

**Description**:
As a user, I want to provide owner profile information during the conversational valuation flow so that it's seamlessly integrated.

**Acceptance Criteria**:
- [ ] Owner profiling step added to AI-assisted flow
- [ ] Natural conversation prompts for profile data
- [ ] Form appears at appropriate point in flow
- [ ] Data saved to session
- [ ] Progress indicator updated
- [ ] Smooth user experience

**Labels**: `phase-1`, `owner-profiling`, `p1-high`, `integration`

**Estimate**: 5 points

**Dependencies**: Story 1.3.1

---

#### Story 1.3.6: Owner Factor Impact in Results
**Title**: Display Owner Factor Adjustments in Results

**Description**:
As a user, I want to see how owner profiling affected my valuation so that I understand the human factor impact.

**Acceptance Criteria**:
- [ ] Owner factor section in Results display
- [ ] Shows dependency score and adjustment
- [ ] Displays transferability risk
- [ ] Shows succession readiness
- [ ] Visual impact indicators
- [ ] Professional presentation

**Labels**: `phase-1`, `owner-profiling`, `p1-high`, `integration`

**Estimate**: 3 points

**Dependencies**: Story 1.3.1, Story 1.3.2

---

## Phase 2: Dynamic AI Conversation UI (Q2 2026)

### Feature: Dynamic Question Generation UI

#### Story 2.1.1: Dynamic Question Component
**Title**: Create Component for Displaying LLM-Generated Questions

**Description**:
As a user, I want to see dynamically generated questions that adapt to my business context so that the conversation feels natural and intelligent.

**Acceptance Criteria**:
- [ ] Component displays LLM-generated question text
- [ ] Shows context indicators (business type, industry)
- [ ] Displays help text and guidance
- [ ] Professional styling matching conversation design
- [ ] Responsive design
- [ ] Accessible with proper ARIA labels

**Labels**: `phase-2`, `dynamic-ai-conversation`, `p0-critical`, `ui-component`

**Estimate**: 5 points

**Dependencies**: Backend LLM API integration

---

#### Story 2.1.2: Natural Language Input Component
**Title**: Create Natural Language Input Field for User Responses

**Description**:
As a user, I want to answer questions in natural language so that I don't have to think about specific formats or numbers.

**Acceptance Criteria**:
- [ ] Text input field for natural language responses
- [ ] Real-time processing of natural language
- [ ] Auto-extraction of structured data
- [ ] Clarification requests if input unclear
- [ ] Visual feedback during processing
- [ ] Error handling for invalid input
- [ ] Accessible form controls

**Labels**: `phase-2`, `dynamic-ai-conversation`, `p0-critical`, `ui-component`

**Estimate**: 8 points

**Dependencies**: Story 2.1.1, Backend NLP processing

---

#### Story 2.1.3: Context-Aware Question Display
**Title**: Display Questions with Business Context Indicators

**Description**:
As a user, I want to see context indicators with questions so that I understand why specific questions are being asked.

**Acceptance Criteria**:
- [ ] Displays business type context
- [ ] Shows industry-specific guidance
- [ ] Indicates data completeness
- [ ] Visual context badges
- [ ] Helpful explanations
- [ ] Professional presentation

**Labels**: `phase-2`, `dynamic-ai-conversation`, `p0-critical`, `ui-component`

**Estimate**: 3 points

**Dependencies**: Story 2.1.1

---

#### Story 2.1.4: Question Help Text and Guidance
**Title**: Display Contextual Help Text for Each Question

**Description**:
As a user, I want to see helpful guidance for each question so that I understand what information is needed and why.

**Acceptance Criteria**:
- [ ] Help text displayed for each question
- [ ] Industry-specific examples
- [ ] Format guidance where needed
- [ ] Expandable help sections
- [ ] Professional presentation
- [ ] Accessible help content

**Labels**: `phase-2`, `dynamic-ai-conversation`, `p0-critical`, `ui-component`

**Estimate**: 3 points

**Dependencies**: Story 2.1.1

---

#### Story 2.1.5: Replace Pre-Scripted Flow with Dynamic Questions
**Title**: Migrate from Pre-Scripted to Dynamic Question Generation

**Description**:
As a developer, I need to replace the pre-scripted 6-question flow with dynamic LLM-generated questions while maintaining user experience.

**Acceptance Criteria**:
- [ ] Removes hardcoded question flow
- [ ] Integrates with LLM question generation API
- [ ] Maintains real-time streaming
- [ ] Backward compatible with existing sessions
- [ ] Performance maintained (<2s question generation)
- [ ] Error handling for LLM failures

**Labels**: `phase-2`, `dynamic-ai-conversation`, `p0-critical`, `migration`

**Estimate**: 8 points

**Dependencies**: Story 2.1.1, Backend LLM infrastructure

---

### Feature: Context-Aware Conversation Interface

#### Story 2.2.1: Conversation Memory Display
**Title**: Show Conversation Context and Collected Data

**Description**:
As a user, I want to see what information has been collected so far so that I understand the conversation progress.

**Acceptance Criteria**:
- [ ] Displays collected data summary
- [ ] Shows progress indicators
- [ ] Context awareness indicators
- [ ] Expandable data view
- [ ] Professional presentation
- [ ] Real-time updates

**Labels**: `phase-2`, `context-aware-conversation`, `p0-critical`, `ui-component`

**Estimate**: 5 points

**Dependencies**: Story 2.1.1

---

#### Story 2.2.2: Answer History Component
**Title**: Display Previous Answers in Conversation

**Description**:
As a user, I want to see my previous answers so that I can reference them and ensure consistency.

**Acceptance Criteria**:
- [ ] Displays previous answers in conversation
- [ ] Organized by question
- [ ] Editable answers (if needed)
- [ ] Visual timeline
- [ ] Professional presentation

**Labels**: `phase-2`, `context-aware-conversation`, `p0-critical`, `ui-component`

**Estimate**: 3 points

**Dependencies**: Story 2.2.1

---

#### Story 2.2.3: Contextual Guidance Component
**Title**: Provide Context-Based Help and Guidance

**Description**:
As a user, I want to receive contextual guidance based on my business type and industry so that I get relevant help.

**Acceptance Criteria**:
- [ ] Displays industry-specific guidance
- [ ] Business type-specific tips
- [ ] Context-aware recommendations
- [ ] Professional presentation
- [ ] Accessible help content

**Labels**: `phase-2`, `context-aware-conversation`, `p0-critical`, `ui-component`

**Estimate**: 3 points

**Dependencies**: Story 2.2.1

---

### Feature: Continuous Learning Feedback UI

#### Story 2.3.1: Question Feedback Component
**Title**: Allow Users to Provide Feedback on Question Quality

**Description**:
As a user, I want to provide feedback on question quality so that the system improves over time.

**Acceptance Criteria**:
- [ ] Thumbs up/down buttons for questions
- [ ] Optional feedback form
- [ ] Feedback submission to backend
- [ ] Visual confirmation
- [ ] Non-intrusive design
- [ ] Accessible controls

**Labels**: `phase-2`, `continuous-learning`, `p1-high`, `ui-component`

**Estimate**: 3 points

**Dependencies**: Backend feedback API

---

#### Story 2.3.2: Learning Metrics Display
**Title**: Show System Learning Progress (Optional Admin View)

**Description**:
As an admin, I want to see learning metrics so that I can monitor system improvement over time.

**Acceptance Criteria**:
- [ ] Displays question relevance scores
- [ ] Shows feedback trends
- [ ] Learning improvement metrics
- [ ] Admin-only view
- [ ] Professional dashboard

**Labels**: `phase-2`, `continuous-learning`, `p2-medium`, `admin`

**Estimate**: 5 points

**Dependencies**: Story 2.3.1

---

## Phase 3: Advanced Features UI (Q3 2026)

### Feature: HBR Framework UI

#### Story 3.1.1: Buyer Questions Interface
**Title**: Create Interface for HBR Buyer Questions Framework

**Description**:
As a buyer, I want to answer HBR buyer questions so that I can systematically evaluate businesses using proven methodology.

**Acceptance Criteria**:
- [ ] Interface displays 5-phase filtering framework
- [ ] Phase 1: Initial filters (profitability, size, location)
- [ ] Phase 2: Enduring profitability
- [ ] Phase 3: Transferability
- [ ] Phase 4: Financial health
- [ ] Phase 5: Deal structure
- [ ] Progress tracking through phases
- [ ] Professional presentation

**Labels**: `phase-3`, `hbr-framework`, `p2-medium`, `ui-component`

**Estimate**: 8 points

**Dependencies**: Backend HBR framework API

---

#### Story 3.1.2: Question Answering Interface
**Title**: Create UI for Answering Buyer Questions

**Description**:
As a buyer, I want to ask questions about businesses and get AI-powered answers so that I can quickly evaluate opportunities.

**Acceptance Criteria**:
- [ ] Question input field
- [ ] Displays AI-generated answers
- [ ] Shows confidence scores
- [ ] Data sources displayed
- [ ] Follow-up questions suggested
- [ ] Professional presentation

**Labels**: `phase-3`, `hbr-framework`, `p2-medium`, `ui-component`

**Estimate**: 5 points

**Dependencies**: Story 3.1.1

---

#### Story 3.1.3: Data Completeness Validator UI
**Title**: Display Seller Data Completeness Against HBR Framework

**Description**:
As a seller, I want to see data completeness against HBR framework so that I know what information buyers need.

**Acceptance Criteria**:
- [ ] Displays completeness score (0-100%)
- [ ] Shows missing fields by phase
- [ ] Phase-by-phase completeness breakdown
- [ ] Recommendations for data collection
- [ ] Visual progress indicators
- [ ] Professional presentation

**Labels**: `phase-3`, `hbr-framework`, `p2-medium`, `ui-component`

**Estimate**: 5 points

**Dependencies**: Story 3.1.1

---

#### Story 3.1.4: Buyer-Seller Matching Display
**Title**: Show Buyer-Seller Matching Results

**Description**:
As a user, I want to see buyer-seller matching results so that I understand compatibility and deal potential.

**Acceptance Criteria**:
- [ ] Displays matching score
- [ ] Shows compatibility factors
- [ ] Visual matching indicators
- [ ] Recommendations
- [ ] Professional presentation

**Labels**: `phase-3`, `hbr-framework`, `p2-medium`, `ui-component`

**Estimate**: 5 points

**Dependencies**: Story 3.1.1, Story 3.1.2

---

### Feature: Multi-Language Support

#### Story 3.2.1: Language Switcher Component
**Title**: Create Language Selection Interface

**Description**:
As a user, I want to switch languages so that I can use the application in my native language.

**Acceptance Criteria**:
- [ ] Language switcher dropdown
- [ ] Supports: English, Dutch (NL), French (FR), German (DE)
- [ ] Language selection persists
- [ ] Visual language indicators
- [ ] Accessible controls
- [ ] Professional design

**Labels**: `phase-3`, `multi-language`, `p2-medium`, `ui-component`

**Estimate**: 3 points

**Dependencies**: Translation service integration

---

#### Story 3.2.2: Translation Service Integration
**Title**: Integrate Translation Service for UI Text

**Description**:
As a developer, I need to integrate translation service so that all UI text can be displayed in multiple languages.

**Acceptance Criteria**:
- [ ] Translation service integrated
- [ ] All UI text translatable
- [ ] Translation files for EN, NL, FR, DE
- [ ] Fallback to English if translation missing
- [ ] Performance maintained (<100ms translation time)
- [ ] RTL support if needed

**Labels**: `phase-3`, `multi-language`, `p2-medium`, `integration`

**Estimate**: 8 points

**Dependencies**: Backend translation service

---

#### Story 3.2.3: Conversation Translation
**Title**: Translate Conversation Questions and Responses

**Description**:
As a user, I want conversation questions and responses translated so that I can have a natural conversation in my language.

**Acceptance Criteria**:
- [ ] Questions translated to selected language
- [ ] User responses processed in selected language
- [ ] Natural language processing in multiple languages
- [ ] Cultural adaptations where needed
- [ ] Performance maintained

**Labels**: `phase-3`, `multi-language`, `p2-medium`, `integration`

**Estimate**: 8 points

**Dependencies**: Story 3.2.2, Backend multi-language NLP

---

#### Story 3.2.4: Report Translation
**Title**: Translate Valuation Reports to Multiple Languages

**Description**:
As a user, I want my valuation report in my language so that I can easily understand and share it.

**Acceptance Criteria**:
- [ ] All report sections translatable
- [ ] Professional translation quality
- [ ] Maintains formatting and layout
- [ ] Charts and graphs localized
- [ ] PDF export in selected language

**Labels**: `phase-3`, `multi-language`, `p2-medium`, `integration`

**Estimate**: 5 points

**Dependencies**: Story 3.2.2, Story 1.2.10

---

### Feature: Advanced Analytics Visualization

#### Story 3.3.1: Monte Carlo Simulation Visualization
**Title**: Create Charts for Monte Carlo Simulation Results

**Description**:
As a user, I want to see Monte Carlo simulation results visualized so that I understand valuation uncertainty and risk.

**Acceptance Criteria**:
- [ ] Distribution chart (histogram)
- [ ] P10/P50/P90 percentiles displayed
- [ ] Statistics summary (mean, std, min, max)
- [ ] Risk assessment visualization
- [ ] Interactive charts (zoom, tooltips)
- [ ] Professional presentation
- [ ] Responsive design

**Labels**: `phase-3`, `advanced-analytics`, `p1-high`, `visualization`

**Estimate**: 8 points

**Dependencies**: Backend Monte Carlo API

---

#### Story 3.3.2: Sensitivity Analysis Visualization
**Title**: Create Tornado Charts for Sensitivity Analysis

**Description**:
As a user, I want to see sensitivity analysis results so that I understand which inputs have the most impact on valuation.

**Acceptance Criteria**:
- [ ] Tornado chart visualization
- [ ] Inputs ranked by impact
- [ ] Impact values displayed
- [ ] Interactive tooltips
- [ ] Professional presentation
- [ ] Responsive design

**Labels**: `phase-3`, `advanced-analytics`, `p1-high`, `visualization`

**Estimate**: 5 points

**Dependencies**: Backend sensitivity analysis API

---

#### Story 3.3.3: Scenario Modeling Interface
**Title**: Create UI for Scenario Comparison

**Description**:
As a user, I want to compare different scenarios so that I understand how assumptions affect valuation.

**Acceptance Criteria**:
- [ ] Scenario selection interface
- [ ] Side-by-side scenario comparison
- [ ] Visual scenario indicators
- [ ] Scenario assumptions displayed
- [ ] Professional presentation

**Labels**: `phase-3`, `advanced-analytics`, `p1-high`, `ui-component`

**Estimate**: 5 points

**Dependencies**: Story 3.3.1, Story 3.3.2

---

#### Story 3.3.4: Advanced Analytics Integration in Results
**Title**: Add Advanced Analytics Section to Results Display

**Description**:
As a user, I want to see advanced analytics in the results so that I have comprehensive valuation insights.

**Acceptance Criteria**:
- [ ] Advanced analytics section in Results
- [ ] Monte Carlo visualization
- [ ] Sensitivity analysis charts
- [ ] Scenario comparison
- [ ] Professional presentation
- [ ] Expandable sections

**Labels**: `phase-3`, `advanced-analytics`, `p1-high`, `integration`

**Estimate**: 3 points

**Dependencies**: Story 3.3.1, Story 3.3.2, Story 3.3.3

---

## Story Dependencies Map

### Phase 1 Dependencies
- Story 1.1.1 → Story 1.1.2, Story 1.1.3, Story 1.1.7
- Story 1.1.3 → Story 1.1.4, Story 1.1.5, Story 1.1.6
- Story 1.2.1 → Story 1.2.2-1.2.11
- Story 1.3.1 → Story 1.3.2-1.3.6

### Phase 2 Dependencies
- Story 2.1.1 → Story 2.1.2-2.1.5
- Story 2.2.1 → Story 2.2.2, Story 2.2.3
- Story 2.3.1 → Story 2.3.2

### Phase 3 Dependencies
- Story 3.1.1 → Story 3.1.2-3.1.4
- Story 3.2.2 → Story 3.2.3, Story 3.2.4
- Story 3.3.1, Story 3.3.2 → Story 3.3.3 → Story 3.3.4

---

## Linear Import Instructions

### Option 1: Manual Import
1. Copy each story title and description
2. Create new issue in Linear
3. Add labels, estimate, and dependencies
4. Link related stories

### Option 2: CSV Import
1. Convert stories to CSV format:
   - Title, Description, Labels, Estimate, Dependencies
2. Use Linear's CSV import feature
3. Map columns to Linear fields

### Option 3: API Import
1. Use Linear API to create issues programmatically
2. Parse this document
3. Create issues with proper relationships

---

## Labels Reference

### Phase Labels
- `phase-1`: Phase 1 - Foundation UI
- `phase-2`: Phase 2 - Dynamic AI Conversation UI
- `phase-3`: Phase 3 - Advanced Features UI

### Feature Labels
- `ebitda-normalization`: EBITDA normalization UI
- `world-class-reports`: World-class report UI
- `owner-profiling`: Owner profiling UI
- `dynamic-ai-conversation`: Dynamic AI conversation
- `context-aware-conversation`: Context-aware conversation
- `continuous-learning`: Continuous learning
- `hbr-framework`: HBR buyer questions framework
- `multi-language`: Multi-language support
- `advanced-analytics`: Advanced analytics visualization

### Priority Labels
- `p0-critical`: Must have (Phase 1)
- `p1-high`: High priority (Phase 1-2)
- `p2-medium`: Medium priority (Phase 3)

### Type Labels
- `ui-component`: UI component
- `visualization`: Data visualization
- `integration`: Integration work
- `migration`: Migration/refactoring
- `form`: Form component
- `navigation`: Navigation component
- `export`: Export functionality
- `admin`: Admin feature

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Total Stories**: 48  
**Total Estimate**: ~250 points  
**Timeline**: 20-30 weeks (6-9 months)

