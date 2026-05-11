from fastapi import APIRouter

from app.api.v1 import auth, management, management_departments, management_imports, management_metrics, public, public_data

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(public.router, prefix="/public", tags=["public"])
api_router.include_router(public_data.router, prefix="/public", tags=["public"])
api_router.include_router(management.router, prefix="/management", tags=["management"])
api_router.include_router(management_departments.router, prefix="/management", tags=["management"])
api_router.include_router(management_metrics.router, prefix="/management", tags=["management"])
api_router.include_router(management_imports.router, prefix="/management", tags=["management"])


@api_router.get("/health", tags=["health"])
def api_health() -> dict[str, str]:
    return {"status": "ok"}
