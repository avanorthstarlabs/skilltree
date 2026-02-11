# .skill.md File Standard — v0.1.0

## Overview

A `.skill.md` file is the atomic unit of the skill marketplace.
It is a portable, self-contained file that an agent can discover, evaluate,
purchase, download, and install into its runtime.

The format uses YAML frontmatter for structured metadata (machine-readable)
and a markdown body for the skill's executable instructions (agent-readable).

---

## File Format

```markdown
---
name: "Code Review Specialist"
version: "1.2.0"
author: "0xABC123...def"
author_name: "hackerman"
slug: "code-review-specialist"
description: "Deep code review with security analysis, performance profiling, and actionable refactoring suggestions."
category: "engineering"
tags: ["code-review", "security", "performance", "refactoring"]
icon: "🔍"

# Pricing — set amount to 0 for free/open-source skills
price:
  amount: 25                 # 0 = free (open-source), >0 = paid
  currency: "SKILL"          # marketplace token ticker
  chains: ["base", "solana"] # accepted payment chains

# Revenue split (auto-applied by marketplace)
# Creator: 80% | Marketplace: 10% | Treasury: 10%

# Compatibility
compatibility:
  runtimes: ["claude-code", "openai-agents", "langchain", "generic"]
  min_context: 8000          # minimum context window needed
  tools_required: ["read", "write", "bash"]  # tools the skill needs access to

# Quality signals
stats:
  installs: 0
  rating: 0
  reviews: 0
  verified: false            # marketplace-verified quality flag

# Skill capabilities — what an agent gets
inputs:
  - name: "repository_path"
    type: "string"
    required: true
    description: "Path to the repository to review"
  - name: "focus_areas"
    type: "array"
    required: false
    description: "Specific areas to focus on: security, performance, style, bugs"
    options: ["security", "performance", "style", "bugs", "all"]
    default: ["all"]
  - name: "severity_threshold"
    type: "enum"
    required: false
    description: "Minimum severity to report"
    options: ["critical", "high", "medium", "low"]
    default: "medium"

outputs:
  - name: "review_report"
    type: "markdown"
    description: "Structured review report with findings"
  - name: "issues_found"
    type: "number"
    description: "Total number of issues identified"
  - name: "severity_breakdown"
    type: "object"
    description: "Count of issues by severity level"

# Marketplace metadata (set by the platform, not the author)
marketplace:
  listed_at: null
  listing_id: null
  content_hash: null          # SHA-256 of the skill body for integrity verification
  payment_contract: null      # on-chain contract address for gated access
---

# Code Review Specialist

You are a senior code reviewer. When invoked, perform a comprehensive
review of the provided repository.

## Workflow

1. Read the repository structure using the `read` and `glob` tools
2. Identify the primary language and framework
3. Focus on the areas specified in `focus_areas`
4. For each file, analyze for:
   - Security vulnerabilities (injection, auth bypass, data exposure)
   - Performance issues (N+1 queries, unnecessary allocations, blocking calls)
   - Code style violations (naming, structure, dead code)
   - Logic bugs (off-by-one, null handling, race conditions)
5. Only report issues at or above `severity_threshold`
6. Produce a structured report in markdown

## Output Format

### Summary
[Brief overview of findings]

### Critical Issues
[List with file:line references]

### Recommendations
[Actionable suggestions ranked by impact]

### Metrics
- Files reviewed: X
- Issues found: Y
- Severity breakdown: {critical: N, high: N, medium: N, low: N}
```

---

## Design Principles

1. **Agent-first**: The body IS the prompt. An agent reads frontmatter for metadata,
   then executes the markdown body as its instructions.

2. **Portable**: A skill file works anywhere. No platform lock-in.
   The frontmatter declares what it needs; any compatible runtime can execute it.

3. **Hashable**: The `content_hash` in marketplace metadata is a SHA-256 of the
   skill body (everything below the frontmatter). This ensures the skill hasn't
   been tampered with post-purchase.

4. **Composable**: Skills can reference other skills by slug for chained workflows.

5. **Priced**: Every skill has a clear price in marketplace tokens.
   Payment unlocks download. The file itself is the product.

---

## Agent Discovery API Contract

An agent interacting with the marketplace will use these endpoints:

```
GET  /api/v1/skills?q=code+review&category=engineering&max_price=50&chain=base
GET  /api/v1/skills/:slug
GET  /api/v1/skills/:slug/preview    (free — returns frontmatter only, no body)
POST /api/v1/skills/:slug/purchase   (requires wallet signature + payment tx hash)
GET  /api/v1/skills/:slug/download   (requires valid purchase token)
GET  /api/v1/library                 (agent's purchased skills)
POST /api/v1/skills                  (list a new skill — requires author wallet)
```

---

## Payment Flow

1. Agent calls `/preview` — gets full metadata, inputs/outputs, reviews, price
2. Agent decides to purchase
3. Agent sends payment on-chain (Base or Solana) to the marketplace contract
4. Agent calls `/purchase` with the transaction hash
5. Backend verifies tx on-chain, issues a purchase token (JWT or signed receipt)
6. Agent calls `/download` with the purchase token
7. Backend returns the full .skill.md file
8. Agent installs skill into its local runtime

---

## Verification

- `content_hash` = SHA-256(skill body below frontmatter)
- After download, agent can verify: `sha256(downloaded_body) === content_hash`
- If mismatch, skill has been tampered with — reject installation

---

## Economics — DECIDED

### Revenue Split (Option A: Creator-Heavy)

| Recipient     | Share | Purpose                                |
|---------------|-------|----------------------------------------|
| Skill Creator | 80%   | Direct payment for their work          |
| Marketplace   | 10%   | Platform operations and development    |
| Treasury      | 10%   | Token buybacks, ecosystem grants       |

### Pricing Model: One-Time Purchase
- Skills are purchased once and owned forever
- No subscriptions, no recurring fees
- Creator can release new versions — existing owners keep their version,
  new version is a separate purchase if creator chooses

### Free Tier: Open-Source Skills
- Creators can list skills at price: 0 (free / open-source)
- Free skills are fully accessible without payment or wallet
- Free skills still get ratings, reviews, and install counts
- Free skills bootstrap the catalog and drive adoption
- Agents can discover and install free skills with zero friction
- Free skills can be "upgraded" to paid by releasing a new paid version
  (the free version remains free forever)

### Pricing Rules
- Minimum paid price: 1 $SKILL token
- No maximum price (market decides)
- Price is set by the creator at listing time
- Creator can update price at any time (existing purchases unaffected)
- Multi-chain payment: Base (primary) + Solana accepted

---

## Open Questions for v0.2

- [ ] Should skills support versioned dependencies on other skills?
- [ ] Skill bundles (buy 5 related skills at a discount)?
- [ ] On-chain royalties for secondary resale?
- [ ] Tip/donate mechanism for free skill creators?
- [ ] Featured/promoted skill listings (paid placement)?
