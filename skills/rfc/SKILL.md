---
name: rfc
description: Create RFCs (Request for Comments) using principles from Eric Evans (DDD), Martin Fowler (design patterns), Dave Farley (Continuous Delivery), and Gene Kim (DevOps). Use when user wants to write RFCs, technical proposals, architecture decision records, or design documents for significant technical changes. Triggers on mentions of RFC, architecture proposal, technical decision, ADR, design doc, or system design.
---

# RFC Creation Skill

This skill guides users through creating rigorous RFCs based on principles from four influential software thought leaders:

- **Eric Evans** (Domain-Driven Design): Ubiquitous language, bounded contexts, strategic design
- **Martin Fowler** (Patterns & Refactoring): Design patterns, evolutionary architecture, incremental change
- **Dave Farley** (Continuous Delivery): Deployability, testability, feedback loops
- **Gene Kim** (DevOps): Flow, feedback, continuous learning, reducing WIP

## When to Use

**Trigger conditions:**
- User mentions RFC, "request for comments", or technical proposal
- User wants to propose a significant architectural change
- User mentions ADR (Architecture Decision Record)
- User wants to document a technical decision
- User is designing a new system or major feature

**Initial offer:**
Offer a structured RFC workflow. Explain that this approach applies principles from DDD, software craftsmanship, and DevOps to ensure proposals are:
1. Clear in domain language (Evans)
2. Incrementally implementable (Fowler)
3. Continuously deployable (Farley)
4. Optimized for flow and feedback (Kim)

## RFC Structure

Every RFC follows this structure:

```
# RFC-[NUMBER]: [TITLE]

## Status
[Draft | Proposed | Accepted | Rejected | Superseded]

## Context
What forces are at play? What problem are we solving?

## Decision
What change do we propose?

## Consequences
What are the tradeoffs? What becomes easier/harder?

## Implementation Path
How do we get there incrementally?
```

---

## Stage 1: Domain Discovery (Evans)

**Goal:** Establish ubiquitous language and bounded context.

### Questions to Ask

1. **Domain Language:**
   - What domain terms appear in this problem?
   - Are these terms used consistently across the team?
   - What concepts do different teams call by different names?

2. **Bounded Context:**
   - What system boundary does this change affect?
   - Which teams own which parts?
   - Where are the context boundaries? (team boundaries, deployment boundaries, linguistic boundaries)

3. **Core vs Supporting Domain:**
   - Is this core to competitive advantage, or supporting infrastructure?
   - Should this be built, bought, or outsourced?

### Evans Principles to Apply

| Principle | Question to Ask |
|-----------|-----------------|
| Ubiquitous Language | "Can a domain expert and developer discuss this using the same words?" |
| Bounded Context | "Which system/team owns this concept?" |
| Context Map | "How do systems communicate across boundaries?" |
| Strategic Design | "Is this core domain (build), generic (buy), or supporting (simplest solution)?" |
| Anticorruption Layer | "How do we protect our model from external system pollution?" |

### Deliverable

A glossary of domain terms used in the RFC. Every term should be defined explicitly. If a term is ambiguous, call it out.

---

## Stage 2: Design Rigor (Fowler)

**Goal:** Ensure the design is sound, patterns are appropriate, and change is manageable.

### Questions to Ask

1. **Patterns:**
   - What design patterns does this proposal use?
   - Are there simpler alternatives?
   - What anti-patterns does this avoid?

2. **Evolutionary Architecture:**
   - How does this decision constrain future options?
   - What fitness functions would detect architectural drift?
   - Can this decision be reversed if wrong?

3. **Refactoring Path:**
   - How do we migrate from current state to proposed state?
   - Can we do it in small, safe steps?
   - What seams exist for incremental change?

### Fowler Principles to Apply

| Principle | Question to Ask |
|-----------|-----------------|
| Refactoring | "Can we make this change in small, reversible steps?" |
| Patterns | "What well-known pattern solves this problem?" |
| Technical Debt | "Are we creating debt? Is it conscious and documented?" |
| Fitness Functions | "How would we detect if this architecture degrades?" |
| Last Responsible Moment | "Do we need to decide this now, or can we defer?" |
| Strangler Fig | "Can we replace incrementally rather than big-bang?" |

### Deliverable

An "Alternatives Considered" section that documents:
- Options explored
- Why each was rejected (or chosen)
- Reversibility assessment (1-10 scale)

---

## Stage 3: Deployability Check (Farley)

**Goal:** Ensure the proposal supports continuous delivery.

### Questions to Ask

1. **Testability:**
   - How will this be tested?
   - Can it be tested in isolation?
   - What are the test boundaries?

2. **Deployability:**
   - Can this be deployed independently?
   - What feature flags or toggles are needed?
   - How do we roll back if it fails?

3. **Feedback Loops:**
   - How quickly will we know if this works?
   - What metrics/alerts will we add?
   - What does "done" look like?

### Farley Principles to Apply

