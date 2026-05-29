#!/usr/bin/env python3
"""DemandPlan → PurchasePlan → PurchaseOrder → Inspection → Inbound → Stock E2E test"""
import urllib.request, json, time, sys

API = 'http://localhost:3001/api'

def api(m, p, b=None):
    req = urllib.request.Request(f'{API}{p}',
        data=json.dumps(b).encode() if b else None,
        headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {TOKEN}'},
        method=m)
    try:
        resp = urllib.request.urlopen(req)
        return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return {'error': str(e), 'body': e.read().decode()}

# Auth
resp = json.loads(urllib.request.urlopen(urllib.request.Request(
    f'{API}/auth/login',
    data=b'{"username":"admin","password":"admin123"}',
    headers={'Content-Type': 'application/json'}
)).read())
TOKEN = resp['token']

def num(v):
    try: return float(v)
    except: return 0

P = 0; F = 0
def check(label, cond):
    global P, F
    if cond: print(f"  ✅ {label}"); P += 1
    else: print(f"  ❌ {label}"); F += 1

ts = int(time.time()); WH = 'WH-001'

CAT = api('GET', '/material-categories?pageSize=1')['items'][0]['id']
UNIT = api('GET', '/measurement-units?pageSize=1')['items'][0]['id']
SUP = api('GET', '/suppliers?pageSize=1')['items'][0]['id']

print("========== DEMAND PLAN → PURCHASE PLAN → PURCHASE ORDER → STOCK ==========")

print("\n1. Create material for chain...")
mat = api('POST', '/materials', {'code': f'M-{ts}', 'name': f'物料-{ts}', 'specification': 'M8x30', 'categoryId': CAT, 'unitId': UNIT, 'approvalStatus': 'APPROVED'})
MAT_CODE = mat.get('code', '')
check("material created", bool(MAT_CODE))

print("\n2. Create demand plan with lines (qty=50)...")
dp = api('POST', '/demand-plans', {
    'planName': f'需求-{ts}', 'demandSource': '销售订单', 'demandUse': '生产用料',
    'lines': [{'lineNo': 1, 'materialCode': MAT_CODE, 'materialName': f'物料-{ts}', 'spec': 'M8x30', 'unit': '个', 'quantity': '50', 'warehouseCode': WH}]
})
DP_ID = dp.get('id', ''); DP_NO = dp.get('planNo', '')
check("demand plan created with lines", bool(DP_ID))

print("\n3. Submit + approve demand plan...")
api('PUT', f'/demand-plans/{DP_ID}/submit')
api('PUT', f'/demand-plans/{DP_ID}/approve')
dp_d = api('GET', f'/demand-plans/{DP_ID}')
check("demand plan APPROVED", dp_d.get('approvalStatus') == 'APPROVED')
check("demand plan businessStatus = PENDING", dp_d.get('businessStatus') == 'PENDING')

print("\n4. Push-down: generate purchase plan...")
pp_res = api('POST', f'/demand-plans/{DP_ID}/generate-purchase-plan')
check("purchase plan generated", bool(pp_res.get('purchasePlanNo')))

pp_no = pp_res.get('purchasePlanNo', '')
pps = api('GET', '/purchase-plans?pageSize=500')
pp = next((i for i in pps.get('items', []) if i.get('orderNo') == pp_no), None)
check("purchase plan found", pp is not None)
PP_ID = pp['id'] if pp else ''

# Check purchase plan lines
pp_d = api('GET', f'/purchase-plans/{PP_ID}')
pp_lines = pp_d.get('lines', [])
pp_qty = sum(num(l.get('quantity', 0)) for l in pp_lines) if pp_lines else 0
check(f"purchase plan has lines, qty={pp_qty}", pp_qty > 0)
check("purchase plan qty = 50", abs(pp_qty - 50) < 0.01)

# Check demand plan status updated
dp_d2 = api('GET', f'/demand-plans/{DP_ID}')
check("demand plan businessStatus = GENERATED", dp_d2.get('businessStatus') == 'GENERATED')

