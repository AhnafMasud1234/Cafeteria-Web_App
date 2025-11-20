

from flask import Flask
from app.flask_api import bp as api_bp

def create_app() -> Flask:
    app = Flask(__name__)
    app.register_blueprint(api_bp)
    return app