# Role mapping and model notes

## Source and scope

The supplied two-page PDF is titled “Industry Growth Manager - Enterprise Applications & AI,” Orane Consulting. It describes hunt/grow/retain/advise/own responsibilities, enterprise technology, multiple international geographies, CRM discipline and commercial targets. It asks for 2-5 years of relevant B2B sales experience. This project supports a learning/portfolio story; it does not establish that experience. The employer's partnership, compensation or scale claims were not independently researched for this build and are not used as project evidence.

| JD responsibility | Implemented demonstration | Evidence to show | Not established |
|---|---|---|---|
| Hunt target accounts and qualify interest | Fictional account attributes, fit-score reasons, BANT and required next action | Filter accounts, inspect score and trigger qualification validation | Real prospect research, outbound replies or customer acquisition |
| Grow through upsell and cross-sell | Existing-customer flag, solution category and editable discovery/expansion next step | Open Cedar and capture a new-use-case hypothesis after reviewing adoption | Product recommendation accuracy, actual upsell or multiple-contract hierarchy |
| Retain and renew | Upcoming-renewal focus and persistent delivery/renewal notes | Two due renewals at the seeded snapshot | Actual retention improvement or customer satisfaction measurements |
| Advise in business terms | Product-specific discovery prompts and cost/benefit calculator | Vary adoption and discuss conservative ROI | Presales certification, SAP expertise or actual financial benefits |
| Own CRM discipline, forecast and revenue targets | SQLite persistence, qualification guardrails, stale-write checks, weighted forecast and exports | Fix a fictional slipped close date and explain the forecast delta | CRM-vendor integration, target attainment or recognized revenue |
| International markets | Five geographic labels and region filtering | Compare region cohorts | Live FX, cross-time-zone scheduling or international customer experience |
| AI-assisted sales tools | Rule-based discovery-brief scaffolding for ERP/HCM/cloud/AI solutions | Explain the rules and their limits | LLM integration, LinkedIn Sales Navigator use or machine-learning predictions |

## Opportunity model

Each record is one opportunity with account attributes embedded in it. The SQLite accounts table stores an ID, validated JSON payload and monotonically increasing version. Activities store a parent opportunity ID, note and UTC timestamp. A tiny metadata table prevents reseeding an initialized empty database. This is a deliberate local-prototype tradeoff; normalized account/contact/contract tables are future work.

## Forecast formula

For open opportunities with close date d within the inclusive interval [snapshot date, snapshot date + 90 days]:

`weighted forecast = sum(opportunity value x stage probability)`

The probabilities are illustrative assumptions: Research .05, Qualified .20, Discovery .40, Proposal .65, Negotiation .80. Closed Won and Lost are excluded from open forecast; their values are not included twice. Undated and overdue open opportunities still count toward all-open pipeline but not the dated forecast. The UI date changes the scenario window, not the machine clock or activity timestamps.

Default forecast on 2026-11-13:

| Fictional opportunity | Value INR | Probability | Weighted INR | Included? |
|---|---:|---:|---:|---|
| Aster | 4,200,000 | .65 | 2,730,000 | Yes |
| Cedar | 3,000,000 | .40 | 1,200,000 | Yes |
| Harbor | 1,800,000 | .20 | 360,000 | Yes |
| Quartz | 5,500,000 | .80 | 4,400,000 | Yes |
| Maple | 800,000 | .05 | 40,000 | No: closes after window |
| Summit | 1,200,000 | .40 | 480,000 | No: close date overdue |
| Lumen / Willow | Closed | 1 / 0 | Not used | No: closed |

Included total: **INR 8,690,000**. All-open face value: **INR 16,500,000**. Fictional won bookings: **INR 2,400,000**. All-closed win rate: one Won / two closed = **50%**. These are correctness fixtures, not performance metrics achieved by the user.

## ROI formula

`annual capacity value = monthly hours x loaded hourly cost x 12 x adoption / 100`

`year-one cost = implementation + annual recurring cost`

`year-one net value = annual capacity value - year-one cost`

`ROI % = year-one net value / year-one cost x 100` (undefined for zero cost)

`simple payback months = implementation / ((annual capacity value - annual recurring cost) / 12)` (not available when monthly net benefit is zero/negative)

Default 800 hours, INR 600/hour, 50% adoption, INR 600,000 recurring and INR 900,000 implementation produces annual capacity value INR 2,880,000, year-one net INR 1,380,000, 92% ROI and 4.7-month simple payback. This is an undiscounted approximation, assumes constant immediate run rate, and excludes taxes, financing, risk, benefits ramp and residual value. Time saved may be capacity rather than actual cost reduction.

## Priorities for a production successor

1. Normalize accounts/contacts/opportunities/contracts and add auditable stage-change history.
2. Add authentication, authorization, encrypted deployment and proper backups.
3. Use approved customer data with consent and retention rules; integrate a real CRM only under explicit authorization.
4. Calibrate probabilities using historical cohorts and compare forecast error over time.
5. If adding an LLM, use a governed provider, ground drafts in approved facts, show uncertainty and require human review. Do not let generated text send itself.

None of these successor features are represented as already implemented.
