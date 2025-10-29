# Data Architecture

**Version**: 1.0  
**Date**: October 20, 2025  
**Audience**: CTO, Engineering Teams, Data Engineers, DevOps  
**Status**: Production Data Architecture

---

## Executive Summary

The Upswitch Valuation Tester data architecture is designed for **high performance**, **data privacy**, and **scalability** while maintaining **GDPR compliance** and **data lineage tracking**. Our architecture supports real-time streaming, intelligent caching, and secure data handling for AI-driven business valuations.

### Data Architecture Principles

- **Privacy-First**: GDPR compliant with data minimization
- **Performance**: Optimized for <5s valuations and <2s frontend load
- **Scalability**: Horizontal scaling with read replicas
- **Security**: End-to-end encryption and access control
- **Lineage**: Complete data lineage tracking for transparency

---

## Data Models

### 1. User Data Model

#### User Profile
```typescript
interface UserProfile {
  id: string;                    // UUID
  email: string;                 // User email
  name: string;                  // User name
  company_name?: string;         // Associated company
  industry?: string;             // Business industry
  country_code: string;          // Country (BE, NL, UK, etc.)
  created_at: Date;             // Account creation
  updated_at: Date;             // Last update
  last_login: Date;             // Last login
  subscription_tier: 'free' | 'premium' | 'enterprise';
  preferences: UserPreferences;  // User settings
}
```

#### User Preferences
```typescript
interface UserPreferences {
  language: string;              // UI language
  currency: string;              // Preferred currency
  timezone: string;              // User timezone
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    data_sharing: boolean;
    analytics: boolean;
    marketing: boolean;
  };
}
```

### 2. Business Data Model

#### Business Profile
```typescript
interface BusinessProfile {
  id: string;                    // UUID
  user_id: string;              // Owner user ID
  company_name: string;          // Company name
  registration_number: string;   // KBO/KVK number
  country_code: string;          // Country code
  industry: string;              // Business industry
  business_type: string;         // Business type
  founding_year: number;         // Year founded
  number_of_employees: number;   // Employee count
  annual_revenue: number;        // Annual revenue
  ebitda: number;               // EBITDA
  created_at: Date;             // Profile creation
  updated_at: Date;             // Last update
  data_sources: string[];       // Data source tracking
}
```

#### Company Financial Data
```typescript
interface CompanyFinancialData {
  id: string;                    // UUID
  business_id: string;           // Business profile ID
  year: number;                  // Financial year
  revenue: number;               // Annual revenue
  ebitda: number;                // EBITDA
  net_income: number;           // Net income
  total_assets: number;          // Total assets
  total_debt: number;            // Total debt
  cash: number;                  // Cash on hand
  source: 'user_input' | 'registry' | 'ai_extracted';
  confidence_score: number;      // Data confidence (0-1)
  created_at: Date;             // Data creation
  updated_at: Date;             // Last update
}
```

### 3. Valuation Data Model

#### Valuation Request
```typescript
interface ValuationRequest {
  id: string;                    // UUID
  user_id: string;              // User ID
  business_id: string;          // Business profile ID
  company_name: string;         // Company name
  country_code: string;          // Country code
  industry: string;              // Industry
  business_model: string;        // Business model
  founding_year: number;        // Founding year
  revenue: number;               // Annual revenue
  number_of_employees: number;   // Employee count
  ebitda: number;               // EBITDA
  current_year_data?: CurrentYearData;
  historical_years_data?: HistoricalData[];
  created_at: Date;             // Request creation
  updated_at: Date;             // Last update
}
```

#### Valuation Response
```typescript
interface ValuationResponse {
  id: string;                    // UUID
  request_id: string;            // Valuation request ID
  enterprise_value_min: number;  // Min enterprise value
  enterprise_value_mid: number;  // Mid enterprise value
  enterprise_value_max: number; // Max enterprise value
  equity_value_min: number;      // Min equity value
  equity_value_mid: number;      // Mid equity value
  equity_value_max: number;      // Max equity value
  confidence_score: number;      // Confidence (0-1)
  methodology: string;           // Valuation methodology
  assumptions: string[];         // Key assumptions
  data_sources: string[];        // Data sources used
  created_at: Date;             // Valuation creation
  updated_at: Date;             // Last update
}
```