| Principle | Question to Ask |
|-----------|-----------------|
| Trunk-Based Development | "Can this be merged to main frequently without breaking?" |
| Feature Toggles | "Can we deploy disabled and enable gradually?" |
| Testing Pyramid | "Do we have the right balance of unit/integration/e2e tests?" |
| Deployment Pipeline | "How does this change our build/test/deploy pipeline?" |
| Observability | "How will we know if this is working in production?" |
| Rollback Strategy | "How quickly can we undo this if it fails?" |

### Deliverable

A "Deployment Strategy" section that includes:
- Feature flag plan
- Rollout phases
- Rollback procedure
- Success metrics

---

## Stage 4: Flow Optimization (Kim)

**Goal:** Ensure the proposal improves flow and reduces friction.

### Questions to Ask

1. **Flow:**
   - Does this reduce or increase WIP (Work in Progress)?
   - Does this remove a bottleneck or create one?
   - What handoffs does this create or eliminate?

2. **Feedback:**
   - How will teams learn if this works?
   - What telemetry/monitoring is needed?
   - How do we detect problems early?

3. **Learning:**
   - What experiments does this enable?
   - How do we measure success?
   - What hypotheses are we testing?

### Kim Principles to Apply (The Three Ways)

| Way | Principle | Question |
|-----|-----------|----------|
| First Way (Flow) | Reduce batch size | "Can we deliver smaller increments?" |
| First Way (Flow) | Reduce WIP | "Does this add to work-in-progress?" |
| First Way (Flow) | Remove constraints | "What bottleneck does this address?" |
| Second Way (Feedback) | Amplify feedback | "How quickly will we know if this fails?" |
| Second Way (Feedback) | Shift left | "Can we catch problems earlier?" |
| Third Way (Learning) | Enable experimentation | "What can we learn from this?" |
| Third Way (Learning) | Foster blameless culture | "How do we make it safe to fail?" |

### Deliverable

An "Impact on Flow" section that includes:
- Current bottlenecks addressed
- New bottlenecks created (if any)
- WIP impact assessment
- Learning/experimentation opportunities

---

## Stage 5: Synthesis & Review

**Goal:** Combine insights into a coherent RFC.

### RFC Template

```markdown
# RFC-[NUMBER]: [TITLE]

**Author:** [name]
**Date:** [date]
**Status:** Draft

## Summary

[One paragraph: what we're proposing and why]

## Context

### Problem Statement
[What forces are at play?]

### Domain Context
[Bounded context, ubiquitous language, key terms]

### Current State
[How things work today]

## Decision

### Proposed Change
[What we're proposing]

### Design Details
[Patterns used, architecture decisions]

### Alternatives Considered
| Option | Pros | Cons | Reversibility |
|--------|------|------|---------------|
| A | ... | ... | 8/10 |
| B | ... | ... | 3/10 |

## Consequences

### Benefits
[What becomes easier]

### Drawbacks
[What becomes harder]

### Technical Debt
[Any debt we're consciously taking on]

## Implementation Path

### Deployment Strategy
- Feature flags:
- Rollout phases:
- Rollback procedure:

### Migration Steps
1. [First small step]
2. [Second step]
3. [Continue...]

### Success Metrics
[How we'll know this worked]

### Impact on Flow
- Bottlenecks addressed:
- WIP impact:
- Feedback loops added:

## Open Questions

[What we still need to figure out]

## References

- [Related RFCs]
- [External resources]
```

---

## Quality Checklist

Before finalizing, verify:

### Evans (Domain)
- [ ] Ubiquitous language defined and consistent
- [ ] Bounded context clearly identified
- [ ] Context map shows system relationships
- [ ] Core vs supporting domain classified

### Fowler (Design)
- [ ] Patterns explicitly named and justified
- [ ] Alternatives documented with tradeoffs
- [ ] Reversibility assessed
- [ ] Incremental migration path defined

### Farley (Delivery)
- [ ] Test strategy defined
- [ ] Feature flag/toggle plan included
- [ ] Rollback procedure documented
- [ ] Pipeline changes identified

### Kim (Flow)
- [ ] WIP impact assessed
- [ ] Bottlenecks identified
- [ ] Feedback loops defined
- [ ] Success metrics measurable

---

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| Big Bang | All-or-nothing deployment | Break into incremental steps |
| Ivory Tower | Designed without implementer input | Include engineers from affected teams |
| Analysis Paralysis | Infinite design phase | Set decision deadline, prototype |
| YAGNI Violation | Building for hypothetical future | Solve today's problem only |
| Unclear Ownership | No one responsible | Name explicit owner and reviewers |
| Missing Rollback | No way to undo | Always define rollback procedure |

---

## Workflow Summary

1. **Domain Discovery** - Establish language and boundaries (Evans)
2. **Design Rigor** - Ensure sound patterns and incremental path (Fowler)
3. **Deployability Check** - Verify continuous delivery compatibility (Farley)
4. **Flow Optimization** - Ensure improved flow and feedback (Kim)
5. **Synthesis** - Combine into coherent RFC document

Each stage produces specific deliverables. The final RFC should explicitly address all four perspectives.

## Tips

- Start with the problem, not the solution
- Name patterns explicitly - don't reinvent wheels
- Every decision should be reversible or explicitly acknowledge lock-in
- If you can't deploy incrementally, rethink the approach
- Measure everything - hunches aren't enough
- Small batches always beat big bangs
