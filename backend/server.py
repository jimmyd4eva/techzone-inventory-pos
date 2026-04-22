"""TechZone POS — FastAPI entry point.

All routes are modularized under /app/backend/routes/.
Models live in /app/backend/models.py.
Shared config & security helpers live in /app/backend/core/.
Email/PDF services live in /app/backend/services/.
"""
import os
import os.path as osp
import uuid
from datetime import datetime, timezone

from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware

from core.config import db, client, logger  # noqa: F401  (imports initialize)
from core.security import hash_password
from services.scheduler import start_scheduler

# Route modules
from routes import (
    auth, customers, inventory, repairs, settings as settings_routes,
    activation, coupons, sales, admin, payments, reports, cash_register,
    suppliers,
)

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Register all route modules under /api
api_router.include_router(auth.router)
api_router.include_router(customers.router)
api_router.include_router(inventory.router)
api_router.include_router(repairs.router)
api_router.include_router(settings_routes.router)
api_router.include_router(activation.router)
api_router.include_router(coupons.router)
api_router.include_router(sales.router)
api_router.include_router(admin.router)
api_router.include_router(payments.router)
api_router.include_router(reports.router)
api_router.include_router(cash_register.router)
api_router.include_router(suppliers.router)

app.include_router(api_router)

# Attach hourly auto-summary email scheduler
start_scheduler(app)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    # Note: with allow_credentials=True, browsers reject `Access-Control-Allow-Origin: *`.
    # We read an explicit list from CORS_ORIGINS; if the admin set "*", fall back to
    # allow_origin_regex=".*" so Starlette echoes the actual Origin header back —
    # preserving "allow any origin" behavior while being credentials-compatible.
    **(
        {"allow_origin_regex": ".*"}
        if os.environ.get('CORS_ORIGINS', '*').strip() == '*'
        else {"allow_origins": [o.strip() for o in os.environ.get('CORS_ORIGINS', '').split(',') if o.strip()]}
    ),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Create default admin user if no users exist."""
    try:
        users_count = await db.users.count_documents({})
        if users_count == 0:
            default_admin = {
                "id": str(uuid.uuid4()),
                "username": "admin",
                "email": "admin@techzone.com",
                "password_hash": hash_password("admin123"),
                "role": "admin",
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            await db.users.insert_one(default_admin)
            print("Created default admin user: admin / admin123")
    except Exception as e:
        print(f"Startup error: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


# --------- Static / SPA serving for portable Windows build ---------
_frontend_build = osp.abspath(osp.join(osp.dirname(__file__), "..", "frontend", "build"))

if osp.exists(_frontend_build) and osp.exists(osp.join(_frontend_build, "static")):
    print(f"Serving frontend from: {_frontend_build}")
    app.mount(
        "/static",
        StaticFiles(directory=osp.join(_frontend_build, "static")),
        name="frontend_static",
    )


@app.get("/")
async def serve_root():
    index_path = osp.join(_frontend_build, "index.html")
    if osp.exists(index_path):
        return FileResponse(index_path)
    return {"message": "TechZone POS API", "docs": "/docs"}


@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    if full_path.startswith("api"):
        raise HTTPException(status_code=404, detail="Not found")
    file_path = osp.join(_frontend_build, full_path)
    if osp.isfile(file_path):
        return FileResponse(file_path)
    index_path = osp.join(_frontend_build, "index.html")
    if osp.exists(index_path):
        return FileResponse(index_path)
    raise HTTPException(status_code=404, detail="Not found")
