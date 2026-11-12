"""Fictional scenario data. No real companies, people or commercial outcomes."""
DEMO_DATE = '2026-11-13'

def demo_records():
    specs = [
        ('Aster Demo Manufacturing', 'Manufacturing', 'India', 'ERP transformation', 'Proposal', 4200000, 1800, 'Finance director (fictional persona)', 'Manual order-to-cash reconciliation delays month-end reporting.', 'Validate baseline and agree a presales workshop.', '2026-12-15', '', False, [1,1,1,1]),
        ('Cedar Demo Healthcare', 'Healthcare', 'Middle East', 'HCM transformation', 'Discovery', 3000000, 2400, 'HR director (fictional persona)', 'Fragmented onboarding and inconsistent employee records.', 'Map onboarding and assess privacy requirements.', '2027-01-10', '2026-12-30', True, [1,1,1,0]),
        ('Harbor Demo Logistics', 'Logistics', 'Southeast Asia', 'Cloud migration', 'Qualified', 1800000, 750, 'IT director (fictional persona)', 'Legacy hosting limits peak-season capacity.', 'Confirm migration window with solution architect.', '2027-02-01', '', False, [0,1,1,1]),
        ('Maple Demo Retail', 'Retail', 'Europe', 'AI workflow pilot', 'Research', 800000, 420, '', 'Support triage is manual; baseline accuracy not measured.', 'Identify workflow owner and data access constraints.', '2027-02-20', '', False, [0,0,1,0]),
        ('Quartz Demo Energy', 'Energy', 'Africa', 'ERP transformation', 'Negotiation', 5500000, 3200, 'CFO (fictional persona)', 'Procurement and finance records do not reconcile.', 'Confirm scope exclusions and procurement checklist.', '2026-12-22', '2027-01-15', True, [1,1,1,1]),
        ('Lumen Demo Services', 'Services', 'India', 'HCM transformation', 'Won', 2400000, 900, 'HR head (fictional persona)', 'Hiring and onboarding span disconnected spreadsheets.', 'Arrange delivery handover and success baseline.', '2026-10-20', '2027-10-20', True, [1,1,1,1]),
        ('Willow Demo Foods', 'Food processing', 'India', 'Cloud migration', 'Lost', 1500000, 600, 'IT head (fictional persona)', 'High manual maintenance effort.', 'Archive discovery notes.', '2026-10-28', '', False, [0,1,1,1]),
        ('Summit Demo Textiles', 'Manufacturing', 'India', 'AI workflow pilot', 'Discovery', 1200000, 1100, 'Operations head (fictional persona)', 'Invoice extraction needs frequent manual correction.', 'Reconfirm slipped decision date before forecasting.', '2026-11-05', '', False, [1,1,1,0]),
    ]
    result=[]
    for name, industry, region, product, stage, value, employees, dm, pain, step, close, renewal, existing, flags in specs:
        r=dict(name=name, industry=industry, region=region, product=product, stage=stage, value=value, employees=employees, decision_maker=dm, pain=pain, next_step=step, close_date=close, renewal_date=renewal, existing_customer=existing, loss_reason='Budget deferred; fictional loss scenario.' if stage=='Lost' else '')
        r.update(zip(['budget','authority','need','timeline'], map(bool,flags)))
        result.append(r)
    return result
