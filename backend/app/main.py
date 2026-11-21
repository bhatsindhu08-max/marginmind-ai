from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.database import engine, Base, SessionLocal
from backend.app.seeds.metal_demo import seed_metal_demonstration

# Routers
from backend.app.api.auth import router as auth_router
from backend.app.api.business import router as business_router
from backend.app.api.materials import router as materials_router
from backend.app.api.products import router as products_router
from backend.app.api.suppliers import router as suppliers_router
from backend.app.api.orders import router as orders_router
from backend.app.api.market import router as market_router
from backend.app.api.marginguard import router as marginguard_router
from backend.app.api.supplyshock import router as supplyshock_router
from backend.app.api.ordersure import router as ordersure_router
from backend.app.api.forecasting import router as forecasting_router
from backend.app.api.viability import router as viability_router
from backend.app.api.decisions import router as decisions_router
from backend.app.api.documents import router as documents_router
from backend.app.api.reports import router as reports_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Explainable Financial Intelligence & Decision-Preparation Platform for Manufacturing",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    # 1. Create DB tables
    Base.metadata.create_all(bind=engine)

    # 2. Seed initial demonstration dataset
    db = SessionLocal()
    try:
        seed_metal_demonstration(db)
    finally:
        db.close()


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
        "demo_mode": settings.DEMO_MODE_DEFAULT
    }


# Include Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(business_router, prefix=settings.API_V1_STR)
app.include_router(materials_router, prefix=settings.API_V1_STR)
app.include_router(products_router, prefix=settings.API_V1_STR)
app.include_router(suppliers_router, prefix=settings.API_V1_STR)
app.include_router(orders_router, prefix=settings.API_V1_STR)
app.include_router(market_router, prefix=settings.API_V1_STR)
app.include_router(marginguard_router, prefix=settings.API_V1_STR)
app.include_router(supplyshock_router, prefix=settings.API_V1_STR)
app.include_router(ordersure_router, prefix=settings.API_V1_STR)
app.include_router(forecasting_router, prefix=settings.API_V1_STR)
app.include_router(viability_router, prefix=settings.API_V1_STR)
app.include_router(decisions_router, prefix=settings.API_V1_STR)
app.include_router(documents_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
