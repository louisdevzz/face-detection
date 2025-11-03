from flask import Flask
from flask_cors import CORS


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)
    return app

# Re-export the WSGI app so `gunicorn app:app` works
from .main import app as app  # noqa: E402,F401


