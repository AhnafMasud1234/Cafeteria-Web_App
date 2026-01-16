from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get allowed origins from environment variable
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173"
).split(",")

# Create FastAPI app
app = FastAPI(
    title="Cafeteria Management API",
    description="REST API for cafeteria operations",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include routers
from app.fastapi_api import router as api_router

app.include_router(api_router)


@app.get("/")
def root():
    return {
        "message": "Cafeteria Management API",
        "docs": "/docs",
        "version": "1.0.0",
    }