import os

from flask import Flask, render_template, request
from models import *

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "postgres://ijqbolaknohivt:f8dea6cdb0906300228cd31274d5bfc2b98c5b16fb61fd99e21873acb9b759a8@ec2-54-225-89-156.compute-1.amazonaws.com:5432/d79sv2ea3fj85a"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)

def main():
    db.create_all()

if __name__ == "__main__":
    with app.app_context():
        main()
