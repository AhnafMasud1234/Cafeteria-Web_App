# app/fastapi_app.py

from fastapi import FastAPI
from app.fastapi_api import router as api_router

app = FastAPI(
    title="Cafeteria API (FastAPI)",
    version="1.0.0",
)

# Attach our API router under /api
app.include_router(api_router)