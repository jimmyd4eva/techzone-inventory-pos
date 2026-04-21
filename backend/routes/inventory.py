"""Route module extracted from server.py."""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from core.config import db, logger
from core.security import get_current_user, check_not_readonly
from models import InventoryItem, InventoryItemCreate, InventoryItemUpdate

router = APIRouter(tags=["Inventory"])

@router.post("/inventory", response_model=InventoryItem)
async def create_inventory_item(item_data: InventoryItemCreate, current_user: dict = Depends(get_current_user)):
    check_not_readonly(current_user)
    item = InventoryItem(**item_data.model_dump())
    doc = item.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.inventory.insert_one(doc)
    return item

@router.get("/inventory", response_model=List[InventoryItem])
async def get_inventory(current_user: dict = Depends(get_current_user)):
    items = await db.inventory.find({}, {"_id": 0}).to_list(1000)
    for item in items:
        if isinstance(item['created_at'], str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
    return items

@router.get("/inventory/low-stock")
async def get_low_stock_items(current_user: dict = Depends(get_current_user)):
    pipeline = [
        {"$match": {"$expr": {"$lte": ["$quantity", "$low_stock_threshold"]}}},
        {"$project": {"_id": 0}}
    ]
    items = await db.inventory.aggregate(pipeline).to_list(100)
    return items

@router.get("/inventory/{item_id}", response_model=InventoryItem)
async def get_inventory_item(item_id: str, current_user: dict = Depends(get_current_user)):
    item = await db.inventory.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@router.put("/inventory/{item_id}")
async def update_inventory_item(item_id: str, item_data: InventoryItemUpdate, current_user: dict = Depends(get_current_user)):
    check_not_readonly(current_user)
    update_data = {k: v for k, v in item_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.inventory.update_one(
        {"id": item_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item updated successfully"}

@router.delete("/inventory/{item_id}")
async def delete_inventory_item(item_id: str, current_user: dict = Depends(get_current_user)):
    check_not_readonly(current_user)
    result = await db.inventory.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted successfully"}

@router.get("/inventory/barcode/{barcode}")
async def get_inventory_by_barcode(barcode: str, current_user: dict = Depends(get_current_user)):
    item = await db.inventory.find_one({"barcode": barcode}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found with this barcode")
    return item


@router.post("/inventory/email-purchase-order")
async def email_purchase_order(data: dict, current_user: dict = Depends(get_current_user)):
    """Email a purchase-order draft to a supplier for specific low-stock item ids."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admin can email purchase orders")

    to_email = (data.get("to_email") or "").strip()
    if not to_email:
        raise HTTPException(status_code=400, detail="Supplier email is required")

    supplier_name = data.get("supplier_name") or ""
    note = data.get("note") or ""
    item_ids = data.get("item_ids") or []
    if not item_ids or not isinstance(item_ids, list):
        raise HTTPException(status_code=400, detail="item_ids must be a non-empty array")

    items = await db.inventory.find(
        {"id": {"$in": item_ids}}, {"_id": 0}
    ).to_list(len(item_ids))
    if not items:
        raise HTTPException(status_code=404, detail="No matching inventory items found")

    # Compute suggested order qty: top up to 3× threshold, min 5
    enriched = []
    for it in items:
        threshold = int(it.get("low_stock_threshold") or 10)
        qty = int(it.get("quantity") or 0)
        suggested = max(threshold * 3 - qty, 5)
        enriched.append({
            "name": it.get("name"),
            "sku": it.get("sku"),
            "quantity": qty,
            "low_stock_threshold": threshold,
            "suggested_order_qty": suggested,
        })

    settings = await db.settings.find_one({"id": "app_settings"}, {"_id": 0}) or {}
    from core.security import strip_html as _strip
    business_name = _strip(settings.get("business_name", "TECHZONE"))

    from services.email_service import send_purchase_order_email
    sent = send_purchase_order_email(to_email, supplier_name, enriched, business_name, note)
    if not sent:
        raise HTTPException(status_code=500, detail="Failed to send PO email (check SMTP settings)")

    return {"sent": True, "recipient": to_email, "items_count": len(enriched)}
