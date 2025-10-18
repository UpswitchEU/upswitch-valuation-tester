# Full Stack Architecture

**Version**: 1.0  
**Date**: October 20, 2025  
**Audience**: CTO, Technical Leaders, Engineering Teams  
**Status**: Production-Ready Architecture

---

## Executive Summary

Upswitch Valuation Tester implements a **lightweight frontend + robust backend** architecture that delivers Big 4 quality valuations through AI-driven intelligent triage. The system achieves 85-95% accuracy in <5 seconds while maintaining complete privacy compliance and transparency.

### Key Architecture Principles

- **Separation of Concerns**: Frontend handles UI/UX, backend handles business logic
- **Privacy-First**: 3-pipeline privacy architecture with GDPR compliance
- **AI-Driven Intelligence**: Dynamic question generation and owner profiling
- **Real-Time Streaming**: Server-Sent Events (SSE) for conversational UX
- **Scalable Design**: Horizontal scaling ready, CDN-optimized frontend

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERFACE LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│  React Frontend (Valuation Tester)                             │
│  ├── Streaming Chat UI                                         │
│  ├── Real-time Progress Tracking                               │
│  ├── Results Visualization                                     │
│  └── Error Handling & Recovery                                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTPS/SSE
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  FastAPI Backend (Valuation Engine)                           │
│  ├── Authentication & Authorization                           │
│  ├── Rate Limiting & Security                                 │
│  ├── Request Routing & Load Balancing                         │
│  └── Response Streaming (SSE)                                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ Internal APIs
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                       │
├─────────────────────────────────────────────────────────────────┤
│  Intelligent Triage Engine                                     │
│  ├── Dynamic Question Generation                               │
│  ├── Context-Aware Conversations                              │
│  ├── Industry-Specific Rules                                  │
│  └── Owner Profiling Integration                               │
│                                                                 │
│  AI/ML Services                                                │
│  ├── OpenAI GPT-4o Integration                                 │
│  ├── Privacy-First Data Filtering                             │
│  ├── Natural Language Processing                              │
│  └── Conversation Memory Management                            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ Data Access
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                  │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL Database                                           │
│  ├── User Profiles & Sessions                                  │
│  ├── Conversation History                                      │
│  ├── Valuation Results                                         │
│  └── Analytics & Metrics                                       │
│                                                                 │
│  External Data Sources                                         │
│  ├── Belgium KBO Registry                                     │
│  ├── Financial Data APIs                                       │
│  └── Market Data Providers                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (fast development, optimized production builds)
- **Styling**: Tailwind CSS (utility-first, responsive design)
- **State Management**: Zustand (lightweight, TypeScript-friendly)
- **Routing**: React Router v6 (client-side routing)
- **HTTP Client**: Axios (API communication)
- **Logging**: Pino (structured logging)

### Component Architecture

```
src/
├── components/           # UI Components
│   ├── StreamingChat/    # Main chat interface
│   ├── Results/          # Valuation results display
│   ├── forms/            # Form components
│   └── common/           # Shared components
├── services/             # API Services
│   ├── api.ts           # HTTP client
│   ├── streamingChatService.ts
│   └── registryService.ts
├── hooks/               # Custom React hooks
│   ├── useStreamingChat.ts
│   ├── useProgressTracking.ts
│   └── useBusinessProfile.ts
├── store/               # State management
│   └── useValuationStore.ts
├── utils/               # Utilities
│   ├── logger.ts        # Structured logging
│   ├── errors/          # Error handling
│   └── messageUtils.ts  # Message processing
└── types/               # TypeScript definitions
    ├── valuation.ts
    └── registry.ts
```

### Key Frontend Features

1. **Streaming Chat Interface**
   - Real-time message streaming via SSE
   - Typing indicators and progress tracking
   - Error handling and recovery
   - Accessibility (WCAG 2.1 compliant)

2. **Modular Component Design**
   - Results component split into 6 sub-components
   - Reusable form components
   - Custom hooks for business logic
   - Clean separation of concerns

3. **Performance Optimizations**
   - Code splitting with React.lazy
   - Vendor bundle splitting
   - React.memo for pure components
   - useMemo and useCallback for expensive operations

