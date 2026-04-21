"""Route module extracted from server.py."""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from core.config import db, logger
from core.security import get_current_user, check_not_readonly
from models import RepairJob, RepairJobCreate, RepairJobUpdate

router = APIRouter(tags=["Repairs"])

@router.post("/repairs", response_model=RepairJob)
async def create_repair_job(job_data: RepairJobCreate, current_user: dict = Depends(get_current_user)):
    check_not_readonly(current_user)
    # Get customer name
    customer = await db.customers.find_one({"id": job_data.customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    job = RepairJob(
        **job_data.model_dump(),
        customer_name=customer['name'],
        status="pending"
    )
    doc = job.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.repair_jobs.insert_one(doc)
    return job

@router.get("/repairs", response_model=List[RepairJob])
async def get_repair_jobs(current_user: dict = Depends(get_current_user)):
    jobs = await db.repair_jobs.find({}, {"_id": 0}).to_list(1000)
    for job in jobs:
        if isinstance(job['created_at'], str):
            job['created_at'] = datetime.fromisoformat(job['created_at'])
        if isinstance(job['updated_at'], str):
            job['updated_at'] = datetime.fromisoformat(job['updated_at'])
    return jobs

@router.get("/repairs/{job_id}", response_model=RepairJob)
async def get_repair_job(job_id: str, current_user: dict = Depends(get_current_user)):
    job = await db.repair_jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Repair job not found")
    return job

@router.put("/repairs/{job_id}")
async def update_repair_job(job_id: str, job_data: RepairJobUpdate, current_user: dict = Depends(get_current_user)):
    check_not_readonly(current_user)
    update_data = {k: v for k, v in job_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.repair_jobs.update_one(
        {"id": job_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Repair job not found")
    return {"message": "Repair job updated successfully"}

@router.delete("/repairs/{job_id}")
async def delete_repair_job(job_id: str, current_user: dict = Depends(get_current_user)):
    check_not_readonly(current_user)
    result = await db.repair_jobs.delete_one({"id": job_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Repair job not found")
    return {"message": "Repair job deleted successfully"}

