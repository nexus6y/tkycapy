#!/usr/bin/env python3
"""Production chain E2E test"""
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

P = 0; F = 0
def check(label, cond):
    global P, F
    if cond: print(f"  ✅ {label}"); P += 1
    else: print(f"  ❌ {label}"); F += 1

ts = int(time.time()); WH = 'WH-001'

CAT = api('GET', '/material-categories?pageSize=1')['items'][0]['id']
UNIT = api('GET', '/measurement-units?pageSize=1')['items'][0]['id']
SUP = api('GET', '/suppliers?pageSize=1')['items'][0]['id']

print("========== PRODUCTION CHAIN ==========")

print("\n1. Create raw material M (stock 100 via inbound)...")
mat_raw = api('POST', '/materials', {'code': f'RAW-{ts}', 'name': f'Material-M-{ts}', 'specification': 'Steel', 'categoryId': CAT, 'unitId': UNIT, 'approvalStatus': 'APPROVED'})
RAW_CODE = mat_raw.get('code', '')
check("raw material created", bool(RAW_CODE))

po_raw = api('POST', '/purchase-orders', {'orderName': f'PO-Raw-{ts}', 'supplierId': SUP, 'supplierName': 'Supplier', 'lines': [{'lineNo': 1, 'materialCode': RAW_CODE, 'materialName': f'Material-M-{ts}', 'spec': 'Steel', 'unit': 'kg', 'quantity': '100', 'unitPrice': '10', 'amount': '1000', 'warehouseCode': WH}]})
POR_ID = po_raw.get('id', ''); POR_NO = po_raw.get('orderNo', '')
api('PUT', f'/purchase-orders/{POR_ID}/submit')
api('PUT', f'/purchase-orders/{POR_ID}/approve'); time.sleep(0.5)
inss = api('GET', '/inspections?pageSize=500')
ins = next((i for i in inss.get('items', []) if i.get('sourceNo') == POR_NO), {})
INSR_ID = ins.get('id', ''); INSR_NO = ins.get('inspectionNo', '')
api('PUT', f'/inspections/{INSR_ID}/submit')
api('PUT', f'/inspections/{INSR_ID}/approve'); time.sleep(0.5)
inbs = api('GET', '/inbound-orders?pageSize=500')
inb = next((i for i in inbs.get('items', []) if i.get('sourceType') == 'INSPECTION' and i.get('sourceNo') == INSR_NO), {})
api('PUT', f'/inbound-orders/{inb["id"]}/submit')
api('PUT', f'/inbound-orders/{inb["id"]}/approve'); time.sleep(0.3)
inv = api('GET', f'/inventory?materialCode={RAW_CODE}')
RAW_STOCK = float(inv['items'][0]['quantity']) if inv.get('items') else 0
check(f"raw material stock = 100 (got {RAW_STOCK})", abs(RAW_STOCK - 100) < 0.01)

print("\n2. Create product material P (for finished goods)...")
mat_prod = api('POST', '/materials', {'code': f'PROD-{ts}', 'name': f'Product-P-{ts}', 'specification': 'Widget', 'categoryId': CAT, 'unitId': UNIT, 'approvalStatus': 'APPROVED'})
PROD_CODE = mat_prod.get('code', '')
check("product material created", bool(PROD_CODE))

print("\n3. Create production order...")
prod = api('POST', '/production-orders', {
    'orderName': f'Prod-{ts}', 'departmentName': 'Production', 'quantity': '10',
    'lines': [{'lineNo': 1, 'materialCode': PROD_CODE, 'materialName': f'Product-P-{ts}', 'spec': 'Widget', 'unit': 'pcs', 'plannedQty': '10', 'warehouseCode': WH}],
    'materials': [{'lineNo': 1, 'materialCode': RAW_CODE, 'materialName': f'Material-M-{ts}', 'spec': 'Steel', 'unit': 'kg', 'quantity': '30', 'warehouseCode': WH}]
})
PROD_ID = prod.get('id', '')
print(f"  PROD_ID={PROD_ID}, error={prod.get('error','')}")
check("production order created", bool(PROD_ID))

if not PROD_ID:
    print(f"  FULL RESPONSE: {prod}")
    sys.exit(1)

print("\n4. Submit + approve production order...")
api('PUT', f'/production-orders/{PROD_ID}/submit')
api('PUT', f'/production-orders/{PROD_ID}/approve')
po_d = api('GET', f'/production-orders/{PROD_ID}')
check("ProdOrder status = PENDING_ISSUE", po_d.get('businessStatus') == 'PENDING_ISSUE')

print("\n5. Push-down: generate issue order...")
iss_res = api('POST', f'/production-orders/{PROD_ID}/generate-issue')
print(f"  issue response: {iss_res}")
check("issue order generated", bool(iss_res.get('issueNo')))

iss_no = iss_res.get('issueNo', '')
issues = api('GET', '/issue-orders?pageSize=500')
iss = next((i for i in issues.get('items', []) if i.get('orderNo') == iss_no), None)
check("issue order found", iss is not None)
ISS_ID = iss['id'] if iss else ''
po_d2 = api('GET', f'/production-orders/{PROD_ID}')
check("ProdOrder -> ISSUING", po_d2.get('businessStatus') == 'ISSUING')

print("\n5b. Duplicate generate-issue must fail (idempotency)...")
dup_iss = api('POST', f'/production-orders/{PROD_ID}/generate-issue')
dup_iss_msg = str(dup_iss.get('message', '') or dup_iss.get('body', '') or dup_iss.get('error', ''))
check("duplicate issue REJECTED", '已存在领料单' in dup_iss_msg or 'already exists' in dup_iss_msg.lower() or ('error' in dup_iss and not dup_iss.get('issueNo')))

