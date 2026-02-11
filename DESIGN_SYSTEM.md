# Design System — Workflow Marketplace

This document is the single source of truth for all visual and interaction decisions.
Every UI component, page, and style MUST follow these rules exactly.

---

## 1. Design Philosophy

**Archetype:** "The Auditor-Operator" — calm, premium, trustworthy, precise.

**Core principles:**
- Trust through legibility — every state is visible, every action is traceable
- Friction in the right place — approval is mandatory but configuration is fast
- Progress certainty — the user always knows where they are and what happens next
- Visual density: medium — generous whitespace, never cramped, never empty
- Every screen earns its pixels — no decorative-only elements, everything communicates

**Quality bar:** This is a SaaS product that competes with Linear, Vercel, and Stripe dashboards.
If a component wouldn't look right on those products, it doesn't ship here.

---

## 1b. Page Composition Patterns (VISUAL IMPACT)

Every application must look investment-worthy. The following patterns are MANDATORY for the landing/home page and STRONGLY RECOMMENDED for all pages.

### Hero Section (REQUIRED on home/landing page)
The hero is the first thing a user sees. It must create immediate visual impact.

```
Structure:
┌─────────────────────────────────────────────────────────────┐
│  .hero (dark gradient bg: navy → indigo → navy)             │
│                                                             │
│  [eyebrow pill: "● Status text"]                           │
│                                                             │
│  Large Headline (3rem, 800 weight)          [Floating       │
│  with gradient-colored accent text           visual:        │
│                                              pipeline       │
│  Subtitle paragraph (muted, 1.125rem)        steps or      │
│                                              card stack]    │
│  [CTA Primary]  [CTA Secondary]                            │
│                                                             │
│  ::before — radial gradient glow (top-right)               │
│  ::after — radial gradient glow (bottom-left)              │
└─────────────────────────────────────────────────────────────┘
```

**Rules:**
- Background: `linear-gradient(135deg, #0f0f1a 0%, #1a1a3e 40%, #2d1b69 70%, #0f0f1a 100%)`
- Decorative glows: `radial-gradient(circle, rgba(99, 102, 241, 0.15), transparent)` positioned with `::before`/`::after`
- Headline: `3rem`, weight 800, letter-spacing `-0.035em`, white text
- Gradient text: `background: linear-gradient(135deg, #818cf8, #c084fc, #f472b6); -webkit-background-clip: text;`
- Eyebrow: pill shape, `rgba(255,255,255,0.08)` bg, pulsing green dot
- CTA Primary: accent bg with colored shadow (`0 2px 12px rgba(99, 102, 241, 0.4)`)
- CTA Secondary: ghost style with `rgba(255,255,255,0.06)` bg, subtle border
- Floating visual: glassmorphism cards with `backdrop-filter: blur(12px)`, staggered animation
- Border-radius: `--radius-xl` (16px)
- Padding: `72px 48px`
- Responsive: hide floating visual below 1024px, reduce headline to 2.25rem

### Stats Bar (REQUIRED on home/landing page)
Live metrics displayed in a horizontal grid below the hero.

```
┌──────────┬──────────┬──────────┬──────────┐
│   42     │   96%    │    3     │   18     │
│ PROPOSALS│ APPROVAL │ PENDING  │ EXECUTED │
└──────────┴──────────┴──────────┴──────────┘
```

**Rules:**
- Grid: `repeat(4, 1fr)` with 1px gap (border shows through as separator)
- Values: `1.75rem`, weight 800, letter-spacing `-0.03em`
- Labels: `0.6875rem`, uppercase, letter-spacing `0.06em`, secondary color
- Color-code values: accent for totals, green for rates, amber for pending
- Card background: white surface, no individual borders (gap creates the lines)
- Border-radius on outer container: `--radius-lg`

### Feature Cards (REQUIRED on home/landing page)
Three cards explaining core value propositions.

