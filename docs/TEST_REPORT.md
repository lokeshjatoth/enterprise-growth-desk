# Validation report

Validated on 13 November 2026 using Python 3.10.12, SQLite, Node 22 and headless Chrome. This is a local functional check, not a security audit, cross-platform certification or claim of customer use.

## Standard-library suite: 22 tests passed

Command: `python3 -m unittest discover -s tests -v`

Coverage:
- All fictional seed records validate.
- Exact reference pipeline/forecast/bookings/win-rate/renewal totals.
- Empty dashboard and undefined rates.
- BANT qualification guard and mandatory lost-deal reason.
- Invalid dates, negative/non-finite numbers, fractional employees, invalid stages and wrong boolean types.
- Fit-score component sums and renewal date boundary.
- Known ROI formula, zero cost, no payback and invalid adoption.
- Rule-based rather than AI-model labelling.
- CSV formula-injection protection.
- Seed-once initialization, new records, persisted edits, activity notes and stale-write rejection.
- HTTP dashboard and exports, invalid date, missing token, cross-origin request, unexpected host, malformed API request and missing resources.

The tests use temporary databases. They do not edit the user's local database.

## Browser checks: passed

- Search, region/focus filters, renewal/overdue cohorts and empty states.
- All three workspace views at 320, 390 and 1280 pixel widths; page-width checks for horizontal overflow.
- Account editing and activity notes survive reload.
- New record creation and server-side qualification guard.
- User text resembling HTML remains displayed as text.
- Keyboard Escape closes the native account dialog.
- Default ROI of 92% and no-payback scenario at zero adoption.
- CSV and JSON download filenames and download events.
- No uncaught browser JavaScript exceptions during the workflow.

A 320px metric-width issue found during testing was fixed and the full browser flow rerun successfully. Source screenshots show the corrected build. Screenshots were visually inspected separately; automated width checks alone do not establish visual quality.

## Optional browser test setup

These are developer-only dependencies, not needed to run the project:

```text
npm install playwright
npx playwright install chromium
python3 app.py --port 8766 --db ui-test.sqlite3
```

Keep that test server running. In a second terminal in the project folder:

```text
node tests/browser_check.cjs
```

Use a **fresh** `ui-test.sqlite3` each test run because the script creates and edits records. Stop the test server before removing its file. The browser test writes screenshots to `artifacts/`. You can choose another screenshot directory with `SCREENSHOT_DIR`. Set `CHROME_PATH` only when using an existing Chrome executable, and `PLAYWRIGHT_PATH` only if Playwright was installed outside the normal Node resolution path. Do not commit `node_modules` or a populated database to a public portfolio.

## Remaining limits

Windows/macOS launcher commands are provided but were not executed on those operating systems. The standard-library app itself was exercised on Linux with Python 3.10.12. No real SAP/CRM/AI integration, public deployment, load test, accessibility audit, security penetration test, forecast backtest, financial validation or production database migration has been performed. The ZIP should remain a local prototype until those gaps are addressed for any real-world use.


## Browser-demo edition

The hosted edition lives in `demo/`. It ports the Python model to browser JavaScript and stores edits under the namespaced `enterprise-growth-desk-demo-v1` local-storage key. The Python server and SQLite remain local-only.

Validated before publication: Python's 22 tests; Node parity fixtures for all eight enriched records, forecast metrics and default ROI; browser qualification/date/numeric/loss/ROI guardrails; Playwright UI checks at 320/390/1280px for all three views and account dialogs. Also checked independent visitor contexts, same-browser reload persistence, two-tab stale opportunity rejection, reset, notes, exports and escaped user text. Desktop pipeline, mobile pipeline and mobile business-case screenshots were visually inspected.

Run `node tests/demo_logic.cjs` for dependency-free browser-model tests. To run UI tests, serve `demo/` on a loopback static server, install Playwright as a development dependency, then set `BASE_URL` to that server and run `node tests/demo_browser.cjs`. Optional `PLAYWRIGHT_PATH`, `CHROME_PATH` and `SCREENSHOT_DIR` select the module, browser binary and artifact folder.

Public deployment and hosted GitHub Actions are not verified until publication succeeds.