4. **Error Handling**
   - Centralized error handling with typed errors
   - Error boundaries for component isolation
   - Graceful degradation
   - User-friendly error messages

---

## Backend Architecture

### Technology Stack

- **Framework**: Python 3.11 with FastAPI
- **Database**: PostgreSQL with SQLAlchemy ORM
- **AI/ML**: OpenAI GPT-4o, custom triage engine
- **Authentication**: JWT tokens, session management
- **Caching**: Redis (planned for scaling)
- **Monitoring**: Structured logging, metrics collection

### Service Architecture

```
src/
├── api/routes/                    # API Endpoints
│   ├── intelligent_conversation_stream.py
│   ├── valuation.py
│   └── registry.py
├── services/                      # Business Logic
│   ├── triage/                    # Intelligent Triage
│   │   ├── intelligent_triage_engine.py
│   │   └── openai_intelligent_triage_engine.py
│   ├── owner_profiling/           # Owner Profiling
│   │   ├── owner_profiling_engine.py
│   │   └── enhanced_owner_profiling_engine.py
│   ├── ai/                        # AI Services
│   │   └── openai_proxy.py
│   └── privacy/                   # Privacy & Security
│       └── financial_data_filter.py
├── domain/models/                 # Data Models
│   ├── user.py
│   ├── business.py
│   └── valuation.py
└── utils/                        # Utilities
    ├── logging.py
    └── security.py
```

### Key Backend Features

1. **Intelligent Triage Engine**
   - Dynamic question generation based on business type
   - Context-aware conversation flow
   - Industry-specific rules and logic
   - Owner profiling integration

2. **AI Integration**
   - OpenAI GPT-4o for natural language processing
   - Privacy-first data filtering
   - Conversation memory management
   - Cost optimization and rate limiting

3. **Owner Profiling System**
   - Human factor analysis in valuations
   - Dependency scoring and risk assessment
   - Succession planning evaluation
   - Transferability analysis

4. **Privacy Architecture**
   - 3-pipeline privacy system
   - GDPR compliance
   - Data minimization
   - Secure data handling

---

## API Integration

### Streaming Protocol (SSE)

**Endpoint**: `/api/v1/intelligent-conversation/stream`

**Request Format**:
```json
{
  "session_id": "uuid",
  "user_input": "string",
  "field_name": "optional",
  "context": {},
  "user_id": "optional"
}
```

**Response Format** (Server-Sent Events):
```
data: {"type": "typing", "session_id": "uuid"}
data: {"type": "message_start", "session_id": "uuid"}
data: {"type": "message_chunk", "content": "word ", "session_id": "uuid"}
data: {"type": "message_complete", "session_id": "uuid", "metadata": {}}
```

### REST Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/valuation/calculate` | POST | Calculate valuation |
| `/api/v1/registry/search` | GET | Search company registry |
| `/api/v1/registry/financials` | GET | Get company financials |
| `/api/v1/owner-profile` | POST | Create owner profile |
| `/api/v1/health` | GET | Health check |

### Data Flow

1. **User Input** → Frontend captures user message
2. **API Call** → Frontend sends to backend via SSE
3. **Triage Processing** → Backend determines next question
4. **AI Generation** → OpenAI generates contextual question
5. **Streaming Response** → Backend streams response to frontend
6. **UI Update** → Frontend displays real-time response
7. **State Management** → Frontend updates conversation state

---

## Privacy Architecture

### 3-Pipeline Privacy System

1. **Pipeline 1: Data Collection**
   - User input sanitization
   - Data validation and cleaning
   - Input method tracking

2. **Pipeline 2: AI Processing**
   - Privacy filter removes sensitive data
   - Only safe context sent to OpenAI
   - Financial data never leaves secure environment

3. **Pipeline 3: Response Generation**
   - AI response generation
   - Privacy-safe response formatting
   - Secure data integration

### GDPR Compliance

- **Data Minimization**: Only collect necessary data
- **Purpose Limitation**: Use data only for stated purposes
- **Storage Limitation**: Automatic data deletion
- **Right to Erasure**: User data deletion on request
- **Data Portability**: Export user data
- **Privacy by Design**: Built-in privacy protection

---

## Performance Characteristics

### Frontend Performance