```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ [colored icon]  │ │ [colored icon]  │ │ [colored icon]  │
│                 │ │                 │ │                 │
│ Bold Title      │ │ Bold Title      │ │ Bold Title      │
│                 │ │                 │ │                 │
│ Description     │ │ Description     │ │ Description     │
│ text here...    │ │ text here...    │ │ text here...    │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

**Rules:**
- Grid: `repeat(3, 1fr)` with 16px gap
- Icon: 44x44px container with `border-radius: 12px`, colored background (10% opacity of accent)
- Title: `0.9375rem`, weight 600, letter-spacing `-0.01em`
- Description: `0.8125rem`, secondary color, line-height 1.6
- Hover: accent border + medium shadow
- Responsive: single column below 1024px

### Gradient Accents (USE EVERYWHERE)
- **Card top-border:** 3px `linear-gradient(90deg, #6366f1, #8b5cf6)`, hidden by default, shown on hover
- **Nav brand icon:** gradient background pill
- **Metric card top:** permanent 3px gradient bar
- **Modal animations:** fadeIn + slideUp (not instant)
- **Skeleton loading:** shimmer (gradient sliding left-to-right), NOT pulse

### Page Composition Order
For any app's home/landing page, the section order MUST be:
1. Hero section (dark, full-width within content area)
2. Stats bar (live metrics)
3. Feature cards (value propositions)
4. Main content (catalog, table, dashboard, etc.)

For interior pages (detail, form, settings), use:
1. Page header (title + subtitle)
2. Main content with appropriate loading/error/empty states

---

## 2. Color Tokens

### Brand palette
| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#f8f9fc` | Page background (light cool gray) |
| `--color-bg-subtle` | `#f0f2f8` | Subtle backgrounds (table headers, icon containers) |
| `--color-surface` | `#ffffff` | Card/panel backgrounds |
| `--color-primary` | `#0f0f1a` | Nav background, dark sections |
| `--color-accent` | `#6366f1` | CTAs, links, active states, focus rings (Indigo) |
| `--color-accent-hover` | `#4f46e5` | Hover state for accent elements |
| `--color-accent-subtle` | `rgba(99, 102, 241, 0.08)` | Hover tint on rows, chips |
| `--color-accent-glow` | `rgba(99, 102, 241, 0.15)` | Focus ring glow |
| `--color-text` | `#111827` | Primary body text |
| `--color-text-secondary` | `#6b7280` | Descriptions, hints, metadata |
| `--color-text-tertiary` | `#9ca3af` | Placeholders, disabled text |
| `--color-border` | `#e5e7eb` | Card borders, dividers, input borders |
| `--color-border-subtle` | `#f3f4f6` | Subtle dividers, card footer borders |

### Status colors (semantic, never decorative)
| Status | Foreground | Background | Text on bg |
|--------|-----------|------------|------------|
| Pending | `#f59e0b` | `#fef3c7` | `#92400e` |
| Approved | `#10b981` | `#d1fae5` | `#065f46` |
| Rejected | `#ef4444` | `#fee2e2` | `#991b1b` |
| Executed | `#4361ee` | `#e0e7ff` | `#3730a3` |

### Rules
- NEVER use raw hex in components — always use CSS variables
- Status colors ONLY for status — never use amber for decorative accents
- Accent blue is for interactive elements ONLY (buttons, links, focus rings, active chips)
- Text hierarchy: `--color-text` for primary, `--color-text-secondary` for supporting
- Borders are always `--color-border` (never darker, never invisible)

---

## 3. Typography

### Font stacks
- **Sans:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` (load Inter from Google Fonts)
- **Mono:** `'JetBrains Mono', 'SF Mono', 'Fira Code', monospace`
- Enable `-webkit-font-smoothing: antialiased` on html

### Type scale (use these exactly, never invent sizes)
| Name | Size | Weight | Letter-spacing | Usage |
|------|------|--------|---------------|-------|
| Hero headline | `3rem` | 800 | `-0.035em` | Landing page hero `<h1>` |
| Page title | `1.875rem` | 700 | `-0.025em` | Interior page headings (`<h1>`) |
| Section title | `1rem` | 700 | `-0.01em` | Section headers, card section titles |
| Card title | `1rem` | 600 | `-0.01em` | Card headings, modal titles |
| Body | `0.875rem` | 400 | normal | Default text, form inputs, table cells |
| Body strong | `0.875rem` | 600 | normal | Labels, table headers, bold inline text |
| Caption | `0.75rem` | 500–600 | `0.04em` | Badges, chips, timestamps, hints |
| Stat label | `0.6875rem` | 500 | `0.06em` | Uppercase metric labels, table headers |
| Metric value | `2.5rem` | 800 | `-0.03em` | KPI numbers (stats bar, dashboard) |

### Rules
- Line height: `1.6` for body, `1.2` for headings and metrics
- Letter spacing: `0.025em` for badges/chips, `0.05em` for table headers (uppercase)
- NEVER use font-weight 300 or 400 for labels — minimum 500
- Description text uses `--color-text-secondary`, never gray darker than `#6b7280`
- Truncate long text with `-webkit-line-clamp` (2 lines for cards, 3 for descriptions)

---

## 4. Spacing & Layout

### Spacing scale (8px base grid)
`4px · 8px · 12px · 16px · 20px · 24px · 32px · 48px · 64px`

### Component spacing rules
| Context | Value |
|---------|-------|
| Card padding | `24px` |
| Card gap in grid | `20px` |
| Form group spacing | `20px` margin-bottom |
| Section spacing | `32px` margin-bottom |
| Page padding | `32px 24px` |
| Button padding | `10px 20px` |
| Input padding | `10px 14px` |
| Badge padding | `4px 10px` |
| Chip padding | `4px 12px` |

### Border radius
- Standard elements (buttons, inputs): `8px` (`--radius`)
- Cards, search bar: `12px` (`--radius-lg`)
- Badges, chips: `20px` (fully rounded)

### Shadows (elevation system)
| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Cards at rest, inputs |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.08)` | Cards on hover, nav bar, modals |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.12)` | Popovers, dropdown menus |

