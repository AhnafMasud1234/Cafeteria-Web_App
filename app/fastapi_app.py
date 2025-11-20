# app/fastapi_app.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.fastapi_api import router as api_router

app = FastAPI(
    title="Cafeteria API (FastAPI)",
    version="1.0.0",
)

# ---- CORS SETTINGS ----
origins = [
    "http://localhost:5173",   # React dev server (Vite default)
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # which frontends are allowed
    allow_credentials=True,
    allow_methods=["*"],         # allow all HTTP methods (GET, POST, PUT, DELETE, ...)
    allow_headers=["*"],         # allow all headers
)

# ---- API ROUTES ----
app.include_router(api_router)