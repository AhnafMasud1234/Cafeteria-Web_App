# app/fastapi_app.py

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, HTMLResponse
from fastapi.templating import Jinja2Templates

from app.fastapi_api import router as api_router   # your /api routes
from app.storage.memory_repo import list_items     # to get items for HTML pages

app = FastAPI(
    title="Cafeteria API (FastAPI)",
    version="1.0.0",
)

# ----------------------------------
# Templates (for HTML pages)
# ----------------------------------
templates = Jinja2Templates(directory="app/templates")

# ----------------------------------
# CORS (so React can call API later)
# ----------------------------------
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
# ROOT ROUTE
# Redirect "/" -> "/api/items" (JSON)
# ----------------------------------
@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/api/items")


# ----------------------------------
# SIMPLE STATIC HTML PAGE
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


# ----------------------------------
# DYNAMIC HTML PAGE (template)
# /items-html -> items + totals in an HTML table
# ----------------------------------
@app.get("/items-html", response_class=HTMLResponse)
def items_html(request: Request):
    items = [item.to_dict() for item in list_items()]
    total_items = len(items)
    available_items = sum(1 for item in items if item["available"])

    return templates.TemplateResponse(
        "items.html",
        {
            "request": request,
            "items": items,
            "total_items": total_items,
            "available_items": available_items,
        },
    )


# ----------------------------------
# API ROUTES (/api/items etc.)
# ----------------------------------
app.include_router(api_router)