### Grid system
- Max content width: `1280px`, centered with auto margins
- Card grid: `repeat(auto-fill, minmax(340px, 1fr))` with `20px` gap
- Metric cards: `repeat(auto-fill, minmax(180px, 1fr))`
- Two-column detail layout: `1fr 1fr` with `24px` gap
- Mobile breakpoint: `768px` — single column, tighter padding

---

## 5. Component Specifications

### Card
```css
background: var(--color-surface);
border: 1px solid var(--color-border);
border-radius: var(--radius-lg);    /* 12px */
padding: 24px;
box-shadow: var(--shadow-sm);
transition: box-shadow 0.2s ease, transform 0.2s ease;
```
**Hover:** `box-shadow: var(--shadow-md); transform: translateY(-2px);`
**NEVER:** Cards without borders. Cards with colored backgrounds (except status-specific contexts).

### Button
- Always `display: inline-flex; align-items: center; gap: 8px;`
- Minimum touch target: 40px height
- Variants: `btn-primary` (accent bg), `btn-success` (green), `btn-danger` (red), `btn-outline` (transparent + border)
- Disabled: `opacity: 0.5; cursor: not-allowed;`
- **NEVER** underlined text-only buttons — always visible button shape
- Icon + text buttons: icon left, text right, 8px gap

### Badge (status indicators)
- Pill shape (`border-radius: 20px`)
- Always uppercase, `0.75rem`, `font-weight: 600`
- Background + text color from status color table (section 2)
- **NEVER** outline-only status badges — always filled background

### Form inputs
- Full width within form group
- Focus state: `border-color: var(--color-accent); box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.15);`
- Required fields: label ends with ` *` in accent color
- Validation hints below input: `0.75rem`, `--color-text-secondary`
- Error messages below input: `0.75rem`, `--color-rejected`
- **NEVER** placeholder-only inputs — always have a visible label above

### Table
- Full width, `border-collapse: collapse`
- Headers: uppercase, `0.75rem`, `letter-spacing: 0.05em`, `--color-text-secondary`, `--color-bg` background
- Cells: `12px 16px` padding, `0.875rem`
- Row hover: `rgba(67, 97, 238, 0.02)` background
- Row separator: `1px solid var(--color-border)`

### Empty state
- Centered, `60px 24px` padding
- Large emoji or SVG icon (`3rem`, `opacity: 0.4`)
- Heading: `1.125rem`, `--color-text`
- Description: `0.875rem`, `--color-text-secondary`
- Optional CTA button below
- **NEVER** leave a section blank — always show an empty state with helpful messaging