### 4. Conversation Data Model

#### Conversation Session
```typescript
interface ConversationSession {
  id: string;                    // UUID
  user_id: string;              // User ID
  business_id?: string;          // Business profile ID
  session_type: 'valuation' | 'profile' | 'support';
  status: 'active' | 'completed' | 'abandoned';
  started_at: Date;             // Session start
  completed_at?: Date;           // Session completion
  total_messages: number;        // Message count
  created_at: Date;             // Session creation
  updated_at: Date;             // Last update
}
```

#### Conversation Message
```typescript
interface ConversationMessage {
  id: string;                    // UUID
  session_id: string;            // Conversation session ID
  message_type: 'user' | 'ai' | 'system';
  content: string;               // Message content
  metadata?: Record<string, any>; // Additional metadata
  created_at: Date;             // Message creation
  updated_at: Date;             // Last update
}
```

---

## Database Schema

### 1. PostgreSQL Tables

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    industry VARCHAR(100),
    country_code VARCHAR(2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    subscription_tier VARCHAR(20) DEFAULT 'free',
    preferences JSONB DEFAULT '{}'
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_country_code ON users(country_code);
CREATE INDEX idx_users_created_at ON users(created_at);
```

#### Business Profiles Table
```sql
CREATE TABLE business_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(50),
    country_code VARCHAR(2) NOT NULL,
    industry VARCHAR(100),
    business_type VARCHAR(100),
    founding_year INTEGER,
    number_of_employees INTEGER,
    annual_revenue DECIMAL(15,2),
    ebitda DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_sources TEXT[]
);

CREATE INDEX idx_business_profiles_user_id ON business_profiles(user_id);
CREATE INDEX idx_business_profiles_company_name ON business_profiles(company_name);
CREATE INDEX idx_business_profiles_country_code ON business_profiles(country_code);
```

#### Valuations Table
```sql
CREATE TABLE valuations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES business_profiles(id) ON DELETE SET NULL,
    company_name VARCHAR(255) NOT NULL,
    country_code VARCHAR(2) NOT NULL,
    industry VARCHAR(100),
    business_model VARCHAR(100),
    founding_year INTEGER,
    revenue DECIMAL(15,2),
    number_of_employees INTEGER,
    ebitda DECIMAL(15,2),
    current_year_data JSONB,
    historical_years_data JSONB,
    enterprise_value_min DECIMAL(15,2),
    enterprise_value_mid DECIMAL(15,2),
    enterprise_value_max DECIMAL(15,2),
    equity_value_min DECIMAL(15,2),
    equity_value_mid DECIMAL(15,2),
    equity_value_max DECIMAL(15,2),
    confidence_score DECIMAL(3,2),
    methodology VARCHAR(100),
    assumptions TEXT[],
    data_sources TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_valuations_user_id ON valuations(user_id);
CREATE INDEX idx_valuations_business_id ON valuations(business_id);
CREATE INDEX idx_valuations_created_at ON valuations(created_at);
CREATE INDEX idx_valuations_company_name ON valuations(company_name);
```

#### Conversations Table
```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES business_profiles(id) ON DELETE SET NULL,
    session_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    total_messages INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);
```

#### Messages Table
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    message_type VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_message_type ON messages(message_type);
```

### 2. Database Relationships

#### Entity Relationship Diagram
```
Users (1) ──→ (N) Business Profiles
Users (1) ──→ (N) Valuations
Users (1) ──→ (N) Conversations
Business Profiles (1) ──→ (N) Valuations
Business Profiles (1) ──→ (N) Conversations
Conversations (1) ──→ (N) Messages
```

#### Foreign Key Constraints
- **Users → Business Profiles**: One-to-many
- **Users → Valuations**: One-to-many
- **Users → Conversations**: One-to-many
- **Business Profiles → Valuations**: One-to-many
- **Business Profiles → Conversations**: One-to-many
- **Conversations → Messages**: One-to-many

---

## Data Flow Architecture

### 1. Data Input Flow

#### User Input Processing
```
User Input → Validation → Sanitization → Storage → Processing
```

#### Validation Layer
- **Type Validation**: TypeScript type checking
- **Format Validation**: Data format validation
- **Business Rules**: Domain-specific validation
- **Privacy Checks**: GDPR compliance validation

