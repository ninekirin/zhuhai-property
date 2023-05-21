# -*- encoding: utf-8 -*-

import json

from flask import Flask
from flask_cors import CORS

from .routes import rest_api
from .models import db

app = Flask(__name__)

app.config.from_object('api.config.BaseConfig')

db.init_app(app)
rest_api.init_app(app)
CORS(app)

"""
    Database initialization
    Create tables if they don't exist
    WARNING: This is not create the database
"""

@app.before_first_request
def initialize_database():
    db.create_all()


"""
   Custom responses
"""


@app.after_request
def after_request(response):
    """
       Sends back a custom error with {"success", "message"} format
    """

    if int(response.status_code) >= 400:
        response_data = json.loads(response.get_data())
        if "errors" in response_data:
            response_data = {"success": False,
                             "message": list(response_data["errors"].items())[0][1]}
            response.set_data(json.dumps(response_data))
        response.headers.add('Content-Type', 'application/json')
    return response


"""
404 error handler
"""

@app.errorhandler(404)
def not_found(error):

    return {"success": False,
            "message": "Not found"}, 404