### Search bar
- Icon positioned absolutely on the left (`left: 14px`)
- Input padding-left: `44px` to make room for icon
- Full width, `--radius-lg`, `--shadow-sm`
- Focus: accent border + shadow ring

### Modal / Dialog
- Backdrop: `rgba(0, 0, 0, 0.5)` with `backdrop-filter: blur(4px)`
- Modal: white bg, `--radius-lg`, `--shadow-lg`, `max-width: 480px`, `padding: 24px`
- Header: card title size, 16px margin-bottom
- Footer: `flex, justify-content: flex-end, gap: 12px`, 16px margin-top
- Close on backdrop click and Escape key
- Focus trap inside modal

---

## 6. Interaction & Motion

### Transitions
- **Default:** `all 0.15s ease` — buttons, links, chips, nav items
- **Cards:** `all 0.2s ease` — hover elevation needs slightly longer duration
- **Modals:** `opacity 0.2s ease, transform 0.2s ease` — fade + slide
- **NEVER** transitions longer than `0.3s` — the UI should feel instant

### Hover states (every interactive element MUST have one)
- Buttons: darken background by ~10%
- Cards: elevate shadow + `translateY(-2px)`
- Table rows: subtle accent background tint
- Links: underline or color shift
- Chips: fill with accent color, text to white

### Focus states (accessibility-critical)
- EVERY focusable element: `outline: none; box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.15);`
- Focus ring color ALWAYS matches accent
- Focus must be visible on keyboard navigation (`:focus-visible`)

### Loading states
- Use skeleton placeholders (pulsing gray rectangles), NEVER spinners for page content
- Buttons: disable + show "Submitting..." text, NEVER just disable silently
- Fetch errors: inline error message with retry button, NEVER blank screen

---

## 7. Page Structure Rules

### Every page MUST have:
1. **Page header** — `h1` title + subtitle description in `--color-text-secondary`
2. **Primary content area** — cards, tables, forms, or metrics
3. **Empty state** — shown when data is empty (never a blank section)
4. **Loading state** — shown while fetching (skeleton or spinner)
5. **Error state** — shown on fetch failure (message + retry)

### Navigation
- Sticky top nav, `60px` height, dark `--color-primary` background
- Brand left (icon + name), nav links right
- Active page link: white text + `rgba(255,255,255,0.1)` background
- Nav links: `rgba(255,255,255,0.75)` default, white on hover

### Responsive behavior
- Below `768px`: single-column cards, tighter padding (16px), hide brand text
- Tables: horizontal scroll wrapper on mobile
- Navigation: reduce link padding, smaller font size

---

## 8. Copy & Tone

### Voice
- Professional but approachable — "Submit Run Proposal", not "Submit" or "Create Run Request"
- Action verbs on buttons — "Approve", "Reject", "View Details", not "OK" or "Go"
- Error messages are specific — "Bug title must be at least 5 characters", not "Invalid input"
- Empty states are encouraging — "No receipts yet. Receipts appear here after proposals are approved and executed."

### Rules
- Button labels: 1–3 words, verb-first ("Create Proposal", "View Details", "Approve Run")
- Page titles: noun phrase ("Workflow Catalog", "Approval Queue", "Metrics Dashboard")
- Descriptions: one sentence, present tense ("Browse and run AI-powered workflows for your team.")
- Timestamps: relative when < 24h ("2h ago"), absolute when older ("Feb 9, 16:10")
- Numbers: no decimals for counts, one decimal for percentages ("0 Pending", "73.2% Approval Rate")

---

## 9. Accessibility

- All interactive elements reachable via keyboard (Tab order)
- Focus visible on `:focus-visible` (never hide focus rings)
- Color contrast: minimum 4.5:1 for text, 3:1 for large text
- Status NEVER communicated by color alone — always include text label
- Form inputs ALWAYS have associated `<label>` elements
- Images/icons have `alt` text or `aria-label`
- Modals trap focus and close on Escape
- Buttons have `type="button"` (never implicit submit)