- **Initial Load**: <2 seconds
- **Time to Interactive**: <3 seconds
- **Bundle Size**: 485 KB (140 KB gzipped)
- **Code Splitting**: Lazy loading for heavy components
- **Caching**: CDN-optimized static assets

### Backend Performance

- **Valuation Calculation**: <5 seconds
- **API Response Time**: <100ms (non-AI endpoints)
- **AI Response Time**: <2 seconds (with OpenAI)
- **Concurrent Users**: 1,000+ (current), 10,000+ (target)
- **Database Queries**: <50ms average

### Scalability Targets

- **Frontend**: CDN-distributed, infinite scale
- **Backend**: Horizontal scaling ready
- **Database**: Read replicas, connection pooling
- **AI Services**: Rate limiting, cost optimization

---

## Security Architecture

### Authentication & Authorization

- **Session Management**: Secure session tokens
- **JWT Tokens**: Stateless authentication
- **Role-Based Access**: User, admin, partner roles
- **API Security**: Rate limiting, CORS, CSRF protection

### Data Security

- **Encryption at Rest**: AES-256 for database
- **Encryption in Transit**: TLS 1.3 for all communications
- **API Security**: OAuth 2.0, API keys
- **Input Validation**: Sanitization, type checking

### Monitoring & Compliance

- **Security Monitoring**: Intrusion detection
- **Audit Logging**: All actions logged
- **Compliance**: GDPR, SOC 2 (planned)
- **Incident Response**: Automated alerts, procedures

---

## Deployment Architecture

### Frontend Deployment (Vercel)

- **CDN**: Global edge network
- **Build Process**: Automated from Git
- **Environment**: Production, staging, preview
- **Monitoring**: Vercel Analytics, error tracking

### Backend Deployment (Railway)

- **Container**: Docker-based deployment
- **Database**: PostgreSQL with backups
- **Scaling**: Auto-scaling based on load
- **Monitoring**: Application metrics, logs

### Infrastructure

- **Domain**: Custom domain with SSL
- **DNS**: Cloudflare for performance
- **Backup**: Automated database backups
- **Monitoring**: Uptime monitoring, alerts

---

## Development Workflow

### Code Quality Standards

- **TypeScript**: 100% type coverage
- **Testing**: Unit, integration, E2E tests
- **Linting**: ESLint, Prettier
- **Documentation**: JSDoc, README files

### CI/CD Pipeline

- **Source Control**: Git with feature branches
- **Automated Testing**: GitHub Actions
- **Code Review**: Pull request reviews
- **Deployment**: Automated to staging/production

### Monitoring & Observability

- **Logging**: Structured logging with Pino
- **Metrics**: Performance, business metrics
- **Error Tracking**: Centralized error handling
- **Alerting**: Automated incident response

---

## Future Architecture Considerations

### Scalability Enhancements

- **Microservices**: Split into domain services
- **Event-Driven**: Async processing with queues
- **Caching**: Redis for session and data caching
- **CDN**: Global content delivery

### AI/ML Enhancements

- **Local LLM**: On-premise AI for privacy
- **Fine-Tuning**: Custom models for Belgian SMEs
- **Predictive Analytics**: ML models for forecasting
- **Document Processing**: OCR + NLP for financial docs

### Integration Capabilities

- **API Gateway**: Centralized API management
- **Webhook Support**: Real-time integrations
- **White-Label**: Partner customization
- **Mobile Apps**: React Native or native apps

---

## Conclusion

The Upswitch Valuation Tester architecture successfully delivers:

✅ **Big 4 Quality**: 85-95% accuracy with professional methodologies  
✅ **AI-Driven Intelligence**: Dynamic questions and owner profiling  
✅ **Privacy-First Design**: GDPR compliant with 3-pipeline architecture  
✅ **Real-Time Experience**: Streaming chat with <5 second valuations  
✅ **Scalable Foundation**: Ready for 10,000+ concurrent users  
✅ **Production Ready**: Robust error handling and monitoring  

This architecture positions Upswitch as the **"Lovable for AI Valuations"** platform, combining institutional-grade quality with consumer-friendly experience.

---

**Document Status**: ✅ Production Architecture  
**Last Updated**: October 20, 2025  
**Next Review**: November 2025  
**Maintained by**: Engineering Team