print("\n6. Approve issue (登卡) -> deduct raw stock...")
api('PUT', f'/issue-orders/{ISS_ID}/submit')
api('PUT', f'/issue-orders/{ISS_ID}/approve'); time.sleep(0.3)
inv2 = api('GET', f'/inventory?materialCode={RAW_CODE}')
RAW2 = float(inv2['items'][0]['quantity']) if inv2.get('items') else 0
check(f"raw stock 100->70 (got {RAW2})", abs(RAW2 - 70) < 0.01)
po_d3 = api('GET', f'/production-orders/{PROD_ID}')
check("ProdOrder -> IN_PRODUCTION", po_d3.get('businessStatus') == 'IN_PRODUCTION')

print("\n7. Cancel issue -> return raw stock...")
api('PUT', f'/issue-orders/{ISS_ID}/cancel-approve'); time.sleep(0.3)
inv3 = api('GET', f'/inventory?materialCode={RAW_CODE}')
RAW3 = float(inv3['items'][0]['quantity']) if inv3.get('items') else 0
check(f"raw stock 70->100 (got {RAW3})", abs(RAW3 - 100) < 0.01)
po_dc = api('GET', f'/production-orders/{PROD_ID}')
check("ProdOrder -> ISSUING (cancel)", po_dc.get('businessStatus') == 'ISSUING')

print("\n8. Re-issue + approve...")
api('PUT', f'/issue-orders/{ISS_ID}/submit')
api('PUT', f'/issue-orders/{ISS_ID}/approve'); time.sleep(0.3)
inv4 = api('GET', f'/inventory?materialCode={RAW_CODE}')
RAW4 = float(inv4['items'][0]['quantity']) if inv4.get('items') else 0
check(f"raw stock 100->70 (got {RAW4})", abs(RAW4 - 70) < 0.01)
po_dr = api('GET', f'/production-orders/{PROD_ID}')
check("ProdOrder -> IN_PRODUCTION (re-issue)", po_dr.get('businessStatus') == 'IN_PRODUCTION')

print("\n9. Push-down: generate complete report...")
rpt_res = api('POST', f'/production-orders/{PROD_ID}/generate-complete-report')
check("complete report generated", bool(rpt_res.get('reportNo')))

rpt_no = rpt_res.get('reportNo', '')
rpts = api('GET', '/complete-reports?pageSize=500')
rpt = next((i for i in rpts.get('items', []) if i.get('reportNo') == rpt_no), None)
check("complete report found", rpt is not None)
RPT_ID = rpt['id'] if rpt else ''

print("\n9b. Duplicate generate-complete-report must fail (idempotency)...")
dup_rpt = api('POST', f'/production-orders/{PROD_ID}/generate-complete-report')
dup_rpt_msg = str(dup_rpt.get('message', '') or dup_rpt.get('body', '') or dup_rpt.get('error', ''))
check("duplicate complete report REJECTED", '已存在完工报告' in dup_rpt_msg or 'already exists' in dup_rpt_msg.lower() or ('error' in dup_rpt and not dup_rpt.get('reportNo')))

print("\n10. Approve complete report (完工登卡) -> product stock +10...")
api('PUT', f'/complete-reports/{RPT_ID}/approve'); time.sleep(0.3)
inv_p = api('GET', f'/inventory?materialCode={PROD_CODE}')
PROD_STOCK = float(inv_p['items'][0]['quantity']) if inv_p.get('items') else 0
check(f"product stock 0->10 (got {PROD_STOCK})", abs(PROD_STOCK - 10) < 0.01)
po_d4 = api('GET', f'/production-orders/{PROD_ID}')
check("ProdOrder -> COMPLETED", po_d4.get('businessStatus') == 'COMPLETED')

print("\n11. Cancel complete report -> product stock back to 0...")
api('PUT', f'/complete-reports/{RPT_ID}/cancel-approve'); time.sleep(0.3)
inv_p2 = api('GET', f'/inventory?materialCode={PROD_CODE}')
PROD2 = float(inv_p2['items'][0]['quantity']) if inv_p2.get('items') else 0
check(f"product stock 10->0 (got {PROD2})", abs(PROD2 - 0) < 0.01)
po_dc2 = api('GET', f'/production-orders/{PROD_ID}')
check("ProdOrder -> IN_PRODUCTION (cancel)", po_dc2.get('businessStatus') == 'IN_PRODUCTION')

print("\n12. Re-complete (重新完工登卡)...")
api('PUT', f'/complete-reports/{RPT_ID}/approve'); time.sleep(0.3)
inv_p3 = api('GET', f'/inventory?materialCode={PROD_CODE}')
PROD3 = float(inv_p3['items'][0]['quantity']) if inv_p3.get('items') else 0
check(f"product stock 0->10 (got {PROD3})", abs(PROD3 - 10) < 0.01)
po_df = api('GET', f'/production-orders/{PROD_ID}')
check("ProdOrder -> COMPLETED (final)", po_df.get('businessStatus') == 'COMPLETED')

print("\n13. COMPLETED state blocks generate-complete-report...")
rpt3 = api('POST', f'/production-orders/{PROD_ID}/generate-complete-report')
rpt3_msg = str(rpt3.get('message', '') or rpt3.get('body', '') or rpt3.get('error', ''))
check("COMPLETED blocks new complete report", '只有生产中状态' in rpt3_msg or ('error' in rpt3 and not rpt3.get('reportNo')))

print(f"\n========== RESULTS ==========")
print(f"✅ {P} passed  ❌ {F} failed")
if F == 0:
    print("\U0001f389 ALL CHECKS PASSED!")
    sys.exit(0)
else:
    print("\U0001f4a5 SOME CHECKS FAILED")
    sys.exit(1)
