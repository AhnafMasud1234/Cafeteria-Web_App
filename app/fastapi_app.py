# app/fastapi_app.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, HTMLResponse

from app.fastapi_api import router as api_router   # your API endpoints

app = FastAPI(
    title="Cafeteria API (FastAPI)",
    version="1.0.0",
)

# -----------------------------
# CORS (so React can call API)
# -----------------------------
origins = [
    "http://localhost:5173",     # React dev server (Vite default)
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],        # allow GET, POST, PUT, DELETE etc.
    allow_headers=["*"],        # allow all headers
)

# ----------------------------------
# ROOT ROUTE (teacher expectation)
# Redirect "/" -> "/api/items"
# ----------------------------------
@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/api/items")


# ----------------------------------
# SIMPLE STATIC HTML PAGE (teacher request)
# ----------------------------------

@app.get("/hello-html", response_class=HTMLResponse)
def hello_html():
    return """
    <!DOCTYPE html>
    <html>
      <head>
        <title>Student Cafeteria</title>
      </head>
      <body>
        <h1>Student Cafeteria</h1>
        <p>This is a simple static HTML page served by FastAPI.</p>
        <p>Later, I will replace this with a React frontend that consumes the same API.</p>
      </body>
    </html>
    """


# -----------------------------
# API ROUTES (/api/items etc.)
# -----------------------------
app.include_router(api_router)