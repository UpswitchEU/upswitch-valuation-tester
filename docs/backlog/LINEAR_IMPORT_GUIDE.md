# Linear Import Guide - ValuationIQ User Stories

**Version**: 1.0  
**Date**: January 2025  
**Purpose**: Guide for importing user stories into Linear

---

## Quick Start

1. **Review Stories**: Check `VALUATIONIQ_USER_STORIES.md` for all 48 stories
2. **Choose Import Method**: Manual, CSV, or API (see below)
3. **Set Up Linear Project**: Create "ValuationIQ Frontend" project
4. **Import Stories**: Follow method-specific instructions
5. **Link Dependencies**: Connect related stories
6. **Assign Labels**: Apply phase, feature, priority labels

---

## Import Methods

### Method 1: Manual Import (Recommended for Small Batches)

**Steps**:
1. Open Linear and navigate to your project
2. Click "New Issue"
3. Copy story title, description, and acceptance criteria from `VALUATIONIQ_USER_STORIES.md`
4. Add labels (phase, feature, priority, type)
5. Set estimate (story points)
6. Link dependencies (create parent/child relationships)
7. Save issue

**Time**: ~2-3 minutes per story  
**Best For**: Phased rollout, reviewing each story

---

### Method 2: CSV Import (Recommended for Bulk Import)

**Steps**:
1. Create CSV file with columns:
   ```
   Title, Description, Labels, Estimate, Priority, Status, Dependencies
   ```
2. Populate from `VALUATIONIQ_USER_STORIES.md`
3. In Linear: Settings → Import → CSV
4. Map columns to Linear fields
5. Import

**CSV Template**:
```csv
Title,Description,Labels,Estimate,Priority,Status,Parent
"Display EBITDA Normalization Overview in Results","As a user, I want to see...","phase-1,ebitda-normalization,p0-critical,ui-component",5,"High","Todo",""
```

**Time**: ~30 minutes for all stories  
**Best For**: Bulk import, initial setup

---

### Method 3: Linear API Import (Recommended for Automation)

**Steps**:
1. Get Linear API key
2. Use Linear GraphQL API
3. Parse `VALUATIONIQ_USER_STORIES.md`
4. Create issues programmatically
5. Link dependencies

**Example API Call**:
```graphql
mutation CreateIssue {
  issueCreate(
    input: {
      title: "Display EBITDA Normalization Overview in Results"
      description: "As a user, I want to see..."
      teamId: "your-team-id"
      labelIds: ["label-id-1", "label-id-2"]
      estimate: 5
      priority: 1
    }
  ) {
    issue {
      id
      title
    }
  }
}
```

**Time**: ~1 hour for setup, then automated  
**Best For**: Automated workflows, CI/CD integration

---

## Linear Setup Checklist

### 1. Create Project
- [ ] Create "ValuationIQ Frontend" project
- [ ] Set project timeline (Q1-Q3 2026)
- [ ] Add project description

### 2. Create Labels

**Phase Labels**:
- [ ] `phase-1` (Phase 1 - Foundation UI)
- [ ] `phase-2` (Phase 2 - Dynamic AI Conversation UI)
- [ ] `phase-3` (Phase 3 - Advanced Features UI)

**Feature Labels**:
- [ ] `ebitda-normalization`
- [ ] `world-class-reports`
- [ ] `owner-profiling`
- [ ] `dynamic-ai-conversation`
- [ ] `context-aware-conversation`
- [ ] `continuous-learning`
- [ ] `hbr-framework`
- [ ] `multi-language`
- [ ] `advanced-analytics`

**Priority Labels**:
- [ ] `p0-critical`
- [ ] `p1-high`
- [ ] `p2-medium`

**Type Labels**:
- [ ] `ui-component`
- [ ] `visualization`
- [ ] `integration`
- [ ] `migration`
- [ ] `form`
- [ ] `navigation`
- [ ] `export`
- [ ] `admin`

### 3. Create Milestones
- [ ] Phase 1 Milestone (Q1 2026)
- [ ] Phase 2 Milestone (Q2 2026)
- [ ] Phase 3 Milestone (Q3 2026)

### 4. Set Up Teams
- [ ] Frontend Team
- [ ] Design Team
- [ ] QA Team

---

## Story Import Order

### Recommended Import Sequence

**Phase 1 - Foundation UI** (Import first):
1. Story 1.1.1 (Normalization Overview) - Foundation
2. Story 1.1.2 (Normalization Bridge) - Depends on 1.1.1
3. Story 1.1.3 (Adjustment Breakdown) - Depends on 1.1.1
4. Story 1.1.4-1.1.6 (Supporting components) - Depends on 1.1.3
5. Story 1.1.7 (Info Tab Integration) - Depends on 1.1.1, 1.1.3
6. Story 1.2.1 (Report Orchestrator) - Foundation
7. Story 1.2.2-1.2.10 (Report sections) - Depends on 1.2.1
8. Story 1.3.1 (Owner Profiling Form) - Foundation
9. Story 1.3.2-1.3.6 (Owner profiling components) - Depends on 1.3.1

