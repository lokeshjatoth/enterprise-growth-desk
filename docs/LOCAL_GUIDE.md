# Enterprise Growth Desk

A local, working sales-operations portfolio project for enterprise ERP, HCM, cloud and AI opportunities. Built to demonstrate the account-research, qualification, forecasting, renewal and business-case thinking in the supplied Orane Consulting Industry Growth Manager job description.

**Every account, persona, deal and result is fictional. This is a portfolio sandbox, not sales employment or a live sales pipeline.** The role's 2-5 years of enterprise-sales experience cannot be replaced by a project.

## Start here

You need a laptop/desktop with **Python 3.10 or newer** and a modern browser. A phone can read the included guide/screenshots but cannot run this Python server by itself.

1. Extract the ZIP first. Do not run from inside the compressed archive.
2. Windows: double-click `start_windows.bat`. Or open a terminal in this folder and run `py -3 app.py` (use Python 3.10+).
3. macOS/Linux: open a terminal in this folder and run `python3 app.py`. `bash start_mac_linux.sh` is also available.
4. Open **http://127.0.0.1:8765** on the same computer. This address works only while your local server is running; it is not a public portfolio URL.
5. Keep the terminal open. Press Ctrl+C there to stop.

No pip install, npm install, API keys, external accounts or internet are needed to run the app after Python is installed. If Python is not installed, use the official installer at python.org and then reopen the terminal. On Windows, enable the Python launcher or use `python app.py` if `py` is not recognized.

If port 8765 is occupied, run `python3 app.py --port 8767` (Windows: `py -3 app.py --port 8767`) and open http://127.0.0.1:8767 instead.

**Do not double-click `web/index.html`.** It needs the local server for the database and API.

## A useful first session (20-30 minutes)

- Read `docs/INTERVIEW_GUIDE.md` and `docs/ROLE_MAPPING.md`.
- Start at snapshot date **2026-11-13**, the fixed synthetic scenario date. It is not a live-data claim.
- Filter to overdue deals. Summit Demo Textiles should be the only result.
- Open Summit. Reconfirm the close date in the fictional scenario, set it to 2026-12-05, and add a specific next step.
- Save. The 90-day weighted forecast should increase from **INR 8,690,000 to INR 9,170,000**: INR 1,200,000 x 40% = INR 480,000 moves into the window.
- Add a fictional activity note explaining the change. Reload and confirm it persists.
- Filter to renewals. Cedar and Quartz should appear. Open Cedar and document a delivery/renewal conversation before proposing additional scope.
- Open Business case. At the defaults, first-year ROI is **92%**, simple payback **4.7 months**. These are hypothetical model outputs, not customer results.
- Change adoption to 25%: the annual capacity value falls to INR 1,440,000 and year-one net becomes INR -60,000. Explain why the project should not sell that as a guaranteed saving.
- Export CSV and a JSON snapshot. Do not publish these as real commercial records.
- Make one small code change you can explain, run the tests, and record what you learned before adding it to your resume.

## Implemented

- Seeded SQLite database with eight fictional opportunities across five regions and four solution categories.
- New-opportunity creation and version-safe editing. Stale saves are rejected rather than silently overwriting another edit.
- Transparent account-fit scoring with visible components.
- BANT qualification checks. BANT means Budget, Authority, Need, Timeline.
- Required qualification evidence for Qualified/Discovery/Proposal/Negotiation/Won; loss reason required for Lost.
- Stage-weighted forecast, all-open pipeline, all-closed-deal win rate and fictional won bookings.
- Configurable snapshot date with a 90-day expected-close forecast window; overdue open deals are flagged and excluded from that window.
- Existing-customer and upcoming-renewal filters; activity notes persisted with UTC timestamps.
- Product-specific, **rule-based** discovery briefs and expansion prompts. No generative AI is called.
- First-year cost/benefit, ROI and simple payback calculator.
- Formula-safe CSV and JSON snapshot exports.
- Responsive browser UI with labels, keyboard focus and native dialog behavior.
- Automated unit, persistence and HTTP tests. Optional browser regression test source is included.

## Not implemented

No actual AI model, live account research, SAP/SuccessFactors integration, Salesforce/HubSpot connector, LinkedIn Sales Navigator integration, email sending, prospect scraping, real currency conversion, authentication for multiple users, cloud deployment, notifications, delete function, import/restore UI, production audit trail or actual revenue outcomes. Renewals are flagged by date; this does **not** compute a real customer-retention rate. The seed's `Won` status is a simulation, not a closed sale.

The discovery brief templates can support preparation for a human conversation. They are not sent to anyone. AI is a solution being discussed, not the engine generating the app's text.

## Data and reset

`growth-desk.sqlite3` is created beside `app.py` on first launch. Edits and activity notes remain there after restart. That file is not shipped in the ZIP; each first launch starts clean.

- Copy the SQLite file while the server is stopped for a restorable database backup.
- The JSON export is a readable snapshot, not an import/restore feature.
- To reset: stop the server, rename `growth-desk.sqlite3` to keep a backup, then restart. A fresh fictional database is seeded.
- `--db PATH` selects another database file for experiments.

Keep this app on your own computer. It binds to 127.0.0.1 and uses a session token, host/origin checks, parameterized SQL and output escaping, but it is not a hardened multi-user CRM. Do not expose it on the internet or enter confidential customer information.

## Test

From the extracted project folder:

```text
python3 -m unittest discover -s tests -v
```

Windows: replace `python3` with `py -3` or your Python command.

The standard-library suite runs in temporary databases and does not alter your app database. See `docs/TEST_REPORT.md` for the delivered validation results. The optional `tests/browser_check.cjs` needs Node, Playwright, Chrome and a fresh test server on port 8766; those are development-only requirements, not app requirements.

## Files

```text
app.py                 Local HTTP API and SQLite persistence
logic.py               Validation, fit scoring, forecasts, ROI and discovery rules
seed.py                Clearly fictional seed scenarios
web/                   Browser interface (HTML, CSS, vanilla JavaScript)
tests/test_app.py      Dependency-free automated tests
tests/browser_check.cjs Optional UI regression checks
docs/                  Role mapping, interview guide, model and test notes
screenshots/           Inspected sample screens from the delivered build
```

## Honest resume use

Do not claim enterprise-sales experience, customer wins, real pipeline ownership or revenue generated. Do not write that you independently authored all of this if you used AI assistance. First run it, complete the practice exercise, understand the formulas and modify something yourself. Then discuss a factual project bullet with your resume reviewer. The interview guide includes conditional wording; your existing resume has not been changed.

Project scope is based on the two-page job description supplied in this conversation, titled “Industry Growth Manager - Enterprise Applications & AI.” No current employer certification, headcount, compensation or partnership claim is being independently verified or repeated here.
