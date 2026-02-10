# Work Order

Source: /home/hackerman/agent-runtime/directives/priorities/approved/approved_prop_20260210_000924_workflow_marketplace_v1.md
Updated: 2026-02-10T01:13:15.576320+00:00

# Approved Proposal: Premium workflow marketplace for ops/eng teams: run workflows via proposal→approval→receipt for safe, auditable AI operations.
project: workflow-marketplace

MASTER PROJECT PROPOSAL TEMPLATE (v1)

=====================================================================
0) COVER
- Project Name: Workflow Marketplace
- One-liner: Safety-first marketplace for AI team workflows with mandatory proposal→approval→receipt and audit-grade receipts.
- Owner / Operator: hackerman
- Status: Proposed (approval requested)
- Primary KPI: Approval-gated runs completed with receipts (weekly) + approval rate
- Target Launch Window: v1: 2–4 days (product-grade UI + simulated execution)

=====================================================================
1) EXECUTIVE SUMMARY (HUMAN READ)
- What we’re building: A curated marketplace UI for installing and running AI-powered team workflows where every run creates a proposal, requires explicit approval, and produces a signed receipt.
- Who it’s for: Ops/Engineering leads and Operators who need fast automation without losing control; Builders who publish workflows with clear schemas and metadata.
- Why it wins (differentiator): Safety-by-default: no execution without approval; every step is auditable with immutable-ish receipts and consistent status semantics.
- What it replaces / competes with: Internal scripts + Zapier-style automation + ad-hoc agent runs in chat tools without governance.
- Expected outcome: Teams can browse workflows, submit validated runs, approve/reject with rationale, and inspect receipts + metrics in a premium SaaS-grade UI.

=====================================================================
2) PROBLEM → SOLUTION FIT
- The problem (plain language):
  - Teams want AI acceleration but cannot trust autonomous side effects or opaque agent output.
  - Current agent usage lacks consistent approvals, audit trails, and repeatable configuration UX.
  - Operators need a single queue and receipt log to safely review and understand what happened.
- The solution (plain language):
  - Marketplace catalog with workflow details, tags, and dynamic input forms from JSON schema.
  - Mandatory proposal object created on every run attempt; status gates enforce approval before execution.
  - Receipt objects capture signed intent, inputs, approval decision, outputs, timestamps, and run status.
  - Metrics dashboard for volume and approval rates to build confidence and operational visibility.
- Non-goals (explicitly NOT building):
  - Real external side effects or integrations (v1 uses a safe simulator only).
  - Payments, billing, or marketplace monetization.
  - Full multi-tenant RBAC; assume single operator identity for v1.

=====================================================================
3) USER STORIES (MINIMAL BUT COMPLETE)
- As an ops/eng lead, I want to browse workflows by category and tags so that I can quickly find a workflow that fits a team task.
- As a user, I want to configure a workflow via a clear validated form so that I can submit a correct run without guesswork.
- As an operator, I want an approval queue with clear diffs/context so that I can safely approve or reject with rationale.
- As an operator, I want to inspect a receipt with inputs/decision/output so that I can audit what happened and why.
- As a lead, I want a metrics view (runs, approvals, outcomes) so that I can track adoption and safety performance.

=====================================================================
4) FEATURE SCOPE (3 TIERS)
MVP (must ship):
- [ ] Catalog + workflow detail pages with dynamic input form rendering and validation; submit creates proposal (pending).
- [ ] Approvals queue + receipts log + metrics dashboard; simulator executes only after approval and emits signed receipts.

V1 (immediately after MVP):
- [ ] Audit event timeline per proposal (created/approved/rejected/executed) and richer receipt presentation (pretty JSON + schema-aware rendering).
- [ ] TBD (needs decision)

Later (nice-to-have / experimental):
- [ ] Builder publishing flow (submit workflow schema + metadata) with review and versioning.
- [ ] Policy engine (per-workflow approval rules, quorum, and allowlisted actions) + external execution bridge/webhooks.

=====================================================================
5) UX / PRODUCT REQUIREMENTS (HUMAN-DIGESTIBLE)
Core screens / routes (map):
- / (Catalog)
- /workflows/[slug]
- /proposals (Approval Queue)
- /proposals/[id]
- /receipts
- /metrics
Key interactions (bullets, not essays):
- Catalog search/filter with category chips and tag pills; featured workflows above fold.
- Schema-driven form with inline validation, helper text, and clear primary CTA (Create proposal).
- Approval decision with required rationale and immediate status badge update.
- Receipt viewer with structured sections: Intent, Inputs, Decision, Output, Timeline.
Edge-case UX rules (top 10 only):
- Invalid input payload (missing required / wrong type) returns friendly field-level errors.
- Attempt to execute without approval is blocked server-side and logged as an audit event.
- Double-approval or conflicting decisions: first decision wins; subsequent attempts return 409 with current state.
- Deleted/unknown workflow slug shows a designed empty state with navigation back to catalog.
Accessibility + mobile stance:
- Mobile-first / Desktop-first / Both: WCAG-minded: high contrast, clear focus rings, semantic headings, readable font sizes.
- Keyboard nav required? All interactive controls reachable via Tab; forms submit via Enter; modals/drawers escape-close.

