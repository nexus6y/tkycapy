#!/usr/bin/env python3
"""Quotation → PreOrder → SalesOrder → Shipment → Outbound → Stock E2E test"""
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

resp = json.loads(urllib.request.urlopen(urllib.request.Request(
    f'{API}/auth/login', data=b'{"username":"admin","password":"admin123"}',
    headers={'Content-Type': 'application/json'})).read())
TOKEN = resp['token']

def num(v): return float(v) if v else 0

P = 0; F = 0
def check(label, cond):
    global P, F
    if cond: print(f"  ✅ {label}"); P += 1
    else: print(f"  ❌ {label}"); F += 1

ts = int(time.time()); WH = 'WH-001'
CAT = api('GET', '/material-categories?pageSize=1')['items'][0]['id']
UNIT = api('GET', '/measurement-units?pageSize=1')['items'][0]['id']
SUP = api('GET', '/suppliers?pageSize=1')['items'][0]['id']
CUS = api('GET', '/customers?pageSize=1')['items'][0]['id']

print("========== QUOTATION → PRE-ORDER → SALES ORDER → STOCK ==========")

# --- Create material + stock 100 ---
print("\n1. Create material + inbound stock 100...")
mat = api('POST', '/materials', {'code': f'QTE-M-{ts}', 'name': f'报价物料-{ts}', 'specification': 'ZN-01', 'categoryId': CAT, 'unitId': UNIT, 'approvalStatus': 'APPROVED'})
MAT_CODE = mat.get('code', '')
check("material created", bool(MAT_CODE))

po = api('POST', '/purchase-orders', {'orderName': f'PO-Stock-{ts}', 'supplierId': SUP, 'supplierName': '供应商', 'lines': [{'lineNo':1,'materialCode':MAT_CODE,'materialName':f'报价物料-{ts}','spec':'ZN-01','unit':'pcs','quantity':'100','unitPrice':'3','amount':'300','warehouseCode':WH}]})
pid = po.get('id',''); pno = po.get('orderNo','')
api('PUT', f'/purchase-orders/{pid}/submit'); api('PUT', f'/purchase-orders/{pid}/approve'); time.sleep(0.5)
ins = api('GET', '/inspections?pageSize=500'); im = next((i for i in ins.get('items',[]) if i.get('sourceNo')==pno),{})
ino = im.get('inspectionNo','')
api('PUT', f'/inspections/{im["id"]}/submit'); api('PUT', f'/inspections/{im["id"]}/approve'); time.sleep(0.5)
inb = next((i for i in api('GET','/inbound-orders?pageSize=500').get('items',[]) if i.get('sourceType')=='INSPECTION' and i.get('sourceNo')==ino),{})
api('PUT', f'/inbound-orders/{inb["id"]}/submit'); api('PUT', f'/inbound-orders/{inb["id"]}/approve'); time.sleep(0.3)
stock = num(api('GET',f'/inventory?materialCode={MAT_CODE}')['items'][0]['quantity']) if api('GET',f'/inventory?materialCode={MAT_CODE}').get('items') else 0
check(f"stock = 100 (got {stock})", abs(stock-100)<0.01)

# --- Quotation with lines ---
print("\n2. Create quotation with lines (qty=20)...")
qt = api('POST', '/quotations', {
    'quotationName': f'报价-{ts}', 'customerName': '测试客户',
    'departmentName': '销售部', 'responsibleName': '张三',
    'lines': [{'lineNo':1,'materialCode':MAT_CODE,'materialName':f'报价物料-{ts}','spec':'ZN-01','unit':'pcs','quantity':'20','unitPrice':'8','amount':'160','warehouseCode':WH}]
})
QT_ID = qt.get('id',''); QT_NO = qt.get('quotationNo','')
check("quotation created with lines", bool(QT_ID))

# --- Submit + approve ---
print("\n3. Submit + approve quotation...")
api('PUT', f'/quotations/{QT_ID}/submit')
api('PUT', f'/quotations/{QT_ID}/approve')
qt_d = api('GET', f'/quotations/{QT_ID}')
check("quotation APPROVED", qt_d.get('approvalStatus')=='APPROVED')

# --- Push-down: generate pre-order ---
print("\n4. Generate pre-order...")
pre_res = api('POST', f'/quotations/{QT_ID}/generate-pre-order')
check("pre-order generated", bool(pre_res.get('preOrderNo')))
pre_no = pre_res.get('preOrderNo','')
pre = next((i for i in api('GET','/pre-orders?pageSize=500').get('items',[]) if i.get('orderNo')==pre_no),None)
check("pre-order found", pre is not None)
PRE_ID = pre['id'] if pre else ''

