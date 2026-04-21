"""Supplier directory: CRUD + name-based lookup for PO auto-fill."""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import Optional

from core.config import db
from core.security import get_current_user, check_not_readonly
from models import Supplier, SupplierCreate, SupplierUpdate

router = APIRouter(tags=["Suppliers"])


@router.get("/suppliers")
async def list_suppliers(current_user: dict = Depends(get_current_user)):
    return await db.suppliers.find({}, {"_id": 0}).sort("name", 1).to_list(1000)


@router.get("/suppliers/lookup")
async def lookup_supplier(name: str, current_user: dict = Depends(get_current_user)):
    """Case-insensitive exact-name lookup (used by Low Stock PO auto-fill)."""
    if not name:
        return None
    supplier = await db.suppliers.find_one(
        {"name": {"$regex": f"^{_re_escape(name)}$", "$options": "i"}},
        {"_id": 0},
    )
    return supplier


def _re_escape(s: str) -> str:
    import re as _r
    return _r.escape(s)


@router.post("/suppliers")
async def create_supplier(data: SupplierCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admin can create suppliers")
    check_not_readonly(current_user)

    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Supplier name is required")

    # Prevent dupes (case-insensitive)
    existing = await db.suppliers.find_one(
        {"name": {"$regex": f"^{_re_escape(name)}$", "$options": "i"}}
    )
    if existing:
        raise HTTPException(status_code=400, detail="A supplier with this name already exists")

    supplier = Supplier(
        name=name,
        email=data.email,
        phone=data.phone,
        whatsapp_number=data.whatsapp_number,
        address=data.address,
        notes=data.notes,
        created_by=current_user.get("username"),
    )
    doc = supplier.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.suppliers.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


@router.put("/suppliers/{supplier_id}")
async def update_supplier(
    supplier_id: str, data: SupplierUpdate, current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admin can update suppliers")
    check_not_readonly(current_user)

    update = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="No data to update")

    result = await db.suppliers.update_one({"id": supplier_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Supplier not found")
    supplier = await db.suppliers.find_one({"id": supplier_id}, {"_id": 0})
    return supplier


@router.delete("/suppliers/{supplier_id}")
async def delete_supplier(supplier_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admin can delete suppliers")
    check_not_readonly(current_user)

    result = await db.suppliers.delete_one({"id": supplier_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return {"message": "Supplier deleted"}