=====================================================================
6) DESIGN STRATEGY (UNIQUE PER PROJECT: PSYCHOLOGY + TECH-DRIVEN)
Design thesis (1–2 sentences):
- Reduce fear and cognitive load by turning agent runs into a familiar procurement-style workflow: configure → submit → approve → receive a signed receipt.
User psychology (pick 2–4 primary drivers):
- Trust through legibility: consistent status badges, timelines, and receipts that look official.
- Friction in the right place: approval gate is mandatory, but configuration is fast and guided.
- Progress certainty: users always know what state they are in and what happens next.
- Safety cues: explicit “No side effects in v1” copy and “Simulator” labeling where relevant.
Product “jobs” the design must accomplish:
- Find a workflow quickly and understand what it does.
- Submit a run confidently with validated inputs.
- Review and approve safely with context and accountability.
- Audit outcomes later with receipts and metrics.
Tech-informed constraints (design must respect these):
- No real external side effects; simulator only.
- Must enforce proposal→approval→receipt invariant on server.
- File-backed JSON acceptable for MVP; must still feel product-grade.
- No filler/lorem UI; seed realistic workflow data and sample outputs.
- Keep navigation consistent and pages complete (no blank states).
Visual identity direction (unique, not templated):
- Brand archetype: The Auditor-Operator: calm, premium, trustworthy, precise.
- UI density: Medium: card-based layouts with generous spacing and readable typography.
- Typography stance: Modern sans (system font stack) with clear hierarchy (H1/H2, muted helper text).
- Motion stance: Subtle: hover elevation, badge transitions, optimistic UI for decisions with clear confirmation.
Interaction patterns (only what fits this product):
- Top navigation with persistent page title + secondary description.
- Status badges: Pending (amber), Approved (blue), Rejected (red), Executed (green), with icon + tooltip.
- Two-pane detail pages: summary header + tabs/sections for inputs, approvals, receipts.
- Empty states: actionable, designed, and never blank (e.g., “No pending approvals” with link to catalog).
Design deliverables (must exist):
- High-fidelity UI implementation (catalog, detail, approvals, receipts, metrics) with consistent components.
- Seed dataset of 5 workflows with realistic schemas and outputs.
- Signed receipt format + server enforcement with audit events.
- README with setup, usage, and safety model explanation.

=====================================================================
7) SYSTEM OVERVIEW (ARCHITECTURE AT A GLANCE)
High-level diagram (text):
- Browser (Next.js) → API routes (Next.js server) → Storage (JSON files or Postgres) → Simulator worker (in-process) → Receipts/Metrics
Major components:
- Frontend: Next.js App Router UI, component library (shadcn/ui or equivalent), schema-form renderer
- Backend/API: Next.js API routes with validation (Zod + JSON Schema validation)
- Database: MVP: file-backed JSON store; option to swap to Postgres (Supabase) without changing API contracts
- Worker/cron: Execution simulator invoked after approval; produces deterministic outputs and receipts
- Storage/CDN: Local filesystem for JSON + optional blob storage for exported receipts
- Auth: Single-operator identity (header-based or local dev auth); actor recorded on actions
- Payments (if any): None (non-goal)
- Onchain (if any): None (non-goal)
- Observability: Structured server logs + basic request timing; error counters for metrics