# Check pre-order lines
pre_d = api('GET', f'/pre-orders/{PRE_ID}')
pre_qty = sum(num(l.get('quantity',0)) for l in pre_d.get('lines',[]))
check(f"pre-order qty=20 (got {pre_qty})", abs(pre_qty-20)<0.01)

# --- Duplicate generate-pre-order ---
print("\n5. Duplicate generate-pre-order must fail...")
dup = api('POST', f'/quotations/{QT_ID}/generate-pre-order')
dup_msg = str(dup.get('message','') or dup.get('body','') or dup.get('error',''))
check("duplicate pre-order REJECTED", '已存在' in dup_msg or ('error' in dup and not dup.get('preOrderNo')))

# --- Submit + approve pre-order; then push-down SO ---
print("\n6. Submit + approve pre-order → generate sales order...")
api('PUT', f'/pre-orders/{PRE_ID}/submit')
api('PUT', f'/pre-orders/{PRE_ID}/approve')
so_res = api('POST', f'/pre-orders/{PRE_ID}/generate-sales-order')
check("sales order generated", bool(so_res.get('salesOrderNo')))
so_no = so_res.get('salesOrderNo','')
so = next((i for i in api('GET','/sales-orders?pageSize=500').get('items',[]) if i.get('orderNo')==so_no),None)
check("sales order found", so is not None)
SO_ID = so['id'] if so else ''

# Check SO lines + warehouseCode
so_d = api('GET', f'/sales-orders/{SO_ID}')
so_qty = sum(num(l.get('quantity',0)) for l in so_d.get('lines',[]))
so_wh = (so_d.get('lines',[]) or [{}])[0].get('warehouseCode','')
check(f"SO qty=20 (got {so_qty})", abs(so_qty-20)<0.01)
check(f"SO has warehouseCode (got {so_wh!r})", so_wh == WH)

# --- Duplicate generate-sales-order ---
print("\n7. Duplicate generate-sales-order must fail...")
dup_so = api('POST', f'/pre-orders/{PRE_ID}/generate-sales-order')
dup_so_msg = str(dup_so.get('message','') or dup_so.get('body','') or dup_so.get('error',''))
check("duplicate SO REJECTED", '已存在' in dup_so_msg or ('error' in dup_so and not dup_so.get('salesOrderNo')))

# --- Chain: SO → Shipment → Outbound → Stock ↓ ---
print("\n8. SO → Shipment(partial 20) → Outbound → Stock 100→80...")
api('PUT', f'/sales-orders/{SO_ID}/submit'); api('PUT', f'/sales-orders/{SO_ID}/approve')
SO_LINE_ID = so_d['lines'][0]['id'] if so_d.get('lines') else ''

ship = api('POST', '/sales-shipments', {'orderId':SO_ID,'orderNo':so_no,'customerName':'测试客户','totalQuantity':'20','totalAmount':'160','lines':[{'lineNo':1,'salesOrderLineId':SO_LINE_ID,'materialCode':MAT_CODE,'materialName':f'报价物料-{ts}','spec':'ZN-01','unit':'pcs','orderQty':'20','shippedQty':'20','warehouseCode':WH}]})
SHP_ID = ship.get('id',''); SHP_NO = ship.get('shipmentNo','')
check("shipment created", bool(SHP_ID))

api('PUT', f'/sales-shipments/{SHP_ID}/submit'); api('PUT', f'/sales-shipments/{SHP_ID}/approve'); time.sleep(0.5)

out = next((i for i in api('GET','/outbound-orders?pageSize=500').get('items',[]) if i.get('sourceNo')==SHP_NO),None)
check("outbound auto-created", out is not None)
OUT_ID = out['id'] if out else ''

api('PUT', f'/outbound-orders/{OUT_ID}/submit'); api('PUT', f'/outbound-orders/{OUT_ID}/approve'); time.sleep(0.3)

stock2 = num(api('GET',f'/inventory?materialCode={MAT_CODE}')['items'][0]['quantity']) if api('GET',f'/inventory?materialCode={MAT_CODE}').get('items') else 0
check(f"stock 100→80 (got {stock2})", abs(stock2-80)<0.01)

print(f"\n========== RESULTS ==========")
print(f"✅ {P} passed  ❌ {F} failed")
if F==0: print("\U0001f389 ALL CHECKS PASSED!"); sys.exit(0)
else: print("\U0001f4a5 SOME CHECKS FAILED"); sys.exit(1)
