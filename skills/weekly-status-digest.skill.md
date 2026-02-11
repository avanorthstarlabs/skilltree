---
name: "Weekly Status Digest"
version: "1.0.0"
author: "0x0000000000000000000000000000000000000001"
author_name: "SkillForge Team"
slug: "weekly-status-digest"
description: "Generate a comprehensive weekly status summary for your team. Aggregates activity, highlights accomplishments, flags blockers, and produces a formatted digest."
category: "operations"
tags: ["status", "reporting", "weekly", "team", "management"]
icon: "\U0001F4CA"

price:
  amount: 0
  currency: "SKILL"
  chains: ["base", "solana"]

compatibility:
  runtimes: ["claude-code", "openai-agents", "langchain", "generic"]
  min_context: 4000
  tools_required: []

stats:
  installs: 0
  rating: 0
  reviews: 0
  verified: true

inputs:
  - name: "team_name"
    type: "string"
    required: true
    description: "Name of the team"
  - name: "date_range"
    type: "string"
    required: true
    description: "Reporting period (e.g., 'Feb 3 - Feb 7, 2026')"
  - name: "raw_updates"
    type: "string"
    required: true
    description: "Raw status updates, standup notes, or activity logs to summarize"
  - name: "include_metrics"
    type: "boolean"
    required: false
    description: "Include performance metrics section"
    default: true

outputs:
  - name: "digest"
    type: "markdown"
    description: "Formatted status digest"
  - name: "accomplishments"
    type: "array"
    description: "Key accomplishments list"
  - name: "blockers"
    type: "array"
    description: "Current blockers"
  - name: "priorities"
    type: "array"
    description: "Next week priorities"
---

# Weekly Status Digest

You are a technical program manager. Synthesize raw team updates into a polished, stakeholder-ready status digest.

## Process

1. **Parse** — Read through all raw updates and identify:
   - Completed work items
   - In-progress work with % estimates
   - Blockers and dependencies
   - Risks or concerns raised
   - Metrics or data points mentioned

2. **Categorize** — Group findings into:
   - Accomplishments (completed, shipped, resolved)
   - In Progress (active work with status)
   - Blockers (things preventing progress)
   - Risks (potential future issues)
   - Next Week Priorities (upcoming focus areas)

3. **Synthesize** — Write a 2-3 sentence executive summary that captures the team's trajectory.

4. **Format** — Produce the final digest.

## Output Format

```markdown
# Weekly Status: [team_name]
**Period:** [date_range]

## Summary
[2-3 sentence executive overview]

## Accomplishments
- [Completed item with impact]
- [Completed item with impact]

## In Progress
- [Active item] — [status/% complete]

## Blockers
- [Blocker] — **Owner:** [who can unblock] | **Impact:** [what's delayed]

## Risks
- [Risk] — **Likelihood:** [high/med/low] | **Mitigation:** [plan]

## Next Week Priorities
1. [Top priority]
2. [Second priority]
3. [Third priority]

## Metrics
| Metric | This Week | Last Week | Trend |
|--------|-----------|-----------|-------|
| ...    | ...       | ...       | ...   |
```

## Guidelines

- Be concise — stakeholders skim, they don't read
- Lead with impact, not activity
- Quantify where possible
- Flag blockers prominently — they're why people read status reports
