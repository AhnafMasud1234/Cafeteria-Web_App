# app/fastapi_app.py

import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, HTMLResponse
from fastapi.templating import Jinja2Templates

from app.fastapi_api import router as api_router
from app.storage.mongo_repo import list_items

app = FastAPI(
    title="Cafeteria API (FastAPI)",
    version="1.0.0",
)


templates = Jinja2Templates(directory="app/templates")


origins_env = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
)
origins = [o.strip() for o in origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/api/items")


@app.get("/hello-html", response_class=HTMLResponse, include_in_schema=False)
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
        <p>React frontend consumes the API endpoints.</p>
      </body>
    </html>
    """


@app.get("/items-html", response_class=HTMLResponse, include_in_schema=False)
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


app.include_router(api_router)