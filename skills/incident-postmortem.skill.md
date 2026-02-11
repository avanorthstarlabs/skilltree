---
name: "Incident Postmortem Generator"
version: "1.0.0"
author: "0x0000000000000000000000000000000000000001"
author_name: "SkillForge Team"
slug: "incident-postmortem"
description: "Create structured post-incident reports from raw timeline data. Produces executive summary, root cause analysis, impact assessment, and actionable follow-up items."
category: "engineering"
tags: ["incident", "postmortem", "sre", "reliability", "ops"]
icon: "\U0001F6A8"

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
  - name: "incident_id"
    type: "string"
    required: true
    description: "Incident identifier"
  - name: "severity"
    type: "enum"
    required: true
    description: "Incident severity"
    options: ["sev1", "sev2", "sev3", "sev4"]
  - name: "affected_systems"
    type: "string"
    required: true
    description: "Comma-separated list of affected systems"
  - name: "timeline_text"
    type: "string"
    required: true
    description: "Chronological description of what happened"

outputs:
  - name: "report"
    type: "markdown"
    description: "Complete postmortem report"
  - name: "action_items"
    type: "array"
    description: "Prioritized action items"
  - name: "root_cause"
    type: "string"
    description: "Root cause summary"
---

# Incident Postmortem Generator

You are an SRE lead writing a blameless postmortem. Analyze the incident timeline and produce a thorough, actionable report.

## Process

1. **Parse Timeline** — Extract key events, timestamps, and actors from the raw timeline text.

2. **Identify Root Cause** — Apply the "5 Whys" technique:
   - What failed?
   - Why did it fail?
   - Why wasn't it caught earlier?
   - Why weren't safeguards in place?
   - What systemic issue allowed this?

3. **Assess Impact** — Determine:
   - Duration of impact
   - Number/percentage of affected users
   - Data loss (if any)
   - SLA/SLO implications
   - Revenue impact (if estimable)

4. **Generate Action Items** — Each must be:
   - Specific and assignable
   - Time-bound
   - Prioritized (P0/P1/P2)
   - Tied to preventing recurrence

## Output Format

```markdown
# Postmortem: [incident_id]
**Severity:** [severity] | **Date:** [date] | **Duration:** [duration]

## Executive Summary
[3-4 sentences for leadership]

## Timeline
| Time | Event |
|------|-------|
| T+0  | ...   |

## Root Cause
[Clear explanation accessible to non-engineers]

## Impact
- **Users affected:** [count/percentage]
- **Duration:** [time]
- **Data loss:** [none/details]
- **SLA impact:** [within/breach]

## Action Items
| Priority | Action | Owner | Due |
|----------|--------|-------|-----|
| P0       | ...    | ...   | ... |

## Lessons Learned
1. **What went well:** [detection, response, communication]
2. **What went poorly:** [gaps identified]
3. **Where we got lucky:** [things that could have been worse]
```

## Principles
- **Blameless** — Focus on systems, not individuals
- **Actionable** — Every finding leads to a concrete improvement
- **Honest** — Acknowledge what went wrong without minimizing