print("\n5. Duplicate generate-purchase-plan must fail...")
dup_pp = api('POST', f'/demand-plans/{DP_ID}/generate-purchase-plan')
dup_pp_msg = str(dup_pp.get('message','') or dup_pp.get('body','') or dup_pp.get('error',''))
check("duplicate generate-purchase-plan REJECTED", '已存在采购计划' in dup_pp_msg or ('error' in dup_pp and not dup_pp.get('purchasePlanNo')))

print("\n6. Submit + approve purchase plan → auto PurchaseOrder...")
api('PUT', f'/purchase-plans/{PP_ID}/submit')
po_result = api('PUT', f'/purchase-plans/{PP_ID}/approve')
check("purchase plan approved → PO generated", bool(po_result.get('purchaseOrderNo')))

po_no = po_result.get('purchaseOrderNo', '')
pos = api('GET', '/purchase-orders?pageSize=500')
po = next((i for i in pos.get('items', []) if i.get('orderNo') == po_no), None)
check("purchase order found", po is not None)
PO_ID = po['id'] if po else ''

# Check PO lines
po_d = api('GET', f'/purchase-orders/{PO_ID}')
po_lines = po_d.get('lines', [])
po_qty = sum(num(l.get('quantity', 0)) for l in po_lines) if po_lines else 0
check(f"purchase order has lines, qty={po_qty}", po_qty > 0)
check("purchase order qty = 50", abs(po_qty - 50) < 0.01)

print("\n7. Duplicate purchase plan approve must fail...")
dup_po = api('PUT', f'/purchase-plans/{PP_ID}/approve')
dup_po_msg = str(dup_po.get('message','') or dup_po.get('body','') or dup_po.get('error',''))
check("duplicate purchase plan approve REJECTED", '已生成采购订单' in dup_po_msg or ('error' in dup_po and not dup_po.get('purchaseOrderNo')))

print("\n8. Continue chain: PO → Inspection → Inbound → Stock...")
api('PUT', f'/purchase-orders/{PO_ID}/submit')
api('PUT', f'/purchase-orders/{PO_ID}/approve')
time.sleep(0.5)

ins_list = api('GET', '/inspections?pageSize=500').get('items', [])
ins_match = next((i for i in ins_list if i.get('sourceNo') == po_no), None)
ins_id = ins_match['id'] if ins_match else None
ins_no = ins_match.get('inspectionNo', '') if ins_match else ''

check("inspection auto-created from PO", ins_id is not None)

if ins_id:

    api('PUT', f'/inspections/{ins_id}/submit')
    api('PUT', f'/inspections/{ins_id}/approve')
    time.sleep(0.5)

    inb_list = api('GET', '/inbound-orders?pageSize=500').get('items', [])
    inb = next((i for i in inb_list if i.get('sourceType') == 'INSPECTION' and i.get('sourceNo') == ins_no), None)

    check("inbound auto-created from inspection", inb is not None)

    if inb:
        api('PUT', f'/inbound-orders/{inb["id"]}/submit')
        api('PUT', f'/inbound-orders/{inb["id"]}/approve')
        time.sleep(0.3)

        inv = api('GET', f'/inventory?materialCode={MAT_CODE}')
        qty = float(inv['items'][0]['quantity']) if inv.get('items') else 0
        check(f"stock = 50 (got {qty})", abs(qty - 50) < 0.01)
    else:
        check("stock = 50", False)
else:
    check("inspection auto-created from PO", False)
    check("inbound auto-created from inspection", False)
    check("stock = 50", False)

print(f"\n========== RESULTS ==========")
print(f"✅ {P} passed  ❌ {F} failed")
if F == 0:
    print("\U0001f389 ALL CHECKS PASSED!")
    sys.exit(0)
else:
    print("\U0001f4a5 SOME CHECKS FAILED")
    sys.exit(1)

