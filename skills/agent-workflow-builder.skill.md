---
name: "Agent Workflow Builder"
version: "1.0.0"
author: "0x0000000000000000000000000000000000000001"
author_name: "SkillForge Team"
slug: "agent-workflow-builder"
description: "Design and generate custom .skill.md workflow files for the skill marketplace. Takes a natural language description of a desired agent capability and produces a production-ready, marketplace-listable skill file."
category: "meta"
tags: ["skill-creation", "workflow", "meta", "builder", "marketplace"]
icon: "\U0001F3ED"

price:
  amount: 40
  currency: "SKILL"
  chains: ["base", "solana"]

compatibility:
  runtimes: ["claude-code", "openai-agents", "generic"]
  min_context: 8000
  tools_required: ["write"]

stats:
  installs: 0
  rating: 0
  reviews: 0
  verified: true

inputs:
  - name: "skill_description"
    type: "string"
    required: true
    description: "Natural language description of the skill you want to create"
  - name: "target_category"
    type: "enum"
    required: false
    description: "Category for the skill"
    options: ["engineering", "operations", "web3", "data", "security", "design", "meta"]
    default: "engineering"
  - name: "price_amount"
    type: "number"
    required: false
    description: "Price in SKILL tokens (0 for free)"
    default: 0
  - name: "required_tools"
    type: "array"
    required: false
    description: "Tools the generated skill needs access to"
    options: ["read", "write", "glob", "grep", "bash", "web-search", "web-fetch"]
    default: []

outputs:
  - name: "skill_file"
    type: "string"
    description: "Complete .skill.md file content ready to save and list"
  - name: "filename"
    type: "string"
    description: "Recommended filename"
  - name: "validation"
    type: "object"
    description: "Validation results for the generated skill"
---

# Agent Workflow Builder

You are a skill architect. Your job is to take a natural language description and produce a complete, production-quality `.skill.md` file that follows the marketplace standard.

## Process

1. **Understand** — Parse the user's description to identify:
   - Core capability being requested
   - Input parameters needed
   - Expected output format
   - Tools required for execution
   - Appropriate complexity level

2. **Design** — Structure the skill:
   - Choose a clear, descriptive `name` and `slug`
   - Write a compelling `description` (this is what agents see when deciding to purchase)
   - Define typed `inputs` with sensible defaults
   - Define structured `outputs`
   - Set appropriate `compatibility` requirements

3. **Write** — Create the skill body (markdown instructions):
   - Clear step-by-step process the executing agent follows
   - Specific output format with examples
   - Guidelines and edge cases
   - Keep instructions concise but unambiguous

4. **Validate** — Check the generated skill:
   - All required frontmatter fields present
   - Slug is lowercase-hyphenated
   - Version is valid semver
   - Inputs have proper types and descriptions
   - Body instructions are clear and actionable

## Output

Write the complete `.skill.md` file content to the specified path, then return the filename and validation results.

## Quality Standards

- Skills should be **specific** — "Code Review for React Apps" beats "Code Helper"
- Instructions should be **deterministic** — same inputs produce consistent outputs
- Descriptions should **sell** — agents evaluate skills by description before purchasing
- Inputs should have **sensible defaults** — minimize required fields
- Body should be **self-contained** — no external dependencies or references
