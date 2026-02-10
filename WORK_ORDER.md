# Work Order: Workflow Marketplace v2

## Project Overview
Build a production-quality workflow marketplace web application where AI-powered team workflows are discoverable, configurable, and safely run using mandatory approvals and signed receipts. Every run follows: Proposal → Approval → Simulated Execution → Receipt.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Styling:** CSS (globals.css, no Tailwind — use custom design system)
- **Data:** File-backed JSON storage under /data directory
- **Language:** JavaScript (not TypeScript)
- **Node:** 20.x

## Core Architecture

### Data Model
1. **Workflow** — Marketplace listing: id, slug, name, description, category, tags[], inputs_schema, outputs_schema, icon, created_at
2. **Proposal** — Pending run intent: id, workflow_id, workflow_slug, input_payload, status (pending|approved|rejected|executed), created_by, created_at
3. **Approval** — Decision record: id, proposal_id, decision (approved|rejected), approved_by, rationale, created_at
4. **Receipt** — Execution artifact: id, proposal_id, output_payload, run_status (success|failed), signed_intent, created_at

### State Machine
- pending → approved (via approval decision=approved)
- pending → rejected (via approval decision=rejected)
- approved → executed (via simulator creating receipt)

### Critical Invariant
No Receipt can exist without a corresponding Approval with decision=approved. Proposals are immutable once decided.

## Routes & Pages

### API Routes (Next.js Route Handlers)
- `GET /api/workflows` — List workflows with optional ?search=&category=&tag= filtering
- `GET /api/workflows/[slug]` — Get workflow detail by slug
- `POST /api/proposals` — Create proposal (validates input_payload against workflow inputs_schema)
- `GET /api/proposals` — List proposals with optional ?status= filter
- `GET /api/proposals/[id]` — Get proposal detail with linked approval/receipt
- `POST /api/approvals` — Approve or reject a proposal (creates receipt on approval via simulated execution)
- `GET /api/receipts` — List all receipts
- `GET /api/metrics` — Aggregate metrics (counts, approval rate, trends)

### UI Pages
- `/` — Catalog: search bar, category/tag filter chips, workflow cards grid with icon, name, description, category badge, "View" CTA
- `/workflows/[slug]` — Workflow detail: full description, inputs_schema rendered as dynamic form with validation, "Submit Run" button creating proposal
- `/approvals` — Approval queue: filterable list of proposals with status badges, click to expand/approve/reject with rationale
- `/approvals/[id]` — Proposal detail: shows workflow context, input payload, status, approval form (if pending), linked receipt (if executed)
- `/receipts` — Receipts log: list of executed receipts with expandable output payload viewer (human summary + raw JSON toggle)
- `/metrics` — Dashboard: KPI cards (total proposals, approval rate, executed count), trend charts, breakdown by workflow

### Layout
- Shared layout with sticky top navigation bar: brand (⚡ Workflow Marketplace), nav links (Catalog, Approvals, Receipts, Metrics)
- Responsive design, clean typography, consistent spacing

## Seed Data
Create 5 realistic workflows with concrete schemas:
1. **bug-triage** — AI Bug Triage: categorize and prioritize bug reports. Inputs: title, description, severity, component
2. **weekly-status** — Weekly Status Digest: generate team status summary. Inputs: team_name, date_range, include_metrics
3. **qa-checklist** — QA Checklist Generator: create testing checklist from requirements. Inputs: feature_name, requirements_text, test_types[]
4. **onboarding-guide** — Onboarding Guide: generate role-specific onboarding plan. Inputs: role, department, start_date
5. **incident-summary** — Incident Summary: create post-incident report. Inputs: incident_id, severity, affected_systems[], timeline_text

## Storage Layer
- `/data/workflows.json` — Array of workflow objects (seeded)
- `/data/proposals.json` — Array of proposal objects (starts empty [])
- `/data/approvals.json` — Array of approval objects (starts empty [])
- `/data/receipts.json` — Array of receipt objects (starts empty [])
- All reads/writes use atomic JSON file operations (read, parse, modify, write)
- Generate UUIDs for all entity IDs

## Design Requirements
- Premium, production-grade UI — no placeholder content, no lorem ipsum
- Color palette: dark sidebar/nav (#1a1a2e primary), white/light card backgrounds, accent blue (#4361ee), green for approved, red for rejected, amber for pending
- Status badges with consistent colors: pending=amber, approved=green, rejected=red, executed=blue
- Card-based layouts with subtle shadows and hover effects
- Clean form styling with inline validation and error states
- Responsive breakpoints for mobile/tablet/desktop
- Breathable spacing, clear visual hierarchy

## Simulator
When a proposal is approved, the simulator runs immediately (in the approval API handler):
1. Generates deterministic output based on workflow + inputs (use hash of proposal ID for consistency)
2. Creates a receipt with output_payload and run_status=success
3. Updates proposal status to "executed"
4. Stores signed_intent as canonical JSON string of {proposal_id, workflow_id, input_payload, approved_by}

## Non-Goals (v1)
- Real external side effects (simulation only)
- Payments/billing
- Multi-tenant auth (single operator)
- Builder publishing portal
- TypeScript (use plain JavaScript)
