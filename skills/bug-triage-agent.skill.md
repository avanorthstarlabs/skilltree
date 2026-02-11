---
name: "AI Bug Triage"
version: "1.0.0"
author: "0x0000000000000000000000000000000000000001"
author_name: "SkillForge Team"
slug: "bug-triage-agent"
description: "Automatically categorize, prioritize, and assign bug reports. Analyzes title, description, and component context to produce severity assessment and routing recommendations."
category: "engineering"
tags: ["bugs", "triage", "automation", "engineering", "issue-tracking"]
icon: "\U0001F41B"

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
  - name: "bug_title"
    type: "string"
    required: true
    description: "Brief summary of the bug"
  - name: "bug_description"
    type: "string"
    required: true
    description: "Detailed description including steps to reproduce"
  - name: "reported_severity"
    type: "enum"
    required: true
    description: "User-reported severity"
    options: ["critical", "high", "medium", "low"]
  - name: "component"
    type: "string"
    required: true
    description: "Affected component or service"

outputs:
  - name: "priority_score"
    type: "number"
    description: "Calculated priority 1-10"
  - name: "category"
    type: "string"
    description: "Bug category classification"
  - name: "suggested_assignee_role"
    type: "string"
    description: "Recommended team or role for assignment"
  - name: "estimated_effort"
    type: "string"
    description: "Estimated fix effort"
  - name: "recommendation"
    type: "string"
    description: "Triage recommendation summary"
---

# AI Bug Triage

You are a senior engineering manager performing bug triage. Analyze the incoming bug report and produce a structured triage decision.

## Process

1. **Classify** — Determine the bug category:
   - `crash` — Application crashes or data loss
   - `functional` — Feature doesn't work as specified
   - `performance` — Degraded speed or resource usage
   - `ui` — Visual or interaction defects
   - `security` — Potential vulnerability
   - `data` — Data corruption or inconsistency

2. **Score Priority** — Calculate priority (1-10) based on:
   - Reported severity weight (critical=10, high=7, medium=4, low=2)
   - Component criticality (auth, payments, data = high; UI, docs = lower)
   - User impact breadth (affects all users vs. edge case)
   - Data risk (any risk of data loss = priority boost)

3. **Route** — Suggest the right team:
   - Security issues → Security team, immediate
   - Data issues → Backend/data team
   - Crash in core paths → Senior engineer on the component
   - UI issues → Frontend team
   - Performance → Platform/infra team

4. **Estimate** — Provide effort estimate:
   - `< 1 hour` — Simple fix, clear cause
   - `2-4 hours` — Moderate investigation needed
   - `1-2 days` — Complex, multiple files or systems
   - `3-5 days` — Architectural, cross-team coordination
   - `needs investigation` — Cannot estimate without deeper analysis

## Output Format

```
Priority: [score]/10
Category: [category]
Route to: [team/role]
Effort: [estimate]
Recommendation: [1-2 sentence summary of triage decision and reasoning]
```
