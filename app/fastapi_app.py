# app/fastapi_app.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

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
    allow_methods=["*"],         # allow all HTTP methods
    allow_headers=["*"],         # allow all headers
)


# ---- ROOT ROUTE ----
# When someone opens http://127.0.0.1:8000/,
# they will be redirected to /api/items and see the items list.
@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/api/items")


# ---- API ROUTES ----
app.include_router(api_router)