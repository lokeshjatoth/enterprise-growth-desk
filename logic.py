"""Enterprise Growth Desk: transparent business logic. Standard library only."""
from datetime import date, timedelta
import math

STAGES = {'Research': 0.05, 'Qualified': 0.20, 'Discovery': 0.40,
          'Proposal': 0.65, 'Negotiation': 0.80, 'Won': 1.0, 'Lost': 0.0}
PRODUCTS = ['ERP transformation', 'HCM transformation', 'Cloud migration', 'AI workflow pilot']
REGIONS = ['India', 'Middle East', 'Africa', 'Europe', 'Southeast Asia']


def validate(record):
    r = dict(record)
    for field in ['name', 'industry', 'region', 'product', 'stage', 'decision_maker', 'pain', 'next_step', 'close_date', 'renewal_date', 'loss_reason']:
        r[field] = str(r.get(field, '')).strip()
        if len(r[field]) > 1000:
            raise ValueError(field + ' is too long')
    if not r['name'] or len(r['name']) > 100:
        raise ValueError('Account name is required (maximum 100 characters)')
    if r['stage'] not in STAGES or r['product'] not in PRODUCTS or r['region'] not in REGIONS:
        raise ValueError('Choose a valid stage, product and region')
    for field in ['value', 'employees']:
        value = r.get(field, 0)
        if isinstance(value, bool):
            raise ValueError(field + ' must be numeric')
        try:
            value = float(value)
        except (ValueError, TypeError):
            raise ValueError(field + ' must be numeric')
        if not math.isfinite(value) or value < 0 or value > 1_000_000_000:
            raise ValueError(field + ' must be between 0 and 1 billion')
        if field == 'employees' and not value.is_integer():
            raise ValueError('Employees must be a whole number')
        r[field] = round(value, 2) if field == 'value' else int(value)
    for field in ['budget', 'authority', 'need', 'timeline', 'existing_customer']:
        if type(r.get(field, False)) is not bool:
            raise ValueError(field + ' must be true or false')
        r[field] = r.get(field, False)
    for field in ['close_date', 'renewal_date']:
        if r[field]:
            try:
                date.fromisoformat(r[field])
            except ValueError:
                raise ValueError(field + ' must be YYYY-MM-DD')
    bant = sum(r[k] for k in ['budget', 'authority', 'need', 'timeline'])
    if r['stage'] not in ['Research', 'Lost'] and (bant < 3 or not r['decision_maker'] or not r['next_step'] or not r['close_date'] or r['value'] <= 0):
        raise ValueError('Qualified or later requires 3/4 BANT, decision maker, next step, close date and positive value')
    if r['stage'] == 'Lost' and not r['loss_reason']:
        raise ValueError('Record a reason before marking Lost')
    return r


def enrich(r, as_of):
    r = dict(r)
    bant = sum(bool(r[k]) for k in ['budget', 'authority', 'need', 'timeline'])
    # Heuristic, not a learned probability: inspect the reasons with the score.
    components = {'Enterprise size (500+ staff)': 25 if r['employees'] >= 500 else 10,
                  'Business pain documented': 25 if r['pain'] else 0,
                  'Decision maker identified': 20 if r['decision_maker'] else 0,
                  'BANT completeness': round(30 * bant / 4, 1)}
    r.update(score=round(sum(components.values()), 1), score_reasons=components,
             bant_count=bant, probability=STAGES[r['stage']],
             weighted_value=round(r['value'] * STAGES[r['stage']], 2))
    r['overdue'] = bool(r['close_date'] and date.fromisoformat(r['close_date']) < as_of and r['stage'] not in ['Won', 'Lost'])
    r['renewal_due'] = bool(r['existing_customer'] and r['renewal_date'] and 0 <= (date.fromisoformat(r['renewal_date']) - as_of).days <= 90)
    return r


def dashboard(records, as_of, horizon=90):
    rows = [enrich(r, as_of) for r in records]
    open_rows = [r for r in rows if r['stage'] not in ['Won', 'Lost']]
    forecast = [r for r in open_rows if r['close_date'] and as_of <= date.fromisoformat(r['close_date']) <= as_of + timedelta(days=horizon)]
    closed = [r for r in rows if r['stage'] in ['Won', 'Lost']]
    return {'records': rows, 'as_of': as_of.isoformat(), 'horizon_days': horizon,
            'metrics': {'open_pipeline': round(sum(r['value'] for r in open_rows), 2),
                        'weighted_forecast': round(sum(r['weighted_value'] for r in forecast), 2),
                        'won_bookings': round(sum(r['value'] for r in rows if r['stage'] == 'Won'), 2),
                        'win_rate': round(100 * sum(r['stage'] == 'Won' for r in closed) / len(closed), 1) if closed else None,
                        'overdue': sum(r['overdue'] for r in rows),
                        'renewals_due': sum(r['renewal_due'] for r in rows)}}


def roi(hours, hourly_cost, adoption, annual_cost, implementation_cost):
    values = [float(x) for x in [hours, hourly_cost, adoption, annual_cost, implementation_cost]]
    if not all(math.isfinite(x) and 0 <= x <= 1e9 for x in values) or not 0 <= values[2] <= 100:
        raise ValueError('Use finite non-negative inputs; adoption must be 0-100%')
    hours, hourly_cost, adoption, annual_cost, implementation_cost = values
    benefit = hours * hourly_cost * 12 * adoption / 100
    total = annual_cost + implementation_cost
    net = benefit - total
    monthly_net = (benefit - annual_cost) / 12
    return {'annual_benefit': round(benefit, 2), 'year_one_cost': round(total, 2),
            'year_one_net': round(net, 2), 'roi_percent': round(net / total * 100, 1) if total else None,
            'payback_months': round(implementation_cost / monthly_net, 1) if monthly_net > 0 else None}


def playbook(r):
    questions = {
        'ERP transformation': ['Which finance or operations handoffs require re-keying?', 'Which integration or data-migration dependencies could delay rollout?'],
        'HCM transformation': ['Which employee lifecycle steps create delays?', 'What payroll, privacy and adoption constraints must be met?'],
        'Cloud migration': ['What is the current run cost and reliability baseline?', 'Which workloads have residency or migration constraints?'],
        'AI workflow pilot': ['Which repeatable workflow has a measurable baseline?', 'What data access, human-review and accuracy thresholds gate a pilot?']}
    missing = [k for k in ['budget', 'authority', 'need', 'timeline'] if not r[k]]
    return {'label': 'Rule-based discovery brief. No AI model or external research.',
            'hypothesis': 'Explore ' + r['product'].lower() + ' for the documented pain: ' + (r['pain'] or 'Not yet captured. Validate this first.'),
            'questions': questions[r['product']], 'missing_qualification': missing,
            'next_action': r['next_step'] or 'Confirm business pain and the decision process before qualifying.',
            'expansion': 'Review delivery outcomes and renewal risk before proposing a new use case.' if r['existing_customer'] else 'Validate a narrow first use case before proposing account expansion.'}