#### Sanitization Layer
- **Input Sanitization**: XSS prevention
- **Data Cleaning**: Remove invalid characters
- **Format Standardization**: Consistent data formats
- **Privacy Filtering**: Remove sensitive data

### 2. Data Processing Flow

#### Valuation Processing
```
User Input → Triage Engine → AI Processing → Valuation Engine → Results
```

#### Triage Engine
- **Question Generation**: Dynamic question creation
- **Context Analysis**: Business context analysis
- **Data Collection**: Progressive data collection
- **Validation**: Data quality validation

#### AI Processing
- **Natural Language**: User input processing
- **Context Understanding**: Conversation context
- **Data Extraction**: Information extraction
- **Response Generation**: AI response creation

#### Valuation Engine
- **DCF Calculation**: Discounted cash flow
- **Multiples Analysis**: Industry multiples
- **Risk Assessment**: Business risk analysis
- **Confidence Scoring**: Result confidence

### 3. Data Output Flow

#### Results Generation
```
Valuation Results → Formatting → Caching → Delivery → Storage
```

#### Formatting Layer
- **Currency Formatting**: Localized currency
- **Number Formatting**: Localized numbers
- **Date Formatting**: Localized dates
- **Text Formatting**: Localized text

#### Caching Layer
- **Result Caching**: Valuation result caching
- **Session Caching**: User session caching
- **API Caching**: API response caching
- **Static Caching**: Static asset caching

---

## Data Privacy Architecture

### 1. GDPR Compliance

#### Data Minimization
- **Collection**: Only collect necessary data
- **Processing**: Process only for stated purposes
- **Retention**: Automatic data deletion
- **Sharing**: No data sharing without consent

#### User Rights
- **Right to Access**: User data access
- **Right to Rectification**: Data correction
- **Right to Erasure**: Data deletion
- **Right to Portability**: Data export

#### Data Protection
- **Encryption**: Data encryption at rest and in transit
- **Access Control**: Role-based access control
- **Audit Logging**: Complete audit trail
- **Data Lineage**: Track all data transformations

### 2. Privacy-First Design

#### 3-Pipeline Privacy System
```
Pipeline 1: Data Collection → Pipeline 2: AI Processing → Pipeline 3: Response Generation
```

#### Pipeline 1: Data Collection
- **User Input**: Direct user input
- **Data Validation**: Input validation
- **Privacy Filtering**: Remove sensitive data
- **Secure Storage**: Encrypted storage

#### Pipeline 2: AI Processing
- **Privacy Filter**: Remove sensitive data
- **Safe Context**: Only safe context to AI
- **Data Masking**: Mask sensitive information
- **Secure Processing**: Isolated processing

#### Pipeline 3: Response Generation
- **AI Response**: Generate AI response
- **Data Integration**: Integrate secure data
- **Response Formatting**: Format response
- **Secure Delivery**: Encrypted delivery

### 3. Data Lineage Tracking

#### Lineage Components
- **Data Sources**: Track data sources
- **Transformations**: Track data transformations
- **Access**: Track data access
- **Sharing**: Track data sharing

#### Implementation
```typescript
interface DataLineage {
  id: string;
  data_id: string;
  operation: 'create' | 'read' | 'update' | 'delete';
  user_id: string;
  timestamp: Date;
  source: string;
  transformation: string;
  destination: string;
  metadata: Record<string, any>;
}
```

---

## Data Analytics

### 1. User Behavior Analytics

#### Key Metrics
- **User Engagement**: Session duration, page views
- **Conversion Funnel**: Signup → Valuation → Payment
- **Feature Usage**: Feature adoption rates
- **User Satisfaction**: NPS scores, ratings

#### Analytics Implementation
```typescript
interface UserAnalytics {
  user_id: string;
  event_type: string;
  event_data: Record<string, any>;
  timestamp: Date;
  session_id: string;
  page_url: string;
  user_agent: string;
  ip_address: string;
}
```

### 2. Business Metrics

#### Valuation Metrics
- **Valuation Accuracy**: Accuracy vs benchmarks
- **Completion Rate**: Valuation completion rate
- **Time to Valuation**: Time to complete valuation
- **User Satisfaction**: Valuation satisfaction scores

