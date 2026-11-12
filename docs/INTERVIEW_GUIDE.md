# Interview and practice guide

## Your positioning

This is a project connecting IT implementation with business-development operations. It is not a substitute for the 2-5 years of enterprise B2B sales requested in the role. Do not say you owned a real territory, sold SAP or won these fictional customers.

A truthful introduction after you have worked through the app:

> I studied the account-growth workflow in an enterprise-applications sales role and worked through an AI-assisted portfolio build called Enterprise Growth Desk. It uses fictional accounts to demonstrate qualification, forecast hygiene, renewals and a business case. I can show the implemented workflow and explain the assumptions. I am still seeking real commercial experience.

Only say you modified, implemented or tested a component if you actually did that part. Be ready to identify the assistance used and your own contribution.

## Five-minute demonstration

### 0:00-0:45 | Business problem

Enterprise-sales records can look healthy while hiding missing qualification, slipped close dates and unsupported benefit claims. The project makes those gaps visible. It follows five tasks in the supplied JD: hunt, grow, retain, advise and own.

### 0:45-1:45 | Hunt and qualify

Filter by India, then open Aster Demo Manufacturing. Explain the fit-score components and show the BANT fields. Change a new opportunity to Qualified without supplying evidence: the server should reject it. Explain why checking boxes is not proof in the real world. A seller must validate budget, authority, need and timing with the customer.

The score is deliberately inspectable: 25 points for 500+ employees (10 otherwise), 25 for documented pain, 20 for a decision maker, 30 distributed over the four BANT fields. This scoring rule is not trained or calibrated. A small company is not automatically a poor customer, and a lost deal can still have high fit.

### 1:45-2:45 | Own the forecast

At 2026-11-13, open pipeline totals INR 16,500,000 while the 90-day weighted forecast is INR 8,690,000. These are demo totals, not your achievements.

Show Summit's overdue close date. It remains in open pipeline but is excluded from the expected-close window. After validating the date in your fictional exercise, move it to 2026-12-05. Its INR 1,200,000 at 40% adds INR 480,000 to the forecast. The result becomes INR 9,170,000. A real manager would not simply move the date to make the forecast look better; they would reconfirm with the buyer and record evidence.

### 2:45-3:30 | Grow and retain

Filter to renewals. Cedar and Quartz are due within 90 days of the demo snapshot. For Cedar, write a fictional note asking about onboarding outcomes, adoption, support issues and the renewal decision date. Only then explore another use case. A new opportunity can represent expansion, but the app does not model separate contract line items or compute a real retention rate.

### 3:30-4:30 | Advise

Open Business case. Explain the difference between capacity value and cash savings. A workflow may free hours without reducing payroll. At the default assumptions, annual capacity value is INR 2,880,000; year-one costs are INR 1,500,000; net value is INR 1,380,000; ROI is 92%.

Lower realized automation/adoption to 25%. Annual capacity value drops to INR 1,440,000, below the first-year cost, and net value becomes INR -60,000. The right response is to validate scope, lower cost or improve the case, not promise the original ROI.

### 4:30-5:00 | Limits and next steps

Open Project guide. There is no live CRM connector, generative model, real customer data or external outreach. The product-specific brief is a transparent rule-based checklist. Production work would require authentication, permissions, a proper audit trail, governed data, calibrated forecasts and delivery-team validation.

## Discovery exercise: HCM expansion

Use Cedar Demo Healthcare. All personas below are fictional.

- HR owner: What part of onboarding causes the most delay? What is the measured baseline?
- IT/security: Where are employee records stored? Which data-residency and access constraints apply?
- Finance/procurement: Is there an approved budget? Who signs and when?
- Delivery team: Is the existing deployment healthy? Which issues should be fixed before discussing expansion?
- Sponsor: What outcome would justify renewal? What would make the project fail?

Document uncertainty instead of inventing answers. Do not claim knowledge of SAP SuccessFactors implementation from this exercise.

## Discovery exercise: AI invoice pilot

Use Summit Demo Textiles. The app provides questions, not model inference.

1. Count monthly invoices and current handling time using an agreed sample.
2. Establish error rates and the cost of incorrect extraction.
3. Confirm data rights, access, retention and human review.
4. Define a narrow pilot, accuracy threshold and exception routing with presales.
5. Estimate benefit under conservative adoption, not a best-case sales number.
6. Agree who owns rollout and how the result will be measured.

The app does not process invoices or benchmark AI accuracy. Those would be a separate technical project.

## Questions you should be able to answer

**Why isn't the fit score a win probability?**
Fit describes a chosen target profile and completeness signals. Winning depends on competition, procurement, price, urgency and trust. This heuristic has no learned historical calibration.

**Why use a weighted forecast?**
It illustrates opportunity value multiplied by an assumed stage probability, within an explicit date window. It is a planning aid, not committed revenue. Won deals are shown separately.

**Why are won bookings not recognized revenue?**
Booking a contract and recognizing accounting revenue are different. This sandbox only sums fictional Won opportunity values. It has no billing or accounting integration.

**Why is a lost account still highly scored?**
A good-fit organization can defer budget, choose a competitor or fail procurement. The score is intentionally separate from commercial outcome.

**What does BANT miss?**
It does not fully represent competitive strategy, multistakeholder politics, procurement gates, legal review or delivery risk. Another possible improvement is a richer qualification model; do not claim it is already implemented.

**What is the data model?**
One record represents one opportunity and includes account attributes. Activities reference opportunity IDs. This simplifies the demo but duplicates account facts if several opportunities belong to the same account. A production model would separate accounts, contacts, opportunities and contracts.

**How do changes persist?**
The Python server validates input and saves JSON-backed records in SQLite using parameterized SQL. A version field rejects stale updates. Activity notes are separate rows. Browser reloads read persisted data.

**What is the security scope?**
Local-only binding, exact host checks, a per-session write token, same-origin checks, content-security policy, text escaping and parameterized SQL. No claim of a security audit or production readiness. Never expose this server publicly.

**Where is the AI?**
AI is one solution category and business-case context. The discovery text is rule-based. No language model, AI API, model accuracy or AI-generated prediction is implemented. If asked for AI-assisted sales work, explain this limit and show the transparent brief instead of pretending it is a chatbot.

## Your own contribution checklist

- [ ] Run the app and all standard-library tests.
- [ ] Explain the demo forecast using a calculator.
- [ ] Complete the Summit close-date and Cedar renewal exercises.
- [ ] Show that your notes survive a restart.
- [ ] Recalculate the business case at 25% adoption and explain the downside.
- [ ] Modify one business rule, add a matching test and explain the tradeoff.
- [ ] Record exactly what you wrote/changed and where you used AI assistance.

A good first change: add a separate industry-fit component to the scoring rule and rebalance the total to 100. Write a test for it and update the interface explanation. This is a suggested exercise, not implemented behavior.

## Conditional resume wording

Only after you have run, understood, tested and adapted the project, a conservative bullet to review is:

> Adapted and tested an AI-assisted Python/SQLite enterprise-sales sandbox with BANT qualification, stage-weighted forecasting, renewal tracking and ROI scenario analysis using eight synthetic opportunities.

Use “adapted and tested” only if you have done that. Do not add synthetic pipeline values, 92% ROI or fictional wins as business impact. “Generated revenue,” “managed enterprise customers,” “improved retention” and “AI-powered forecasting” would be unsupported. This document does not change your resume or approve an application claim.