=====================================================================
8) DATA MODEL (ONLY WHAT MATTERS)
Core entities (tables/collections):
Entity: Workflow
- Purpose: Defines a runnable workflow with schemas and metadata for discovery and form generation.
- Key fields: id, slug, name, description, category, tags[], inputs_schema, outputs_schema, icon, created_at
- Indexes: slug (unique), category, tags (inverted index or scan filter)
- Relationships: Workflow 1→N Proposal
- Retention: Keep indefinitely (catalog history).
Entity: Proposal
- Purpose: Represents a requested run with validated inputs; must be approved before execution.
- Key fields: id, workflow_id, input_payload, status, created_by, created_at
- Indexes: status, created_at, workflow_id
- Relationships: Proposal N→1 Workflow, Proposal 1→0..1 Approval, Proposal 1→0..1 Receipt
- Retention: Keep 90+ days (configurable); receipts may be retained longer.
Entity: Approval
- Purpose: Records an operator decision and rationale, forming the governance checkpoint.
- Key fields: id, proposal_id, decision, approved_by, rationale, created_at
- Indexes: proposal_id (unique), created_at
- Relationships: Approval N→1 Proposal
- Retention: Keep as long as proposal/receipt exists.
Entity: Receipt
- Purpose: Audit-grade record of an executed (or attempted) run with signed intent artifact.
- Key fields: id, proposal_id, output_payload, run_status, signed_intent, created_at
- Indexes: proposal_id (unique), created_at, run_status
- Relationships: Receipt N→1 Proposal
- Retention: Keep 180+ days (configurable) for audit and metrics.

=====================================================================
9) API SPEC (CONTRACT-LEVEL, NOT OVER-VERBOSE)
- Auth method: Local dev auth: X-Actor header (defaults to 'operator@local') recorded in audit fields.
- Rate limits: Local-only soft limits: 60 req/min per IP; 10 create/approve actions per minute.
Endpoints (grouped):
- GET /api/workflows — List workflows with search and filters.
  - Request: { search?: string, category?: string, tag?: string }
  - Response: { workflows: WorkflowSummary[] }
  - Errors: ['400 invalid query']
- GET /api/workflows/[slug] — Fetch a workflow detail including schemas for form rendering.
  - Request: path: slug
  - Response: { workflow: Workflow }
  - Errors: ['404 not found']
- POST /api/proposals — Create proposal after validating payload against workflow inputs_schema.
  - Request: { workflow_slug: string, input_payload: object, created_by?: string }
  - Response: { proposal: Proposal }
  - Errors: ['400 schema validation failed', '404 workflow not found']
- GET /api/proposals — List proposals by status for approval queue and history.
  - Request: { status?: 'pending'|'approved'|'rejected'|'executed' }
  - Response: { proposals: ProposalSummary[] }
  - Errors: ['400 invalid status']
- POST /api/approvals — Approve/reject a pending proposal; if approved, triggers simulator to create receipt and mark executed.
  - Request: { proposal_id: string, decision: 'approved'|'rejected', rationale: string, approved_by?: string }
  - Response: { proposal: Proposal, approval: Approval, receipt?: Receipt }
  - Errors: ['400 missing rationale', '409 proposal not pending', '404 proposal not found']
- GET /api/metrics — Aggregate counts and approval rates for dashboards.
  - Request: { window?: 'day'|'week'|'month' }
  - Response: { proposals: number, approvals: number, receipts: number, approval_rate: number, series: { date: string, proposals: number, approvals: number, receipts: number }[] }
  - Errors: ['400 invalid window']

=====================================================================
10) BUSINESS LOGIC RULES (THE “TRUTH TABLE”)
Critical invariants:
- A proposal must exist before any execution; direct receipt creation is forbidden.
- Only pending proposals can be approved/rejected; decisions are immutable once written.
- A receipt can only be created for an approved proposal, and proposal must transition to executed.
- All state transitions emit an audit event (at least: proposal_created, approval_written, receipt_created).
State machine (if applicable):
- pending, approved, rejected, executed
Allowed transitions + by who + why:
- pending → approved (via approval decision=approved)
- pending → rejected (via approval decision=rejected)
- approved → executed (via simulator receipt creation)
Anti-abuse rules:
- Require non-empty rationale for all approvals/rejections (min 10 chars).
- Idempotency: approvals are unique per proposal; subsequent attempts return current decision.
- Server-side schema validation; reject unknown fields if schema sets additionalProperties=false.
- Audit actor attribution from X-Actor and IP for all write actions.

=====================================================================
11) SECURITY & RISK (PRACTICAL)
Threat model summary (top risks only):
- Bypass approval gate by calling internal simulator path or creating receipts directly.
- Tampering with stored JSON files to forge approvals/receipts.
- Injection/unsafe rendering of user-provided text in receipts and workflow descriptions.
- Denial via excessive proposal creation causing file bloat and slow listing.
Mitigations:
- Single write path: receipt creation only in approval handler after approved state check; no public endpoint for receipts creation.
- Signed intent: include HMAC signature over (proposal_id, workflow_id, input_payload hash, approval_id, timestamp) using server secret; verify on read.
- Sanitize/escape all rendered text; render JSON with safe pretty viewer; disallow HTML in descriptions.
- Pagination + soft rate limits; cap stored proposals/receipts per day in dev; metrics computed incrementally/cached.