#### Revenue Metrics
- **User Acquisition**: New user signups
- **Conversion Rate**: Free to paid conversion
- **Revenue per User**: Average revenue per user
- **Customer Lifetime Value**: Long-term value

### 3. Performance Metrics

#### System Performance
- **Response Time**: API response times
- **Throughput**: Requests per second
- **Error Rate**: Error percentage
- **Availability**: Uptime percentage

#### Database Performance
- **Query Time**: Database query times
- **Connection Pool**: Connection pool usage
- **Cache Hit Rate**: Cache hit percentage
- **Storage Usage**: Database storage usage

---

## Backup & Recovery

### 1. Backup Strategy

#### Automated Backups
- **Daily Backups**: Full database backup
- **Incremental Backups**: Hourly incremental backups
- **Point-in-Time Recovery**: 30-day retention
- **Cross-Region**: Backup replication

#### Backup Configuration
```yaml
# Backup configuration
backup:
  schedule: "0 2 * * *"  # Daily at 2 AM
  retention: 30          # 30 days retention
  compression: true      # Compress backups
  encryption: true       # Encrypt backups
  cross_region: true      # Cross-region replication
```

### 2. Disaster Recovery

#### Recovery Procedures
- **RTO**: Recovery Time Objective <4 hours
- **RPO**: Recovery Point Objective <1 hour
- **Failover**: Automatic failover to backup
- **Testing**: Monthly disaster recovery testing

#### Recovery Steps
1. **Assessment**: Assess disaster impact
2. **Activation**: Activate disaster recovery
3. **Restoration**: Restore from backups
4. **Validation**: Validate data integrity
5. **Communication**: Notify stakeholders

### 3. Data Integrity

#### Integrity Checks
- **Checksums**: Data integrity verification
- **Validation**: Data validation rules
- **Consistency**: Cross-table consistency
- **Auditing**: Regular data audits

#### Monitoring
- **Health Checks**: Database health monitoring
- **Alerting**: Automated alerting for issues
- **Reporting**: Regular integrity reports
- **Testing**: Regular integrity testing

---

## Future Data Considerations

### 1. Big Data Analytics

#### Data Warehouse
- **ETL Pipeline**: Extract, Transform, Load
- **Data Lake**: Raw data storage
- **Data Marts**: Department-specific data
- **Analytics**: Advanced analytics capabilities

#### Machine Learning
- **Training Data**: ML model training data
- **Feature Engineering**: Feature creation
- **Model Training**: ML model training
- **Model Deployment**: Model deployment

### 2. Real-Time Analytics

#### Stream Processing
- **Apache Kafka**: Event streaming
- **Apache Spark**: Stream processing
- **Real-Time Dashboards**: Live analytics
- **Alerting**: Real-time alerting

#### Event Sourcing
- **Event Store**: Event storage
- **Event Replay**: Event replay capability
- **CQRS**: Command Query Responsibility Segregation
- **Saga Pattern**: Distributed transactions

### 3. Data Governance

#### Data Quality
- **Data Profiling**: Data quality assessment
- **Data Cleansing**: Data cleaning processes
- **Data Validation**: Data validation rules
- **Data Monitoring**: Continuous monitoring

#### Compliance
- **GDPR**: European data protection
- **CCPA**: California privacy law
- **SOC 2**: Security compliance
- **ISO 27001**: Information security

---

## Conclusion

The Upswitch Valuation Tester data architecture provides:

✅ **High Performance**: Optimized for <5s valuations and <2s frontend load  
✅ **Data Privacy**: GDPR compliant with 3-pipeline privacy system  
✅ **Scalability**: Horizontal scaling with read replicas and caching  
✅ **Security**: End-to-end encryption and access control  
✅ **Analytics**: Comprehensive user behavior and business metrics  
✅ **Disaster Recovery**: Automated backups and recovery procedures  
✅ **Future-Proof**: Big data analytics and real-time processing ready  

This architecture ensures data integrity, privacy compliance, and performance at scale while supporting our AI-driven valuation platform.

---

**Document Status**: ✅ Production Data Architecture  
**Last Updated**: October 20, 2025  
**Next Review**: November 2025  
**Maintained by**: Engineering Team