**Phase 2 - Dynamic AI Conversation UI** (Import after Phase 1):
1. Story 2.1.1 (Dynamic Question Component) - Foundation
2. Story 2.1.2-2.1.5 (Question components) - Depends on 2.1.1
3. Story 2.2.1 (Conversation Memory) - Depends on 2.1.1
4. Story 2.2.2-2.2.3 (Context components) - Depends on 2.2.1
5. Story 2.3.1-2.3.2 (Learning components)

**Phase 3 - Advanced Features UI** (Import after Phase 2):
1. Story 3.1.1 (HBR Interface) - Foundation
2. Story 3.1.2-3.1.4 (HBR components) - Depends on 3.1.1
3. Story 3.2.2 (Translation Service) - Foundation
4. Story 3.2.1, 3.2.3-3.2.4 (Language components) - Depends on 3.2.2
5. Story 3.3.1-3.3.2 (Analytics visualizations) - Foundation
6. Story 3.3.3-3.3.4 (Analytics components) - Depends on 3.3.1, 3.3.2

---

## Story Point Estimates Summary

### Phase 1: Foundation UI
- **Total**: ~100 points
- **EBITDA Normalization**: ~40 points
- **World-Class Reports**: ~50 points
- **Owner Profiling**: ~20 points

### Phase 2: Dynamic AI Conversation UI
- **Total**: ~50 points
- **Dynamic Questions**: ~30 points
- **Context-Aware**: ~15 points
- **Continuous Learning**: ~5 points

### Phase 3: Advanced Features UI
- **Total**: ~50 points
- **HBR Framework**: ~25 points
- **Multi-Language**: ~25 points
- **Advanced Analytics**: ~20 points

**Grand Total**: ~200 points (48 stories)

---

## Dependencies Mapping

### Critical Path Stories (Must Complete First)

1. **Story 1.1.1** - Normalization Overview (blocks 1.1.2, 1.1.3, 1.1.7)
2. **Story 1.1.3** - Adjustment Breakdown (blocks 1.1.4, 1.1.5, 1.1.6)
3. **Story 1.2.1** - Report Orchestrator (blocks all report stories)
4. **Story 1.3.1** - Owner Profiling Form (blocks all owner profiling stories)
5. **Story 2.1.1** - Dynamic Question Component (blocks all Phase 2 stories)
6. **Story 3.1.1** - HBR Interface (blocks all HBR stories)
7. **Story 3.2.2** - Translation Service (blocks all language stories)

### Parallel Work Opportunities

**Can work in parallel**:
- Stories 1.1.4, 1.1.5, 1.1.6 (all depend on 1.1.3)
- Stories 1.2.2-1.2.10 (all depend on 1.2.1)
- Stories 1.3.2-1.3.6 (all depend on 1.3.1)
- Stories 2.1.2-2.1.5 (all depend on 2.1.1)
- Stories 3.1.2-3.1.4 (all depend on 3.1.1)

---

## Acceptance Criteria Format

Each story includes acceptance criteria in checklist format:
```
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
```

**In Linear**: Convert to checklist items or keep as description text.

---

## Labels Color Coding (Recommended)

**Phase Labels** (Color-coded by phase):
- `phase-1`: Blue
- `phase-2`: Green
- `phase-3`: Purple

**Priority Labels** (Color-coded by urgency):
- `p0-critical`: Red
- `p1-high`: Orange
- `p2-medium`: Yellow

**Feature Labels** (Color-coded by feature):
- All feature labels: Teal (matching brand)

---

## Milestone Planning

### Phase 1 Milestone (Q1 2026)
- **Target Date**: End of Q1 2026
- **Stories**: 1.1.1 - 1.3.6 (22 stories)
- **Total Points**: ~100
- **Duration**: 6-8 weeks

### Phase 2 Milestone (Q2 2026)
- **Target Date**: End of Q2 2026
- **Stories**: 2.1.1 - 2.3.2 (8 stories)
- **Total Points**: ~50
- **Duration**: 8-10 weeks

### Phase 3 Milestone (Q3 2026)
- **Target Date**: End of Q3 2026
- **Stories**: 3.1.1 - 3.3.4 (10 stories)
- **Total Points**: ~50
- **Duration**: 6-8 weeks

---

## Quality Checklist

Before importing, verify:
- [ ] All stories have clear titles
- [ ] All stories have detailed descriptions
- [ ] All stories have acceptance criteria
- [ ] All stories have labels assigned
- [ ] All stories have estimates
- [ ] Dependencies are identified
- [ ] Stories are in correct phase order

---

## Post-Import Tasks

After importing:
1. [ ] Review all stories for accuracy
2. [ ] Link dependencies (parent/child relationships)
3. [ ] Assign stories to team members
4. [ ] Set up sprints/iterations
5. [ ] Create project timeline
6. [ ] Set up notifications
7. [ ] Share project with stakeholders

---

## Support

For questions about:
- **Story Content**: See `VALUATIONIQ_USER_STORIES.md`
- **Implementation Details**: See phase documents in `docs/strategy/phases/`
- **Strategic Context**: See `VALUATIONIQ_FRONTEND_IMPLEMENTATION_ROADMAP.md`

---

**Document Version**: 1.0  
**Last Updated**: January 2025