=====================================================================
12) OPS SPEC (HOW THIS RUNS IN REAL LIFE)
Environments:
- local-dev
- local-prod-like (single machine)
Deploy strategy:
- Frontend: Next.js build and run (node) with static assets served by Next.
- Backend: Next.js API routes (same process) for simplicity; can split later.
- Workers: In-process simulator triggered by approval; no separate worker required for v1.
Secrets management:
- Local .env for HMAC signing secret and optional admin token; never committed.
Monitoring + alerts:
- High error rate on POST /api/proposals schema validation failures (indicates UX mismatch).
- Any 5xx rate above 1% over 15 minutes.
- Receipt signature verification failures (possible tampering/bug).
- Queue health: pending proposals older than 24h count.
Runbooks (short):
- If receipt signature failures: rotate secret only if necessary; note old receipts will not verify—prefer fixing bug first.
- If approvals stuck pending: inspect proposal status transitions and audit events; re-run simulator for approved proposals without receipts.
- If metrics incorrect: rebuild metrics from stored entities by re-aggregating series; compare counts to raw entity totals.
- If listing slow: enable pagination + cache workflow list; prune old proposals beyond retention.

=====================================================================
13) TECH STACK & LIBRARIES (PINNED CHOICES)
- Frontend: TypeScript, Next.js (App Router), Tailwind CSS, shadcn/ui, React Hook Form
- Backend: Next.js API routes, Zod, AJV (JSON Schema validation)
- DB: File-backed JSON store (MVP), Optional: Postgres/Supabase (swap-in)
- Queue/cron: None (v1); in-process simulator
- Infra/hosting: Node runtime (local), Vercel optional later
- Wallet/auth (if web3): None
- Analytics: Server-side metrics endpoint + optional PostHog later
Version pinning rules:
- Node version: 20.x
- Lockfile required: Yes (pnpm-lock.yaml or package-lock.json)
- Lint/test required: Yes (eslint + basic API tests)

=====================================================================
14) BUILD PLAN (MILESTONES + DELIVERABLES)
M1 — Data + API contract (Safety core)
- Implement file-backed repositories for workflows/proposals/approvals/receipts (+ optional audit events).
- Implement schema validation on POST /api/proposals using workflow.inputs_schema.
- Implement POST /api/approvals with state checks + rationale requirement + idempotency.
- Implement receipt signing (HMAC) and verification on read.
M2 — Marketplace-grade UI (Core flows)
- Catalog page with search/filter/tags + featured section + premium cards.
- Workflow detail page: description, metadata, dynamic form, validation, submit creates pending proposal.
- Approval queue + proposal detail with clear context, rationale input, approve/reject with confirmation.
- Receipts list + receipt detail view with structured sections and status badges.
M3 — Simulator + Metrics (Utility + confidence)
- Simulator outputs for 5 seed workflows with realistic structured outputs (no lorem).
- Metrics dashboard: counts + approval rate + simple trend series (day/week).
- Polish: empty states, loading states, error messages, consistent navigation.
M4 — Hardening + Ship
- Add basic tests: schema validation, approval gating, receipt signature verification.
- Add retention/pruning script (manual) and pagination in list endpoints.
- Write README: safety model, demo script, architecture, seed workflows and schemas.

=====================================================================
15) ACCEPTANCE CRITERIA (DEFINITION OF DONE)
MVP is done when:
- [ ] All five pages work end-to-end: catalog → detail → create proposal (pending) → approve/reject with rationale → approved creates executed receipt.
- [ ] Server enforces invariant: cannot create receipt or execute simulator without an approved proposal (attempts return 409/403).
- [ ] Dynamic form renders from JSON schema with human-friendly errors and required/type validation.
- [ ] UI is premium and complete: consistent nav/layout, realistic seed data, designed empty/loading/error states (no filler/lorem).
V1 is done when:
- [ ] Audit timeline is visible per proposal and receipts verify a signed intent signature successfully.

=====================================================================
16) OPEN QUESTIONS / DECISIONS NEEDED
- Storage decision for v1: stay file-backed JSON only or ship with Postgres/Supabase from day one (affects deployment and data access patterns).
- Auth decision: is X-Actor header sufficient, or should we add a simple local login (single operator) to prevent accidental shared-machine actions?
- Do we require approval for every workflow always, or allow per-workflow policy toggles (still default-on) in v1?

=====================================================================
17) APPENDICES (OPTIONAL)
- Seed workflow set (v1): Bug Triage, Weekly Status Digest, QA Checklist Runner, Onboarding Guide, Incident Summary.
- Signed intent payload fields (suggested): intent_version, proposal_id, workflow_slug, input_hash, approval_id, actor, issued_at, signature.

